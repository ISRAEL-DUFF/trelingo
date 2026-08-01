import { useState } from "react";
import { useCourseContent } from "@/state/useCourse";
import { ScriptWord } from "@/components/ScriptWord";
import { FamilySheet } from "./FamilySheet";
import { useSession } from "@/state/session";
import { playWord, speak } from "@/lib/audio";
import { textProps } from "@/content/course";

/**
 * Renders a real verse with tap-to-gloss on every word (spec §4 Phase 4).
 *
 * Layout note: the token list is laid out RTL via CSS (`flex-direction:
 * row-reverse` under `direction: rtl`) rather than by reversing the array. The
 * source order stays the reading order, so screen readers and copy-paste get
 * the verse in the right sequence.
 */
export function PassageReader({
  passageId,
  showTranslation = true,
  fadeStage = 0,
}: {
  passageId: string;
  showTranslation?: boolean;
  fadeStage?: number;
}) {
  const { passageById } = useCourseContent();
  const passage = passageById.get(passageId);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [familySheet, setFamilySheet] = useState<string | null>(null);
  const settings = useSession((s) => s.settings);

  if (!passage) return <div className="empty">Passage not found.</div>;

  const active = activeIndex === null ? null : passage.tokens[activeIndex];

  return (
    <div className="pad-x">
      <div className="card" style={{ padding: "22px 16px" }}>
        <div className="passage" {...textProps()}>
          {passage.tokens.map((t, i) => (
            <button
              key={`${t.text}-${i}`}
              className={`passage__token passage__token--tappable${
                activeIndex === i ? " passage__token--active" : ""
              }`}
              onClick={() => setActiveIndex(activeIndex === i ? null : i)}
              aria-label={`${t.text} — ${t.gloss}`}
            >
              <ScriptWord
                word={t.text}
                highlight={t.morphology?.highlight}
                size={30}
                showHighlight={activeIndex === i}
                fadeStage={fadeStage}
              />
            </button>
          ))}
        </div>

        <div style={{ marginTop: 14, minHeight: 66 }}>
          {active ? (
            <div className="card card--flat" style={{ background: "var(--gold-wash)", borderColor: "var(--gold)" }}>
              <div className="row row--between">
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{active.gloss}</div>
                  <div className="translit">{active.translit}</div>
                </div>
                <div className="row" style={{ gap: 6 }}>
                  <button
                    className="btn btn--ghost"
                    style={{ minHeight: 0, padding: 6 }}
                    aria-label="Hear this word"
                    onClick={() =>
                      void (active.wordId
                        ? playWord(active.wordId, active.text, {
                            enabled: settings?.soundEnabled ?? true,
                          })
                        : speak(active.text))
                    }
                  >
                    🔊
                  </button>
                  {active.familyId && (
                    <button className="tag tag--family" onClick={() => setFamilySheet(active.familyId)}>
                      {active.familyId}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="small muted center" style={{ margin: 0 }}>
              Tap any word to see what it means.
            </p>
          )}
        </div>
      </div>

      {showTranslation && (
        <div style={{ marginTop: 14 }}>
          <p className="small muted" style={{ margin: 0, fontStyle: "italic", lineHeight: 1.6 }}>
            {passage.translation}
          </p>
          <p className="translit" style={{ marginTop: 6 }}>
            {passage.reference}
          </p>
          {passage.notes && (
            <p className="small muted" style={{ marginTop: 10, lineHeight: 1.6 }}>
              {passage.notes}
            </p>
          )}
        </div>
      )}

      <FamilySheet familyId={familySheet} onClose={() => setFamilySheet(null)} />
    </div>
  );
}
