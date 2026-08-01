import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Banner, Button, Switch, TopBar } from "@/components/ui";
import { mockConfig, type MockConfig } from "@/mocks/config";
import { mockDb } from "@/mocks/db";
import { clearLocalData, db } from "@/db";
import { rebuildCardsFromLogs } from "@/db/repo";
import { sync } from "@/sync/sync";
import { useSyncState } from "@/features/sync/SyncIndicator";
import { showDueNotification } from "@/lib/notifications";
import { getDueCounts } from "@/db/repo";

/**
 * Developer panel.
 *
 * This exists because the backend is mocked: without a way to force latency,
 * failures and offline, those code paths are unreachable by hand and nobody
 * finds out they're broken until a real server exists. Delete this screen (and
 * src/mocks) when the real API lands.
 */
export function DevPanel() {
  const navigate = useNavigate();
  const [cfg, setCfg] = useState<MockConfig>(mockConfig.get());
  const syncStatus = useSyncState();
  const [message, setMessage] = useState<string | null>(null);
  const [counts, setCounts] = useState<{ cards: number; logs: number; unsynced: number } | null>(
    null,
  );

  useEffect(() => mockConfig.subscribe(setCfg), []);

  const refresh = async () => {
    setCounts({
      cards: await db.srsCards.count(),
      logs: await db.reviewLogs.count(),
      unsynced: await db.reviewLogs.where("synced").equals(0).count(),
    });
  };

  useEffect(() => {
    void refresh();
  }, [syncStatus]);

  return (
    <div className="screen">
      <TopBar
        left={
          <button
            className="btn btn--ghost"
            style={{ color: "var(--chrome-fg)", padding: 0, minHeight: 0 }}
            onClick={() => navigate("/settings")}
          >
            ← Back
          </button>
        }
        right={<span className="small">dev</span>}
      />

      <div className="pad stack">
        <Banner kind="info">
          The API is mocked in-browser. These controls make the unhappy paths reachable.
        </Banner>

        {message && <Banner kind="success">{message}</Banner>}

        <div className="card stack">
          <span className="label">Simulated network</span>

          <Switch
            label="Offline"
            hint="Requests reject as if there were no connection"
            checked={cfg.offline}
            onChange={(v) => mockConfig.set({ offline: v })}
          />

          <div className="field">
            <span className="small">Latency: {cfg.latencyMs} ms</span>
            <input
              type="range"
              min={0}
              max={3000}
              step={50}
              value={cfg.latencyMs}
              onChange={(e) => mockConfig.set({ latencyMs: Number(e.target.value) })}
              style={{ width: "100%", accentColor: "var(--gold)" }}
            />
          </div>

          <div className="field">
            <span className="small">Failure rate: {Math.round(cfg.failureRate * 100)}%</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={cfg.failureRate}
              onChange={(e) => mockConfig.set({ failureRate: Number(e.target.value) })}
              style={{ width: "100%", accentColor: "var(--gold)" }}
            />
          </div>

          <Button variant="secondary" block onClick={() => mockConfig.reset()}>
            Reset network settings
          </Button>
        </div>

        <div className="card stack">
          <span className="label">State</span>
          <p className="small muted" style={{ margin: 0 }}>
            Sync: <strong>{syncStatus.status}</strong>
            {syncStatus.error && ` — ${syncStatus.error}`}
          </p>
          <p className="small muted" style={{ margin: 0 }}>
            Local: {counts?.cards ?? "—"} cards · {counts?.logs ?? "—"} review logs ·{" "}
            {counts?.unsynced ?? "—"} unsynced
          </p>
          <p className="small muted" style={{ margin: 0 }}>
            Mock server: {mockDb.raw.users.length} user(s)
          </p>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <Button variant="secondary" onClick={() => void sync().then(refresh)}>
              Sync now
            </Button>
            <Button
              variant="secondary"
              onClick={() => void rebuildCardsFromLogs().then(() => setMessage("Cards rebuilt from the log."))}
            >
              Rebuild cards
            </Button>
          </div>
        </div>

        <div className="card stack">
          <span className="label">Destructive</span>
          <p className="small muted" style={{ margin: 0, lineHeight: 1.55 }}>
            “Wipe this device” is the interesting one: with an account, everything should come back
            from the server on the next sync. That's the multi-device story in one button.
          </p>
          <Button
            variant="danger"
            block
            onClick={async () => {
              await clearLocalData();
              await refresh();
              setMessage("Local data wiped. Sync to restore from the server.");
            }}
          >
            Wipe this device
          </Button>
          <Button
            variant="danger"
            block
            onClick={() => {
              mockDb.reset();
              setMessage("Mock server reset. You'll need to sign up again.");
            }}
          >
            Reset mock server
          </Button>
        </div>

        <div className="card stack">
          <span className="label">Notifications</span>
          <Button
            variant="secondary"
            block
            onClick={async () => {
              const c = await getDueCounts();
              const ok = await showDueNotification(c.due + c.new);
              setMessage(ok ? "Notification sent." : "Permission not granted — enable it in Settings.");
            }}
          >
            Send a test “cards due” notification
          </Button>
        </div>
      </div>
    </div>
  );
}
