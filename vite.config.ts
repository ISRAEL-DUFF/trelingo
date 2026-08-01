// `vitest/config` re-exports Vite's defineConfig with the `test` block typed.
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

// NOTE ON SERVICE WORKERS.
// A page is controlled by exactly one service worker per scope. That slot used
// to belong to MSW, so the generated Workbox `sw.js` was never registered — the
// app precached nothing and could not be installed, because Chrome will not
// offer a real install (or fire `beforeinstallprompt`) without a registered
// worker. Both now live in one worker, src/sw.ts, which is why this uses
// `injectManifest` rather than `generateSW`. See the header of that file for
// why the registration order in it matters.
//
// Dev keeps MSW's own standalone worker: `devOptions.enabled` is false, so
// there is no PWA worker to share with, and installability is not a dev concern.

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      // Registration is explicit, in main.tsx, because it has to be sequenced
      // against MSW's client handshake.
      injectRegister: null,
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
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
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,woff2}"],
        // MSW's worker must stay a separately fetchable script: sw.ts pulls it
        // in with importScripts, and precaching it would also make Workbox try
        // to serve it as a cached asset.
        globIgnores: ["**/mockServiceWorker.js"],
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
