import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCourseContent } from "@/state/useCourse";
import { Button, TopBar } from "@/components/ui";
import { ScriptWord } from "@/components/ScriptWord";
import { ExerciseView } from "./Exercises";
import type { GradeResult } from "./grade";
import { completeUnit, getCompletedUnitIds, getReviewQueue, recordReview } from "@/db/repo";
import { buildSession, reviewCount, wordsToSchedule } from "./session";
import type { LocalCard } from "@/db";
import { addXp, touchStreak } from "@/db/repo";
import { useSession } from "@/state/session";
import { getCourse, scriptOf } from "@/content/course";
import { sync } from "@/sync/sync";
import { PassageReader } from "@/features/reading/PassageReader";
import { WordFrequency } from "@/components/WordFrequency";
import { passagesOf } from "@/content/schema";

/**
 * XP for finishing a unit.
 *
 * Ten an exercise, but never nothing. A continuous book eventually produces a
 * unit that introduces no new vocabulary — Ruth 3:5–6 is two verses of words
 * the learner already knows — and with an empty review queue that lesson is
 * pure reading. Reading the text is the thing the whole app is for; it cannot
 * be the one unit that pays zero.
 */
const MIN_UNIT_XP = 10;
export const xpFor = (exerciseCount: number) => Math.max(MIN_UNIT_XP, 10 * exerciseCount);

/**
 * Runs one unit: its exercises, then the milestone verse, then the summary.
 *
 * Answers feed the SRS directly — getting a vocabulary item wrong in a lesson
 * schedules that card exactly as failing it in a review would. There is no
 * separate "lesson score" that quietly disagrees with what the learner knows.
 *
 * A lesson is NOT only its authored exercises. `buildSession` appends whatever
 * is due from the review queue, because every unit teaches only the words it
 * introduces — so without this a word met in chapter 1 was drilled once and
 * never seen again by any lesson, and all recurrence depended on the learner
 * choosing to open a separate Review tab.
 */
