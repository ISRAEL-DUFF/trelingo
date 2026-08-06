import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Empty, Spinner, TopBar } from "@/components/ui";
import { contentFor } from "@/content";
import { courseById, getCourse, languageOf, textProps } from "@/content/course";
import type { Word } from "@/content/schema";
import { isTaught, pick, unstudiedTracks, type Choice } from "./select";
import { clearSeen, enoughToPlay, knownWordIds, readState, recordRead, studiedCourses } from "./state";

/**
 * Cold Read — a verse from a book you have never opened.
 *
 * The one game here that could not be a standalone HTML file, because it needs
 * something no prototype has: the app knows which words YOU know. Everything
 * else in Games is byte-identical for a learner on day one and day four
 * hundred.
 *
 * THE IDEA IS TWO NUMBERS, NOT ONE. The learner taps what they cannot read,
 * which gives a self-reported count. The review queue independently predicts
 * the same thing. The gap between them is the product — and it cuts both ways:
 * reading words your queue never taught you is one kind of news, and tapping
 * words it thinks you know is another. The headline is always the learner's own
 * number; the prediction is the quieter second line, because a game that told
 * you what you know better than you do would be obnoxious.
 *
 * NO ENGLISH ON THE PATH TO THE ANSWER, the rule kept from the scene game.
 * Nothing is glossed and nothing is translated until after the commit.
 *
 * NOTHING HERE WRITES TO THE SRS. The gallery promises games do not move your
 * due count, and this one sits closest to the line — the unknown words it finds
 * are exactly the ones worth learning next. Surfacing them is right; scheduling
 * them silently is not.
 */

type Phase = "loading" | "cold" | "reading" | "revealed" | "empty";

interface Round {
  choice: Choice;
  /** Word records for the taught tokens, for glosses and frequency on reveal. */
  words: Map<string, Word>;
  /** Whether this really is a book the learner has never opened. */
  neverOpened: boolean;
}

export function ColdReadScreen() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("loading");
  const [round, setRound] = useState<Round | null>(null);
  const [known, setKnown] = useState<ReadonlySet<string>>(new Set());
  /** Token indices the learner has flagged as unreadable. */
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [reads, setReads] = useState(0);

  const deal = useCallback(async () => {
    setPhase("loading");
    setFlagged(new Set());

    const [cards, studied, state] = await Promise.all([
      knownWordIds(),
      studiedCourses(),
      readState(),
    ]);
    setKnown(cards);
    setReads(state.reads);

    if (!enoughToPlay(cards)) {
      setPhase("cold");
      return;
    }

    const language = languageOf(getCourse()).id;
    let tracks = unstudiedTracks(language, studied);
    /*
     * Every track opened is not a dead end. Fall back to the whole language and
     * let `seen` do the work — the headline softens rather than the game
     * refusing. cold-read-spec.md calls this out as a real end state, because a
     * committed learner reaches it.
     */
    const neverOpened = tracks.length > 0;
    if (!neverOpened) tracks = unstudiedTracks(language, new Set());

    let seen = new Set(state.seen);
    let choice = pick(tracks, cards, seen);
    if (!choice && seen.size) {
      // Pool exhausted: forget what has been shown rather than stop.
      await clearSeen();
      seen = new Set();
      choice = pick(tracks, cards, seen);
    }
    if (!choice) {
      setPhase("empty");
      return;
    }

    const content = contentFor(choice.best.courseId);
    const words = new Map<string, Word>();
    for (const t of choice.best.taught) {
      const w = content.wordById.get(t.wordId!);
      if (w) words.set(t.wordId!, w);
    }
    setRound({ choice, words, neverOpened });
    setPhase("reading");
  }, []);

  useEffect(() => {
    void deal();
  }, [deal]);

  const course = round ? courseById.get(round.choice.best.courseId) : undefined;
  const script = useMemo(() => (course ? textProps(course) : { dir: "ltr", lang: "en" }), [course]);

  if (phase === "loading") return <Spinner label="Finding you a verse…" />;

  if (phase === "cold") {
    return (
      <Shell onClose={() => navigate("/games")}>
        <Empty
          icon="📖"
          title="Not yet"
          hint="Cold Read needs a vocabulary to draw on. Finish a lesson or two and come back — it only works once you know enough to surprise yourself."
        />
      </Shell>
    );
  }

  if (phase === "empty" || !round || !course) {
    return (
      <Shell onClose={() => navigate("/games")}>
        <Empty icon="📖" title="Nothing to read yet" hint="No verse in this language is within reach." />
      </Shell>
    );
  }

  const { best, clearedFloor } = round.choice;
  const taughtIndices = best.passage.tokens.map((t, i) => (isTaught(t) ? i : -1)).filter((i) => i >= 0);
  const selfRead = taughtIndices.length - flagged.size;
  /*
   * The queue's opinion about THE WORDS THE LEARNER CLAIMED, not about the whole
   * verse — the two numbers have to answer the same question or the sentence
   * comparing them is false.
   *
   * `best.hits` counts every known word in the verse, including ones the learner
   * flagged as unreadable. Using it read "you read 29, the queue knew 27, so 4
   * were new" — three numbers that cannot all be true at once. Counting only the
   * unflagged makes it 25, and 25 + 4 = 29 closes.
   */
  const predicted = taughtIndices.filter(
    (i) => !flagged.has(i) && known.has(best.passage.tokens[i]!.wordId!),
  ).length;

  return (
    <Shell onClose={() => navigate("/games")}>
      <div className="cold">
        <p className="cold__eyebrow">{best.passage.reference}</p>
        {/* The hook, and it was missing: this is the whole premise of the game
            and it was nowhere on screen. Only claimed when it is true. */}
        {round.neverOpened && <p className="cold__hook">A book you have never opened.</p>}

        {phase === "reading" && (
          <p className="cold__ask">
            {clearedFloor
              ? "Tap every word you cannot read."
              : "This one is a stretch. Tap every word you cannot read."}
          </p>
        )}

        <div className={`cold__verse${phase === "revealed" ? " is-revealed" : ""}`} {...script}>
          {best.passage.tokens.map((t, i) => {
            if (!isTaught(t)) {
              // Untaught: shown so the verse is whole, inert because the app has
              // no evidence either way and will not invent some.
              return (
                <span key={i} className="cold__tok cold__tok--untaught">
                  {t.text}
                </span>
              );
            }
            const flaggedHere = flagged.has(i);
            const knownHere = known.has(t.wordId!);
            const state =
              phase !== "revealed"
                ? flaggedHere
                  ? " is-flagged"
                  : ""
                : flaggedHere
                  ? " is-missed"
                  : knownHere
                    ? " is-read"
                    : // Read without ever having drilled it — the nicest signal
                      // in the game and the reason the two numbers differ.
                      " is-inferred";
            return (
              <button
                key={i}
                type="button"
                disabled={phase === "revealed"}
                className={`cold__tok${state}`}
                onClick={() =>
                  setFlagged((f) => {
                    const next = new Set(f);
                    if (!next.delete(i)) next.add(i);
                    return next;
                  })
                }
              >
                {t.text}
              </button>
            );
          })}
        </div>

        {phase === "reading" ? (
          <button
            className="cold__btn"
            onClick={() => {
              void recordRead(best.passage.id, selfRead / taughtIndices.length).then((s) =>
                setReads(s.reads),
              );
              setPhase("revealed");
            }}
          >
            Show me
          </button>
        ) : (
          <Reveal
            round={round}
            known={known}
            flagged={flagged}
            selfRead={selfRead}
            predicted={predicted}
            taught={taughtIndices.length}
            neverOpened={round.neverOpened}
            reads={reads}
            onAgain={() => void deal()}
          />
        )}
      </div>
    </Shell>
  );
}

