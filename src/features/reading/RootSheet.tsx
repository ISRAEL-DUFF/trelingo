import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router-dom";
import { passageById, passagesByRoot, rootById, unitByWordId, wordsByRoot } from "@/content";
import { HebrewWord } from "@/components/HebrewWord";
import { Sheet } from "@/components/ui";
import { formatRoot } from "@/lib/hebrew";
import { db } from "@/db";

/**
 * The root card (spec §4 Phase 4): every word in the app built on this root,
 * every verse it appears in, and how well the learner knows each form.
 *
 * This is the screen that makes the product's central claim visible — you learn
 * a root once and it pays off across a family of words.
 */
export function RootSheet({ rootId, onClose }: { rootId: string | null; onClose: () => void }) {
  const root = rootId ? rootById.get(rootId) : undefined;
  const family = rootId ? (wordsByRoot[rootId] ?? []) : [];
  const cards = useLiveQuery(
    async () => (rootId ? db.cards.bulkGet(family.map((w) => w.id)) : []),
    [rootId, family.length],
  );

  const cardFor = (wordId: string) => cards?.find((c) => c?.wordId === wordId) ?? undefined;
  const verses = rootId ? (passagesByRoot[rootId] ?? []) : [];

  return (
    <Sheet open={!!root} onClose={onClose} title={root ? `Root ${root.letters}` : undefined}>
      {root && (
        <>
          <div className="center" style={{ paddingBottom: 8 }}>
            <HebrewWord word={formatRoot(root.letters)} size={38} highlight={false} />
            <p style={{ margin: "8px 0 0", fontSize: 17, fontWeight: 600 }}>{root.coreGloss}</p>
            {root.notes && (
              <p className="small muted" style={{ marginTop: 8, lineHeight: 1.6 }}>
                {root.notes}
              </p>
            )}
          </div>

          <hr className="divider" />

          <span className="label">
            {family.length} word{family.length === 1 ? "" : "s"} from this root
          </span>
          <div className="stack" style={{ marginTop: 10 }}>
            {family.map((w) => {
              const card = cardFor(w.id);
              const unit = unitByWordId[w.id];
              return (
                <div key={w.id} className="card card--flat">
                  <div className="row row--between">
                    <div>
                      <HebrewWord word={w.hebrew} rootIndices={w.rootIndices} size={26} highlight />
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
                      {[w.parse.binyan, w.parse.tense, w.parse.person, w.parse.gender, w.parse.number]
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
