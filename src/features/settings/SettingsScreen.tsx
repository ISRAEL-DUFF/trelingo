import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Banner, Button, Sheet, Switch, TopBar } from "@/components/ui";
import { useSession } from "@/state/session";
import { reviewNotesFor } from "@/content";
import { useActiveCourseId, useCourse, useCourseContent } from "@/state/useCourse";
import { requestPersistentStorage, storageEstimate } from "@/db";
import { api } from "@/api/client";
import { useSyncState } from "@/features/sync/SyncIndicator";
import { sync } from "@/sync/sync";
import { installState, promptInstall } from "@/lib/pwa";
import { THEME_LABELS, systemTheme } from "@/lib/theme";
import { getCourse, morphemeLabel } from "@/content/course";
import { notificationState, requestNotificationPermission } from "@/lib/notifications";

export function SettingsScreen() {
  const { families, units, words } = useCourseContent();
  const courseId = useActiveCourseId();
  const morpheme = morphemeLabel(useCourse());
  const navigate = useNavigate();
  const { user, settings, updateSettings, logout } = useSession();
  const syncStatus = useSyncState();
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [provenanceOpen, setProvenanceOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const course = getCourse();
  const install = installState();
  const notif = notificationState();

  useEffect(() => {
    void storageEstimate().then(setStorage);
  }, []);

  const exportData = async () => {
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "shoresh-export.json";
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      setNotice("Export needs a connection and an account.");
    }
  };

  if (!settings) return null;
  const mb = (n: number) => `${(n / 1024 / 1024).toFixed(1)} MB`;

  return (
    <div className="screen">
      <TopBar left={<span className="small">Settings</span>} />

      <div className="pad stack">
        {notice && <Banner kind="warn">{notice}</Banner>}

        {/* ---- account ---- */}
        <div className="card">
          <span className="label">Account</span>
          {user ? (
            <>
              <p style={{ margin: "8px 0 2px", fontWeight: 600 }}>{user.displayName}</p>
              <p className="small muted" style={{ margin: 0 }}>
                {user.email}
              </p>
              <p className="small muted" style={{ marginTop: 8 }}>
                Sync: {syncStatus.status}
                {syncStatus.pendingCount > 0 && ` · ${syncStatus.pendingCount} pending`}
                {syncStatus.lastSyncedAt &&
                  ` · last ${new Date(syncStatus.lastSyncedAt).toLocaleTimeString()}`}
              </p>
              <div className="row" style={{ gap: 8, marginTop: 12 }}>
                <Button variant="secondary" onClick={() => void sync()}>
                  Sync now
                </Button>
                <Button variant="secondary" onClick={() => void exportData()}>
                  Export data
                </Button>
              </div>
              <div style={{ marginTop: 10 }}>
                <Button
                  variant="danger"
                  block
                  onClick={async () => {
                    await logout();
                    navigate("/");
                  }}
                >
                  Sign out (clears local data)
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="small muted" style={{ marginTop: 8, lineHeight: 1.6 }}>
                You're using Shoresh without an account. Everything works, but progress lives only
                on this device.
              </p>
              <Link to="/auth">
                <Button block style={{ marginTop: 10 }}>
                  Create an account
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* ---- course ---- */}
        <Link to="/courses" className="card" style={{ display: "block", textDecoration: "none", color: "inherit" }}>
          <div className="row row--between">
            <div>
              <span className="label">Course</span>
              <div style={{ fontWeight: 600, marginTop: 4 }}>{course.name}</div>
              <div className="small muted">{course.subtitle}</div>
            </div>
            <span className="muted">›</span>
          </div>
        </Link>

        {/* ---- appearance ---- */}
        <div className="card stack">
          <span className="label">Appearance</span>
          <div className="field">
            <span className="small">Theme</span>
            <div className="chips">
              {(["dark", "light", "system"] as const).map((v) => (
                <button
                  key={v}
                  className={`chip${settings.themePref === v ? " chip--selected" : ""}`}
                  onClick={() => void updateSettings({ themePref: v })}
                  aria-pressed={settings.themePref === v}
                >
                  {v === "dark" ? "🌙 " : v === "light" ? "☀️ " : "🖥 "}
                  {THEME_LABELS[v]}
                </button>
              ))}
            </div>
            <span className="small muted">
              {settings.themePref === "system"
                ? `Following your device, which is currently ${systemTheme()}.`
                : settings.themePref === "light"
                  ? "Parchment and ink — the original Shoresh palette."
                  : "Dark parchment. Easier on the eyes at night."}
            </span>
          </div>
        </div>

        {/* ---- reading ---- */}
        <div className="card stack">
          <span className="label">Reading</span>
          <div className="field">
            {/* Label and copy come from the course: "vowel points (niqqud)" is
                meaningless for Greek, which has accents and breathings. */}
            <span className="small">{course.diacriticsCopy.label}</span>
            <div className="chips">
              {(["always", "fading", "off"] as const)
                // Fading is only offered where the script has an honest
                // progression to fade along (Hebrew yes, Greek no — §4.5).
                .filter((v) => v !== "fading" || course.supportsFading)
                .map((v) => (
                  <button
                    key={v}
                    className={`chip${settings.diacriticsPref === v ? " chip--selected" : ""}`}
                    onClick={() => void updateSettings({ diacriticsPref: v })}
                  >
                    {v === "always" ? "Always show" : v === "fading" ? "Fade as I learn" : "Hide"}
                  </button>
                ))}
            </div>
            <span className="small muted">{course.diacriticsCopy[settings.diacriticsPref]}</span>
          </div>

          <div className="field">
            <span className="small">Pronunciation</span>
            <div className="chips">
              {(["sephardic", "ashkenazi", "modern_israeli"] as const).map((v) => (
                <button
                  key={v}
                  className={`chip${settings.pronunciationPref === v ? " chip--selected" : ""}`}
                  onClick={() => void updateSettings({ pronunciationPref: v })}
                >
                  {v === "modern_israeli" ? "Modern Israeli" : v === "sephardic" ? "Sephardic" : "Ashkenazi"}
                </button>
              ))}
            </div>
            <span className="small muted">
              Audio is currently synthesised speech, not recordings — the variant selection is
              stored and sent to the API, but won't change how it sounds yet.
            </span>
          </div>

          <Switch
            label="Sound"
            hint="Play audio automatically after answering"
            checked={settings.soundEnabled}
            onChange={(v) => void updateSettings({ soundEnabled: v })}
          />
        </div>

        {/* ---- notifications ---- */}
        <div className="card stack">
          <span className="label">Reminders</span>
          {notif.reason ? (
            <Banner kind="info">{notif.reason}</Banner>
          ) : (
            <Switch
              label="Daily reminders"
              hint="A nudge when cards are due"
              checked={settings.notifications.enabled}
              onChange={async (v) => {
                if (v) {
                  const ok = await requestNotificationPermission();
                  if (!ok) {
                    setNotice("Notification permission was declined.");
                    return;
                  }
                }
                void updateSettings({
                  notifications: { ...settings.notifications, enabled: v },
                });
              }}
            />
          )}
          {settings.notifications.enabled && (
            <p className="small muted" style={{ margin: 0 }}>
              Quiet hours {settings.notifications.quietHoursStart}:00–
              {settings.notifications.quietHoursEnd}:00.
            </p>
          )}
        </div>

        {/* ---- install ---- */}
        {!install.installed && (
          <div className="card">
            <span className="label">Install</span>
            {install.canPrompt ? (
              <>
                <p className="small muted" style={{ marginTop: 6 }}>
                  Install Shoresh for offline access and a home-screen icon.
                </p>
                <Button block style={{ marginTop: 10 }} onClick={() => void promptInstall()}>
                  Install app
                </Button>
              </>
            ) : (
              <p className="small muted" style={{ marginTop: 6, lineHeight: 1.6 }}>
                {install.isIos
                  ? "On iOS, tap the Share button and choose “Add to Home Screen”. iOS doesn't offer an automatic install prompt, and reminders only work once installed."
                  : "Your browser will offer an install option when it's ready."}
              </p>
            )}
          </div>
        )}

        {/* ---- storage ---- */}
        <div className="card">
          <span className="label">Storage</span>
          <p className="small muted" style={{ marginTop: 6 }}>
            {storage ? `${mb(storage.usage)} used of ${mb(storage.quota)} available.` : "—"}
          </p>
          <p className="small muted" style={{ marginTop: 4, lineHeight: 1.55 }}>
            Browsers can evict app storage under pressure. Requesting persistence makes that much
            less likely.
          </p>
          <Button
            variant="secondary"
            block
            style={{ marginTop: 10 }}
            onClick={async () => setPersisted(await requestPersistentStorage())}
          >
            {persisted === null ? "Request persistent storage" : persisted ? "Granted ✓" : "Denied"}
          </Button>
        </div>

        {/* ---- content provenance ---- */}
        <button className="card" style={{ textAlign: "start" }} onClick={() => setProvenanceOpen(true)}>
          <div className="row row--between">
            <div>
              <div style={{ fontWeight: 600 }}>Content provenance</div>
              <div className="small muted">
                {units.length} units · {words.length} words · {families.length} families
              </div>
            </div>
            <span className="muted">›</span>
          </div>
        </button>

        <Link to="/dev" className="small muted center" style={{ textDecoration: "none" }}>
          Developer tools →
        </Link>
      </div>

      <Sheet open={provenanceOpen} onClose={() => setProvenanceOpen(false)} title="Content provenance">
        <h2 className="title h2">Content provenance</h2>
        <p className="small muted" style={{ lineHeight: 1.6 }}>
          Every word's {morpheme.one} indices are machine-verified to land on real letters, and
          the whole bundle is schema-validated in CI. The items below are judgement calls a
          specialist should review before this reaches learners.
        </p>
        <div className="stack" style={{ marginTop: 14 }}>
          {reviewNotesFor(courseId).map((n) => (
            <div key={n.id} className="card card--flat">
              <div className="translit" style={{ marginBottom: 4 }}>
                {n.id}
              </div>
              <p className="small" style={{ margin: 0, lineHeight: 1.55 }}>
                {n.note}
              </p>
            </div>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
