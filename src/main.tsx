import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/global.css";
import { getContent } from "./content";
import { requestPersistentStorage } from "./db";

/**
 * Boot order matters:
 *
 *  1. Validate content. A schema violation is a build-time bug that must fail
 *     loudly rather than render a half-broken lesson.
 *  2. Start the mock API and WAIT for it. If React mounts first, early requests
 *     escape to the network before the worker is controlling the page.
 *  3. Render.
 */
async function bootstrap() {
  try {
    getContent();
  } catch (e) {
    // Surface content errors instead of a blank screen — this is the failure
    // the CI content test exists to prevent reaching a user at all.
    document.getElementById("root")!.innerHTML = `
      <pre style="padding:24px;font-family:monospace;white-space:pre-wrap;color:#b23a2e">
${(e as Error).message}
      </pre>`;
    return;
  }

  const useMocks = import.meta.env.VITE_USE_MOCK_API !== "false";
  if (useMocks) {
    const { startMockServer } = await import("./mocks/browser");
    await startMockServer();
  }

  // Ask the browser not to evict our IndexedDB (spec §2.1). Fire-and-forget:
  // a refusal is not fatal, it just means storage is evictable.
  void requestPersistentStorage();

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
}

void bootstrap();
