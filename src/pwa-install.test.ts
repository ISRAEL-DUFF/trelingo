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

describe("the manifest meets the install criteria", () => {
  const manifest = viteConfig.slice(viteConfig.indexOf("manifest: {"));

  it("declares a standalone display and a scoped start url", () => {
    expect(manifest).toMatch(/display:\s*"standalone"/);
    expect(manifest).toMatch(/start_url:\s*"\//);
    expect(manifest).toMatch(/id:\s*"\//);
  });

  it("ships the icon sizes Chrome requires, including a maskable one", () => {
    expect(manifest).toMatch(/192x192/);
    expect(manifest).toMatch(/512x512/);
    expect(manifest).toMatch(/purpose:\s*"maskable"/);
  });
});
