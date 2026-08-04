import { Fragment, useMemo, useState, type ReactNode } from "react";
import { ScriptWord } from "@/components/ScriptWord";
import { Button } from "@/components/ui";
import { scriptOf, parseFieldsOf, textProps } from "@/content/course";
import { findField } from "@/content/parse-fields";
import { playWord } from "@/lib/audio";
import { type Exercise, type Parse } from "@/content";
import { useCourseContent } from "@/state/useCourse";
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

/**
 * A shuffle with NO fixed point: nothing ends up where it started.
 *
 * A plain shuffle of the gloss column does not guarantee this. A random
 * permutation leaves one item in place on average, so a matching grid regularly
 * hands the learner a free pair sitting on its own row — two of them at once in
 * a six-pair grid, observed in the browser once grids grew past four.
 *
 * Exported for the test that pins it across every grid size the budget can ask
 * for, since the failure is intermittent by nature and easy to miss by eye.
 */
export function seededDerangement<T>(items: readonly T[], seed: string): T[] {
  if (items.length < 2) return [...items];
  const out = seededShuffle(items, seed);
  for (let i = 0; i < out.length; i++) {
    if (out[i] !== items[i]) continue;
    // Any other position works: its occupant cannot be items[i] (permutations
    // hold distinct entries), and it cannot itself be left holding its own item.
    for (let d = 1; d < out.length; d++) {
      const j = (i + d) % out.length;
      if (out[j] !== items[i] && out[i] !== items[j]) {
        [out[i], out[j]] = [out[j]!, out[i]!];
        break;
      }
    }
  }
  return out;
}

/** True when a choice is written in the course's script rather than English. */
function isScriptText(s: string): boolean {
  const script = scriptOf();
  return script.toLetterClusters(s).some((c) => script.isLetter(c));
}

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
  const { wordById, words: allWords } = useCourseContent();
  const [selected, setSelected] = useState<string | null>(null);
  const word = wordById.get(exercise.wordId);
  const production = exercise.direction === "production";

  const choices = useMemo(() => {
    if (!word) return [];
    if (!production) return seededShuffle([word.gloss, ...word.distractors.slice(0, 3)], exercise.id);
    // Production: pick the Hebrew form. Distractors come from other families so the
    // answer can't be guessed from letter shape alone.
    // Same-family words make confusing distractors, but "no family" is not a
    // family: two rootless words are unrelated and may sit beside each other.
    const others = allWords.filter(
      (w) => w.id !== word.id && !(w.familyId && word.familyId && w.familyId === word.familyId),
    );
    const picked = seededShuffle(others, exercise.id)
      .slice(0, 3)
      .map((w) => w.text);
    return seededShuffle([word.text, ...picked], exercise.id);
  }, [word, production, exercise.id]);

  if (!word) return null;
  const answer = production ? word.text : word.gloss;
  const revealed = selected !== null;

  const choose = (c: string) => {
    if (revealed) return;
    setSelected(c);
    void playWord(word.id, word.text, { enabled: soundEnabled });
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
            <ScriptWord
              word={word.text}
              highlight={word.morphology?.highlight}
              size={52}
              showHighlight={revealed}
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
              {production ? <ScriptWord word={c} size={26} showHighlight={false} /> : c}
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
        <span className="tag tag--family">{scriptOf().joinLetters(exercise.familyId)}</span>
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
              <ScriptWord word={c} size={24} showHighlight={false} />
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
  const inScript = isScriptText(exercise.choices[0] ?? "");

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
              style={{ textAlign: inScript ? "center" : "start" }}
              onClick={() => choose(c)}
              disabled={revealed}
            >
              {inScript ? <ScriptWord word={c} size={24} showHighlight={false} /> : c}
            </button>
          );
        })}
      </div>
      {revealed && <Note>{exercise.note}</Note>}
    </div>
  );
}

// ---------- Parsing (tap-to-tag) ----------

