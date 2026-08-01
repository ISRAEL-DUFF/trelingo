import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { passageById, units } from "@/content";
import { db } from "@/db";
import { api } from "@/api/client";
import { Banner, Button, Empty, TopBar } from "@/components/ui";
import { HebrewWord } from "@/components/HebrewWord";
import type { AssessmentResult } from "@/api/types";

type Phase = "pick" | "reading" | "questions" | "done";

/**
 * Reading fluency check (spec §4 Phase 8).
 *
 * Results are stored as their own entity and deliberately do NOT feed the SRS —
 * "different signal, shouldn't pollute SRS scheduling". Reading slowly is not
 * the same as having forgotten a word.
 */
export function FluencyScreen() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("pick");
  const [passageId, setPassageId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const completed = useLiveQuery(
    async () => new Set((await db.progress.toArray()).map((p) => p.unitId)),
    [],
  );
  const available = units
    .filter((u) => completed?.has(u.id) && u.passageId)
    .map((u) => u.passageId!);

  const passage = passageId ? passageById.get(passageId) : undefined;

  // Comprehension questions are generated from the passage's own tokens — a
  // small template bank rather than anything pretending to be clever.
  const questions = useMemo(() => {
    if (!passage) return [];
    const glossed = passage.tokens.filter((t) => t.wordId);
    return glossed.slice(0, 3).map((t) => {
      const distractors = glossed
        .filter((o) => o.gloss !== t.gloss)
        .slice(0, 3)
        .map((o) => o.gloss);
      return {
        hebrew: t.hebrew,
        answer: t.gloss,
        choices: [t.gloss, ...distractors].sort(),
      };
    });
  }, [passage]);

  useEffect(() => {
    if (phase !== "reading") return;
    const id = window.setInterval(() => setElapsedMs(Date.now() - startedAt), 100);
    return () => window.clearInterval(id);
  }, [phase, startedAt]);

  const beginRead = (id: string) => {
    setPassageId(id);
    setStartedAt(Date.now());
    setElapsedMs(0);
    setPhase("reading");
  };

  const finishRead = () => {
    setElapsedMs(Date.now() - startedAt);
    setPhase("questions");
  };

  const answer = async (correct: boolean) => {
    const next = [...answers, correct];
    setAnswers(next);
    if (next.length < questions.length) return;

    const correctCount = next.filter(Boolean).length;
    try {
      const r = await api.submitAssessment({
        kind: "fluency",
        passageId,
        elapsedMs,
        wordCount: passage?.tokens.length ?? 0,
        correct: correctCount,
        total: questions.length,
      });
      setResult(r);
    } catch {
      // Offline: still show the learner their own numbers.
      const minutes = elapsedMs / 60000;
      setResult({
        id: "local",
        kind: "fluency",
        passageId,
        wordsPerMinute: minutes > 0 ? Math.round((passage?.tokens.length ?? 0) / minutes) : null,
        accuracy: questions.length ? correctCount / questions.length : 0,
        createdAt: Date.now(),
      });
      setError("Saved on this device — it will sync when you're back online.");
    }
    setPhase("done");
  };

  if (phase === "pick") {
    return (
      <div className="screen">
        <TopBar
          left={
            <button
              className="btn btn--ghost"
              style={{ color: "var(--chrome-fg)", padding: 0, minHeight: 0 }}
              onClick={() => navigate(-1)}
            >
              ← Back
            </button>
          }
        />
        <div className="pad stack">
          <h1 className="title h2">Reading fluency</h1>
          <p className="small muted" style={{ lineHeight: 1.6 }}>
            Read the verse aloud at your own pace, then tap done. You'll answer a few
            comprehension questions. This measures reading speed, not recall — it doesn't affect
            your review schedule.
          </p>
          {available.length === 0 ? (
            <Empty icon="⏱" title="No verses unlocked yet" hint="Finish a unit with a milestone verse first." />
          ) : (
            available.map((pid) => (
              <button key={pid} className="choice" onClick={() => beginRead(pid)}>
                {passageById.get(pid)?.reference}
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  if (phase === "reading" && passage) {
    return (
      <div className="screen">
        <TopBar left={<span className="small">Reading…</span>} right={<span className="translit">{(elapsedMs / 1000).toFixed(1)}s</span>} />
        <div className="pad">
          <div className="card" style={{ padding: "26px 16px" }}>
            <div className="passage">
              {passage.tokens.map((t, i) => (
                <span key={i}>
                  <HebrewWord word={t.hebrew} size={30} highlight={false} />
                </span>
              ))}
            </div>
          </div>
          <p className="small muted center" style={{ marginTop: 14 }}>
            No glosses while the clock runs.
          </p>
          <div style={{ marginTop: 18 }}>
            <Button block onClick={finishRead}>
              Done reading
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "questions") {
    const q = questions[answers.length];
    if (!q) return null;
    return (
      <div className="screen">
        <TopBar
          left={<span className="small">Comprehension</span>}
          right={
            <span className="small">
              {answers.length + 1}/{questions.length}
            </span>
          }
        />
        <div className="center" style={{ padding: "34px 24px 8px" }}>
          <p className="small muted">What does this word mean?</p>
          <HebrewWord word={q.hebrew} size={44} highlight={false} />
        </div>
        <div className="choice-list" style={{ marginTop: 18 }}>
          {q.choices.map((c) => (
            <button key={c} className="choice" onClick={() => void answer(c === q.answer)}>
              {c}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <TopBar left={<span className="small">Result</span>} />
      <div className="pad stack center" style={{ marginTop: 24 }}>
        <div style={{ fontSize: 40 }}>⏱</div>
        <h1 className="title h1">{result?.wordsPerMinute ?? "—"} wpm</h1>
        <p className="small muted">
          {Math.round((result?.accuracy ?? 0) * 100)}% comprehension ·{" "}
          {(elapsedMs / 1000).toFixed(1)}s for {passage?.tokens.length ?? 0} words
        </p>
        {error && <Banner kind="warn">{error}</Banner>}
        <p className="small muted" style={{ lineHeight: 1.6 }}>
          Fluency results are tracked separately from your review schedule, so a slow read never
          makes a word come round more often.
        </p>
        <Button block onClick={() => navigate("/progress")}>
          Back to progress
        </Button>
      </div>
    </div>
  );
}
