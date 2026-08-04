import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Installability preconditions, guarded at the source.
 *
 * The app shipped for weeks unable to install. `vite-plugin-pwa` was set to
 * `injectRegister: null` so that MSW could own the single service-worker slot,
 * which meant `dist/sw.js` was built, referenced by nothing, and never
 * registered. With no registered worker Chrome does not fire
 * `beforeinstallprompt` and offers only "create shortcut" — the user accepted
 * that, got a bookmark, and nothing installed.
 *
 * Nothing failed. No test, no type error, no console warning: a service worker
 * that is never registered is silent by construction. These assertions are
 * cheap and they target exactly that silence.
 */

const ROOT = resolve(__dirname, "..");
const read = (p: string) => readFileSync(resolve(ROOT, p), "utf8");

const viteConfig = read("vite.config.ts");
const sw = read("src/sw.ts");
const main = read("src/main.tsx");
const mocks = read("src/mocks/browser.ts");

describe("the service worker is actually registered", () => {
  it("is built from a source worker we control, not generateSW", () => {
    // generateSW cannot importScripts MSW, so the two workers could not share
    // a scope and one of them had to lose. That is how this bug happened.
    expect(viteConfig).toMatch(/strategies:\s*"injectManifest"/);
    expect(viteConfig).toMatch(/filename:\s*"sw\.ts"/);
  });

  it("has something that registers it in a built app", () => {
    // Either path is fine; having neither is the bug.
    const mswRegisters = /import\.meta\.env\.DEV\s*\?[^;]*"\/sw\.js"/.test(mocks);
    const appRegisters = /registerServiceWorker/.test(main);
    expect(mswRegisters || appRegisters).toBe(true);
  });

  it("points MSW at the shared worker in a built app, not its own", () => {
    // Two registrations at scope "/" means the second evicts the first.
    expect(mocks).toMatch(/import\.meta\.env\.DEV\s*\?\s*"\/mockServiceWorker\.js"\s*:\s*"\/sw\.js"/);
  });
});

describe("the shared worker's listener order", () => {
  /*
   * Load-bearing. Workbox's fetch listener must be registered first: it calls
   * respondWith only for routes it matches and stays silent otherwise, leaving
   * /api/* to MSW. Reversed, MSW goes first and its passthrough for unmatched
   * requests hits the network directly — the precache is bypassed and offline
   * breaks, while every test still passes because the server is up.
   */
  it("registers Workbox routes before importing MSW", () => {
    const precache = sw.indexOf("precacheAndRoute(");
    const navRoute = sw.indexOf("NavigationRoute(");
    const msw = sw.indexOf("importScripts(");
    expect(precache).toBeGreaterThan(-1);
    expect(msw).toBeGreaterThan(-1);
    expect(precache).toBeLessThan(msw);
    expect(navRoute).toBeLessThan(msw);
  });

  it("keeps the API off the navigation fallback", () => {
    // Without the denylist a navigation-shaped API request is served index.html.
    expect(sw).toMatch(/denylist:\s*\[\/\^\\\/api\\\//);
  });

  it("compiles MSW out entirely when mocks are off", () => {
    // A real backend must never ship with an interceptor in front of it.
    const guard = sw.slice(0, sw.indexOf("importScripts("));
    expect(guard).toMatch(/VITE_USE_MOCK_API/);
  });
});

describe("the deployed build", () => {
  const pkg = JSON.parse(read("package.json")) as { scripts: Record<string, string> };

  it("emits a 200.html so a static host can serve deep links", () => {
    // Surge (and Netlify's legacy behaviour) fall back to 200.html for unknown
    // paths. Without it a first visit to /library 404s — the service worker's
    // navigation route only helps once the worker already exists.
    expect(pkg.scripts.build).toMatch(/200\.html/);
  });
});

describe("the install prompt is captured before the bundle loads", () => {
  /*
   * `beforeinstallprompt` fires once and never replays. On a repeat visit the
   * service worker is already active and the manifest already known, so Chrome
   * fires it at navigation — long before ~590 KB of module bundle evaluates on
   * a phone. A listener registered from React code misses it entirely.
   *
   * The symptom is exact and misleading: Chrome's own menu offers "Install app"
   * while the page reports that no prompt was ever offered, so the app's own
   * install button never appears. Desktop hides it, because the address-bar
   * icon works whether or not the page captured anything.
   */
  const html = read("index.html");

  it("registers the listener in inline HTML, not in the bundle", () => {
    const inlineEnd = html.indexOf('<script type="module"');
    const listener = html.indexOf("beforeinstallprompt");
    expect(listener).toBeGreaterThan(-1);
    expect(listener).toBeLessThan(inlineEnd);
  });

  it("stashes the event somewhere the app can collect it later", () => {
    expect(html).toMatch(/__trelingoInstall/);
    expect(read("src/lib/pwa.ts")).toMatch(/__trelingoInstall/);
  });

  it("does not re-register a late listener that would shadow the early one", () => {
    // Two listeners both calling preventDefault is harmless, but a second
    // source of truth for the deferred event is how this broke the first time.
    const pwa = read("src/lib/pwa.ts");
    expect(pwa).not.toMatch(/addEventListener\(\s*"beforeinstallprompt"/);
  });
});

describe("a deploy actually reaches returning visitors", () => {
  /*
   * A waiting worker keeps serving the PREVIOUS index.html out of the precache.
   * The failure is invisible from outside — curl shows the new file while every
   * browser shows the old one — and for an installed PWA, whose windows are
   * rarely all closed, it means updates never land at all. Verified by shipping
   * a marked index.html over a live worker and reloading: stale before, current
   * after.
   */
  it("takes over immediately instead of waiting", () => {
    expect(sw).toMatch(/self\.skipWaiting\(\)/);
    expect(sw).toMatch(/clientsClaim\(\)/);
    expect(viteConfig).toMatch(/registerType:\s*"autoUpdate"/);
  });

  it("drops precaches from previous builds", () => {
    expect(sw).toMatch(/cleanupOutdatedCaches\(\)/);
  });
});

describe("the manifest meets the install criteria", () => {
  const manifest = viteConfig.slice(viteConfig.indexOf("manifest: {"));

  it("declares a standalone display and a scoped start url", () => {
    expect(manifest).toMatch(/display:\s*"standalone"/);
    expect(manifest).toMatch(/start_url:\s*"\//);
    expect(manifest).toMatch(/scope:\s*"\//);
  });

  it("ships the icon sizes Chrome requires", () => {
    expect(manifest).toMatch(/192x192/);
    expect(manifest).toMatch(/512x512/);
  });

  /*
   * The manifest must stay minimal.
   *
   * With `id`, `orientation`, `dir`, `categories` and icon `purpose` declared,
   * Chrome accepted the app as installable and showed the prompt, but the
   * Android install then produced nothing at all — no app, no shortcut. Android
   * mints a WebAPK through Play Services, which happens outside the page and
   * reports nothing back on failure, so there is no error to find. Two
   * known-good PWAs on the same device install with plain manifests.
   *
   * A richer manifest is not a better one if it cannot be installed. Anything
   * added back here has to be re-tested on a real Android device.
   */
  it.each(["id", "orientation", "dir", "categories", "purpose"])(
    "does not declare %s",
    (member) => {
      expect(manifest).not.toMatch(new RegExp(`\\b${member}:`));
    },
  );
});
