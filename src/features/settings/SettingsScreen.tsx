import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Banner, Button, Sheet, Switch, TopBar } from "@/components/ui";
import { useSession } from "@/state/session";
import { reviewNotesFor } from "@/content";
import { useActiveCourseId, useCourse, useCourseContent } from "@/state/useCourse";
import { requestPersistentStorage, storageEstimate } from "@/db";
import { backupFilename, exportBackup, importBackup, readBackupFile } from "@/db/backup";
import { useSyncState } from "@/features/sync/SyncIndicator";
import { sync } from "@/sync/sync";
import { installDiagnostics, installState, promptInstall, type InstallCheck } from "@/lib/pwa";
import { THEME_LABELS, systemTheme } from "@/lib/theme";
import { getCourse, morphemeLabel, varietyOf } from "@/content/course";
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
  const [checks, setChecks] = useState<InstallCheck[] | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const course = getCourse();
  const install = installState();
  const notif = notificationState();

  useEffect(() => {
    void storageEstimate().then(setStorage);
  }, []);

  /*
   * Backup is entirely local — no account, no network. It used to call
   * api.exportData() against a server that does not exist, so the button
   * always failed and the people who most needed it (everyone without an
   * account, which is everyone) could not take a copy of their own data.
   */
  const exportData = async () => {
    try {
      const backup = await exportBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = backupFilename();
      a.click();
      URL.revokeObjectURL(a.href);
      setNotice(`Saved ${backup.reviewLogs.length} reviews to ${a.download}.`);
    } catch {
      setNotice("Could not write the backup file.");
    }
  };

  const importData = async (file: File) => {
    setImporting(true);
    setNotice(null);
    try {
      const summary = await importBackup(await readBackupFile(file));
      // Counts are of what was ADDED, not what the file held — importing onto a
      // device that already has the data should say so rather than claim work.
      setNotice(
        summary.reviewLogs === 0 && summary.progress === 0
          ? "Nothing new in that backup — this device already has all of it."
          : `Restored ${summary.reviewLogs} reviews and ${summary.progress} completed units. Reload to see them.`,
      );
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "That backup could not be imported.");
    } finally {
      setImporting(false);
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
                You're using Trelingo without an account. Everything works, but progress lives only
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
              {/* The full path, because "Shoresh" alone does not say which
                  language or variety it belongs to. */}
              <span className="label">Course</span>
              <div style={{ fontWeight: 600, marginTop: 4 }}>
                {varietyOf(course).name} › {course.name}
              </div>
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
                  ? "Parchment and ink — the original palette."
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
                  Install Trelingo for offline access and a home-screen icon.
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

            {/*
              Runs on the device that is failing, which is the only place the
              answer exists. Desktop Chrome installs almost any page as an app,
              so a desktop success says nothing about whether the criteria are
              actually met — Android is the honest test, and this reports the
              criteria rather than either browser's menu wording.
            */}
            {!install.isIos && (
              <>
                <button
                  className="btn btn--ghost"
                  style={{ marginTop: 8 }}
                  onClick={() => void installDiagnostics().then(setChecks)}
                >
                  {checks ? "Re-check" : "Why can't I install?"}
                </button>
                {checks && (
                  <div className="stack" style={{ marginTop: 10, gap: 6 }}>
                    {checks.map((c) => (
                      <div key={c.id} className="row" style={{ gap: 8, alignItems: "start" }}>
                        <span aria-hidden style={{ color: c.ok ? "var(--sage)" : "var(--danger)" }}>
                          {c.ok ? "✓" : "✗"}
                        </span>
                        <div>
                          <div className="small">{c.label}</div>
                          <div className="small muted" style={{ wordBreak: "break-word" }}>
                            {c.detail}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ---- backup ----
            Sits directly above Storage on purpose: that card explains that
            browsers can evict this data, and this one is what you do about it. */}
        <div className="card">
          <span className="label">Backup</span>
          <p className="small muted" style={{ marginTop: 6, lineHeight: 1.55 }}>
            Save everything you've learned to a file on this device — reviews, completed units,
            streak and settings. No account needed, and it never leaves your machine.
          </p>
          <div className="row" style={{ gap: 8, marginTop: 10 }}>
            <Button variant="secondary" onClick={() => void exportData()}>
              Save a backup
            </Button>
            <Button
              variant="secondary"
              disabled={importing}
              onClick={() => fileInput.current?.click()}
            >
              {importing ? "Restoring…" : "Restore a backup"}
            </Button>
          </div>
          <p className="small muted" style={{ marginTop: 8, lineHeight: 1.55 }}>
            Restoring merges — it adds what the file has without removing anything already here, so
            it is safe to run on a device you're still using.
          </p>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              // Cleared so picking the SAME file twice still fires onChange —
              // which a learner retrying after an error will absolutely do.
              e.target.value = "";
              if (file) void importData(file);
            }}
          />
        </div>

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
