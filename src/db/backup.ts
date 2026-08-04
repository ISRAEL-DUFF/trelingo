/**
 * Local backup — export and restore a learner's progress as a file.
 *
 * WHY THIS EXISTS. Everything a learner has built lives in one browser's
 * IndexedDB, and browser storage can be evicted or cleared. Until this landed,
 * the Settings "export" button called `api.exportData()` — a server that does
 * not exist — so someone eight months into Hebrew had no way at all to take a
 * copy of their own data. This is the whole of that problem solved without a
 * backend: the file is written and read entirely on the device.
 *
 * It is deliberately NOT sync. It will not notice a second device on its own,
 * and two devices drifting apart is the learner's business to reconcile by
 * exporting and importing. What it does guarantee is that nothing is ever lost
 * to a cleared cache, and that is the risk actually worth insuring against
 * today (see the backend discussion — accounts remain deferred).
 *
 * THREE RULES, and the tests exist to hold them:
 *
 *   1. MERGE, NEVER DESTROY. Importing onto a device that already has progress
 *      keeps both sides. There is no "replace" mode, because the failure it
 *      would cause — restoring a stale file over live progress — is exactly the
 *      thing this feature is supposed to prevent.
 *
 *   2. IDEMPOTENT. Importing the same file twice must be a no-op. That is why
 *      every merge rule below is max / union / earliest and never a sum: a
 *      learner who double-clicks, or restores the same file on three devices,
 *      must not end up with triple the XP.
 *
 *   3. THE LOG WINS. Card state is DERIVED from the review log, per spec §5.2,
 *      not copied out of the file. Cards are still exported, but only as the
 *      carrier for words that have been introduced and never reviewed — those
 *      have no events to derive from. Wherever a log exists, it decides.
 */
import { db, getMeta, setMeta, type Meta, type Settings } from "./index";
import type { LocalCard, LocalDeck, LocalProgress, LocalReviewLog } from "./index";
import { rebuildCardsFromLogs } from "./repo";
import type { CourseId } from "@/content/course";
import type { AssessmentResult, StreakState } from "@/api/types";

/**
 * Bump when the file shape changes in a way an older app could not read.
 *
 * Import refuses anything NEWER than it understands, because silently ignoring
 * fields a future version added would restore a partial account and look like
 * it had worked.
 */
export const BACKUP_VERSION = 1;

export interface Backup {
  app: "trelingo";
  backupVersion: number;
  exportedAt: number;
  reviewLogs: LocalReviewLog[];
  /** Only load-bearing for words with no reviews yet — see rule 3. */
  cards: LocalCard[];
  progress: LocalProgress[];
  decks: LocalDeck[];
  assessments: AssessmentResult[];
  settings: Settings | null;
  /** The whole meta table minus `deviceId`, keyed as stored. */
  meta: Record<string, unknown>;
}

