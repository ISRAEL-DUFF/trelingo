import { useLiveQuery } from "dexie-react-hooks";
import { Link, useNavigate } from "react-router-dom";
import { useCourse, useCourseContent } from "@/state/useCourse";
import { CourseSwitcher } from "@/features/courses/CourseScreen";
import { useState } from "react";
import { db } from "@/db";
import { ALL_COURSES, getDueCounts, getPlacementUnlocked, getStreak, getXp } from "@/db/repo";
import { TopBar } from "@/components/ui";
import { SyncIndicator } from "@/features/sync/SyncIndicator";

type Status = "done" | "current" | "locked";

export function PathScreen() {
  const { units } = useCourseContent();
  const course = useCourse();
  const [switching, setSwitching] = useState(false);
  const navigate = useNavigate();

  const data = useLiveQuery(async () => {
    const [progress, counts, xp, streak, unlocked, allCounts] = await Promise.all([
      db.unitProgress.toArray(),
      getDueCounts(),
      getXp(),
      getStreak(),
      getPlacementUnlocked(),
      getDueCounts(Date.now(), ALL_COURSES),
    ]);
    return {
      completed: new Set(progress.map((p) => p.unitId)),
      counts,
      xp,
      streak,
      unlocked: new Set(unlocked),
      allDue: allCounts.due + allCounts.new,
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
        <button
          className="btn btn--ghost"
          style={{ minHeight: 0, padding: "4px 12px", color: "var(--accent)", fontWeight: 600 }}
          onClick={() => setSwitching(true)}
        >
          {course.name} <span aria-hidden>▾</span>
        </button>
        <p className="small muted" style={{ margin: "2px 0 0", lineHeight: 1.5 }}>
          {course.subtitle}
        </p>
      </div>

      <SyncIndicator />
      <CourseSwitcher open={switching} onClose={() => setSwitching(false)} />

      {dueTotal > 0 && (
        <div className="center" style={{ margin: "16px 0 4px" }}>
          <button
            className="btn"
            style={{
              border: "2px solid var(--attention)",
              background: "var(--attention-wash)",
              color: "var(--attention)",
            }}
            onClick={() => navigate("/review")}
          >
            🔁 Review — {dueTotal} due
          </button>
        </div>
      )}

      {/* D4: the merged session is offered, never imposed. */}
      {(data?.allDue ?? 0) > dueTotal && (
        <div className="center" style={{ marginTop: 6 }}>
          <button
            className="btn btn--ghost"
            style={{ minHeight: 0, fontSize: 13 }}
            onClick={() => navigate("/review?all")}
          >
            or review all {data!.allDue} across every course
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
                <div style={{ fontWeight: 600 }}>Already know some {course.name}?</div>
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
