import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router-dom";
import { useActiveCourseId, useCourse, useCourseContent } from "@/state/useCourse";
import { ScriptWord } from "@/components/ScriptWord";
import { Sheet } from "@/components/ui";
import { morphemeLabel, parseFieldsOf, scriptOf } from "@/content/course";
import { db } from "@/db";


/**
 * The word-family card (spec §4 Phase 4): every word in the app built on this
 * family's morpheme, every verse it appears in, and how well the learner knows
 * each form.
 *
 * This is the screen that makes the product's central claim visible — you learn
 * one morpheme and it pays off across a family of words. It was called the
 * "root card", but Hebrew teaches roots and Greek teaches stems, so all copy
 * here comes from `morphemeLabel`.
 */
export function FamilySheet({ familyId, onClose }: { familyId: string | null; onClose: () => void }) {
  const { familyById, wordsByFamily, passagesByFamily, unitByWordId, passageById } =
    useCourseContent();
  const courseId = useActiveCourseId();
  const course = useCourse();
  const morpheme = morphemeLabel(course);
  const entry = familyId ? familyById.get(familyId) : undefined;
  const family = familyId ? (wordsByFamily[familyId] ?? []) : [];
  const cards = useLiveQuery(
    async () => (familyId ? db.srsCards.bulkGet(family.map((w) => [courseId, w.id] as [typeof courseId, string])) : []),
    [familyId, family.length, courseId],
  );

  const cardFor = (wordId: string) => cards?.find((c) => c?.wordId === wordId) ?? undefined;
  const verses = familyId ? (passagesByFamily[familyId] ?? []) : [];

  return (
    <Sheet open={!!entry} onClose={onClose} title={entry ? `${morpheme.One} ${entry.letters}` : undefined}>
      {entry && (
        <>
          <div className="center" style={{ paddingBottom: 8 }}>
            <ScriptWord word={scriptOf(course).joinLetters(entry.letters)} size={38} showHighlight={false} />
            <p style={{ margin: "8px 0 0", fontSize: 17, fontWeight: 600 }}>{entry.coreGloss}</p>
            {entry.notes && (
              <p className="small muted" style={{ marginTop: 8, lineHeight: 1.6 }}>
                {entry.notes}
              </p>
            )}
          </div>

          <hr className="divider" />

          <span className="label">
            {family.length} word{family.length === 1 ? "" : "s"} from this {morpheme.one}
          </span>
          <div className="stack" style={{ marginTop: 10 }}>
            {family.map((w) => {
              const card = cardFor(w.id);
              const unit = unitByWordId[w.id];
              return (
                <div key={w.id} className="card card--flat">
                  <div className="row row--between">
                    <div>
                      <ScriptWord word={w.text} highlight={w.morphology.highlight} size={26} showHighlight />
                      <div className="translit" style={{ marginTop: 3 }}>
                        {w.translit}
                      </div>
                    </div>
                    <div style={{ textAlign: "end" }}>
                      <div className="small">{w.gloss}</div>
                      <div className="small muted">
                        {card
                          ? card.state === "new"
                            ? "not started"
                            : `${card.state} · ${card.intervalDays}d`
                          : unit
                            ? `taught in ${unit}`
                            : ""}
                      </div>
                    </div>
                  </div>
                  {w.parse && (
                    <div className="small muted" style={{ marginTop: 8 }}>
                      {parseFieldsOf(course)
                        .map((f) => w.parse?.[f.id])
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  )}
                  {w.notes && (
                    <p className="small muted" style={{ marginTop: 8, lineHeight: 1.55 }}>
                      {w.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {verses.length > 0 && (
            <>
              <hr className="divider" />
              <span className="label">Seen in</span>
              <div className="stack" style={{ marginTop: 10 }}>
                {verses.map((pid) => (
                  <Link
                    key={pid}
                    to={`/passages/${pid}`}
                    onClick={onClose}
                    className="card card--flat"
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <div className="row row--between">
                      <span className="small">{passageById.get(pid)?.reference ?? pid}</span>
                      <span className="muted">›</span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </Sheet>
  );
}
