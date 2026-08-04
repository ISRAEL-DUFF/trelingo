import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCourseContent } from "@/state/useCourse";
import { Button, Empty, TopBar } from "@/components/ui";
import { ScriptWord } from "@/components/ScriptWord";
import { textProps, getCourse } from "@/content/course";
import { addXp, getCompletedUnitIds, recordReview, touchStreak } from "@/db/repo";
import { sync } from "@/sync/sync";
import { hitsIn, pickTarget, scanScope, scanTargets, type ScanTarget } from "./targets";

/**
 * Scan-and-find: chase one root through a chapter, against the clock.
 *
 * Everything else in this app stops the learner on one word. This asks them to
 * move over a page of text they are NOT stopping to parse, which is the skill
 * that separates reading a text from reciting a deck.
 *
 * Three rules make it reading rather than a spot-the-shape puzzle, and all three
 * are load-bearing:
 *
 *   1. The prompt is a MEANING ("to go down"), never the letters. Showing ירד
 *      would turn the round into a visual search anyone could win without
 *      knowing Hebrew.
 *   2. No glosses and NO TRANSLATION while the clock runs. The JPS text would
 *      hand over every answer at a glance.
 *   3. Targets take at least two distinct forms, enforced in `targets.ts`. In
 *      Jonah the descent motif runs וַיֵּרֶד · יָרַד · יָרַדְתִּי, which share no
 *      surface shape — you have to recognise the root.
 *
 * The verse the learner is scanning is text they have already finished, so this
 * is speed over known language rather than comprehension of new language.
 */

type Phase = "intro" | "scanning" | "done";

