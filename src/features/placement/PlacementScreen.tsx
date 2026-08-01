import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api/client";
import { NetworkError, type PlacementQuestion, type SubmitPlacementResponse } from "@/api/types";
import { Banner, Button, Spinner, TopBar } from "@/components/ui";
import { HebrewWord } from "@/components/HebrewWord";
import { unlockUnits } from "@/db/repo";
import { unitById } from "@/content";
import { useSession } from "@/state/session";

/**
 * Placement test (spec §4 Phase 7): let someone who already reads Hebrew skip
 * ahead rather than grinding through Genesis 1 to prove it.
 */
export function PlacementScreen() {
  const navigate = useNavigate();
  const user = useSession((s) => s.user);
  const [questions, setQuestions] = useState<PlacementQuestion[] | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: string; answer: string }[]>([]);
  const [result, setResult] = useState<SubmitPlacementResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getPlacementTest()
      .then((r) => setQuestions(r.questions))
      .catch((e) =>
        setError(
          e instanceof NetworkError
            ? "The placement test needs a connection. You can start from the beginning and skip units later."
            : "Could not load the placement test.",
        ),
      );
  }, []);

  const submit = async (final: { questionId: string; answer: string }[]) => {
    if (!user) {
      setError("Create an account to save a placement result.");
      return;
    }
    try {
      const r = await api.submitPlacement({ answers: final });
      await unlockUnits(r.unlockedUnitIds);
      setResult(r);
    } catch {
      setError("Could not score the test. Nothing was changed.");
    }
  };

  const choose = (choice: string) => {
    if (!questions) return;
    const q = questions[index]!;
    const next = [...answers, { questionId: q.id, answer: choice }];
    setAnswers(next);
    if (index < questions.length - 1) setIndex(index + 1);
    else void submit(next);
  };

  if (error && !questions) {
    return (
      <div className="screen">
        <TopBar left={<span className="small">Placement</span>} />
        <div className="pad">
          <Banner kind="warn">{error}</Banner>
          <div style={{ marginTop: 16 }}>
            <Button block onClick={() => navigate("/")}>
              Start from the beginning
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (result) {
    const names = result.unlockedUnitIds
      .map((id) => unitById.get(id)?.title)
      .filter(Boolean)
      .slice(-3);
    return (
      <div className="screen">
        <TopBar left={<span className="small">Placement</span>} />
        <div className="pad stack center" style={{ marginTop: 30 }}>
          <div style={{ fontSize: 40 }}>✦</div>
          <h1 className="title h1">Level {result.levelAssigned}</h1>
          <p className="small muted">
            {result.correct} of {result.total} correct. {result.unlockedUnitIds.length} units
            unlocked{names.length ? `, up to “${names[names.length - 1]}”.` : "."}
          </p>
          <p className="small muted">
            You can still go back and do the earlier units — they're open, not skipped.
          </p>
          <Button block onClick={() => navigate("/")}>
            Go to the path
          </Button>
        </div>
      </div>
    );
  }

  if (!questions) return <Spinner label="Loading placement test…" />;

  const q = questions[index]!;
  return (
    <div className="screen">
      <TopBar
        left={
          <button
            className="btn btn--ghost"
            style={{ color: "var(--chrome-fg)", padding: 0, minHeight: 0 }}
            onClick={() => navigate("/")}
          >
            ✕
          </button>
        }
        right={
          <span className="small">
            {index + 1}/{questions.length}
          </span>
        }
        progress={(index / questions.length) * 100}
      />
      <div className="center" style={{ padding: "34px 24px 10px" }}>
        <p className="small muted">{q.prompt}</p>
        <HebrewWord word={q.hebrew} size={50} highlight={false} />
      </div>
      <div className="choice-list" style={{ marginTop: 20 }}>
        {q.choices.map((c) => (
          <button key={c} className="choice" onClick={() => choose(c)}>
            {c}
          </button>
        ))}
      </div>
      <div className="pad">
        <Button variant="ghost" block onClick={() => choose("")}>
          I don't know
        </Button>
      </div>
    </div>
  );
}
