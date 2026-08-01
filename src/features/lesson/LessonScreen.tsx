import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCourseContent } from "@/state/useCourse";
import { Button, TopBar } from "@/components/ui";
import { ScriptWord } from "@/components/ScriptWord";
import { ExerciseView } from "./Exercises";
import type { GradeResult } from "./grade";
import { completeUnit, recordReview } from "@/db/repo";
import { addXp, touchStreak } from "@/db/repo";
import { useSession } from "@/state/session";
import { getCourse, scriptOf } from "@/content/course";
import { sync } from "@/sync/sync";
import { PassageReader } from "@/features/reading/PassageReader";

/**
 * Runs one unit: its exercises, then the milestone verse, then the summary.
 *
 * Answers feed the SRS directly — getting a vocabulary item wrong in a lesson
 * schedules that card exactly as failing it in a review would. There is no
 * separate "lesson score" that quietly disagrees with what the learner knows.
 */
export function LessonScreen() {
  const { unitById, wordById } = useCourseContent();
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const settings = useSession((s) => s.settings);
  const unit = unitId ? unitById.get(unitId) : undefined;

  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [phase, setPhase] = useState<"exercises" | "passage" | "done">("exercises");
  const [answered, setAnswered] = useState(false);

  const exercises = useMemo(() => unit?.exercises ?? [], [unit]);
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
    if (current && "wordId" in current) {
      await recordReview(current.wordId, result.verdict === "correct" ? 2 : 0);
    }
  };

  const next = async () => {
    setAnswered(false);
    if (index < exercises.length - 1) {
      setIndex(index + 1);
      return;
    }
    if (unit.passageId && phase === "exercises") {
      setPhase("passage");
      return;
    }
    await finish();
  };

  const finish = async () => {
    const score = exercises.length ? correctCount / exercises.length : 1;
    await completeUnit(unit.id, score);
    await addXp(10 * exercises.length);
    await touchStreak();
    void sync();
    setPhase("done");
  };

  if (phase === "done") {
    const score = exercises.length ? Math.round((correctCount / exercises.length) * 100) : 100;
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
            +{10 * exercises.length} XP · new cards added to your review queue
          </p>
          <div style={{ marginTop: 26 }}>
            <Button onClick={() => navigate("/")}>Back to path</Button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "passage" && unit.passageId) {
    return (
      <div className="screen">
        <TopBar
          left={<span className="small">Milestone</span>}
          right={<span className="small">{unit.subtitle}</span>}
          progress={100}
        />
        <div className="pad">
          <p className="small muted center">
            You now know every word you need for this verse. Tap any word to see its{" "}
            {getCourse().morphemeNoun}.
          </p>
        </div>
        <PassageReader passageId={unit.passageId} />
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
              <ScriptWord word={word.text} highlight={word.morphology.highlight} size={22} showHighlight />
              <span className="small muted" style={{ marginInlineStart: 8 }}>
                {word.gloss}
              </span>
            </div>
          )}
          <Button block onClick={() => void next()}>
            {index < exercises.length - 1 ? "Continue" : unit.passageId ? "Read the verse" : "Finish"}
          </Button>
        </div>
      )}
    </div>
  );
}
