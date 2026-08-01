// `vitest/config` re-exports Vite's defineConfig with the `test` block typed.
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

// NOTE ON SERVICE WORKERS — read before enabling the PWA SW.
// A page can only be controlled by one service worker per scope. While the
// backend is mocked, that slot belongs to MSW's worker (public/mockServiceWorker.js),
// which is what makes the API mocks real HTTP interception rather than a stubbed
// client. So the Workbox SW below is registered as `injectRegister: null` and is
// only activated when VITE_ENABLE_PWA_SW=true (which in turn disables mocking).
// The manifest, icons and install metadata always ship, and offline still works
// because every read/write in the app goes through Dexie, not the network.
// See README.md § Service worker trade-off.
const enablePwaSw = process.env.VITE_ENABLE_PWA_SW === "true";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: enablePwaSw ? "auto" : null,
      strategies: "generateSW",
      manifest: {
        id: "/",
        name: "Shoresh — Learn Biblical Hebrew by the Root",
        short_name: "Shoresh",
        description:
          "Learn Biblical Hebrew through the triliteral root system, with spaced repetition and real unedited verses.",
        theme_color: "#1B2A4A",
        background_color: "#F3E9D2",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        lang: "en",
        dir: "ltr",
        categories: ["education", "books"],
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,woff2}"],
        // Audio is runtime-cached, never precached — it would bloat the install.
        // Matches spec §2 "runtime cache, cache-first" for audio assets.
        runtimeCaching: [
          {
            urlPattern: /\/api\/audio\/.*/,
            handler: "CacheFirst",
            options: {
              cacheName: "shoresh-audio",
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
        navigateFallback: "index.html",
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: { port: 5173 },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
});
