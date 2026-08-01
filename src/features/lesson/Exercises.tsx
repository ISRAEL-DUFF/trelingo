import { useMemo, useState, type ReactNode } from "react";
import { HebrewWord } from "@/components/HebrewWord";
import { Button } from "@/components/ui";
import { formatRoot } from "@/lib/hebrew";
import { playWord } from "@/lib/audio";
import { wordById, words as allWords, type Exercise, type Parse } from "@/content";
import { gradeChoice, gradeMatching, gradeParse, gradeTranslation, type GradeResult } from "./grade";

/** Narrow the Exercise union to one variant. */
type Of<T extends Exercise["type"]> = Extract<Exercise, { type: T }>;

interface BaseProps {
  onAnswer: (result: GradeResult) => void;
  fadeStage?: number;
  soundEnabled?: boolean;
}

export type ExerciseProps = BaseProps & { exercise: Exercise };

/**
 * Every view below receives an already-narrowed exercise. Components must never
 * early-return before their hooks run, so the type test happens once, in the
 * dispatcher at the bottom of this file.
 */

/** Deterministic shuffle so choices don't reorder on every re-render. */
function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rand = () => {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    return h / 0x7fffffff;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

const HEBREW_RANGE = /[֐-׿]/;

function Note({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p
      className="small muted center"
      style={{ fontStyle: "italic", padding: "14px 24px 0", lineHeight: 1.6 }}
    >
      {children}
    </p>
  );
}

function Prompt({ children }: { children: ReactNode }) {
  return (
    <p className="small muted center" style={{ margin: "0 0 14px" }}>
      {children}
    </p>
  );
}

// ---------- Multiple-choice vocabulary ----------

function McVocabExerciseView({
  exercise,
  onAnswer,
  fadeStage = 0,
  soundEnabled,
}: BaseProps & { exercise: Of<"mc_vocab"> }) {
  const [selected, setSelected] = useState<string | null>(null);
  const word = wordById.get(exercise.wordId);
  const production = exercise.direction === "production";

  const choices = useMemo(() => {
    if (!word) return [];
    if (!production) return seededShuffle([word.gloss, ...word.distractors.slice(0, 3)], exercise.id);
    // Production: pick the Hebrew form. Distractors come from other roots so the
    // answer can't be guessed from letter shape alone.
    const others = allWords.filter((w) => w.id !== word.id && w.rootId !== word.rootId);
    const picked = seededShuffle(others, exercise.id)
      .slice(0, 3)
      .map((w) => w.hebrew);
    return seededShuffle([word.hebrew, ...picked], exercise.id);
  }, [word, production, exercise.id]);

  if (!word) return null;
  const answer = production ? word.hebrew : word.gloss;
  const revealed = selected !== null;

  const choose = (c: string) => {
    if (revealed) return;
    setSelected(c);
    void playWord(word.id, word.hebrew, { enabled: soundEnabled });
    onAnswer(gradeChoice(c, answer));
  };

  return (
    <div>
      <div className="center" style={{ padding: "30px 24px 6px" }}>
        <Prompt>{exercise.prompt}</Prompt>
        {production ? (
          <p style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>{word.gloss}</p>
        ) : (
          <>
            <HebrewWord
              word={word.hebrew}
              rootIndices={word.rootIndices}
              size={52}
              highlight={revealed}
              fadeStage={fadeStage}
            />
            <div className="translit" style={{ marginTop: 10, minHeight: 18 }}>
              {revealed ? word.translit : ""}
            </div>
          </>
        )}
      </div>

      <div className="choice-list" style={{ marginTop: 18 }}>
        {choices.map((c) => {
          const cls = revealed
            ? c === answer
              ? " choice--correct"
              : c === selected
                ? " choice--wrong"
                : ""
            : "";
          return (
            <button key={c} className={`choice${cls}`} onClick={() => choose(c)} disabled={revealed}>
              {production ? <HebrewWord word={c} size={26} highlight={false} /> : c}
            </button>
          );
        })}
      </div>

      {revealed && word.notes && <Note>{word.notes}</Note>}
    </div>
  );
}

// ---------- Conjugation ----------

function ConjugationExerciseView({
  exercise,
  onAnswer,
}: BaseProps & { exercise: Of<"conjugation"> }) {
  const [selected, setSelected] = useState<string | null>(null);
  const choices = useMemo(() => seededShuffle(exercise.choices, exercise.id), [exercise]);
  const revealed = selected !== null;

  const choose = (c: string) => {
    if (revealed) return;
    setSelected(c);
    onAnswer(gradeChoice(c, exercise.answer));
  };

  return (
    <div>
      <div className="center" style={{ padding: "30px 24px 10px" }}>
        <Prompt>Grammar drill</Prompt>
        <p style={{ fontSize: 16, lineHeight: 1.55, margin: "0 0 14px" }}>{exercise.prompt}</p>
        <span className="tag tag--root">{formatRoot(exercise.rootId)}</span>
      </div>
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", padding: "14px 20px" }}
      >
        {choices.map((c) => {
          const cls = revealed
            ? c === exercise.answer
              ? " choice--correct"
              : c === selected
                ? " choice--wrong"
                : ""
            : "";
          return (
            <button
              key={c}
              className={`choice${cls}`}
              style={{ width: "auto", padding: "14px 20px" }}
              onClick={() => choose(c)}
              disabled={revealed}
            >
              <HebrewWord word={c} size={24} highlight={false} />
            </button>
          );
        })}
      </div>
      {revealed && <Note>{exercise.note}</Note>}
    </div>
  );
}

// ---------- Construct chain ----------

function ConstructChainExerciseView({
  exercise,
  onAnswer,
}: BaseProps & { exercise: Of<"construct_chain"> }) {
  const [selected, setSelected] = useState<string | null>(null);
  const choices = useMemo(() => seededShuffle(exercise.choices, exercise.id), [exercise]);
  const revealed = selected !== null;
  const isHebrew = HEBREW_RANGE.test(exercise.choices[0] ?? "");

  const choose = (c: string) => {
    if (revealed) return;
    setSelected(c);
    onAnswer(gradeChoice(c, exercise.answer));
  };

  return (
    <div>
      <div className="center" style={{ padding: "30px 24px 10px" }}>
        <Prompt>Grammar</Prompt>
        <p style={{ fontSize: 16, lineHeight: 1.55, margin: 0 }}>{exercise.prompt}</p>
      </div>
      <div className="choice-list" style={{ marginTop: 16 }}>
        {choices.map((c) => {
          const cls = revealed
            ? c === exercise.answer
              ? " choice--correct"
              : c === selected
                ? " choice--wrong"
                : ""
            : "";
          return (
            <button
              key={c}
              className={`choice${cls}`}
              style={{ textAlign: isHebrew ? "center" : "start" }}
              onClick={() => choose(c)}
              disabled={revealed}
            >
              {isHebrew ? <HebrewWord word={c} size={24} highlight={false} /> : c}
            </button>
          );
        })}
      </div>
      {revealed && <Note>{exercise.note}</Note>}
    </div>
  );
}

// ---------- Parsing (tap-to-tag) ----------

const FIELD_OPTIONS: Record<string, { value: string; label: string }[]> = {
  binyan: [
    { value: "qal", label: "Qal" },
    { value: "niphal", label: "Niphal" },
    { value: "piel", label: "Piel" },
    { value: "pual", label: "Pual" },
    { value: "hiphil", label: "Hiphil" },
    { value: "hophal", label: "Hophal" },
    { value: "hitpael", label: "Hitpael" },
  ],
  tense: [
    { value: "perfect", label: "Perfect" },
    { value: "imperfect", label: "Imperfect" },
    { value: "imperative", label: "Imperative" },
    { value: "participle", label: "Participle" },
    { value: "infinitive_construct", label: "Inf. construct" },
    { value: "jussive", label: "Jussive" },
  ],
  person: [
    { value: "1", label: "1st" },
    { value: "2", label: "2nd" },
    { value: "3", label: "3rd" },
  ],
  gender: [
    { value: "m", label: "Masc." },
    { value: "f", label: "Fem." },
    { value: "c", label: "Common" },
  ],
  number: [
    { value: "s", label: "Singular" },
    { value: "p", label: "Plural" },
  ],
};

const FIELD_LABELS: Record<string, string> = {
  binyan: "Stem (binyan)",
  tense: "Form",
  person: "Person",
  gender: "Gender",
  number: "Number",
};

function ParsingExerciseView({
  exercise,
  onAnswer,
  fadeStage = 0,
}: BaseProps & { exercise: Of<"parsing"> }) {
  const [picks, setPicks] = useState<Partial<Parse>>({});
  const [result, setResult] = useState<GradeResult | null>(null);
  const complete = exercise.fields.every((f) => picks[f] !== undefined);

  const submit = () => {
    if (!complete || result) return;
    const r = gradeParse(picks, exercise.answer, exercise.fields);
    setResult(r);
    onAnswer(r);
  };

  return (
    <div>
      <div className="center" style={{ padding: "26px 24px 8px" }}>
        <Prompt>{exercise.prompt}</Prompt>
        <HebrewWord
          word={exercise.hebrew}
          rootIndices={exercise.rootIndices}
          size={46}
          highlight
          fadeStage={fadeStage}
        />
        <div style={{ marginTop: 10 }}>
          <span className="tag tag--root">{formatRoot(exercise.rootId)}</span>
        </div>
      </div>

      <div className="stack pad-x" style={{ marginTop: 12 }}>
        {exercise.fields.map((field) => (
          <div key={field} className="field">
            <span className="label">{FIELD_LABELS[field] ?? field}</span>
            <div className="chips">
              {(FIELD_OPTIONS[field] ?? []).map((opt) => {
                const chosen = picks[field] === opt.value;
                let cls = chosen ? " chip--selected" : "";
                if (result) {
                  if (opt.value === exercise.answer[field]) cls = " chip--correct";
                  else if (chosen) cls = " chip--wrong";
                }
                return (
                  <button
                    key={opt.value}
                    className={`chip${cls}`}
                    disabled={!!result}
                    onClick={() => setPicks((p) => ({ ...p, [field]: opt.value }))}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {!result ? (
        <div className="pad">
          <Button block disabled={!complete} onClick={submit}>
            {complete ? "Check" : "Tag every field"}
          </Button>
        </div>
      ) : (
        <>
          {result.explanation && (
            <p className="small center muted" style={{ marginTop: 14 }}>
              {result.explanation}
            </p>
          )}
          <Note>{exercise.note}</Note>
        </>
      )}
    </div>
  );
}

// ---------- Binyan comparison (matching) ----------

function BinyanCompareExerciseView({
  exercise,
  onAnswer,
}: BaseProps & { exercise: Of<"binyan_compare"> }) {
  const [assigned, setAssigned] = useState<Record<string, string>>({});
  const [result, setResult] = useState<GradeResult | null>(null);
  const [activeForm, setActiveForm] = useState<string | null>(null);

  const glosses = useMemo(
    () => seededShuffle(exercise.forms.map((f) => f.gloss), exercise.id),
    [exercise],
  );
  const expected = useMemo(
    () => Object.fromEntries(exercise.forms.map((f) => [f.hebrew, f.gloss])),
    [exercise],
  );
  const complete = exercise.forms.every((f) => assigned[f.hebrew]);

  const assign = (gloss: string) => {
    if (result || !activeForm) return;
    setAssigned((a) => {
      const next = { ...a };
      // Each gloss is used once — clear any previous owner.
      for (const k of Object.keys(next)) if (next[k] === gloss) delete next[k];
      next[activeForm] = gloss;
      return next;
    });
    setActiveForm(null);
  };

  const submit = () => {
    if (!complete || result) return;
    const r = gradeMatching(assigned, expected);
    setResult(r);
    onAnswer(r);
  };

  return (
    <div>
      <div className="center" style={{ padding: "26px 24px 6px" }}>
        <Prompt>{exercise.prompt}</Prompt>
        <span className="tag tag--root">{formatRoot(exercise.rootId)}</span>
      </div>

      <div className="stack pad-x" style={{ marginTop: 16 }}>
        {exercise.forms.map((f) => {
          const chosen = assigned[f.hebrew];
          const correct = result?.fields?.[f.hebrew];
          return (
            <button
              key={f.hebrew}
              className="choice"
              style={{
                borderColor:
                  result != null
                    ? correct
                      ? "var(--sage)"
                      : "var(--root)"
                    : activeForm === f.hebrew
                      ? "var(--gold)"
                      : undefined,
              }}
              disabled={!!result}
              onClick={() => setActiveForm(activeForm === f.hebrew ? null : f.hebrew)}
            >
              <span className="row row--between">
                <span>
                  <HebrewWord word={f.hebrew} size={26} highlight={false} />
                  <span className="translit" style={{ display: "block", marginTop: 4 }}>
                    {f.translit} · {f.binyan}
                  </span>
                </span>
                <span className="small" style={{ textAlign: "end", maxWidth: "50%" }}>
                  {chosen ?? <span className="muted">tap, then pick a meaning</span>}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="pad-x" style={{ marginTop: 18 }}>
        <span className="label">Meanings</span>
        <div className="chips" style={{ marginTop: 8 }}>
          {glosses.map((g) => {
            const used = Object.values(assigned).includes(g);
            return (
              <button
                key={g}
                className={`chip${used ? " chip--selected" : ""}`}
                disabled={!!result || !activeForm}
                onClick={() => assign(g)}
              >
                {g}
              </button>
            );
          })}
        </div>
        {!result && !activeForm && (
          <p className="small muted" style={{ marginTop: 8 }}>
            Tap a form above first, then choose its meaning.
          </p>
        )}
      </div>

      {!result ? (
        <div className="pad">
          <Button block disabled={!complete} onClick={submit}>
            {complete ? "Check" : "Match every form"}
          </Button>
        </div>
      ) : (
        <Note>{exercise.note}</Note>
      )}
    </div>
  );
}

// ---------- Listening ----------

function ListeningExerciseView({
  exercise,
  onAnswer,
  soundEnabled = true,
}: BaseProps & { exercise: Of<"listening_mc"> }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [audioSource, setAudioSource] = useState<string | null>(null);
  const word = wordById.get(exercise.wordId);

  const choices = useMemo(
    () => (word ? seededShuffle([word.gloss, ...word.distractors.slice(0, 3)], exercise.id) : []),
    [word, exercise.id],
  );

  if (!word) return null;
  const revealed = selected !== null;

  const play = async () => {
    const r = await playWord(word.id, word.hebrew, { enabled: soundEnabled });
    setHasPlayed(true);
    setAudioSource(r.source);
  };

  const choose = (c: string) => {
    if (revealed) return;
    setSelected(c);
    onAnswer(gradeChoice(c, word.gloss));
  };

  return (
    <div>
      <div className="center" style={{ padding: "30px 24px 6px" }}>
        <Prompt>{exercise.prompt}</Prompt>
        <button
          className="btn btn--primary"
          onClick={() => void play()}
          style={{ width: 84, height: 84, borderRadius: "50%", fontSize: 30, padding: 0 }}
          aria-label="Play the word"
        >
          🔊
        </button>
        {!hasPlayed && (
          <p className="small muted" style={{ marginTop: 12 }}>
            Tap to hear it
          </p>
        )}
        {revealed && (
          <div style={{ marginTop: 16 }}>
            <HebrewWord word={word.hebrew} rootIndices={word.rootIndices} size={40} highlight />
            <div className="translit" style={{ marginTop: 6 }}>
              {word.translit}
            </div>
          </div>
        )}
        {audioSource === "speech" && (
          <p className="small muted" style={{ marginTop: 10 }}>
            Synthesised speech — recorded audio is not available yet.
          </p>
        )}
        {audioSource === "none" && (
          <p className="small muted" style={{ marginTop: 10 }}>
            No audio available on this device.
          </p>
        )}
      </div>

      <div className="choice-list" style={{ marginTop: 16 }}>
        {choices.map((c) => {
          const cls = revealed
            ? c === word.gloss
              ? " choice--correct"
              : c === selected
                ? " choice--wrong"
                : ""
            : "";
          return (
            <button key={c} className={`choice${cls}`} onClick={() => choose(c)} disabled={revealed}>
              {c}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Free-text translation ----------

function TranslationExerciseView({
  exercise,
  onAnswer,
  fadeStage = 0,
}: BaseProps & { exercise: Of<"translation"> }) {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<GradeResult | null>(null);

  const check = () => {
    if (result) return;
    const r = gradeTranslation(value, exercise.acceptable, exercise.keywords);
    setResult(r);
    // An uncertain grade is deliberately NOT reported to the SRS — the learner
    // decides, rather than the app guessing and mis-scheduling the card.
    if (r.verdict !== "uncertain") onAnswer(r);
  };

  const selfAssess = (gotIt: boolean) => {
    onAnswer({ verdict: gotIt ? "correct" : "incorrect", confidence: 1 });
    setResult((r) => ({ ...(r as GradeResult), verdict: gotIt ? "correct" : "incorrect" }));
  };

  return (
    <div>
      <div className="center" style={{ padding: "28px 24px 8px" }}>
        <Prompt>{exercise.prompt}</Prompt>
        <HebrewWord word={exercise.hebrew} size={38} highlight={false} fadeStage={fadeStage} />
      </div>

      <div className="pad-x stack" style={{ marginTop: 16 }}>
        <textarea
          className="textarea"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type your translation…"
          disabled={!!result && result.verdict !== "uncertain"}
          aria-label="Your translation"
        />
        {!result && (
          <Button block disabled={!value.trim()} onClick={check}>
            Check
          </Button>
        )}
      </div>

      {result && (
        <div className="pad-x stack" style={{ marginTop: 14 }}>
          {result.verdict === "correct" && <div className="banner banner--success">Correct.</div>}
          {result.verdict === "incorrect" && <div className="banner banner--error">Not quite.</div>}
          {result.verdict === "uncertain" && (
            <>
              <div className="banner banner--warn">
                {result.explanation ?? "We could not confidently grade this."}
              </div>
              <p className="small muted" style={{ margin: 0 }}>
                Expected something like: <strong>{exercise.acceptable[0]}</strong>
              </p>
              <div className="row" style={{ gap: 8 }}>
                <Button variant="secondary" block onClick={() => selfAssess(false)}>
                  I got it wrong
                </Button>
                <Button block onClick={() => selfAssess(true)}>
                  I got it right
                </Button>
              </div>
            </>
          )}
          {result.verdict !== "uncertain" && (
            <p className="small muted" style={{ margin: 0 }}>
              Accepted: {exercise.acceptable.slice(0, 2).join(" · ")}
            </p>
          )}
          <Note>{exercise.note}</Note>
        </div>
      )}
    </div>
  );
}

// ---------- Dispatcher ----------

export function ExerciseView({ exercise, ...rest }: ExerciseProps) {
  // The single place the union is narrowed. Because each branch renders a
  // different component type, React remounts on type change and the per-view
  // hook state resets cleanly.
  switch (exercise.type) {
    case "mc_vocab":
      return <McVocabExerciseView exercise={exercise} {...rest} />;
    case "conjugation":
      return <ConjugationExerciseView exercise={exercise} {...rest} />;
    case "construct_chain":
      return <ConstructChainExerciseView exercise={exercise} {...rest} />;
    case "parsing":
      return <ParsingExerciseView exercise={exercise} {...rest} />;
    case "binyan_compare":
      return <BinyanCompareExerciseView exercise={exercise} {...rest} />;
    case "listening_mc":
      return <ListeningExerciseView exercise={exercise} {...rest} />;
    case "translation":
      return <TranslationExerciseView exercise={exercise} {...rest} />;
  }
}
