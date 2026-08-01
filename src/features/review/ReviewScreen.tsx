import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { wordById } from "@/content";
import { ScriptWord } from "@/components/ScriptWord";
import { Button, Spinner } from "@/components/ui";
import { RootSheet } from "@/features/reading/RootSheet";
import {
  adaptiveNewCardLimit,
  previewIntervals,
  type Rating,
  type SrsCard,
  RATING_LABELS,
} from "@/srs/engine";
import { fadeStageForInterval } from "@/lib/script";
import { scriptOf } from "@/content/course";
import { getDeckQueue, getRecentEvents, getReviewQueue, recordReview, addXp, touchStreak } from "@/db/repo";
import { db } from "@/db";
import { useSession } from "@/state/session";
import { sync } from "@/sync/sync";
import { playWord } from "@/lib/audio";

const RATING_STYLE: Record<Rating, { bg: string; color: string }> = {
  0: { bg: "var(--root-wash)", color: "var(--root)" },
  1: { bg: "var(--gold-wash)", color: "var(--gold)" },
  2: { bg: "var(--sage-wash)", color: "var(--sage)" },
  3: { bg: "var(--ink-wash)", color: "var(--ink)" },
};

/**
 * A review session.
 *
 * The queue is SNAPSHOT once when the session starts and never re-derived from
 * live card state mid-session. Re-filtering as cards are rated shrinks the array
 * underneath the cursor and silently skips half the queue — the bug the original
 * prototype shipped with. Cards rated "Again" are re-appended here instead,
 * which is the behaviour that filtering was accidentally approximating.
 */
export function ReviewScreen() {
  const { deckId } = useParams<{ deckId?: string }>();
  const navigate = useNavigate();
  const settings = useSession((s) => s.settings);

  const [queue, setQueue] = useState<SrsCard[] | null>(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [rootSheet, setRootSheet] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let cards: SrsCard[];
      if (deckId) {
        const deck = await db.decks.get(deckId);
        cards = deck ? await getDeckQueue(deck.wordIds) : [];
      } else {
        // Adaptive pacing: if recent recall is poor, introduce fewer new cards.
        const recent = await getRecentEvents(7);
        cards = await getReviewQueue(Date.now(), adaptiveNewCardLimit(recent));
      }
      if (!cancelled) setQueue(cards);
    })();
    return () => {
      cancelled = true;
    };
  }, [deckId]);

  const card = queue?.[index];
  const word = card ? wordById.get(card.wordId) : undefined;

  const rate = useCallback(
    async (rating: Rating) => {
      if (!card) return;
      await recordReview(card.wordId, rating);
      await addXp(rating === 0 ? 1 : 3);
      setReviewed((r) => r + 1);

      setQueue((q) => {
        if (!q) return q;
        // "Again" means due again today — put it at the back of this session
        // rather than dropping it until tomorrow.
        return rating === 0 ? [...q, card] : q;
      });
      setFlipped(false);
      setIndex((i) => i + 1);
    },
    [card],
  );

  // Keyboard shortcuts: space reveals, 1-4 rate. Makes long sessions bearable
  // on desktop and costs nothing on touch.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!card) return;
      if (e.code === "Space") {
        e.preventDefault();
        setFlipped(true);
      } else if (flipped && ["1", "2", "3", "4"].includes(e.key)) {
        void rate((Number(e.key) - 1) as Rating);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [card, flipped, rate]);

  if (queue === null) return <Spinner label="Building your queue…" />;

  if (!card) {
    const finish = async () => {
      if (reviewed > 0) {
        await touchStreak();
        void sync();
      }
      navigate("/");
    };
    return (
      <div
        className="screen screen--full center"
        style={{
          background: "var(--chrome-bg)",
          color: "var(--chrome-fg)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          minHeight: "100dvh",
          padding: 30,
        }}
      >
        <div style={{ fontSize: 40 }}>✦</div>
        <h1 className="title h1" style={{ color: "var(--chrome-fg)" }}>
          {reviewed > 0 ? "Review complete" : "All caught up"}
        </h1>
        <p className="small" style={{ color: "var(--parchment-deep)" }}>
          {reviewed > 0
            ? `${reviewed} card${reviewed === 1 ? "" : "s"} reviewed.`
            : "Nothing is due right now. Come back tomorrow, or learn a new unit."}
        </p>
        <div style={{ marginTop: 24 }}>
          <Button onClick={() => void finish()}>Back to path</Button>
        </div>
      </div>
    );
  }

  const previews = previewIntervals(card, Date.now());
  // Fading niqqud: points drop away as the card matures (spec §4 Phase 4).
  const fadeStage =
    settings?.niqqudPref === "off"
      ? 6
      : settings?.niqqudPref === "fading"
        ? fadeStageForInterval(card.intervalDays, scriptOf().stages)
        : 0;

  return (
    <div className="screen">
      <div className="topbar">
        <span className="small">
          {index + 1} / {queue.length}
        </span>
        {card.isLeech && <span className="tag">leech</span>}
        <button
          className="btn btn--ghost"
          style={{ color: "var(--chrome-fg)", minHeight: 0, padding: 0 }}
          onClick={() => navigate("/")}
          aria-label="End session"
        >
          ✕
        </button>
      </div>

      <div className="pad">
        <div
          className="card"
          style={{ minHeight: 210, display: "grid", placeItems: "center", padding: "36px 18px" }}
          onClick={() => setFlipped(true)}
        >
          <div className="center">
            <ScriptWord
              word={word?.text ?? card.wordId}
              highlight={word?.morphology.highlight}
              size={46}
              showHighlight={flipped}
              fadeStage={fadeStage}
            />
            <div className="translit" style={{ marginTop: 10, minHeight: 18 }}>
              {flipped ? word?.translit : ""}
            </div>
            {flipped ? (
              <>
                <p style={{ fontSize: 17, margin: "12px 0 0" }}>{word?.gloss}</p>
                <div className="row" style={{ justifyContent: "center", gap: 8, marginTop: 12 }}>
                  <button
                    className="btn btn--ghost"
                    style={{ minHeight: 0, padding: 6 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      void playWord(card.wordId, word?.text ?? "", {
                        enabled: settings?.soundEnabled ?? true,
                      });
                    }}
                    aria-label="Hear this word"
                  >
                    🔊
                  </button>
                  {word && (
                    <button
                      className="tag tag--root"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRootSheet(word.familyId);
                      }}
                    >
                      {word.familyId}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <p className="small muted" style={{ marginTop: 12 }}>
                tap to reveal · space
              </p>
            )}
          </div>
        </div>
      </div>

      {flipped && (
        <div className="row pad-x" style={{ gap: 8, flexWrap: "wrap" }}>
          {([0, 1, 2, 3] as Rating[]).map((r) => (
            <button
              key={r}
              className="btn"
              style={{
                flex: "1 1 70px",
                flexDirection: "column",
                gap: 2,
                background: RATING_STYLE[r].bg,
                color: RATING_STYLE[r].color,
                border: `2px solid ${RATING_STYLE[r].color}`,
                padding: "10px 6px",
              }}
              onClick={() => void rate(r)}
            >
              <span style={{ fontSize: 14 }}>{RATING_LABELS[r]}</span>
              <span className="translit" style={{ fontSize: 10, color: "inherit", opacity: 0.75 }}>
                {previews[r]}
              </span>
            </button>
          ))}
        </div>
      )}

      <RootSheet rootId={rootSheet} onClose={() => setRootSheet(null)} />
    </div>
  );
}
