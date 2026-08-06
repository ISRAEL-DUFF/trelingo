import { Link } from "react-router-dom";
import { useSession } from "@/state/session";
import { StatsBody } from "@/features/progress/StatsScreen";
import { TopBar } from "@/components/ui";

/**
 * "You" — everything about the learner rather than about the material.
 *
 * WHY THIS EXISTS: the bottom nav had six destinations and ran out of room. At
 * 320px the "Review" and "Read" labels overlapped by 0.8px and the due badge
 * sat on top of the Read icon. Something had to merge, and Progress and
 * Settings were the only pair where merging loses nothing — stats, streak, XP,
 * preferences, backup and account are all facts about the person, while Learn,
 * Review and Read are the material and Games is play.
 *
 * IT IS NOT A MENU. The stats are rendered inline rather than hidden behind a
 * row, because they are the reason anyone opens this tab; a hub screen whose
 * first job is to make you tap again would have been a worse trade than the
 * crowding it fixed. Settings keeps its own screen — it is 423 lines of
 * genuinely separate concerns — and is reached from the foot of this one.
 *
 * /progress STILL WORKS and redirects here, because it has been the stats URL
 * for the whole life of the app and may be bookmarked or deep-linked.
 */
export function YouScreen() {
  const { user } = useSession();

  return (
    <div className="screen">
      <TopBar left={<span className="small">You</span>} />

      <div className="pad-x stack" style={{ paddingTop: 4 }}>
        {user ? (
          <div className="card card--flat row row--between">
            <div>
              <div style={{ fontWeight: 600 }}>{user.displayName || user.email}</div>
              <div className="small muted">Signed in · progress syncs</div>
            </div>
          </div>
        ) : (
          /*
           * The same warning the path screen carries, in the place someone
           * looks when they wonder where their progress lives. Not a banner —
           * a banner here would read as an error on a screen the learner
           * opened deliberately.
           */
          <Link to="/auth" className="card card--flat" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="row row--between">
              <div>
                <div style={{ fontWeight: 600 }}>Progress is saved on this device</div>
                <div className="small muted">
                  Create an account to sync it, or export a backup from Settings.
                </div>
              </div>
              <span className="muted" aria-hidden>
                ›
              </span>
            </div>
          </Link>
        )}
      </div>

      <StatsBody />

      <div className="pad-x stack" style={{ marginTop: 4 }}>
        <Link to="/settings" className="card card--flat" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="row row--between">
            <div>
              <div style={{ fontWeight: 600 }}>⚙️ Settings</div>
              <div className="small muted">
                Vowel points, theme, notifications, backup and export, sources.
              </div>
            </div>
            <span className="muted" aria-hidden>
              ›
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
