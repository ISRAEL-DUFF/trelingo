// Deliberately the most boring service worker that can exist: it takes over
// immediately and has a fetch handler, which is all Chrome's install criteria
// ask for. No Workbox, no precache, no request interception.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  e.respondWith(fetch(e.request).catch(() => new Response("offline", { status: 503 })));
});
