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

let deferred: BeforeInstallPromptEvent | null = null;
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
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // keep the mini-infobar from firing on first load
    deferred = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    notify();
  });
}

export interface InstallState {
  canPrompt: boolean;
  installed: boolean;
  isIos: boolean;
}

let cached: InstallState | null = null;

function snapshot(): InstallState {
  const next = { canPrompt: deferred !== null, installed: isStandalone(), isIos: isIos() };
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
  if (!deferred) return false;
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
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
    console.warn("[shoresh] service worker registration failed", e);
  }
}
