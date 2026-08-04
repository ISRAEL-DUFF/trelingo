import { useLiveQuery } from "dexie-react-hooks";
import { Link, useNavigate } from "react-router-dom";
import { useCourse, useCourseContent } from "@/state/useCourse";
import { varietyOf } from "@/content/course";
import { CourseSwitcher } from "@/features/courses/CourseScreen";
import { Fragment, useMemo, useState } from "react";
import { db } from "@/db";
import { ALL_COURSES, getDueCounts, getPlacementUnlocked, getStreak, getXp } from "@/db/repo";
import { TopBar } from "@/components/ui";
import { InstallBanner } from "@/components/InstallBanner";
import { SyncIndicator } from "@/features/sync/SyncIndicator";
import { reviewCapacity } from "@/features/lesson/session";
import { canScan } from "@/features/scan/targets";

type Status = "done" | "current" | "locked";

type SectionLike = { id: string; label: string; subtitle?: string };

/**
 * Chapter picker, shown above the path for a track that is a whole book.
 *
 * Only ONE chapter's units are rendered at a time. A book is read chapter by
 * chapter, so that is also how it should be shown — and it is what keeps the
 * path finite: Jonah is 25 units across 4 chapters, but Genesis would be 766
 * across 50, which no amount of scrolling makes navigable.
 *
 * Each chapter carries its own new-word count, deliberately. Chapters are NOT
 * equal: Jonah 1 introduces 99 of the book's 245 lexemes, and Genesis 10 jumps
 * back to 94 after Genesis 9 needed 25 (coverage-findings.md §4a). Identical
 * chips would imply identical effort.
 *
 * Selection is free; progression is not. Any chapter can be opened to look at,
 * but its units stay locked until the ones before them are done — vocabulary is
 * cumulative, and arriving at chapter 12 cold means knowing almost none of it.
 */
function ChapterPicker({
  sections,
  units,
  completed,
  activeId,
  onPick,
}: {
  sections: SectionLike[];
  units: { id: string; sectionId?: string }[];
  completed: Set<string>;
  activeId: string;
  onPick: (id: string) => void;
}) {
  return (
    <div className="pad-x" style={{ marginTop: 14 }}>
      <div className="chips" style={{ gap: 8, flexWrap: "wrap" }}>
        {sections.map((sec) => {
          const mine = units.filter((u) => u.sectionId === sec.id);
          const done = mine.filter((u) => completed.has(u.id)).length;
          const finished = mine.length > 0 && done === mine.length;
          return (
            <button
              key={sec.id}
              className={`chip${sec.id === activeId ? " chip--selected" : ""}`}
              onClick={() => onPick(sec.id)}
              aria-current={sec.id === activeId ? "true" : undefined}
            >
              {finished && <span aria-hidden>✓ </span>}
              {sec.label.replace("Chapter ", "Ch ")}
              {/* Separator matters: "Ch 1" beside "0/8" reads as "Ch 10/8". */}
              <span className="muted" style={{ marginInlineStart: 6 }}>
                · {done}/{mine.length}
              </span>
            </button>
          );
        })}
      </div>
      {(() => {
        const sec = sections.find((x) => x.id === activeId);
        return sec?.subtitle ? (
          <div className="small muted" style={{ marginTop: 8 }}>
            {sec.label} · {sec.subtitle}
          </div>
        ) : null;
      })()}
    </div>
  );
}

