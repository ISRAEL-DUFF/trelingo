import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { api } from "@/api/client";
import { ApiError, NetworkError, type Deck } from "@/api/types";
import { Banner, Button, Empty, Sheet, TopBar } from "@/components/ui";
import { ScriptWord } from "@/components/ScriptWord";
import { useCourseContent } from "@/state/useCourse";
import { db } from "@/db";
import { putLocalDecks } from "@/db/repo";
import { scriptOf, textProps } from "@/content/course";
import { useSession } from "@/state/session";
import { DEFAULT_COURSE_ID } from "@/content/course";

/** Custom decks (spec §4 Phase 7): review any subset independently of the path. */
export function DecksScreen() {
  const { families, words, wordsByFamily } = useCourseContent();
  const navigate = useNavigate();
  const user = useSession((s) => s.user);
  const decks = useLiveQuery(() => db.decks.toArray(), []) ?? [];
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    api
      .listDecks()
      .then((remote) => void putLocalDecks(remote))
      .catch(() => {
        /* offline: local copies stand */
      });
  }, [user]);

  const toggle = (id: string) =>
    setPicked((p) => {
      const next = new Set(p);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const addRoot = (rootId: string) =>
    setPicked((p) => {
      const next = new Set(p);
      for (const w of wordsByFamily[rootId] ?? []) next.add(w.id);
      return next;
    });

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const deck = await api.createDeck({ name, wordIds: [...picked] });
      await db.decks.put({ ...deck, courseId: DEFAULT_COURSE_ID });
      setCreating(false);
      setName("");
      setPicked(new Set());
    } catch (e) {
      if (e instanceof NetworkError) {
        // Local-first: the deck exists now, sync reconciles it later.
        const local: Deck = {
          id: crypto.randomUUID(),
          name,
          wordIds: [...picked],
          createdAt: Date.now(),
        };
        await db.decks.put({ ...local, courseId: DEFAULT_COURSE_ID });
        setCreating(false);
        setName("");
        setPicked(new Set());
      } else {
        setError(e instanceof ApiError ? e.body.message : "Could not create the deck.");
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    await db.decks.delete(id);
    try {
      await api.deleteDeck(id);
    } catch {
      /* local delete already applied */
    }
  };

  return (
    <div className="screen">
      <TopBar left={<span className="small">Decks</span>} />

      <div className="pad stack">
        {error && <Banner kind="error">{error}</Banner>}

        {decks.length === 0 && (
          <Empty
            icon="🗂"
            title="No custom decks"
            hint="Build a deck from any words — say, everything on one root — and review it on its own."
          />
        )}

        {decks.map((d) => (
          <div key={d.id} className="card card--flat">
            <div className="row row--between">
              <div>
                <div style={{ fontWeight: 600 }}>{d.name}</div>
                <div className="small muted">{d.wordIds.length} words</div>
              </div>
              <div className="row" style={{ gap: 6 }}>
                <Button variant="secondary" onClick={() => navigate(`/review/deck/${d.id}`)}>
                  Review
                </Button>
                <button
                  className="btn btn--ghost"
                  onClick={() => void remove(d.id)}
                  aria-label={`Delete ${d.name}`}
                >
                  🗑
                </button>
              </div>
            </div>
          </div>
        ))}

        <Button block onClick={() => setCreating(true)}>
          New deck
        </Button>
      </div>

      <Sheet open={creating} onClose={() => setCreating(false)} title="New deck">
        <div className="stack">
          <div className="field">
            <span className="label">Name</span>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Verbs from Genesis"
            />
          </div>

          <div>
            <span className="label">Add a whole root</span>
            <div className="chips" style={{ marginTop: 8 }}>
              {families
                .filter((r) => (wordsByFamily[r.id]?.length ?? 0) > 1)
                .map((r) => (
                  <button key={r.id} className="chip" onClick={() => addRoot(r.id)}>
                    <span {...textProps()}>
                      {scriptOf().joinLetters(r.letters)}
                    </span>
                  </button>
                ))}
            </div>
          </div>

          <div>
            <span className="label">Words ({picked.size} selected)</span>
            <div className="stack" style={{ marginTop: 8, maxHeight: 260, overflowY: "auto" }}>
              {words.map((w) => (
                <button
                  key={w.id}
                  className={`choice${picked.has(w.id) ? " choice--selected" : ""}`}
                  onClick={() => toggle(w.id)}
                >
                  <span className="row row--between">
                    <ScriptWord word={w.text} highlight={w.morphology.highlight} size={20} showHighlight />
                    <span className="small muted">{w.gloss}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <Button block disabled={!name.trim() || picked.size === 0 || busy} onClick={() => void create()}>
            Create deck
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
