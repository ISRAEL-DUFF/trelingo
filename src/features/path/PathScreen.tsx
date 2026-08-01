import { useLiveQuery } from "dexie-react-hooks";
import { Link, useNavigate } from "react-router-dom";
import { units } from "@/content";
import { db } from "@/db";
import { getDueCounts, getPlacementUnlocked, getStreak, getXp } from "@/db/repo";
import { TopBar } from "@/components/ui";
import { SyncIndicator } from "@/features/sync/SyncIndicator";

type Status = "done" | "current" | "locked";

export function PathScreen() {
  const navigate = useNavigate();

  const data = useLiveQuery(async () => {
    const [progress, counts, xp, streak, unlocked] = await Promise.all([
      db.progress.toArray(),
      getDueCounts(),
      getXp(),
      getStreak(),
      getPlacementUnlocked(),
    ]);
    return {
      completed: new Set(progress.map((p) => p.unitId)),
      counts,
      xp,
      streak,
      unlocked: new Set(unlocked),
    };
  }, []);

  const completed = data?.completed ?? new Set<string>();
  const unlocked = data?.unlocked ?? new Set<string>();
  const dueTotal = (data?.counts.due ?? 0) + (data?.counts.new ?? 0);

  const statusOf = (unitId: string, requires: string | null): Status => {
    if (completed.has(unitId)) return "done";
    // Placement can open a unit without its prerequisite being completed.
    if (!requires || completed.has(requires) || unlocked.has(unitId)) return "current";
    return "locked";
  };

  return (
    <div className="screen">
      <TopBar
        left={
          <>
            <span aria-hidden>🔥</span>
            <span>{data?.streak.current ?? 0}</span>
          </>
        }
        progress={(completed.size / units.length) * 100}
        right={
          <>
            <span aria-hidden style={{ color: "var(--gold-bright)" }}>
              ✦
            </span>
            <span>{data?.xp ?? 0} XP</span>
          </>
        }
      />

      <div className="center" style={{ padding: "22px 20px 4px" }}>
        <p className="small muted" style={{ margin: 0, fontStyle: "italic", letterSpacing: 1 }}>
          <span lang="he" dir="rtl">
            שֹׁרֶשׁ
          </span>{" "}
          — “Root”
        </p>
        <h1 className="title h1" style={{ marginTop: 2 }}>
          Learn by the Root
        </h1>
      </div>

      <SyncIndicator />

      {dueTotal > 0 && (
        <div className="center" style={{ margin: "16px 0 4px" }}>
          <button
            className="btn"
            style={{
              border: "2px solid var(--root)",
              background: "var(--root-wash)",
              color: "var(--root)",
            }}
            onClick={() => navigate("/review")}
          >
            🔁 Review — {dueTotal} due
          </button>
        </div>
      )}

      <div className="path">
        {units.map((u, i) => {
          const s = statusOf(u.id, u.requires);
          const offset = i % 2 === 0 ? -34 : 34;
          return (
            <div key={u.id} className="path__node" style={{ transform: `translateX(${offset}px)` }}>
              <button
                className={`path__button path__button--${s}`}
                disabled={s === "locked"}
                onClick={() => s !== "locked" && navigate(`/lesson/${u.id}`)}
                aria-label={`${u.title}${s === "locked" ? " (locked)" : ""}`}
              >
                {s === "done" ? "✓" : s === "locked" ? "🔒" : u.type === "grammar" ? "📖" : "▶"}
              </button>
              <div className="path__label">{u.title}</div>
              {u.subtitle && (
                <div className="path__label small" style={{ opacity: 0.7, marginTop: 0 }}>
                  {u.subtitle}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {completed.size === 0 && (
        <div className="pad-x" style={{ marginTop: 8 }}>
          <Link
            to="/placement"
            className="card card--flat"
            style={{ display: "block", textDecoration: "none", color: "inherit" }}
          >
            <div className="row row--between">
              <div>
                <div style={{ fontWeight: 600 }}>Already know some Hebrew?</div>
                <div className="small muted">Take a short placement test and skip ahead.</div>
              </div>
              <span className="muted">›</span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
