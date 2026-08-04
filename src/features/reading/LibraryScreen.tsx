import { useLiveQuery } from "dexie-react-hooks";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useCourse, useCourseContent } from "@/state/useCourse";
import { db } from "@/db";
import { passagesOf } from "@/content/schema";
import { PassageReader } from "./PassageReader";
import { FamilySheet } from "./FamilySheet";
import { Empty, TopBar } from "@/components/ui";
import { ScriptWord } from "@/components/ScriptWord";
import { morphemeLabel, scriptOf } from "@/content/course";
import { useState } from "react";
import { useSession } from "@/state/session";

/** Every verse the learner has unlocked, re-readable at any time. */
export function LibraryScreen() {
  const { passages, families, units, wordsByFamily } = useCourseContent();
  const [tab, setTab] = useState<"verses" | "families">("verses");
  const [familySheet, setFamilySheet] = useState<string | null>(null);
  const course = useCourse();
  const morpheme = morphemeLabel(course);

  const completed = useLiveQuery(
    async () => new Set((await db.unitProgress.toArray()).map((p) => p.unitId)),
    [],
  );

  const unlockedPassageIds = new Set(
    units.filter((u) => completed?.has(u.id)).flatMap(passagesOf),
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
          className={`chip${tab === "families" ? " chip--selected" : ""}`}
          onClick={() => setTab("families")}
        >
          {morpheme.Many}
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

      {tab === "families" && (
        <div className="stack pad" style={{ marginTop: 4 }}>
          {families
            .filter((r) => (wordsByFamily[r.id]?.length ?? 0) > 0)
            .map((r) => (
              <button
                key={r.id}
                className="card card--flat"
                style={{ textAlign: "start", border: "1px solid var(--border)" }}
                onClick={() => setFamilySheet(r.id)}
              >
                <div className="row row--between">
                  <ScriptWord word={scriptOf(course).joinLetters(r.letters)} size={24} showHighlight={false} />
                  <div style={{ textAlign: "end" }}>
                    <div className="small">{r.coreGloss}</div>
                    <div className="small muted">
                      {wordsByFamily[r.id]?.length ?? 0} word
                      {(wordsByFamily[r.id]?.length ?? 0) === 1 ? "" : "s"}
                    </div>
                  </div>
                </div>
              </button>
            ))}
        </div>
      )}

      <FamilySheet familyId={familySheet} onClose={() => setFamilySheet(null)} />
    </div>
  );
}

/** A single verse, opened from the library or a word-family card. */
export function PassageScreen() {
  const { passageId } = useParams<{ passageId: string }>();
  const navigate = useNavigate();
  const settings = useSession((s) => s.settings);
  const [fade, setFade] = useState(settings?.diacriticsPref === "off" ? 6 : 0);

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
