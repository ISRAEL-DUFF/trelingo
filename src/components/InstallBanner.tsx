import { useState } from "react";
import { installState, promptInstall } from "@/lib/pwa";

const DISMISSED_KEY = "trelingo.installDismissed";

/**
 * Offer the install where the learner will actually see it.
 *
 * The app captures `beforeinstallprompt` and calls `preventDefault()` so the
 * browser's own banner does not interrupt a lesson. That is the normal pattern,
 * but it has a platform asymmetry that matters:
 *
 *   Desktop Chrome still shows an install icon in the address bar, so
 *   suppressing the banner costs nothing — the affordance is always visible.
 *
 *   Android Chrome has no address bar icon. Suppressing the banner removes the
 *   ONLY visible way in, leaving the real prompt buried in Settings where
 *   nobody looks. The install then appears not to work: the browser's own menu
 *   offers "Add to Home screen", which makes a bookmark rather than an app.
 *
 * So the prompt we suppressed has to be replaced somewhere prominent. Dismissal
 * is remembered, because a nag on every launch is worse than no banner.
 */
export function InstallBanner() {
  const install = installState();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === "1",
  );

  if (!install.canPrompt || install.installed || dismissed) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="card" style={{ margin: "12px 16px 0" }}>
      <div className="row row--between" style={{ gap: 12 }}>
        <div>
          <div style={{ fontWeight: 600 }}>Install Trelingo</div>
          <p className="small muted" style={{ margin: "2px 0 0", lineHeight: 1.5 }}>
            Adds a home-screen icon and keeps working offline.
          </p>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <button className="btn btn--ghost" onClick={dismiss} aria-label="Dismiss install prompt">
            Not now
          </button>
          <button
            className="btn"
            onClick={() => {
              void promptInstall().then((accepted) => {
                // Declining is a decision too — do not ask again next launch.
                if (!accepted) dismiss();
              });
            }}
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
