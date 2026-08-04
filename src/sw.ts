/// <reference lib="webworker" />
/**
 * The app's one service worker.
 *
 * A page is controlled by exactly ONE service worker per scope. The project
 * previously gave that slot to MSW so the API mocks would be real HTTP
 * interception — which meant Workbox's `sw.js` was generated and never
 * registered, so the app precached nothing, worked offline only as far as
 * IndexedDB reached, and was **not installable at all**: with no registered
 * service worker Chrome never fires `beforeinstallprompt`, and its menu offers
 * only "create shortcut".
 *
 * Rather than choose between mocking and installing, both live here. MSW
 * supports being hosted by a custom worker (`serviceWorker.url` on the client),
 * and its worker script is loaded via `importScripts` below.
 *
 * ORDER IS LOAD-BEARING. Workbox's routes are registered FIRST so its fetch
 * listener runs first: it calls `respondWith` only for requests a route matches
 * — precached assets, navigations, audio — and stays silent otherwise. MSW's
 * listener then gets everything left over, which is `/api/*`. Swapping these
 * would put MSW first, and its passthrough for unmatched requests goes straight
 * to the network, defeating the precache and breaking offline.
 *
 * MSW ignores navigation requests entirely, so the app-shell route below is
 * never contested.
 */
import { precacheAndRoute, createHandlerBoundToURL, cleanupOutdatedCaches } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { clientsClaim } from "workbox-core";
import { CacheFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

// 1. Take over as soon as a new build is available.
//
//    Without this a new worker installs and then waits forever: every visit
//    keeps being served the PREVIOUS index.html out of the precache, so a
//    deploy has no visible effect until the user closes every window of the
//    app. That is invisible from the server side — curl shows the new file
//    while the browser shows the old one — and for an installed PWA, whose
//    windows are rarely all closed, it means updates effectively never land.
self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();

// 2. Precache the app shell. Injected at build time by vite-plugin-pwa.
precacheAndRoute(self.__WB_MANIFEST);

// 3. Audio is runtime-cached, never precached — it would bloat the install.
//    Spec §2: "runtime cache, cache-first" for audio assets.
registerRoute(
  /\/api\/audio\/.*/,
  new CacheFirst({
    cacheName: "trelingo-audio",
    plugins: [
      new ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 90 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
);

// 4. Client-side routing: every navigation resolves to the precached shell.
//    /api/ is denied so a navigation-shaped API request is not fed index.html.
//    /probe/ is a self-contained minimal PWA with its own worker and manifest,
//    used to isolate an Android install failure. It must be left entirely alone
//    or it stops being an independent control.
registerRoute(
  new NavigationRoute(createHandlerBoundToURL("index.html"), {
    denylist: [/^\/api\//, /^\/probe\//],
  }),
);

// 5. MSW last, so Workbox has already claimed what it owns. Compiled out of the
//    bundle entirely when mocks are off — a real backend must never ship with
//    an interceptor sitting in front of it.
if (import.meta.env.VITE_USE_MOCK_API !== "false") {
  self.importScripts("/mockServiceWorker.js");
}

// Kept for an explicit "update now" control, should one ever be added.
self.addEventListener("message", (event: ExtendableMessageEvent) => {
  if ((event.data as { type?: string } | null)?.type === "SKIP_WAITING") void self.skipWaiting();
});