export function PathScreen() {
  const { units, sections } = useCourseContent();
  const chapters = sections ?? [];
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

  /**
   * Which chapter is open.
   *
   * Defaults to the one holding the first unfinished unit, so a returning
   * learner lands where they stopped rather than at chapter 1 — the reason a
   * long book needs selection at all. Null until progress has loaded, so the
   * default is computed from real data rather than flashing chapter 1 first.
   */
  const [picked, setPicked] = useState<string | null>(null);
  const nextChapter =
    units.find((u) => !completed.has(u.id))?.sectionId ?? chapters[chapters.length - 1]?.id;
  const openChapter = picked ?? nextChapter ?? chapters[0]?.id ?? "";
  const setOpenChapter = (id: string) => setPicked(id);

  // Only the open chapter is rendered. Everything else stays in the model —
  // `requires` still chains across chapter boundaries — but off the screen.
  const visibleUnits = chapters.length ? units.filter((u) => u.sectionId === openChapter) : units;
  const unlocked = data?.unlocked ?? new Set<string>();
  const dueTotal = (data?.counts.due ?? 0) + (data?.counts.new ?? 0);
  const content = useCourseContent();
  const scannable = useMemo(
    () => canScan(content, completed, chapters.length ? openChapter : undefined),
    [content, completed, chapters.length, openChapter],
  );

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
          {/*
            Variety, then track. The language is left implicit because the
            variety name already carries it ("Attic Greek"), and because Koine
            versus Attic is the distinction a learner needs to see — that is
            what changes which text they are reading.
          */}
          <span className="muted" style={{ fontWeight: 400 }}>
            {varietyOf(course).name}
          </span>
          <span aria-hidden className="muted" style={{ margin: "0 6px", fontWeight: 400 }}>
            ›
          </span>
          {course.name} <span aria-hidden>▾</span>
        </button>
        <p className="small muted" style={{ margin: "2px 0 0", lineHeight: 1.5 }}>
          {course.subtitle}
        </p>
      </div>

      <SyncIndicator />
      <CourseSwitcher open={switching} onClose={() => setSwitching(false)} />

      {/* Android Chrome has no address-bar install icon; see InstallBanner. */}
      <InstallBanner />

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
          {/*
            Say what lessons can and cannot absorb.

            Every lesson now mixes review in, but on a whole book the queue
            outruns it: by Jonah's last unit around 128 words are due and a
            lesson takes 31. Without this line the learner sees a number growing
            for reasons they cannot act on, and the tab that would clear it looks
            optional. Hidden while lessons are keeping up, which is most of a
            short track.
          */}
          {dueTotal > reviewCapacity(dueTotal) * 2 && (
            <p className="small muted" style={{ margin: "8px auto 0", maxWidth: 300, lineHeight: 1.5 }}>
              Lessons revisit about {reviewCapacity(dueTotal)} of these. The rest are waiting here.
            </p>
          )}
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
            or review all {data!.allDue} across every track
          </button>
        </div>
      )}

      {chapters.length > 0 && (
        <ChapterPicker
          sections={chapters}
          units={units}
          completed={completed}
          activeId={openChapter}
          onPick={setOpenChapter}
        />
      )}

      {/*
        Scan-and-find, offered on the chapter it applies to.

        Deliberately here rather than in the tab bar: it is a thing you do to a
        chapter you have finished reading, so it belongs beside that chapter.
        Hidden entirely until the finished verses actually contain a root that
        recurs in more than one form — an empty scan would be worse than none.
      */}
      {scannable && (
        <div className="center" style={{ marginTop: 12 }}>
          <button
            className="btn btn--ghost"
            style={{ minHeight: 0, fontSize: 13, color: "var(--accent)", fontWeight: 600 }}
            onClick={() => navigate(chapters.length ? `/scan/${openChapter}` : "/scan")}
          >
            🔍 Scan {chapters.length ? chapters.find((c) => c.id === openChapter)?.label ?? "this chapter" : "what you've read"} for a{" "}
            {course.morphemeNoun}
          </button>
        </div>
      )}

      <div className="path">
        {visibleUnits.map((u, i) => {
          const s = statusOf(u.id, u.requires);
          const offset = i % 2 === 0 ? -34 : 34;
          return (
            <Fragment key={u.id}>
            <div className="path__node" style={{ transform: `translateX(${offset}px)` }}>
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
            </Fragment>
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
