import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { readProgress, recordFinish, recordLevel, resetProgress, type GameProgress } from "../progress";
import type { Drill, GameChrome, Level } from "./types";
import type { LanguageId } from "@/content/language";

/** A miss comes back this many places later, rather than costing a life. */
const MISS_RETURNS_AFTER = 4;

/** Every N correct in a row throws a spark. */
const SPARK_EVERY = 5;

/** BCP-47 for the `lang` attribute. Screen readers and font stacks both use it. */
const LANG: Record<LanguageId, string> = { hebrew: "he", greek: "grc", latin: "la" };

/** Which face the script text is set in. */
const FONT: Record<LanguageId, string> = {
  hebrew: "var(--font-hebrew)",
  greek: "var(--font-greek)",
  latin: "var(--font-body)",
};

/** Direction and language, threaded to every component that shows script. */
interface ScriptProps {
  dir: "rtl" | "ltr";
  lang: string;
}

/**
 * The sunrise engine — one verse at a time, night to dawn.
 *
 * Extracted from Day One when the Greek game arrived. Both games run on this;
 * only the levels, the script and the copy differ, and all of those arrive as
 * props. Nothing below knows which language it is showing.
 *
 * FORM → MEANING, NEVER FORM → LABEL. Nothing here asks for a tense or a
 * paradigm. "Who was?" is answered "she was"; "happened, or wanted?" is how
 * aspect gets taught, and Greek's "going on, or done and finished?" is the same
 * question in another language. The finale says it out loud, and it is the
 * whole design. Each game's levels.test.ts fails the build if its content
 * starts naming things.
 *
 * NO HEARTS. A miss costs nothing — the question is spliced back into the queue
 * four places later and comes round again. Nothing is ever taken away, so there
 * is no reason to fear a guess.
 *
 * THE SKY IS THE PROGRESS BAR. Every question answered for the FIRST time
 * brightens the background a little; repeats earned by a miss do not, so the
 * sky measures ground covered rather than answers given. It starts at night and
 * reaches dawn as the last verse closes — and a RESUMED run starts wherever a
 * clean run would have been, via the game's own lightBefore().
 *
 * That gradient is the one thing here not expressed as flat design tokens, and
 * deliberately: it is the mechanic, not decoration. Its two endpoints are read
 * from --ink-deep and --gold-bright at runtime, so it still tracks the theme
 * and still works in light mode — where the source, being a fixed dark palette,
 * did not.
 */
type Screen = "title" | "teach" | "play" | "reward" | "finale";

/** A queued question keeps an identity, so a repeat is distinguishable. */
interface Queued {
  drill: Drill;
  key: string;
}

const shuffle = <T,>(a: T[]): T[] => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j]!, b[i]!];
  }
  return b;
};

/** Blend two CSS colours. Accepts anything the browser can parse. */
function mix(from: string, to: string, t: number): string {
  const rgb = (c: string): [number, number, number] => {
    const el = document.createElement("span");
    el.style.color = c;
    document.body.appendChild(el);
    const m = getComputedStyle(el).color.match(/\d+/g);
    el.remove();
    return m ? [Number(m[0]), Number(m[1]), Number(m[2])] : [0, 0, 0];
  };
  const [r1, g1, b1] = rgb(from);
  const [r2, g2, b2] = rgb(to);
  const c = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `rgb(${c(r1, r2)}, ${c(g1, g2)}, ${c(b1, b2)})`;
}

/** "5 August" — a day, not a timestamp. Nobody needs the minute they finished. */
function formatDay(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, { day: "numeric", month: "long" });
}

export interface SunriseGameProps {
  chrome: GameChrome;
  levels: Level[];
  lightPerQuestion: number;
  lightBefore: (levelIndex: number) => number;
}