export function LessonScreen() {
  const { unitById, wordById } = useCourseContent();
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const settings = useSession((s) => s.settings);
  const unit = unitId ? unitById.get(unitId) : undefined;

  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  /** Words already advanced by this lesson — see the note in `onAnswer`. */
  const scheduled = useRef(new Set<string>());
  const [phase, setPhase] = useState<"exercises" | "passage" | "done">("exercises");
  const [answered, setAnswered] = useState(false);

  const content = useCourseContent();

  /**
   * Due cards and finished units, for the review mixed into this lesson.
   *
   * Snapshotted ONCE, not live. Answering a review writes to `srsCards`, which
   * would re-run a live query, rebuild the session and swap the exercise out
   * from under the learner at the same index — a second matching grid appeared
   * mid-answer when this used `useLiveQuery`.
   *
   * It is the same defect as the original prototype's review-queue skip: a live
   * re-filter behind a stable index. A lesson is a fixed list once begun.
   */
  const [review, setReview] = useState<{ due: LocalCard[]; completedUnitIds: string[] } | null>(null);
  useEffect(() => {
    let cancelled = false;
    // A new unit is a new lesson, so every word is eligible to advance again.
    scheduled.current = new Set();
    void (async () => {
      const [due, completedUnitIds] = await Promise.all([
        getReviewQueue(Date.now()),
        getCompletedUnitIds(),
      ]);
      if (!cancelled) setReview({ due, completedUnitIds });
    })();
    return () => {
      cancelled = true;
    };
  }, [unitId]);

  /** Every verse this unit teaches, in text order. */
  const versesRead = useMemo(() => (unit ? passagesOf(unit) : []), [unit]);

  const exercises = useMemo(() => {
    if (!unit) return [];
    if (!review) return unit.exercises;
    return buildSession({
      unit,
      content,
      due: review.due,
      completedUnitIds: new Set(review.completedUnitIds),
    });
  }, [unit, content, review]);
  const current = exercises[index];

  if (!unit) {
    return (
      <div className="screen">
        <TopBar left={<button className="btn btn--ghost" onClick={() => navigate("/")}>← Back</button>} />
        <div className="empty">Unit not found.</div>
      </div>
    );
  }

  const onAnswer = async (result: GradeResult) => {
    setAnswered(true);
    if (result.verdict === "correct") setCorrectCount((c) => c + 1);

    // Vocabulary exercises drive the SRS. A wrong answer is "Again"; a right one
    // is "Good" — Easy is reserved for the review screen where the learner
    // explicitly rates their own recall.
    //
    // `wordsToSchedule` holds the rule about repeated sightings; see its note.
    const correct = result.verdict === "correct";
    for (const id of wordsToSchedule(current, correct, scheduled.current)) {
      scheduled.current.add(id);
      await recordReview(id, correct ? 2 : 0);
    }
  };

  const next = async () => {
    setAnswered(false);
    if (index < exercises.length - 1) {
      setIndex(index + 1);
      return;
    }
    if (versesRead.length && phase === "exercises") {
      setPhase("passage");
      return;
    }
    await finish();
  };

  const finish = async () => {
    const score = exercises.length ? correctCount / exercises.length : 1;
    await completeUnit(unit.id, score);
    await addXp(xpFor(exercises.length));
    await touchStreak();
    void sync();
    setPhase("done");
  };

  if (phase === "done") {
    const score = exercises.length ? Math.round((correctCount / exercises.length) * 100) : 100;
    const revisited = reviewCount(unit, exercises);
    return (
      <div className="screen screen--full" style={{ background: "var(--chrome-bg)", minHeight: "100dvh" }}>
        <div
          className="center"
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            minHeight: "100dvh",
            padding: 30,
            color: "var(--chrome-fg)",
          }}
        >
          <div style={{ fontSize: 44 }}>✦</div>
          <h1 className="title h1" style={{ color: "var(--chrome-fg)" }}>
            Unit complete
          </h1>
          <p style={{ color: "var(--gold-bright)", fontSize: 16 }}>
            {correctCount} / {exercises.length} correct · {score}%
          </p>
          <p className="small" style={{ color: "var(--parchment-deep)" }}>
            +{xpFor(exercises.length)} XP · new cards added to your review queue
            {revisited > 0 && (
              <>
                <br />
                {revisited} earlier word{revisited === 1 ? "" : "s"} revisited in this lesson
              </>
            )}
          </p>
          <div style={{ marginTop: 26 }}>
            <Button onClick={() => navigate("/")}>Back to path</Button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "passage" && versesRead.length) {
    return (
      <div className="screen">
        <TopBar
          left={<span className="small">Milestone</span>}
          right={<span className="small">{unit.subtitle}</span>}
          progress={100}
        />
        <div className="pad">
          <p className="small muted center">
            You now know every word you need for {versesRead.length === 1 ? "this verse" : "these verses"}.
            Tap any word to see its {getCourse().morphemeNoun}.
          </p>
        </div>
        {/*
          Every verse the unit covers, not only the one it ends on. A Jonah unit
          teaches two, and showing one left half the book displayed nowhere.
        */}
        {versesRead.map((id) => (
          <PassageReader key={id} passageId={id} />
        ))}
        <div className="pad">
          <Button block onClick={() => void finish()}>
            Finish unit
          </Button>
        </div>
      </div>
    );
  }

  const progress = (index / Math.max(1, exercises.length)) * 100;
  const word = current && "wordId" in current ? wordById.get(current.wordId) : undefined;

  return (
    <div className="screen">
      <TopBar
        left={
          <button
            className="btn btn--ghost"
            style={{ color: "var(--chrome-fg)", padding: 0, minHeight: 0 }}
            onClick={() => navigate("/")}
            aria-label="Leave lesson"
          >
            ✕
          </button>
        }
        right={
          <span className="small">
            {index + 1}/{exercises.length}
          </span>
        }
        progress={progress}
      />

      {current && (
        <ExerciseView
          key={current.id}
          exercise={current}
          onAnswer={(r) => void onAnswer(r)}
          fadeStage={settings?.diacriticsPref === "off" ? scriptOf().stages : 0}
          soundEnabled={settings?.soundEnabled ?? true}
        />
      )}

      {answered && (
        <div className="pad" style={{ paddingTop: 24 }}>
          {word && (
            <div className="center" style={{ marginBottom: 14 }}>
              <ScriptWord word={word.text} highlight={word.morphology?.highlight} size={22} showHighlight />
              <span className="small muted" style={{ marginInlineStart: 8 }}>
                {word.gloss}
              </span>
              {/* Rarity at the moment of learning, not only when browsing. */}
              <div style={{ display: "flex", justifyContent: "center", marginTop: 6 }}>
                <WordFrequency frequency={word.frequency} />
              </div>
            </div>
          )}
          <Button block onClick={() => void next()}>
            {index < exercises.length - 1
              ? "Continue"
              : versesRead.length === 0
                ? "Finish"
                : versesRead.length === 1
                  ? "Read the verse"
                  : "Read the verses"}
          </Button>
        </div>
      )}
    </div>
  );
}
