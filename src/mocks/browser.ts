import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

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
    serviceWorker: { url: "/mockServiceWorker.js" },
  });
  // eslint-disable-next-line no-console
  console.info(
    "%c[shoresh] mock API active",
    "color:#B8863B;font-weight:bold",
    "— set VITE_USE_MOCK_API=false to talk to a real backend.",
  );
}