export function ScanScreen() {
  const content = useCourseContent();
  const { sectionId } = useParams<{ sectionId: string }>();
  const navigate = useNavigate();

  const [completedUnitIds, setCompletedUnitIds] = useState<Set<string> | null>(null);
  useEffect(() => {
    let cancelled = false;
    void getCompletedUnitIds().then((ids) => {
      if (!cancelled) setCompletedUnitIds(new Set(ids));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Where in the rotation this visit starts.
   *
   * Without it every visit opened on the same root, because `round` resets on
   * mount — so "scan this chapter again" was the identical game. Chosen once per
   * visit rather than per render, so the target cannot change under the learner
   * mid-round.
   */
  const [offset] = useState(() => Math.floor(Math.random() * 1000));
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");
  const [found, setFound] = useState<Set<string>>(new Set());
  const [misses, setMisses] = useState(0);
  const [wrongKey, setWrongKey] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  const { passages, targets } = useMemo(() => {
    if (!completedUnitIds) return { passages: [], targets: [] as ScanTarget[] };
    const scope = scanScope(content, completedUnitIds, sectionId);
    return { passages: scope, targets: scanTargets(content, scope) };
  }, [content, completedUnitIds, sectionId]);

  const target = pickTarget(targets, offset + round);

  // The clock. Stops the moment the last hit is found.
  useEffect(() => {
    if (phase !== "scanning") return;
    const id = window.setInterval(() => setElapsedMs(Date.now() - startedAt), 100);
    return () => window.clearInterval(id);
  }, [phase, startedAt]);

  /** Words this round has already written to the SRS — one advance per word. */
  const scheduled = useRef(new Set<string>());

  const total = target?.hits.length ?? 0;

  const start = () => {
    setFound(new Set());
    setMisses(0);
    setWrongKey(null);
    scheduled.current = new Set();
    setStartedAt(Date.now());
    setElapsedMs(0);
    setPhase("scanning");
  };

  const finish = async (finalFound: Set<string>, ms: number) => {
    setElapsedMs(ms);
    setPhase("done");
    // Finding a word inside running text, under time pressure, with no gloss on
    // screen, is strong evidence of recognition — so it feeds the SRS like any
    // other correct answer. Only successes are recorded: failing to SPOT a word
    // while scanning is confounded with giving up, and is not the same signal as
    // failing to recall it.
    await addXp(5 * finalFound.size);
    await touchStreak();
    void sync();
  };

  const tap = async (passageId: string, tokenIndex: number) => {
    if (phase !== "scanning" || !target) return;
    const key = `${passageId}:${tokenIndex}`;
    if (found.has(key)) return;

    const isHit = hitsIn(target, passageId).has(tokenIndex);
    if (!isHit) {
      setMisses((m) => m + 1);
      setWrongKey(key);
      window.setTimeout(() => setWrongKey((k) => (k === key ? null : k)), 450);
      return;
    }

    const next = new Set(found).add(key);
    setFound(next);

    const wordId = content.passageById.get(passageId)?.tokens[tokenIndex]?.wordId;
    if (wordId && !scheduled.current.has(wordId)) {
      scheduled.current.add(wordId);
      await recordReview(wordId, 2);
    }

    if (next.size === total) await finish(next, Date.now() - startedAt);
  };

  if (!completedUnitIds) return <div className="screen" />;

  const back = (
    <button
      className="btn btn--ghost"
      style={{ color: "var(--chrome-fg)", padding: 0, minHeight: 0 }}
      onClick={() => navigate("/")}
      aria-label="Leave scan"
    >
      ✕
    </button>
  );

  if (!target) {
    return (
      <div className="screen">
        <TopBar left={back} />
        <div className="pad">
          <Empty
            icon="🔍"
            title="Nothing to scan yet"
            hint={`Finish a few more units. A scan needs a ${getCourse().morphemeNoun} that turns up more than once, in more than one form.`}
          />
        </div>
      </div>
    );
  }

  const seconds = (elapsedMs / 1000).toFixed(1);

  if (phase === "intro") {
    return (
      <div className="screen">
        <TopBar left={back} right={<span className="small">Scan</span>} />
        <div className="pad stack center" style={{ marginTop: 22 }}>
          <div style={{ fontSize: 40 }}>🔍</div>
          <h1 className="title h2" style={{ margin: 0 }}>
            Find every place the text says
          </h1>
          <p style={{ fontSize: 26, color: "var(--accent)", fontWeight: 600, margin: "6px 0" }}>
            “{target.gloss}”
          </p>
          <p className="small muted" style={{ lineHeight: 1.6, maxWidth: 330 }}>
            {total} of them, across {target.verses} {target.verses === 1 ? "verse" : "verses"} — in{" "}
            {target.forms} different forms. No glosses and no translation while the clock runs, so
            read fast and don&apos;t stop on anything.
          </p>
          <div style={{ marginTop: 16, width: "100%" }}>
            <Button block onClick={start}>
              Start the clock
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const done = phase === "done";

  return (
    <div className="screen">
      <TopBar
        left={back}
        progress={(found.size / Math.max(1, total)) * 100}
        right={
          <span className="small">
            {found.size}/{total} · <span className="translit">{seconds}s</span>
          </span>
        }
      />

      <div className="pad" style={{ paddingBottom: 4 }}>
        <p className="small muted center" style={{ margin: 0 }}>
          {done ? (
            <>
              {target.letters} — “{target.gloss}”
            </>
          ) : (
            <>
              Tap every word meaning <strong style={{ color: "var(--accent)" }}>“{target.gloss}”</strong>
            </>
          )}
        </p>
      </div>

      {passages.map((p) => (
        <div key={p.id} className="pad-x" style={{ marginBottom: 12 }}>
          <div className="card" style={{ padding: "18px 14px" }}>
            <div className="passage" {...textProps()}>
              {p.tokens.map((t, i) => {
                const key = `${p.id}:${i}`;
                const isFound = found.has(key);
                // After the round, show what was there all along.
                const missed = done && !isFound && hitsIn(target, p.id).has(i);
                return (
                  <button
                    key={key}
                    // Deliberately NOT `--tappable`: that class tints on hover
                    // with the same wash a found word uses, so on a pointer
                    // device every word the cursor crossed looked found.
                    className="passage__token"
                    onClick={() => void tap(p.id, i)}
                    disabled={done}
                    aria-label={done ? `${t.text} — ${t.gloss}` : t.text}
                    style={{
                      cursor: done ? "default" : "pointer",
                      background: isFound
                        ? "var(--gold-wash)"
                        : missed || wrongKey === key
                          ? "var(--danger-wash)"
                          : undefined,
                      borderBottomColor: isFound
                        ? "var(--gold)"
                        : missed || wrongKey === key
                          ? "var(--danger)"
                          : undefined,
                    }}
                  >
                    <ScriptWord
                      word={t.text}
                      highlight={t.morphology?.highlight}
                      size={26}
                      showHighlight={isFound || missed}
                    />
                  </button>
                );
              })}
            </div>
            {/*
              The reference is a landmark, not a hint. The TRANSLATION stays
              hidden until the round is over — "and he went down to Joppa" would
              give away every answer without reading a word of Hebrew.
            */}
            <p className="translit" style={{ marginTop: 8, marginBottom: 0 }}>
              {p.reference}
            </p>
            {done && (
              <p className="small muted" style={{ margin: "6px 0 0", fontStyle: "italic", lineHeight: 1.6 }}>
                {p.translation}
              </p>
            )}
          </div>
        </div>
      ))}

      {done && (
        <div className="pad stack">
          <div className="card center" style={{ padding: 18 }}>
            <div style={{ fontSize: 30 }}>✦</div>
            <p style={{ fontSize: 18, fontWeight: 600, margin: "4px 0" }}>
              {found.size}/{total} in {seconds}s
            </p>
            <p className="small muted" style={{ margin: 0 }}>
              {misses === 0 ? "No wrong taps." : `${misses} wrong tap${misses === 1 ? "" : "s"}.`}{" "}
              +{5 * found.size} XP
            </p>
          </div>
          {targets.length > 1 && (
            <Button
              block
              onClick={() => {
                setRound((r) => r + 1);
                setPhase("intro");
              }}
            >
              Scan for another {getCourse().morphemeNoun}
            </Button>
          )}
          <button className="btn btn--ghost" onClick={() => navigate("/")}>
            Back to path
          </button>
        </div>
      )}

      {!done && (
        <div className="pad">
          <button
            className="btn btn--ghost"
            onClick={() => void finish(found, Date.now() - startedAt)}
          >
            Give up and show me
          </button>
        </div>
      )}
    </div>
  );
}
