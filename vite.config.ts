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
      // A stale precached shell is worse than a mid-session asset swap: see sw.ts.
      registerType: "autoUpdate",
      // Registration is explicit, in main.tsx, because it has to be sequenced
      // against MSW's client handshake.
      injectRegister: null,
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      /*
       * Deliberately minimal, and it must stay that way.
       *
       * This manifest previously also declared `id`, `orientation`, `dir`,
       * `lang`, `categories` and an icon `purpose` (including a maskable
       * entry). Chrome accepted all of it — the install criteria passed and the
       * prompt appeared — but on Android the install then produced nothing at
       * all: no app, no shortcut. Android does not install a PWA directly; it
       * asks Play Services to mint a WebAPK, and that step happens outside the
       * page and reports nothing back when it fails.
       *
       * Two known-good PWAs on the same device install fine with plain
       * manifests: name, short_name, description, icons, start_url, display,
       * colours, scope. Nothing else. This now matches that shape.
       *
       * Do not add members back without testing an Android install afterwards.
       * A richer manifest is not a better one if it cannot be installed.
       */
      manifest: {
        name: "Trelingo — Learn Ancient Hebrew and Greek",
        short_name: "Trelingo",
        description:
          "Read ancient Hebrew and Greek by their morphology — roots and stems — with spaced repetition and real unedited texts.",
        icons: [
          { src: "/icons/icon-48.png", sizes: "48x48", type: "image/png" },
          { src: "/icons/icon-72.png", sizes: "72x72", type: "image/png" },
          { src: "/icons/icon-96.png", sizes: "96x96", type: "image/png" },
          { src: "/icons/icon-128.png", sizes: "128x128", type: "image/png" },
          { src: "/icons/icon-144.png", sizes: "144x144", type: "image/png" },
          { src: "/icons/icon-152.png", sizes: "152x152", type: "image/png" },
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-256.png", sizes: "256x256", type: "image/png" },
          { src: "/icons/icon-384.png", sizes: "384x384", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
        start_url: "/",
        display: "standalone",
        background_color: "#F3E9D2",
        theme_color: "#1B2A4A",
        scope: "/",
      },
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,woff2}"],
        // MSW's worker must stay a separately fetchable script: sw.ts pulls it
        // in with importScripts, and precaching it would also make Workbox try
        // to serve it as a cached asset.
        globIgnores: ["**/mockServiceWorker.js", "probe/**"],
        /*
         * Workbox refuses to precache a file over 2 MiB and FAILS THE BUILD
         * rather than warning. Our one chunk is 12.6 MB because the tracks are
         * compiled into it: measured, the shell alone is 529 KB and content is
         * 93% of the bundle. Every whole book added moves this number — John
         * alone is 3.1 MB of the total, Mark 2.6 MB.
         *
         * Raised rather than worked around, because the alternative is to drop
         * the chunk from the precache, and then the tracks stop working offline
         * — which is most of the point of the PWA.
         *
         * THIS IS A HOLDING MEASURE AND IT HAS NOW BEEN RAISED TWICE. 2 MiB →
         * 12 MiB when Matthew landed, 12 → 15 when Genesis 1–11 did, and that
         * second raise was five hours after the first.
         *
         * 15 IS DELIBERATELY TIGHT — about 2.2 MB of headroom over the current
         * 12.75. That is roughly what Genesis 12–50 alone would consume, so the
         * next whole book will probably hit this ceiling rather than sail under
         * it. That is the point. A limit set just above the current size keeps
         * the pressure where it belongs; a comfortable one would quietly let
         * the bundle grow for another year.
         *
         * DO NOT RAISE THIS A THIRD TIME. The ceiling is not the problem — the
         * problem is that a learner reading Obadiah downloads the whole of John
         * to do it. Content belongs behind an API, fetched per book and
         * runtime-cached the way sw.ts already caches audio. See the "WHY NOT
         * LAZY" header in src/content/index.ts, which names that as the
         * destination and the content version stamp that has to land with it,
         * and task #76.
         */
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
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
    /*
     * Never collect from .claude/worktrees.
     *
     * A background task spun up an isolated copy of the frontend there and left
     * it behind when the session was deleted. Vitest's default `include` walks
     * the whole tree, so it picked up the copy's tests too and ran the entire
     * suite TWICE — 22,749 tests instead of 11,744, with the duplicates failing
     * against a stale copy of the source. The count is the tell; the failures
     * are noise from a directory that is not part of the app.
     */
    exclude: ["**/node_modules/**", "**/dist/**", "**/.claude/worktrees/**"],
  },
});
