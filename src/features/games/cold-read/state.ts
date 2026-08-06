import { db, getMeta, setMeta } from "@/db";
import type { CourseId } from "@/content/course";
import { MIN_KNOWN_WORDS } from "./select";

/**
 * Cold Read's own record, and its read of what the learner knows.
 *
 * IT DOES NOT USE `GameProgress`. That models a fixed sequence of levels with a
 * furthest-reached marker, and this game has no end — there is always another
 * verse. Forcing it into that shape would put a meaningless "3 of 5" on the
 * gallery tile. Its own key instead, riding export/import through the same
 * whole-meta rule in backup.ts.
 */
export interface ColdReadState {
  /** Rounds finished. */
  reads: number;
  /** Best self-reported coverage, 0–1. */
  best: number;
  /** Passage ids already shown, so the same verse is not offered twice. */
  seen: string[];
}

export const COLD_READ_KEY = "games:cold-read:state";

const EMPTY: ColdReadState = { reads: 0, best: 0, seen: [] };

export async function readState(): Promise<ColdReadState> {
  const stored = await getMeta<Partial<ColdReadState> | null>(COLD_READ_KEY, null);
  return stored ? { ...EMPTY, ...stored, seen: stored.seen ?? [] } : { ...EMPTY };
}

/**
 * Record a finished round.
 *
 * `best` is monotonic so a bad round cannot erase a good one, matching the rule
 * every other game's progress follows.
 */
export async function recordRead(passageId: string, coverage: number): Promise<ColdReadState> {
  const current = await readState();
  const next: ColdReadState = {
    reads: current.reads + 1,
    best: Math.max(current.best, coverage),
    seen: current.seen.includes(passageId) ? current.seen : [...current.seen, passageId],
  };
  await setMeta(COLD_READ_KEY, next);
  return next;
}

/**
 * Forget which verses have been shown, keeping the counters.
 *
 * Called when the pool empties rather than refusing to play. A learner who has
 * read every eligible verse should get them again, not a dead end.
 */
export async function clearSeen(): Promise<ColdReadState> {
  const current = await readState();
  const next: ColdReadState = { ...current, seen: [] };
  await setMeta(COLD_READ_KEY, next);
  return next;
}

/**
 * Every word the learner can read, across every track.
 *
 * THREE DELIBERATE CHOICES, all argued in cold-read-spec.md:
 *
 *   ANY COURSE. Cards are keyed [courseId+wordId] but `wordId` is indexed, so
 *   one query collapses them. A word learned in Jonah is known in Genesis —
 *   the ids are the same Strong's key. This is the entire premise of the game.
 *
 *   state === "review", not intervalDays >= 21. The stricter "known well" bar
 *   belongs on the stats tile. A card in review has graduated from learning,
 *   which is exactly the claim "I can read this word" makes.
 *
 *   LEECHES EXCLUDED. A word forgotten eight times is not one you read cold,
 *   whatever its card says.
 *
 * A DUE CARD STILL COUNTS. The SRS's own model is that a due card is known and
 * needs refreshing, not forgotten. Reasonable people could set this the other
 * way; what matters is that it is a decision with a reason rather than an
 * accident of which query was easiest.
 */
export async function knownWordIds(): Promise<Set<string>> {
  const cards = await db.srsCards.where("state").equals("review").toArray();
  const known = new Set<string>();
  for (const c of cards) if (!c.isLeech) known.add(c.wordId);
  return known;
}

/** Courses with at least one completed unit — the books already opened. */
export async function studiedCourses(): Promise<Set<CourseId>> {
  const rows = await db.unitProgress.toArray();
  return new Set(rows.map((r) => r.courseId as CourseId));
}

export const enoughToPlay = (known: ReadonlySet<string>): boolean => known.size >= MIN_KNOWN_WORDS;
