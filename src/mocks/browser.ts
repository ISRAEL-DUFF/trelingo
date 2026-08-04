import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

/**
 * Where MSW's worker logic lives, which differs between dev and a built app.
 *
 * Dev: its own standalone worker, as shipped. There is no PWA worker in dev
 * (`devOptions.enabled` is false), so there is nothing to share the scope with.
 *
 * Built: inside the app's single service worker, which `src/sw.ts` pulls in via
 * importScripts. Only one worker can control a scope, and that one has to be
 * the PWA worker or the app cannot be installed at all.
 */
const WORKER_URL = import.meta.env.DEV ? "/mockServiceWorker.js" : "/sw.js";

/**
 * Start the mock backend.
 *
 * `onUnhandledRequest: "bypass"` lets fonts, assets and Vite's HMR traffic pass
 * straight through — only paths the handlers claim are intercepted.
 */
export async function startMockServer() {
  await worker.start({
    onUnhandledRequest: "bypass",
    quiet: false,
    serviceWorker: { url: WORKER_URL },
  });
  // eslint-disable-next-line no-console
  console.info(
    "%c[trelingo] mock API active",
    "color:#B8863B;font-weight:bold",
    "— set VITE_USE_MOCK_API=false to talk to a real backend.",
  );
}