export interface ImportSummary {
  reviewLogs: number;
  cards: number;
  progress: number;
  decks: number;
  assessments: number;
  courses: CourseId[];
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export async function exportBackup(): Promise<Backup> {
  const [reviewLogs, cards, progress, decks, assessments, settings, meta] = await Promise.all([
    db.reviewLogs.toArray(),
    db.srsCards.toArray(),
    db.unitProgress.toArray(),
    db.decks.toArray(),
    db.assessments.toArray(),
    db.settings.get("settings"),
    db.meta.toArray(),
  ]);

  return {
    app: "trelingo",
    backupVersion: BACKUP_VERSION,
    exportedAt: Date.now(),
    reviewLogs,
    cards,
    progress,
    decks,
    assessments,
    settings: settings ?? null,
    meta: metaToRecord(meta),
  };
}

/**
 * The meta table is exported WHOLE rather than field by field.
 *
 * It holds `xp` and `streak`, but also `placementUnlocked:<courseId>` — one key
 * per track. Enumerating the fields we knew about would have quietly dropped a
 * learner's placement result, and would drop the next thing stored here too.
 *
 * `deviceId` is the one deliberate exception. It identifies the INSTALL, not
 * the learner: copying it to a second device would make both attribute their
 * review events to the same origin, which is precisely the field that exists to
 * tell them apart when a conflict needs debugging.
 */
function metaToRecord(rows: Meta[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const row of rows) if (row.key !== "deviceId") out[row.key] = row.value;
  return out;
}

/** A stable, sortable filename: `trelingo-backup-2026-08-04.json`. */
export function backupFilename(now = new Date()): string {
  const d = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  return `trelingo-backup-${d}.json`;
}

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

/**
 * Validate before touching anything.
 *
 * Everything here throws rather than skipping bad rows, so a half-understood
 * file is refused outright instead of restoring a partial account that looks
 * complete. Nothing is written until every check has passed.
 */
function validate(backup: Backup): void {
  if (!backup || typeof backup !== "object") throw new Error("That file is not a Trelingo backup.");
  if (backup.app !== "trelingo") throw new Error("That file is not a Trelingo backup.");
  if (typeof backup.backupVersion !== "number") {
    throw new Error("That file is not a Trelingo backup.");
  }
  if (backup.backupVersion > BACKUP_VERSION) {
    throw new Error(
      `That backup was written by a newer version of Trelingo (format ${backup.backupVersion}, this app reads ${BACKUP_VERSION}). Update the app and try again.`,
    );
  }

  const arrays: [keyof Backup, unknown][] = [
    ["reviewLogs", backup.reviewLogs],
    ["cards", backup.cards],
    ["progress", backup.progress],
    ["decks", backup.decks],
    ["assessments", backup.assessments],
  ];
  for (const [name, value] of arrays) {
    if (!Array.isArray(value)) throw new Error(`That backup is missing its ${String(name)}.`);
  }
  if (backup.meta && typeof backup.meta !== "object") throw new Error("That backup is damaged.");

  for (const l of backup.reviewLogs) {
    if (
      typeof l?.id !== "string" ||
      typeof l?.courseId !== "string" ||
      typeof l?.wordId !== "string" ||
      typeof l?.rating !== "number" ||
      typeof l?.reviewedAt !== "number"
    ) {
      throw new Error("That backup has a damaged review log entry and was not imported.");
    }
  }
  for (const c of backup.cards) {
    if (typeof c?.wordId !== "string" || typeof c?.courseId !== "string") {
      throw new Error("That backup has a damaged card and was not imported.");
    }
  }
  for (const p of backup.progress) {
    if (typeof p?.unitId !== "string" || typeof p?.courseId !== "string") {
      throw new Error("That backup has a damaged progress row and was not imported.");
    }
  }
}

export async function importBackup(backup: Backup): Promise<ImportSummary> {
  validate(backup);

  const summary: ImportSummary = {
    reviewLogs: 0,
    cards: 0,
    progress: 0,
    decks: 0,
    assessments: 0,
    courses: [],
  };

  await db.transaction(
    "rw",
    [db.reviewLogs, db.srsCards, db.unitProgress, db.decks, db.assessments, db.settings, db.meta],
    async () => {
      // ---- review logs: union by id, and events are immutable, so an id we
      // already hold is never rewritten. This is what makes a re-import free.
      const existingLogIds = new Set(await db.reviewLogs.toCollection().primaryKeys());
      const freshLogs = backup.reviewLogs
        .filter((l) => !existingLogIds.has(l.id))
        // Imported events are marked unsynced so that if this device ever signs
        // into an account, they are pushed. The server is idempotent on log id
        // (see the /sync/review-logs contract), so re-pushing costs nothing and
        // missing them would lose history the server never saw.
        .map((l) => ({ ...l, synced: 0 as const }));
      if (freshLogs.length) await db.reviewLogs.bulkAdd(freshLogs);
      summary.reviewLogs = freshLogs.length;

      // ---- unit progress: earliest completion, best score. Mirrors the rule
      // completeUnit already applies, so importing cannot un-complete a unit or
      // lower a score.
      for (const p of backup.progress) {
        const key = [p.courseId, p.unitId] as [CourseId, string];
        const existing = await db.unitProgress.get(key);
        const merged: LocalProgress = {
          courseId: p.courseId,
          unitId: p.unitId,
          completedAt: Math.min(p.completedAt, existing?.completedAt ?? p.completedAt),
          score: Math.max(p.score ?? 0, existing?.score ?? 0),
          synced: 0,
        };
        if (
          !existing ||
          existing.completedAt !== merged.completedAt ||
          existing.score !== merged.score
        ) {
          await db.unitProgress.put(merged);
          if (!existing) summary.progress += 1;
        }
      }

      // ---- decks and assessments: union by id, existing rows left alone.
      summary.decks = await unionById(db.decks, backup.decks);
      summary.assessments = await unionById(db.assessments, backup.assessments);

      // ---- settings: a restore should restore preferences.
      if (backup.settings) await db.settings.put({ ...backup.settings, key: "settings" });

      // ---- meta: per-key rules, all idempotent. See mergeMeta.
      await mergeMeta(backup.meta ?? {});
    },
  );

  /*
   * Cards last, and OUTSIDE the transaction above, because rebuilding reads the
   * logs we just merged and writes derived rows from them.
   *
   * Every course touched by either side is rebuilt: a course whose logs came
   * only from the file still needs its cards derived, and a course that already
   * had local cards needs them recomputed now that more events exist. This is
   * the step that makes rule 3 true — nothing trusts the card state in the file
   * where a log can speak instead.
   */
  const courses = new Set<CourseId>([
    ...backup.reviewLogs.map((l) => l.courseId as CourseId),
    ...backup.cards.map((c) => c.courseId as CourseId),
  ]);
  for (const courseId of courses) await rebuildCardsFromLogs(courseId);
  summary.courses = [...courses];

  /*
   * Then, and only then, restore cards for words that have NO review events.
   *
   * `ensureCards` creates a card the moment a unit introduces a word, before it
   * has ever been rated — those cards are real state ("this word has been
   * introduced") and no log entry exists to derive them from. Anything with a
   * log was already rebuilt above and is not touched here.
   */
  const reviewedKeys = new Set(
    (await db.reviewLogs.toArray()).map((l) => `${l.courseId} ${l.wordId}`),
  );
  const missing: LocalCard[] = [];
  for (const c of backup.cards) {
    const key = `${c.courseId} ${c.wordId}`;
    if (reviewedKeys.has(key)) continue;
    if (await db.srsCards.get([c.courseId, c.wordId])) continue;
    missing.push(c);
  }
  if (missing.length) await db.srsCards.bulkPut(missing);
  summary.cards = missing.length;

  return summary;
}

/** Insert rows whose id we do not already hold; never overwrite. */
async function unionById<T extends { id: string }>(
  table: { bulkGet: (keys: string[]) => Promise<(T | undefined)[]>; bulkAdd: (rows: T[]) => unknown },
  rows: T[],
): Promise<number> {
  if (!rows.length) return 0;
  const have = await table.bulkGet(rows.map((r) => r.id));
  const fresh = rows.filter((_, i) => have[i] === undefined);
  if (fresh.length) await table.bulkAdd(fresh);
  return fresh.length;
}

/**
 * Merge the meta table, one rule per kind of key. Every rule is idempotent.
 *
 *   xp                        max — summing would inflate on a second import
 *   streak                    longest is max; the current run follows whichever
 *                             side was active more recently, since a streak is
 *                             a fact about consecutive days and the stale side
 *                             cannot know about days it never saw
 *   placementUnlocked:<id>    union — unlocking is monotonic
 *   anything else             local wins if present, else take the file's
 *
 * The fallback is deliberately conservative: a key added later gets sane
 * behaviour (never destroys local state) without this function knowing about it.
 */
async function mergeMeta(incoming: Record<string, unknown>): Promise<void> {
  for (const [key, value] of Object.entries(incoming)) {
    if (key === "deviceId") continue; // never adopt another install's identity

    if (key === "xp") {
      const local = await getMeta<number>("xp", 0);
      await setMeta("xp", Math.max(local, typeof value === "number" ? value : 0));
      continue;
    }

    if (key === "streak") {
      const local = await getMeta<StreakState | null>("streak", null);
      const incomingStreak = value as StreakState | null;
      await setMeta("streak", mergeStreak(local, incomingStreak));
      continue;
    }

    if (key.startsWith("placementUnlocked:")) {
      const local = await getMeta<string[]>(key, []);
      const merged = [...new Set([...local, ...(Array.isArray(value) ? (value as string[]) : [])])];
      await setMeta(key, merged);
      continue;
    }

    const existing = await db.meta.get(key);
    if (existing === undefined) await setMeta(key, value);
  }
}

function mergeStreak(local: StreakState | null, incoming: StreakState | null): StreakState {
  if (!incoming) return local!;
  if (!local) return incoming;
  // The side with the later last-active date owns the CURRENT run; the other
  // side's run is by definition already broken by the days it did not see.
  const newer = incoming.lastActiveDate > local.lastActiveDate ? incoming : local;
  return {
    current: newer.current,
    lastActiveDate: newer.lastActiveDate,
    longest: Math.max(local.longest, incoming.longest),
    freezesAvailable: Math.max(local.freezesAvailable, incoming.freezesAvailable),
  };
}

// ---------------------------------------------------------------------------
// File plumbing
// ---------------------------------------------------------------------------

/** Parse a picked file, with errors a person can act on. */
export async function readBackupFile(file: File): Promise<Backup> {
  let text: string;
  try {
    text = await file.text();
  } catch {
    throw new Error("That file could not be read.");
  }
  try {
    return JSON.parse(text) as Backup;
  } catch {
    throw new Error("That file is not valid JSON, so it is not a Trelingo backup.");
  }
}