function ParsingExerciseView({
  exercise,
  onAnswer,
  fadeStage = 0,
}: BaseProps & { exercise: Of<"parsing"> }) {
  const [picks, setPicks] = useState<Partial<Parse>>({});
  const [result, setResult] = useState<GradeResult | null>(null);
  // Chips come from the course's language, not a hardcoded table — Hebrew shows
  // binyan and common gender, Greek will show case, voice, mood and neuter.
  const fields = parseFieldsOf();
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
        <ScriptWord
          word={exercise.text}
          highlight={exercise.morphology.highlight}
          size={46}
          showHighlight
          fadeStage={fadeStage}
        />
        <div style={{ marginTop: 10 }}>
          <span className="tag tag--family">{scriptOf().joinLetters(exercise.familyId)}</span>
        </div>
      </div>

      <div className="stack pad-x" style={{ marginTop: 12 }}>
        {exercise.fields.map((field) => (
          <div key={field} className="field">
            <span className="label">{findField(fields, field)?.label ?? field}</span>
            <div className="chips">
              {(findField(fields, field)?.options ?? []).map((opt) => {
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
    () => Object.fromEntries(exercise.forms.map((f) => [f.text, f.gloss])),
    [exercise],
  );
  const complete = exercise.forms.every((f) => assigned[f.text]);

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
        <span className="tag tag--family">{scriptOf().joinLetters(exercise.familyId)}</span>
      </div>

      <div className="stack pad-x" style={{ marginTop: 16 }}>
        {exercise.forms.map((f) => {
          const chosen = assigned[f.text];
          const correct = result?.fields?.[f.text];
          return (
            <button
              key={f.text}
              className="choice"
              style={{
                borderColor:
                  result != null
                    ? correct
                      ? "var(--sage)"
                      : "var(--danger)"
                    : activeForm === f.text
                      ? "var(--gold)"
                      : undefined,
              }}
              disabled={!!result}
              onClick={() => setActiveForm(activeForm === f.text ? null : f.text)}
            >
              <span className="row row--between">
                <span>
                  <ScriptWord word={f.text} size={26} showHighlight={false} />
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
  const { wordById } = useCourseContent();
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
    const r = await playWord(word.id, word.text, { enabled: soundEnabled });
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
            <ScriptWord word={word.text} highlight={word.morphology?.highlight} size={40} showHighlight />
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
        <ScriptWord word={exercise.text} size={38} showHighlight={false} fadeStage={fadeStage} />
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

// ---------- Match pairs ----------

/**
 * Tap a word, tap its meaning; correct pairs disappear.
 *
 * Wrong pairs are shown briefly and then released rather than penalised
 * outright — the point is speed of recognition, and a single mis-tap on a
 * six-tile grid says less about knowledge than hesitation does.
 *
 * Reported correct only if the learner clears the grid with no wrong pairing,
 * so the SRS still hears an honest signal.
 */
function MatchPairsExerciseView({
  exercise,
  onAnswer,
  fadeStage,
}: BaseProps & { exercise: Of<"match_pairs"> }) {
  const { wordById } = useCourseContent();
  const words = useMemo(
    () => exercise.wordIds.map((id) => wordById.get(id)).filter((w) => !!w),
    [exercise.wordIds, wordById],
  );

  // Deranged, not merely shuffled, so no tile ever sits opposite its own answer.
  const glosses = useMemo(
    () => seededDerangement(words.map((w) => w.id), `${exercise.id}-gloss`),
    [words, exercise.id],
  );

  const [pickedWord, setPickedWord] = useState<string | null>(null);
  const [pickedGloss, setPickedGloss] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [done, setDone] = useState(false);

  const attempt = (wordId: string | null, glossId: string | null) => {
    if (!wordId || !glossId) return;
    if (wordId === glossId) {
      const next = new Set(matched).add(wordId);
      setMatched(next);
      setPickedWord(null);
      setPickedGloss(null);
      if (next.size === words.length && !done) {
        setDone(true);
        onAnswer({ verdict: mistakes === 0 ? "correct" : "incorrect", confidence: 1 });
      }
      return;
    }
    setWrong(`${wordId}|${glossId}`);
    setMistakes((m) => m + 1);
    window.setTimeout(() => {
      setWrong(null);
      setPickedWord(null);
      setPickedGloss(null);
    }, 550);
  };

  const tile = (id: string, selected: boolean, isWrong: boolean, onClick: () => void, body: ReactNode) => (
    <button
      key={id}
      className="card card--flat"
      onClick={onClick}
      disabled={matched.has(id)}
      style={{
        textAlign: "center",
        padding: "12px 8px",
        // Fill the grid cell rather than hugging the content, so a short gloss
        // and a tall Hebrew word occupy the same box.
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: matched.has(id) ? 0.25 : 1,
        borderColor: isWrong ? "var(--danger)" : selected ? "var(--accent)" : undefined,
        borderWidth: isWrong || selected ? 2 : 1,
        transition: "opacity .2s ease",
      }}
    >
      {body}
    </button>
  );

  return (
    // `pad` like every other exercise view. Without it the grid ran edge to
    // edge while the rest of the lesson sat inset, which reads as a different
    // screen rather than a different question.
    <div className="pad stack">
      <p className="small muted" style={{ margin: 0 }}>
        {exercise.prompt}
      </p>
      {/*
        ONE grid, not two columns of independently-sized cards.
        Two stacks let each tile size to its own content, so a Hebrew word at
        22px stood taller than a one-line gloss and the columns drifted out of
        step — rows stopped lining up, which makes pairing harder to read.
        A single grid gives every row a shared height, and `1fr` rows make every
        row equal to the tallest.
      */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridAutoRows: "1fr",
          gap: 10,
          marginTop: 10,
          alignItems: "stretch",
        }}
      >
        {words.map((w, i) => {
          const glossId = glosses[i]!;
          return (
            <Fragment key={w.id}>
              {tile(
                w.id,
                pickedWord === w.id,
                wrong?.startsWith(`${w.id}|`) ?? false,
                () => {
                  setPickedWord(w.id);
                  attempt(w.id, pickedGloss);
                },
                <ScriptWord word={w.text} size={22} showHighlight={false} fadeStage={fadeStage} />,
              )}
              {tile(
                glossId,
                pickedGloss === glossId,
                wrong?.endsWith(`|${glossId}`) ?? false,
                () => {
                  setPickedGloss(glossId);
                  attempt(pickedWord, glossId);
                },
                <span className="small">{wordById.get(glossId)?.gloss}</span>,
              )}
            </Fragment>
          );
        })}
      </div>
      {done && (
        <p className="small muted" style={{ marginTop: 10 }}>
          {mistakes === 0 ? "Cleared with no mistakes." : `Cleared with ${mistakes} mistake${mistakes === 1 ? "" : "s"}.`}
        </p>
      )}
    </div>
  );
}

// ---------- Cloze ----------

/**
 * A verse already read, with one word removed.
 *
 * The whole verse stays on screen: this tests whether the learner can supply a
 * word from context, which is what reading actually requires, rather than
 * whether they can recognise it in isolation.
 */
function ClozeExerciseView({
  exercise,
  onAnswer,
  fadeStage,
}: BaseProps & { exercise: Of<"cloze"> }) {
  const { passageById } = useCourseContent();
  const passage = passageById.get(exercise.passageId);
  const [picked, setPicked] = useState<string | null>(null);

  const choices = useMemo(
    () => seededShuffle(exercise.choices, exercise.id),
    [exercise.choices, exercise.id],
  );

  const choose = (choice: string) => {
    if (picked) return;
    setPicked(choice);
    onAnswer(gradeChoice(choice, exercise.answer));
  };

  return (
    <div className="pad stack">
      <p className="small muted" style={{ margin: 0 }}>
        {exercise.prompt}
      </p>

      <div className="passage" {...textProps()} style={{ marginTop: 12 }}>
        {(passage?.tokens ?? []).map((t, i) => (
          <span key={i} className="passage__token">
            {i === exercise.tokenIndex ? (
              <span
                style={{
                  display: "inline-block",
                  minWidth: 68,
                  borderBottom: "2px solid var(--accent)",
                  color: picked ? "var(--ink)" : "transparent",
                }}
              >
                <ScriptWord word={picked ?? t.text} size={26} showHighlight={false} />
              </span>
            ) : (
              <ScriptWord word={t.text} size={26} showHighlight={false} fadeStage={fadeStage} />
            )}
          </span>
        ))}
      </div>

      {passage && (
        <p className="small muted" style={{ margin: "6px 0 0", fontStyle: "italic" }}>
          {passage.translation}
        </p>
      )}

      <div className="stack" style={{ marginTop: 12 }}>
        {choices.map((c) => (
          <button
            key={c}
            className="choice"
            disabled={!!picked}
            onClick={() => choose(c)}
            style={{
              borderColor:
                picked == null
                  ? undefined
                  : c === exercise.answer
                    ? "var(--sage)"
                    : c === picked
                      ? "var(--danger)"
                      : undefined,
            }}
          >
            <ScriptWord word={c} size={24} showHighlight={false} />
          </button>
        ))}
      </div>

      {picked && exercise.note && (
        <p className="small muted" style={{ marginTop: 10, lineHeight: 1.55 }}>
          {exercise.note}
        </p>
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
    case "match_pairs":
      return <MatchPairsExerciseView exercise={exercise} {...rest} />;
    case "cloze":
      return <ClozeExerciseView exercise={exercise} {...rest} />;
  }
}