function Reveal({
  round,
  known,
  flagged,
  selfRead,
  predicted,
  taught,
  neverOpened,
  reads,
  onAgain,
}: {
  round: Round;
  known: ReadonlySet<string>;
  flagged: Set<number>;
  selfRead: number;
  predicted: number;
  taught: number;
  neverOpened: boolean;
  reads: number;
  onAgain: () => void;
}) {
  const { best } = round.choice;
  const course = courseById.get(best.courseId)!;
  const script = textProps(course);

  const missed = best.passage.tokens
    .map((t, i) => ({ t, i }))
    .filter(({ t, i }) => isTaught(t) && flagged.has(i))
    .map(({ t }) => round.words.get(t.wordId!))
    .filter((w): w is Word => Boolean(w));

  const inferred = best.passage.tokens.filter(
    (t, i) => isTaught(t) && !flagged.has(i) && !known.has(t.wordId!),
  ).length;

  return (
    <div className="cold__reveal">
      <p className="cold__score">
        You read <b>{selfRead}</b> of <b>{taught}</b>
        {neverOpened ? " in a book you have never opened." : "."}
      </p>

      {/*
       * The second number, always quieter. It is a claim about the learner made
       * by a machine, and it is often the more interesting of the two — but it
       * is not the headline, because being told what you know is not the same
       * as finding out.
       */}
      <p className="cold__second">
        {predicted === selfRead
          ? `Your review queue agreed on all ${taught}.`
          : inferred > 0
            ? `Your review queue only knew ${predicted} of them — ${inferred} you read without ever drilling.`
            : `Your review queue expected ${predicted}.`}
      </p>

      {best.untaught > 0 && (
        <p className="cold__aside">
          {best.untaught} more {best.untaught === 1 ? "word was" : "words were"} an article or particle
          this course does not drill, so {best.untaught === 1 ? "it is" : "they are"} not counted
          either way.
        </p>
      )}

      <p className="cold__translation">{best.passage.translation}</p>

      {missed.length > 0 && (
        <div className="cold__missed">
          <span className="label">Worth learning next</span>
          {missed.map((w) => (
            <div key={w.id} className="cold__missed-row">
              <span className="cold__missed-word" {...script}>
                {w.text}
              </span>
              <span className="small muted">
                {w.gloss}
                {w.frequency?.inCorpus && w.frequency.corpus
                  ? ` · ${w.frequency.inCorpus}× in ${w.frequency.corpus}`
                  : ""}
              </span>
            </div>
          ))}
        </div>
      )}

      <button className="cold__btn" onClick={onAgain}>
        Another verse
      </button>
      <p className="cold__tally">
        {reads} {reads === 1 ? "read" : "reads"}
      </p>
    </div>
  );
}

function Shell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="screen">
      <TopBar left={<span className="small">Cold Read</span>} right={<button className="cold__exit" onClick={onClose}>✕</button>} />
      <div className="pad">{children}</div>
    </div>
  );
}
