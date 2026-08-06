import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, TopBar } from "@/components/ui";
import { getMeta, setMeta } from "@/db";
import {
  DRILLS,
  ROUND_LENGTH,
  SHAPES,
  SLOT,
  questionsOf,
  type Drill,
  type ShapeKey,
  type TokenItem,
} from "./bank";

/**
 * Reading Drills — five timed drills for parsing Greek at speed.
 *
 * THE FLUENCY WINDOW IS THE POINT. Every other exercise in this app asks
 * whether you got it right. This one asks whether you got it right IN TIME: a
 * correct answer that arrives after the window grades as "parsed, not read",
 * and that distinction is the whole pedagogy. Reading is not slow parsing done
 * accurately; it is a different skill, and it is the one nothing else here
 * trains.
 *
 * NOTHING ASKS FOR ENGLISH. You answer in Greek, by role, or by shape. The
 * aspect drill answers with glyphs rather than the words "imperfect" and
 * "aorist" on purpose — naming the tense is a separate skill from seeing the
 * shape of the event, and most courses teach them in the wrong order.
 *
 * MISSES ARE LOGGED AGAINST THE FEATURE, NOT THE SENTENCE. The report says
 * "dative after ἐν — 2 missed, 1 slow" rather than listing verses, so it tells
 * a player what to drill instead of what to re-read.
 *
 * STANDALONE, DELIBERATELY. No review events, no effect on the due queue, no
 * progress gate. See features/games/registry.ts for why that separation exists
 * and what it costs.
 */

type Phase = "menu" | "playing" | "report";

interface Answer {
  tag: string;
  ok: boolean;
  ms: number;
  fluent: boolean;
}

/** Best median per drill, so a returning player can see the number move. */
const BEST_KEY = "games:greek-reading:best";
type Bests = Record<string, { medianMs: number; fluent: number; of: number }>;

