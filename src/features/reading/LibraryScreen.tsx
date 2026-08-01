import { useLiveQuery } from "dexie-react-hooks";
import { Link, useParams, useNavigate } from "react-router-dom";
import { passages, roots, units, wordsByRoot } from "@/content";
import { db } from "@/db";
import { PassageReader } from "./PassageReader";
import { RootSheet } from "./RootSheet";
import { Empty, TopBar } from "@/components/ui";
import { ScriptWord } from "@/components/ScriptWord";
import { scriptOf } from "@/content/course";
import { useState } from "react";
import { useSession } from "@/state/session";

/** Every verse the learner has unlocked, re-readable at any time. */
export function LibraryScreen() {
  const [tab, setTab] = useState<"verses" | "roots">("verses");
  const [rootSheet, setRootSheet] = useState<string | null>(null);

  const completed = useLiveQuery(
    async () => new Set((await db.progress.toArray()).map((p) => p.unitId)),
    [],
  );

  const unlockedPassageIds = new Set(
    units.filter((u) => completed?.has(u.id) && u.passageId).map((u) => u.passageId!),
  );

  return (
    <div className="screen">
      <TopBar left={<span className="small">Library</span>} />

      <div className="row pad-x" style={{ gap: 8, marginTop: 16 }}>
        <button
          className={`chip${tab === "verses" ? " chip--selected" : ""}`}
          onClick={() => setTab("verses")}
        >
          Verses
        </button>
        <button
          className={`chip${tab === "roots" ? " chip--selected" : ""}`}
          onClick={() => setTab("roots")}
        >
          Roots
        </button>
      </div>

      {tab === "verses" && (
        <div className="stack pad" style={{ marginTop: 4 }}>
          {passages.map((p) => {
            const unlocked = unlockedPassageIds.has(p.id);
            return unlocked ? (
              <Link
                key={p.id}
                to={`/passages/${p.id}`}
                className="card card--flat"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div className="row row--between">
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.reference}</div>
                    <div className="small muted">{p.translation}</div>
                  </div>
                  <span className="muted">›</span>
                </div>
              </Link>
            ) : (
              <div key={p.id} className="card card--flat" style={{ opacity: 0.5 }}>
                <div className="row row--between">
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.reference}</div>
                    <div className="small muted">
                      Complete the unit that teaches it to unlock.
                    </div>
                  </div>
                  <span aria-hidden>🔒</span>
                </div>
              </div>
            );
          })}
          {unlockedPassageIds.size === 0 && (
            <Empty
              icon="📖"
              title="No verses yet"
              hint="Finish your first unit and the verse it builds toward appears here."
            />
          )}
        </div>
      )}

      {tab === "roots" && (
        <div className="stack pad" style={{ marginTop: 4 }}>
          {roots
            .filter((r) => (wordsByRoot[r.id]?.length ?? 0) > 0)
            .map((r) => (
              <button
                key={r.id}
                className="card card--flat"
                style={{ textAlign: "start", border: "1px solid var(--border)" }}
                onClick={() => setRootSheet(r.id)}
              >
                <div className="row row--between">
                  <ScriptWord word={scriptOf().joinLetters(r.letters)} size={24} showHighlight={false} />
                  <div style={{ textAlign: "end" }}>
                    <div className="small">{r.coreGloss}</div>
                    <div className="small muted">
                      {wordsByRoot[r.id]?.length ?? 0} word
                      {(wordsByRoot[r.id]?.length ?? 0) === 1 ? "" : "s"}
                    </div>
                  </div>
                </div>
              </button>
            ))}
        </div>
      )}

      <RootSheet rootId={rootSheet} onClose={() => setRootSheet(null)} />
    </div>
  );
}

/** A single verse, opened from the library or a root card. */
export function PassageScreen() {
  const { passageId } = useParams<{ passageId: string }>();
  const navigate = useNavigate();
  const settings = useSession((s) => s.settings);
  const [fade, setFade] = useState(settings?.niqqudPref === "off" ? 6 : 0);

  if (!passageId) return null;

  return (
    <div className="screen">
      <TopBar
        left={
          <button
            className="btn btn--ghost"
            style={{ color: "var(--chrome-fg)", padding: 0, minHeight: 0 }}
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>
        }
      />
      <div className="pad-x" style={{ marginTop: 16 }}>
        <div className="row row--between">
          <span className="label">Vowel points</span>
          <div className="row" style={{ gap: 6 }}>
            {[0, 3, 6].map((s) => (
              <button
                key={s}
                className={`chip${fade === s ? " chip--selected" : ""}`}
                onClick={() => setFade(s)}
              >
                {s === 0 ? "Full" : s === 3 ? "Reduced" : "None"}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <PassageReader passageId={passageId} fadeStage={fade} />
      </div>
    </div>
  );
}
