import { useEffect, useState } from "react";
import { api } from "@/api/client";
import { ApiError, NetworkError, type GemLedgerResponse, type LeagueResponse } from "@/api/types";
import { Banner, Button, Empty, Spinner, TopBar } from "@/components/ui";
import { useSession } from "@/state/session";
import { useLiveQuery } from "dexie-react-hooks";
import { getStreak } from "@/db/repo";
import { Link } from "react-router-dom";

/**
 * Small-cohort league (spec §4 Phase 6). Deliberately ~20 people, not a global
 * leaderboard: at low user counts a global board is either empty or meaningless.
 */
export function LeagueScreen() {
  const user = useSession((s) => s.user);
  const [league, setLeague] = useState<LeagueResponse | null>(null);
  const [gems, setGems] = useState<GemLedgerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const streak = useLiveQuery(() => getStreak(), []);

  const load = async () => {
    if (!user) return;
    try {
      const [l, g] = await Promise.all([api.getLeague(), api.getGems()]);
      setLeague(l);
      setGems(g);
      setError(null);
    } catch (e) {
      setError(
        e instanceof NetworkError
          ? "Leagues need a connection. Your learning works offline regardless."
          : e instanceof ApiError
            ? e.body.message
            : "Could not load the league.",
      );
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const buyFreeze = async () => {
    setBusy(true);
    try {
      setGems(await api.useStreakFreeze());
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.body.message : "Could not buy a freeze.");
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <div className="screen">
        <TopBar left={<span className="small">League</span>} />
        <Empty
          icon="🏅"
          title="Leagues need an account"
          hint="Create one to join a weekly cohort. Everything else works signed out."
        />
        <div className="pad">
          <Link to="/auth">
            <Button block>Create an account</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <TopBar
        left={<span className="small">League</span>}
        right={<span className="small">💎 {gems?.balance ?? 0}</span>}
      />

      <div className="pad stack">
        {error && <Banner kind="warn">{error}</Banner>}

        <div className="card">
          <div className="row row--between">
            <div>
              <div style={{ fontWeight: 600 }}>Streak freezes</div>
              <div className="small muted">
                {streak?.freezesAvailable ?? 0} available · covers one missed day
              </div>
            </div>
            <Button variant="secondary" onClick={() => void buyFreeze()} disabled={busy}>
              Buy · 50 💎
            </Button>
          </div>
        </div>

        {!league ? (
          <Spinner label="Loading standings…" />
        ) : (
          <div className="card">
            <div className="row row--between">
              <span className="label">Cohort {league.tier}</span>
              <span className="small muted">
                resets {new Date(league.endsAt).toLocaleDateString()}
              </span>
            </div>
            <div className="stack" style={{ marginTop: 12 }}>
              {league.members.map((m, i) => (
                <div
                  key={m.userId}
                  className="row row--between"
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    background: m.isCurrentUser ? "var(--gold-wash)" : "transparent",
                    fontWeight: m.isCurrentUser ? 600 : 400,
                  }}
                >
                  <span className="row" style={{ gap: 10 }}>
                    <span className="translit" style={{ width: 22 }}>
                      {i + 1}
                    </span>
                    <span>{m.isCurrentUser ? "You" : m.displayName}</span>
                  </span>
                  <span className="translit">{m.xpThisWeek} XP</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {gems && gems.transactions.length > 0 && (
          <div className="card">
            <span className="label">Gem history</span>
            <div className="stack" style={{ marginTop: 10 }}>
              {gems.transactions.slice(0, 8).map((t) => (
                <div key={t.id} className="row row--between small">
                  <span className="muted">{t.reason}</span>
                  <span style={{ color: t.amount > 0 ? "var(--sage)" : "var(--root)" }}>
                    {t.amount > 0 ? "+" : ""}
                    {t.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
