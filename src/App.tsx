import { useEffect } from "react";
import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";

import { PathScreen } from "@/features/path/PathScreen";
import { LessonScreen } from "@/features/lesson/LessonScreen";
import { ReviewScreen } from "@/features/review/ReviewScreen";
import { LibraryScreen, PassageScreen } from "@/features/reading/LibraryScreen";
import { StatsScreen } from "@/features/progress/StatsScreen";
import { LeagueScreen } from "@/features/gamification/LeagueScreen";
import { DecksScreen } from "@/features/decks/DecksScreen";
import { PlacementScreen } from "@/features/placement/PlacementScreen";
import { FluencyScreen } from "@/features/assessment/FluencyScreen";
import { SettingsScreen } from "@/features/settings/SettingsScreen";
import { AuthScreen } from "@/features/auth/AuthScreen";
import { DevPanel } from "@/features/dev/DevPanel";

import { useSession } from "@/state/session";
import { startSyncTriggers } from "@/sync/sync";
import { getDueCounts } from "@/db/repo";
import { loadAudioManifest } from "@/lib/audio";
import { applyTheme, watchSystemTheme } from "@/lib/theme";
import { applyCourse, getCourse } from "@/content/course";
import { Spinner } from "@/components/ui";

/** Routes that take over the whole screen and hide the tab bar. */
const IMMERSIVE = [/^\/lesson\//, /^\/review/, /^\/placement/, /^\/assessment/, /^\/auth/];

function BottomNav() {
  const counts = useLiveQuery(() => getDueCounts(), []);
  const due = (counts?.due ?? 0) + (counts?.new ?? 0);

  const items = [
    { to: "/", icon: "🌱", label: "Learn", end: true },
    { to: "/review", icon: "🔁", label: "Review", badge: due },
    { to: "/library", icon: "📖", label: "Read" },
    { to: "/progress", icon: "📊", label: "Progress" },
    { to: "/settings", icon: "⚙️", label: "Settings" },
  ];

  return (
    <nav className="bottomnav" aria-label="Main">
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.end}
          className={({ isActive }) =>
            `bottomnav__item${isActive ? " bottomnav__item--active" : ""}`
          }
        >
          <span className="bottomnav__icon" aria-hidden>
            {it.icon}
            {it.badge ? <span className="bottomnav__badge">{it.badge > 99 ? "99+" : it.badge}</span> : null}
          </span>
          <span>{it.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default function App() {
  const { status, init, settings } = useSession();
  const location = useLocation();
  const immersive = IMMERSIVE.some((re) => re.test(location.pathname));

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => startSyncTriggers(), []);

  // Course presentation: accent hue and script font. Phase 4 will re-run this
  // when the learner switches course.
  useEffect(() => {
    applyCourse(getCourse());
  }, []);

  useEffect(() => {
    if (settings) void loadAudioManifest(settings.pronunciationPref);
  }, [settings?.pronunciationPref]);

  // Only follow the OS while the preference is actually "system"; an explicit
  // Dark or Light choice must not be overridden when the device flips at dusk.
  useEffect(() => {
    if (settings?.themePref !== "system") return;
    return watchSystemTheme(() => applyTheme("system", { animate: true }));
  }, [settings?.themePref]);

  // Each route change starts at the top; without this a long lesson leaves the
  // next screen scrolled halfway down.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (status === "loading") {
    return (
      <div className="app-shell">
        <Spinner label="Loading your progress…" />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<PathScreen />} />
        <Route path="/lesson/:unitId" element={<LessonScreen />} />
        <Route path="/review" element={<ReviewScreen />} />
        <Route path="/review/deck/:deckId" element={<ReviewScreen />} />
        <Route path="/library" element={<LibraryScreen />} />
        <Route path="/passages/:passageId" element={<PassageScreen />} />
        <Route path="/progress" element={<StatsScreen />} />
        <Route path="/leagues" element={<LeagueScreen />} />
        <Route path="/decks" element={<DecksScreen />} />
        <Route path="/placement" element={<PlacementScreen />} />
        <Route path="/assessment" element={<FluencyScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/auth" element={<AuthScreen />} />
        <Route path="/dev" element={<DevPanel />} />
        <Route
          path="*"
          element={
            <div className="empty">
              <div className="empty__icon">🧭</div>
              <p>That page doesn't exist.</p>
            </div>
          }
        />
      </Routes>
      {!immersive && <BottomNav />}
    </div>
  );
}