export function SunriseGame({ chrome, levels, lightPerQuestion, lightBefore }: SunriseGameProps) {
  const navigate = useNavigate();
  const LEVELS = levels;
  const LIGHT_PER_QUESTION = lightPerQuestion;
  const GAME_ID = chrome.gameId;
  const script: ScriptProps = { dir: chrome.direction, lang: LANG[chrome.language] };
  const [screen, setScreen] = useState<Screen>("title");
  const [li, setLi] = useState(0);
  const [queue, setQueue] = useState<Queued[]>([]);
  const [qi, setQi] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [picked, setPicked] = useState<number[]>([]);
  const [why, setWhy] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [light, setLight] = useState(0);
  const [spark, setSpark] = useState(false);
  const seen = useRef(new Set<string>());
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /*
   * Progress, and `null` until it has been read.
   *
   * The title screen waits for it rather than rendering "Begin in the dark" and
   * then swapping in a Continue button a frame later — a player reaching for a
   * button that moves under their thumb is worse than a beat of nothing.
   */
  const [progress, setProgress] = useState<GameProgress | null>(null);
  useEffect(() => {
    void readProgress(GAME_ID).then(setProgress);
  }, []);

  const level = LEVELS[li]!;
  const current = queue[qi];

  useEffect(
    () => () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    },
    [],
  );

  /**
   * Pick up where they left off.
   *
   * The sky is restored from `lightBefore` rather than left at night, and
   * `seen` is left EMPTY on purpose: it exists to stop a repeated question
   * brightening the sky twice, and the questions already answered in previous
   * sessions are not in this run's queue at all.
   */
  function resume(at: number) {
    setLi(at);
    setLight(lightBefore(at));
    setStreak(0);
    seen.current = new Set();
    setScreen("teach");
  }

  function startOver() {
    seen.current = new Set();
    setLight(0);
    setStreak(0);
    setLi(0);
    void resetProgress(GAME_ID).then(setProgress);
    setScreen("teach");
  }

  function startLevel(i: number) {
    setQueue(LEVELS[i]!.drills.map((d, k) => ({ drill: d, key: `${i}-${k}` })));
    setQi(0);
    setChosen(null);
    setLocked(false);
    setPicked([]);
    setWhy(null);
    setScreen("play");
  }

  function advance() {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    setChosen(null);
    setLocked(false);
    setPicked([]);
    setWhy(null);
    if (qi + 1 >= queue.length) setScreen("reward");
    else setQi(qi + 1);
  }

  /**
   * Score one answer.
   *
   * A miss re-queues rather than penalising, and only a FIRST pass at a
   * question moves the sky — otherwise missing something would brighten the
   * screen twice for the same ground.
   */
  function grade(ok: boolean, q: Queued) {
    if (ok) {
      setStreak((s) => {
        const n = s + 1;
        if (n % SPARK_EVERY === 0) {
          setSpark(true);
          setTimeout(() => setSpark(false), 900);
        }
        return n;
      });
      if (!seen.current.has(q.key)) {
        seen.current.add(q.key);
        setLight((l) => Math.min(1, l + LIGHT_PER_QUESTION));
      }
    } else {
      setStreak(0);
      setQueue((old) => {
        const copy = [...old];
        copy.splice(Math.min(copy.length, qi + MISS_RETURNS_AFTER), 0, {
          drill: q.drill,
          key: `${q.key}r`,
        });
        return copy;
      });
    }
  }

  function answerChoice(option: string) {
    if (locked || !current) return;
    const d = current.drill as Extract<Drill, { ans: string }>;
    const ok = option === d.ans;
    setChosen(option);
    setLocked(true);
    grade(ok, current);
    if (!ok || d.why) setWhy(d.why ?? null);
    // A clean hit with nothing to explain moves on by itself.
    if (ok && !d.why) advanceTimer.current = setTimeout(advance, 750);
  }

  function answerTap() {
    if (locked || !current) return;
    const d = current.drill as Extract<Drill, { t: "tapAll" }>;
    const ok = picked.length === d.pick.length && picked.every((p) => d.pick.includes(p));
    setLocked(true);
    grade(ok, current);
    setWhy(d.why);
  }

  const togglePick = (i: number) =>
    setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));

  // ---- the sky ------------------------------------------------------------
  // Read the endpoints from the theme rather than hard-coding them, so the ramp
  // tracks light and dark. `light * light` is the source's easing: the first
  // answers barely move it and the last few bring the sun up quickly.
  const [ground, setGround] = useState({ night: "#0b1020", dawn: "#e0b768" });
  useEffect(() => {
    const cs = getComputedStyle(document.documentElement);
    setGround({
      night: cs.getPropertyValue("--ink-deep").trim() || "#0b1020",
      dawn: cs.getPropertyValue("--gold-bright").trim() || "#e0b768",
    });
  }, []);

  const bg = useMemo(() => mix(ground.night, ground.dawn, light * light), [ground, light]);
  const glow = useMemo(() => mix(ground.night, "#FFD98A", Math.min(1, light * 1.15)), [ground, light]);
  const risen = light > 0.72;

  useEffect(() => {
    if (screen === "finale") setLight(1);
  }, [screen]);

  return (
    <div
      className={`sunrise${risen ? " sunrise--risen" : ""}`}
      /*
       * --script-font is set here rather than in a per-game stylesheet, so the
       * ~129 shared rules below stay script-agnostic. Every rule that shows
       * script text reads var(--script-font, var(--font-hebrew)); Hebrew is the
       * fallback only because it was here first.
       */
      style={
        {
          background: `radial-gradient(120% 85% at 50% 118%, ${glow} 0%, ${bg} 62%)`,
          "--script-font": FONT[chrome.language],
        } as React.CSSProperties
      }
    >
      {screen !== "title" && screen !== "finale" && (
        <div className="sunrise-rail" aria-hidden>
          <div className="sunrise-rail__fill" style={{ width: `${light * 100}%` }} />
        </div>
      )}

      {spark && (
        <div className="sunrise-spark" aria-live="polite">
          ✦ {streak} IN A ROW ✦
        </div>
      )}

      <button className="sunrise-exit" onClick={() => navigate("/games")}>
        ✕
      </button>

      {screen === "title" && (
        <div className="sunrise-centre">
          <p className="sunrise-eyebrow">{chrome.eyebrow}</p>
          <h1 className="sunrise-hero" dir={script.dir} lang={script.lang}>
            {chrome.hero}
          </h1>
          <h2 className="sunrise-sub">{chrome.title}</h2>
          <p className="sunrise-lede">{chrome.lede}</p>

          {/*
            THE CHOICE IS ALWAYS OFFERED, never made for them.
            
            This game is a sunrise: it opens at night and reaches dawn as the
            fifth verse closes. Resuming at verse 4 drops a player into a sky
            that is already 77% bright, which is correct bookkeeping and throws
            away the arc. Some will want that and some will want the dark again,
            and the only way to know is to ask. It costs one button.
          */}
          {progress === null ? (
            <button className="sunrise-btn" disabled>
              …
            </button>
          ) : progress.furthest > 0 && progress.furthest < LEVELS.length ? (
            <>
              <button className="sunrise-btn" onClick={() => resume(progress.furthest)}>
                Continue — {LEVELS[progress.furthest]!.ref}
              </button>
              <button className="sunrise-btn sunrise-btn--ghost" onClick={startOver}>
                Start again from night
              </button>
            </>
          ) : (
            <>
              <button className="sunrise-btn" onClick={startOver}>
                {progress.completed ? "Read it again" : "Begin in the dark"}
              </button>
              {progress.completed && (
                <p className="sunrise-whisper">
                  you finished this {progress.runs === 1 ? "once" : `${progress.runs} times`}
                  {progress.completedAt ? ` · first on ${formatDay(progress.completedAt)}` : ""}
                </p>
              )}
            </>
          )}
          {!progress?.completed && progress?.furthest === 0 && (
            <p className="sunrise-whisper">the screen starts at night</p>
          )}
        </div>
      )}

      {screen === "teach" && (
        <div className="sunrise-centre">
          <p className="sunrise-eyebrow">
            Verse {li + 1} of {LEVELS.length} · {level.ref}
          </p>
          <h2 className="sunrise-sub sunrise-sub--tight">{level.title}</h2>
          <div className="sunrise-teach">
            <div className="sunrise-teach__he" dir={script.dir} lang={script.lang}>
              {level.teach.he}
            </div>
            <div className="sunrise-teach__en">{level.teach.en}</div>
            <p className="sunrise-teach__line">{level.teach.line}</p>
          </div>
          <button className="sunrise-btn" onClick={() => startLevel(li)}>
            Got it
          </button>
        </div>
      )}

      {screen === "play" && current && (
        <div className="sunrise-play">
          <div className="sunrise-play__inner">
            {current.drill.t === "order" ? (
              <OrderDrill
                level={level}
                onDone={advance}
                script={script}
                prompt={chrome.rebuildPrompt}
                hint={chrome.rebuildHint}
              />
            ) : current.drill.t === "tapAll" ? (
              <TapAllDrill
                script={script}
                level={level}
                drill={current.drill}
                locked={locked}
                picked={picked}
                onToggle={togglePick}
                onCheck={answerTap}
              />
            ) : (
              <ChoiceDrill
                script={script}
                drill={current.drill}
                locked={locked}
                chosen={chosen}
                onAnswer={answerChoice}
              />
            )}

            {why && (
              <div className="sunrise-why">
                <p>{why}</p>
                <button className="sunrise-btn sunrise-btn--ghost" onClick={advance}>
                  Keep going
                </button>
              </div>
            )}

            {locked && !why && chosen !== null && (
              <div className="sunrise-why sunrise-why--bare">
                <button className="sunrise-btn sunrise-btn--ghost" onClick={advance}>
                  Keep going
                </button>
              </div>
            )}
          </div>
          <div className="sunrise-ref">{level.ref}</div>
        </div>
      )}

      {screen === "reward" && (
        <VerseReward
          script={script}
          finishLabel={`Finish ${chrome.title}`}
          level={level}
          last={li === LEVELS.length - 1}
          onNext={() => {
            if (li === LEVELS.length - 1) {
              void recordFinish(GAME_ID, LEVELS.length).then(setProgress);
              setScreen("finale");
            } else {
              void recordLevel(GAME_ID, li).then(setProgress);
              setLi(li + 1);
              setScreen("teach");
            }
          }}
        />
      )}

      {screen === "finale" && (
        <div className="sunrise-centre sunrise-finale">
          <p className="sunrise-eyebrow">{chrome.finale.eyebrow}</p>
          <div className="sunrise-allwords" dir={script.dir} lang={script.lang}>
            {LEVELS.flatMap((l) => l.verse.map((w) => w[0])).map((w, i) => (
              <span key={i}>{w}</span>
            ))}
          </div>
          <p className="sunrise-finale__lead">{chrome.finale.lead}</p>
          <p className="sunrise-finale__body">{chrome.finale.body}</p>
          <div className="sunrise-finale__actions">
            <button
              className="sunrise-btn sunrise-btn--ghost"
              onClick={() => {
                seen.current = new Set();
                setLight(0);
                setLi(0);
                setStreak(0);
                void resetProgress(GAME_ID).then(setProgress);
                setScreen("title");
              }}
            >
              Read it again
            </button>
            <button className="sunrise-btn sunrise-btn--ghost" onClick={() => navigate("/games")}>
              Back to games
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Hebrew → English, or English → Hebrew. Also carries `who` and `when`. */
function ChoiceDrill({
  drill,
  locked,
  chosen,
  onAnswer,
  script,
}: {
  drill: Exclude<Drill, { t: "order" } | { t: "tapAll" }>;
  locked: boolean;
  chosen: string | null;
  onAnswer: (o: string) => void;
  script: ScriptProps;
}) {
  const reverse = drill.t === "reverse";
  const prompt =
    drill.t === "meaning"
      ? "What does this mean?"
      : reverse
        ? "Which word is this?"
        : drill.prompt;
  const stimulus = reverse ? drill.en : drill.he;

  return (
    <div className="sunrise-drill">
      <p className="sunrise-eyebrow">{prompt}</p>
      {reverse ? (
        <div className="sunrise-stim sunrise-stim--en">{stimulus}</div>
      ) : (
        <div className="sunrise-stim sunrise-stim--he" dir={script.dir} lang={script.lang}>
          {stimulus}
        </div>
      )}
      <div className={`sunrise-opts${drill.opts.length > 3 ? " sunrise-opts--pairs" : ""}`}>
        {drill.opts.map((o) => {
          const right = o === drill.ans;
          const mine = chosen === o;
          const state = !locked ? "" : right ? " is-right" : mine ? " is-wrong" : " is-dimmed";
          return (
            <button
              key={o}
              disabled={locked}
              onClick={() => onAnswer(o)}
              dir={reverse ? script.dir : "ltr"}
              lang={reverse ? script.lang : undefined}
              className={`sunrise-opt${reverse ? " sunrise-opt--he" : ""}${state}`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Tap every word in the verse that matches the prompt. */
function TapAllDrill({
  level,
  drill,
  locked,
  picked,
  onToggle,
  onCheck,
  script,
}: {
  level: Level;
  drill: Extract<Drill, { t: "tapAll" }>;
  locked: boolean;
  picked: number[];
  onToggle: (i: number) => void;
  onCheck: () => void;
  script: ScriptProps;
}) {
  return (
    <div className="sunrise-drill">
      <p className="sunrise-eyebrow">{drill.prompt}</p>
      <div className="sunrise-verse" dir={script.dir} lang={script.lang}>
        {level.verse.map((w, i) => {
          const on = picked.includes(i);
          const should = drill.pick.includes(i);
          const state = !locked
            ? on
              ? " is-on"
              : ""
            : should
              ? " is-right"
              : on
                ? " is-wrong"
                : " is-dimmed";
          return (
            <button
              key={i}
              disabled={locked}
              onClick={() => onToggle(i)}
              className={`sunrise-word${state}`}
            >
              {w[0]}
            </button>
          );
        })}
      </div>
      {!locked && (
        <button className="sunrise-btn" disabled={picked.length === 0} onClick={onCheck}>
          Check these
        </button>
      )}
    </div>
  );
}

/**
 * Rebuild the verse, right to left.
 *
 * Only the next word in sequence can be placed; anything else nudges the line
 * and stays in the bank. There is no wrong-answer state to recover from, which
 * is the same no-hearts rule the rest of the game runs on.
 *
 * MATCHED BY WORD, NOT BY INDEX — a deliberate fix to the original rather than
 * a faithful copy of it. Genesis 1:4 contains אֱלֹהִים twice and הָאוֹר twice;
 * 1:5 has יוֹם and וַיְהִי twice; 1:2 has עַל and פְּנֵי twice. Comparing the
 * clicked index against the position wanted meant exactly one of each identical
 * pair was accepted, and the buttons are indistinguishable — so a player
 * reading correctly gets the shake half the time, with nothing on screen to
 * explain why. Comparing the text keeps the mechanic and removes a coin flip
 * that could never be learned from.
 */
function OrderDrill({
  level,
  onDone,
  script,
  prompt,
  hint,
}: {
  level: Level;
  onDone: () => void;
  script: ScriptProps;
  prompt: string;
  hint: string;
}) {
  const [built, setBuilt] = useState<number[]>([]);
  const [bank, setBank] = useState(() => shuffle(level.verse.map((_, i) => i)));
  const [shake, setShake] = useState(false);
  const done = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (done.current) clearTimeout(done.current);
    },
    [],
  );

  function place(i: number) {
    const wanted = level.verse[built.length]?.[0];
    if (wanted !== undefined && level.verse[i]![0] === wanted) {
      setBuilt((b) => [...b, i]);
      setBank((b) => b.filter((x) => x !== i));
      if (built.length + 1 === level.verse.length) done.current = setTimeout(onDone, 700);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 350);
    }
  }

  return (
    <div className="sunrise-drill">
      <p className="sunrise-eyebrow">{prompt}</p>
      <div className={`sunrise-line${shake ? " is-shaking" : ""}`} dir={script.dir} lang={script.lang}>
        {built.length === 0 && <span className="sunrise-line__hint">{hint}</span>}
        {built.map((i) => (
          <span key={i} className="sunrise-line__word">
            {level.verse[i]![0]}
          </span>
        ))}
      </div>
      <div className="sunrise-bank" dir={script.dir} lang={script.lang}>
        {bank.map((i) => (
          <button key={i} className="sunrise-word" onClick={() => place(i)}>
            {level.verse[i]![0]}
          </button>
        ))}
      </div>
    </div>
  );
}

/** The verse, whole, with every word tappable for its gloss. */
function VerseReward({
  level,
  last,
  onNext,
  script,
  finishLabel,
}: {
  level: Level;
  last: boolean;
  onNext: () => void;
  script: ScriptProps;
  finishLabel: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="sunrise-centre">
      <p className="sunrise-eyebrow sunrise-eyebrow--sea">{level.ref} · yours now</p>
      <div className="sunrise-reward" dir={script.dir} lang={script.lang}>
        {level.verse.map((w, i) => (
          <button
            key={i}
            className={`sunrise-reward__word${open === i ? " is-open" : ""}`}
            onClick={() => setOpen(open === i ? null : i)}
          >
            {w[0]}
          </button>
        ))}
      </div>
      <div className={`sunrise-gloss${open === null ? " is-empty" : ""}`}>
        {open === null ? "tap any word" : level.verse[open]![1]}
      </div>
      <button className="sunrise-btn" onClick={onNext}>
        {last ? finishLabel : "Next verse"}
      </button>
    </div>
  );
}
