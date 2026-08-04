/**
 * Install-prompt handling (spec §2.1).
 *
 * Android/desktop Chrome fire `beforeinstallprompt`, which can be deferred and
 * replayed from a button. iOS Safari does not implement it at all — there, the
 * only path is the user manually choosing "Add to Home Screen", so the UI has to
 * detect the platform and give instructions instead of a button that would do
 * nothing.
 */
import { useSyncExternalStore } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Where the event is actually caught: an inline script in index.html, which
 * runs before this bundle is even downloaded.
 *
 * `beforeinstallprompt` fires once and never replays. On a repeat visit the
 * service worker is already active and the manifest already known, so Chrome
 * fires it at navigation — well before ~590 KB of module bundle evaluates on a
 * phone. A listener registered from here would simply never see it, and the app
 * would report "no install prompt offered" while the browser was offering one.
 */
interface EarlyInstallState {
  event: BeforeInstallPromptEvent | null;
  installed: boolean;
  seenAt: number | null;
}

const early: EarlyInstallState =
  (window as unknown as { __trelingoInstall?: EarlyInstallState }).__trelingoInstall ?? {
    event: null,
    installed: false,
    seenAt: null,
  };

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function isStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari's non-standard flag.
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function isIos(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPadOS 13+ reports as a Mac; the touch-point check disambiguates.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

if (typeof window !== "undefined") {
  // The inline capture re-broadcasts, so React re-renders when an event that
  // arrived before this module existed is finally handed over.
  window.addEventListener("trelingo:installchange", notify);
}

export interface InstallState {
  canPrompt: boolean;
  installed: boolean;
  isIos: boolean;
}

let cached: InstallState | null = null;

function snapshot(): InstallState {
  const next = {
    canPrompt: early.event !== null,
    installed: isStandalone() || early.installed,
    isIos: isIos(),
  };
  // useSyncExternalStore requires a stable reference between notifications.
  if (
    !cached ||
    cached.canPrompt !== next.canPrompt ||
    cached.installed !== next.installed ||
    cached.isIos !== next.isIos
  ) {
    cached = next;
  }
  return cached;
}

export function installState(): InstallState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    snapshot,
    snapshot,
  );
}

export async function promptInstall(): Promise<boolean> {
  const event = early.event;
  if (!event) return false;
  await event.prompt();
  const { outcome } = await event.userChoice;
  // A captured event can only be prompted once, accepted or not.
  early.event = null;
  notify();
  return outcome === "accepted";
}

/**
 * Register the app's service worker.
 *
 * Only needed when mocks are off: MSW's `worker.start()` registers the same
 * `/sw.js` and awaits activation, so calling both would be redundant. A missing
 * registration is exactly what made the app uninstallable — the worker was
 * built into `dist/` and referenced by nothing.
 */
export async function registerServiceWorker(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch (e) {
    // Not fatal: the app is local-first and runs without a worker. It just
    // cannot be installed or precache its shell.
    console.warn("[trelingo] service worker registration failed", e);
  }
}

/** One installability precondition, as observed on THIS device. */
export interface InstallCheck {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
}

/**
 * Why the install prompt is or isn't available, evaluated live.
 *
 * Chrome's criteria are the same everywhere, but the *affordances* are not, and
 * that difference is a trap:
 *
 *   Desktop Chrome will "install" almost any page as an app whether or not it
 *   is a PWA, so a successful desktop install proves nothing about the manifest
 *   or the service worker.
 *
 *   Android Chrome only offers a real install when every criterion is met, and
 *   otherwise silently degrades to "Add to Home screen", which makes a bookmark.
 *
 * So "it installs on desktop but not on Android" is the expected symptom of
 * criteria that were never met — not of an Android-specific bug. This reports
 * the criteria themselves rather than either browser's UI.
 */
export async function installDiagnostics(): Promise<InstallCheck[]> {
  const checks: InstallCheck[] = [];
  const add = (id: string, label: string, ok: boolean, detail: string) =>
    checks.push({ id, label, ok, detail });

  add(
    "secure",
    "Served over HTTPS",
    window.isSecureContext,
    window.isSecureContext ? location.origin : `${location.origin} is not a secure context`,
  );

  const swSupported = "serviceWorker" in navigator;
  add("sw-support", "Service workers available", swSupported, swSupported ? "yes" : "not supported");

  if (swSupported) {
    const reg = await navigator.serviceWorker.getRegistration();
    const worker = reg?.active ?? reg?.waiting ?? reg?.installing ?? null;
    add(
      "sw-registered",
      "Service worker registered",
      !!worker,
      worker ? `${new URL(worker.scriptURL).pathname} (${worker.state})` : "none registered",
    );
    add(
      "sw-controlling",
      "Service worker controlling this page",
      !!navigator.serviceWorker.controller,
      navigator.serviceWorker.controller
        ? new URL(navigator.serviceWorker.controller.scriptURL).pathname
        : "not controlled — a first load needs one reload",
    );
  }

  const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  add("manifest-link", "Manifest linked", !!link, link?.getAttribute("href") ?? "no <link rel=manifest>");

  if (link) {
    try {
      const res = await fetch(link.href);
      const m = (await res.json()) as {
        name?: string;
        display?: string;
        start_url?: string;
        icons?: { sizes?: string; purpose?: string }[];
      };
      add("manifest-fetch", "Manifest loads", res.ok, `HTTP ${res.status} · ${res.headers.get("content-type") ?? "no content-type"}`);
      add(
        "display",
        "Display mode is standalone",
        m.display === "standalone" || m.display === "fullscreen" || m.display === "minimal-ui",
        m.display ?? "missing",
      );
      const sizes = (m.icons ?? []).filter((i) => (i.purpose ?? "any").split(/\s+/).includes("any"));
      const has = (px: string) => sizes.some((i) => (i.sizes ?? "").split(/\s+/).includes(px));
      add(
        "icons",
        "Has 192px and 512px icons",
        has("192x192") && has("512x512"),
        sizes.map((i) => i.sizes).join(", ") || "none usable",
      );
      add("start-url", "Start URL set", !!m.start_url, m.start_url ?? "missing");
    } catch (e) {
      add("manifest-fetch", "Manifest loads", false, (e as Error).message);
    }
  }

  add(
    "prompt",
    "Install prompt captured",
    early.event !== null,
    early.event !== null
      ? `captured ${early.seenAt ? `${Math.round((Date.now() - early.seenAt) / 1000)}s ago` : ""} — use the button above`
      : isStandalone() || early.installed
        ? "already installed"
        : "not captured. If the browser's own menu offers Install, the page " +
          "missed the event — reload once and re-check.",
  );

  return checks;
}