export function ReadingDrillsScreen() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("menu");
  const [drill, setDrill] = useState<Drill | null>(null);
  const [queue, setQueue] = useState<{ i: number; j: number }[]>([]);
  const [n, setN] = useState(0);
  const [log, setLog] = useState<Answer[]>([]);
  const [locked, setLocked] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const [bests, setBests] = useState<Bests>({});

  const startedAt = useRef(0);

  useEffect(() => {
    void getMeta<Bests>(BEST_KEY, {}).then(setBests);
  }, []);

  const question = useMemo(() => {
    if (!drill || n >= queue.length) return null;
    const { i, j } = queue[n]!;
    const item = drill.items[i]!;
    const prompt = "prompts" in item ? item.prompts?.[j] : undefined;
    return { item, prompt };
  }, [drill, queue, n]);

  /**
   * Grade the current question. Pure state — it schedules nothing.
   *
   * The clock and the advance are owned by the two effects below, so that no
   * timer ever holds a closure over stale round state. An earlier version had
   * `start()` kick off the clock directly, which captured `queue` from the
   * render BEFORE setQueue landed: the timeout then read `queue[0]` of an empty
   * array, bailed before writing the log, and left the round locked with an
   * empty verdict and a counter stuck on zero.
   */
  function settle(ok: boolean, ms: number, viaTimeout = false) {
    if (!drill || !question) return;
    const tag =
      question.prompt?.tag ?? ("tag" in question.item ? question.item.tag : undefined) ?? "unknown";
    setLog((l) => [...l, { tag, ok, ms, fluent: ok && ms <= drill.window }]);
    setElapsed(ms);
    setTimedOut(viaTimeout);
    setLocked(true);
  }

  // Kept in a ref so the animation frame always calls the current one.
  const settleRef = useRef(settle);
  settleRef.current = settle;

  /** The clock for whichever question is on screen. */
  useEffect(() => {
    if (phase !== "playing" || !drill || !question || locked) return;
    const cap = drill.window * 2;
    startedAt.current = performance.now();
    setElapsed(0);
    let id = 0;
    const tick = () => {
      const e = performance.now() - startedAt.current;
      setElapsed(e);
      if (e >= cap) {
        settleRef.current(false, cap, true);
        return;
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [phase, drill, question, locked]);

  /** The pause on the verdict. A miss sits longer, because it is the teaching. */
  useEffect(() => {
    if (!locked || phase !== "playing") return;
    const wasRight = log[log.length - 1]?.ok ?? false;
    const t = setTimeout(() => {
      setLocked(false);
      setPicked(null);
      setTimedOut(false);
      setN((v) => v + 1);
    }, wasRight ? 1300 : 2400);
    return () => clearTimeout(t);
  }, [locked, phase, log]);

  /** Out of questions ends the round. */
  useEffect(() => {
    if (phase === "playing" && queue.length > 0 && n >= queue.length) setPhase("report");
  }, [phase, n, queue.length]);

  function start(d: Drill) {
    const pool = questionsOf(d);
    for (let i = pool.length - 1; i > 0; i--) {
      const r = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[r]] = [pool[r]!, pool[i]!];
    }
    setDrill(d);
    setQueue(pool.slice(0, ROUND_LENGTH));
    setN(0);
    setLog([]);
    setLocked(false);
    setPicked(null);
    setTimedOut(false);
    setElapsed(0);
    setPhase("playing");
  }

  function answerChoice(idx: number) {
    if (locked || !question || !drill) return;
    setPicked(idx);
    const a = "a" in question.item && typeof question.item.a === "number" ? question.item.a : -1;
    settle(idx === a, performance.now() - startedAt.current);
  }

  function answerShape(key: ShapeKey) {
    if (locked || !question || !drill) return;
    setPicked(SHAPES.findIndex((s) => s.key === key));
    settle(key === (question.item as { a: ShapeKey }).a, performance.now() - startedAt.current);
  }

  function answerToken(idx: number) {
    if (locked || !question || !drill) return;
    setPicked(idx);
    const correct = question.prompt?.a ?? (question.item as TokenItem).a ?? [];
    settle(correct.includes(idx), performance.now() - startedAt.current);
  }

  // Keyboard 1–4 for the drills that show options. Token drills are tapped.
  useEffect(() => {
    if (phase !== "playing" || !drill || drill.type === "token" || locked || !question) return;
    const onKey = (e: KeyboardEvent) => {
      const k = Number.parseInt(e.key, 10);
      if (!Number.isFinite(k)) return;
      if (drill.type === "shape") {
        if (k >= 1 && k <= SHAPES.length) answerShape(SHAPES[k - 1]!.key);
      } else {
        const opts = (question.item as { opts: string[] }).opts;
        if (k >= 1 && k <= opts.length) answerChoice(k - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ---- report ------------------------------------------------------------
  const summary = useMemo(() => {
    if (!log.length) return null;
    const correct = log.filter((x) => x.ok).length;
    const fluent = log.filter((x) => x.fluent).length;
    const times = log.filter((x) => x.ok).map((x) => x.ms).sort((a, b) => a - b);
    const median = times.length ? times[Math.floor(times.length / 2)]! : 0;

    const byTag = new Map<string, { miss: number; slow: number }>();
    for (const x of log) {
      const v = byTag.get(x.tag) ?? { miss: 0, slow: 0 };
      if (!x.ok) v.miss += 1;
      else if (!x.fluent) v.slow += 1;
      byTag.set(x.tag, v);
    }
    const weak = [...byTag.entries()]
      .filter(([, v]) => v.miss || v.slow)
      .sort((a, b) => b[1].miss * 2 + b[1].slow - (a[1].miss * 2 + a[1].slow));

    return { correct, fluent, median, weak, total: log.length };
  }, [log]);

  // Persist the best median once a round finishes. Stored in `meta`, so it
  // travels in the local backup with everything else.
  useEffect(() => {
    if (phase !== "report" || !drill || !summary || !summary.median) return;
    const prev = bests[drill.id];
    const better = !prev || summary.median < prev.medianMs;
    if (!better) return;
    const next: Bests = {
      ...bests,
      [drill.id]: { medianMs: summary.median, fluent: summary.fluent, of: summary.total },
    };
    setBests(next);
    void setMeta(BEST_KEY, next);
  }, [phase, drill, summary, bests]);

  // ---- render ------------------------------------------------------------
  if (phase === "menu") {
    return (
      <div className="screen">
        <TopBar left={<button className="linklike" onClick={() => navigate("/games")}>← Games</button>} />
        <div className="pad stack">
          <div className="game-mast">
            <p className="game-eyebrow">Read · don't translate</p>
            <h1 className="game-title" lang="grc">
              ἀναγίγνωσκε
            </h1>
            <p className="small muted" style={{ lineHeight: 1.6, marginTop: 6 }}>
              Five drills for parsing Greek at speed. Nothing here asks you for English — you answer
              in Greek, by role, or by shape. The bar under each sentence is the point: a right
              answer that arrives late is a parse, not a read.
            </p>
          </div>

          {DRILLS.map((d) => {
            const best = bests[d.id];
            return (
              <button key={d.id} className="card game-card" onClick={() => start(d)}>
                <span className="game-kicker">{d.kicker}</span>
                <span className="game-card__name">{d.name}</span>
                <span className="small muted" style={{ lineHeight: 1.5 }}>
                  {d.blurb}
                </span>
                <span className="small muted game-card__foot">
                  {(d.window / 1000).toFixed(1)}s window
                  {best ? ` · best median ${(best.medianMs / 1000).toFixed(1)}s` : ""}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (phase === "report" && summary && drill) {
    return (
      <div className="screen">
        <TopBar left={<span className="small">{drill.name}</span>} />
        <div className="pad stack">
          <h2 className="title h2">Session report</h2>
          <div className="game-grid">
            <div className="game-cell">
              <div className="game-cell__n">
                {summary.correct}/{summary.total}
              </div>
              <div className="game-cell__l">correct</div>
            </div>
            <div className="game-cell">
              <div className="game-cell__n">
                {summary.fluent}/{summary.total}
              </div>
              <div className="game-cell__l">read at speed</div>
            </div>
            <div className="game-cell">
              <div className="game-cell__n">
                {summary.median ? `${(summary.median / 1000).toFixed(1)}s` : "—"}
              </div>
              <div className="game-cell__l">median</div>
            </div>
          </div>

          <div className="card">
            <span className="label">Features to drill next</span>
            {summary.weak.length === 0 ? (
              <p className="small muted" style={{ marginTop: 8, lineHeight: 1.55 }}>
                Nothing broke and nothing dragged. Widen the window or move to a longer text.
              </p>
            ) : (
              <ul className="game-weak">
                {summary.weak.map(([tag, v]) => (
                  <li key={tag}>
                    <span>{tag}</span>
                    <span className="muted small">
                      {[v.miss ? `${v.miss} missed` : "", v.slow ? `${v.slow} slow` : ""]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="row" style={{ gap: 8 }}>
            <Button onClick={() => start(drill)}>Run it again</Button>
            <Button variant="secondary" onClick={() => setPhase("menu")}>
              All drills
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!drill || !question) return null;

  const { item, prompt } = question;
  const isToken = drill.type === "token";
  const correctTokens = prompt?.a ?? (item as TokenItem).a ?? [];
  const shapeItem = drill.type === "shape" ? (item as { mark: number; a: ShapeKey }) : null;
  const cap = drill.window * 2;
  const pct = Math.min(elapsed / cap, 1) * 100;
  const overWindow = elapsed > drill.window;
  const last = log[log.length - 1];
  const showVerdict = locked && last;

  return (
    <div className="screen">
      <TopBar
        left={<span className="small">{drill.name}</span>}
        right={
          <span className="small muted game-counts">
            <b>{log.length}</b>/{queue.length} · fluent <b>{log.filter((x) => x.fluent).length}</b>
          </span>
        }
      />
      <div className="pad stack">
        <p className="game-ask">{prompt?.ask ?? drill.ask}</p>

        <div className="game-field">
          <div className="game-greek" lang="grc">
            {item.tokens.map((t, idx) => {
              if (t === SLOT) {
                const filled = locked && "opts" in item;
                return (
                  <span key={idx} className={`game-slot${filled ? " game-slot--filled" : ""}`}>
                    {filled ? (item as { opts: string[]; a: number }).opts[(item as { a: number }).a] : " "}
                  </span>
                );
              }
              const isMark = shapeItem?.mark === idx;
              const isHit = locked && isToken && correctTokens.includes(idx);
              const isErr = locked && isToken && picked === idx && !correctTokens.includes(idx);
              const cls = [
                "game-tok",
                isMark ? "game-tok--mark" : "",
                isToken && !locked ? "game-tok--pick" : "",
                isHit ? "game-tok--hit" : "",
                isErr ? "game-tok--err" : "",
              ]
                .filter(Boolean)
                .join(" ");
              if (isToken && !locked) {
                return (
                  <button key={idx} className={cls} onClick={() => answerToken(idx)}>
                    {t}
                  </button>
                );
              }
              return (
                <span key={idx} className={cls}>
                  {t}
                </span>
              );
            })}
          </div>
        </div>

        {/* The fluency window. The notch is the deadline; past it the bar
            changes colour, which is the only feedback given while answering. */}
        <div>
          <div className="game-window" aria-hidden>
            <div
              className={`game-fill${overWindow ? " game-fill--past" : ""}`}
              style={{ width: `${pct}%` }}
            />
            <div className="game-notch" style={{ left: "50%" }} />
          </div>
          <div className="game-wlabel">
            <span>fluency window</span>
            <span>{(elapsed / 1000).toFixed(1)}s</span>
          </div>
        </div>

        {drill.type === "choice" && (
          <div className="game-opts">
            {(item as { opts: string[]; a: number }).opts.map((o, idx) => {
              const good = locked && idx === (item as { a: number }).a;
              const bad = locked && picked === idx && !good;
              return (
                <button
                  key={idx}
                  className={`game-opt${good ? " game-opt--good" : ""}${bad ? " game-opt--bad" : ""}`}
                  disabled={locked}
                  onClick={() => answerChoice(idx)}
                  lang="grc"
                >
                  <span className="game-opt__key">{idx + 1}</span>
                  {o}
                </button>
              );
            })}
          </div>
        )}

        {drill.type === "shape" && (
          <div className="game-opts game-opts--three">
            {SHAPES.map((s, idx) => {
              const good = locked && s.key === shapeItem?.a;
              const bad = locked && picked === idx && !good;
              return (
                <button
                  key={s.key}
                  className={`game-opt${good ? " game-opt--good" : ""}${bad ? " game-opt--bad" : ""}`}
                  disabled={locked}
                  onClick={() => answerShape(s.key)}
                >
                  <span className="game-opt__key">{idx + 1}</span>
                  <svg width="46" height="20" viewBox="0 0 46 20" aria-hidden>
                    {s.key !== "ongoing" && <circle cx={s.key === "standing" ? 12 : 23} cy="10" r="5" fill="currentColor" />}
                    {s.path && (
                      <path d={s.path} fill="none" stroke="currentColor" strokeWidth="2" />
                    )}
                  </svg>
                  <span className="game-opt__cap">{s.cap}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="game-verdict" aria-live="polite">
          {showVerdict && (
            <>
              <span
                className={`game-verdict__tag ${
                  last.fluent ? "is-fluent" : last.ok ? "is-slow" : "is-miss"
                }`}
              >
                {last.fluent ? "Read" : last.ok ? "Parsed, not read" : timedOut ? "Out of window" : "Missed"}
              </span>
              {("why" in item && item.why) || `Feature: ${last.tag}.`}
              {last.ok && !last.fluent ? " You got there — now get there without stopping." : ""}
            </>
          )}
        </div>

        <div className="row" style={{ gap: 8 }}>
          <Button
            variant="secondary"
            onClick={() => setPhase(log.length ? "report" : "menu")}
          >
            End session
          </Button>
        </div>
      </div>
    </div>
  );
}
