/**
 * Local-first storage (spec principle 5: "Local-first, sync-second").
 *
 * Every read and write the UI performs goes here, never to the network. Sync is
 * a background reconciliation between this store and the server; if it never
 * runs, the app still works completely. That is what makes offline real rather
 * than aspirational.
 */
import Dexie, { type EntityTable, type Table } from "dexie";
import { DEFAULT_THEME, type ThemePref } from "@/lib/theme";
import { DEFAULT_COURSE_ID, type CourseId } from "@/content/course";
import type { SrsCard } from "@/srs/engine";
import type {
  AssessmentResult,
  Deck,
  NotificationPrefs,
  PronunciationVariant,
  ReviewLogEntry,
  UnitProgress,
} from "@/api/types";

/** Every learning row is scoped to a course (decision D1). */
export interface CourseScoped {
  courseId: CourseId;
}

export type LocalCard = SrsCard & CourseScoped;

export type LocalReviewLog = Omit<ReviewLogEntry, "courseId"> &
  CourseScoped & {
    /** 0 = not yet pushed to the server, 1 = acknowledged. Indexed for sync. */
    synced: 0 | 1;
  };

export type LocalProgress = Omit<UnitProgress, "courseId"> & CourseScoped & { synced: 0 | 1 };

export type LocalDeck = Deck & CourseScoped;

export interface Settings {
  key: "settings";
  /** "system" is resolved to a concrete palette in lib/theme.ts. */
  themePref: ThemePref;
  niqqudPref: "always" | "fading" | "off";
  pronunciationPref: PronunciationVariant;
  dailyGoal: number;
  soundEnabled: boolean;
  notifications: NotificationPrefs;
}

export interface Meta {
  key: string;
  value: unknown;
}

export type ShoreshDb = Dexie & {
  /** Compound key: the same word id can exist in more than one course. */
  srsCards: Table<LocalCard, [CourseId, string]>;
  reviewLogs: EntityTable<LocalReviewLog, "id">;
  unitProgress: Table<LocalProgress, [CourseId, string]>;
  decks: EntityTable<LocalDeck, "id">;
  assessments: EntityTable<AssessmentResult, "id">;
  settings: EntityTable<Settings, "key">;
  meta: EntityTable<Meta, "key">;
};

/**
 * Rows written before courses existed belong to the only course there was.
 * Used solely by the v1 → v2 backfill.
 */
const LEGACY_COURSE_ID: CourseId = DEFAULT_COURSE_ID;

/**
 * Build a database instance.
 *
 * Parameterised by name purely so migrations can be tested against a seeded
 * fixture. A migration that has only ever run against an empty database has not
 * really been tested — and this is the one part of the app that can destroy a
 * learner's history.
 *
 * Versioned schema: bump the version and add a new `.stores()` block; never edit
 * an existing one, or clients that already ran it will diverge.
 */
export function createDb(name = "shoresh"): ShoreshDb {
  const database = new Dexie(name) as ShoreshDb;

  database.version(1).stores({
    cards: "wordId, state, dueAt, isLeech",
    reviewLogs: "id, wordId, reviewedAt, synced",
    progress: "unitId, completedAt, synced",
    decks: "id, createdAt",
    assessments: "id, createdAt, kind",
    settings: "key",
    meta: "key",
  });

  /**
   * v2 — course scoping.
   *
   * v1 keyed cards by `wordId` alone. That collides the moment a second course
   * exists: Attic λόγος and Koine λόγος are different words with the same id.
   *
   * IndexedDB cannot change a store's keyPath, and Dexie refuses to fake it
   * ("Not yet support for changing primary key"). So the two tables that need a
   * compound key are recreated under new names and copied across, rather than
   * altered in place. The other tables keep their `id` primary key and only gain
   * an index, so they migrate with a plain backfill.
   *
   * XP, streak and deviceId stay in `meta`, unscoped, per decision D2 — a streak
   * measures showing up, which is a global habit.
   */
  database
    .version(2)
    .stores({
      srsCards: "[courseId+wordId], courseId, wordId, state, dueAt, isLeech",
      unitProgress: "[courseId+unitId], courseId, unitId, completedAt, synced",
      reviewLogs: "id, courseId, wordId, reviewedAt, synced",
      decks: "id, courseId, createdAt",
      assessments: "id, courseId, createdAt, kind",
    })
    .upgrade(async (tx) => {
      // Copy the two re-keyed tables. `cards` and `progress` still exist at this
      // point — a version's stores() is a delta, so unlisted tables carry over.
      const legacyCards = await tx.table("cards").toArray();
      if (legacyCards.length) {
        await tx
          .table("srsCards")
          .bulkAdd(legacyCards.map((c) => ({ ...c, courseId: LEGACY_COURSE_ID })));
      }
      const legacyProgress = await tx.table("progress").toArray();
      if (legacyProgress.length) {
        await tx
          .table("unitProgress")
          .bulkAdd(legacyProgress.map((p) => ({ ...p, courseId: LEGACY_COURSE_ID })));
      }
      // Tables whose primary key is unchanged just gain the field.
      for (const table of ["reviewLogs", "decks", "assessments"]) {
        await tx
          .table(table)
          .toCollection()
          .modify((row: Record<string, unknown>) => {
            row.courseId ??= LEGACY_COURSE_ID;
          });
      }
    });

  // v3 — drop the superseded tables, now that v2 has copied out of them.
  database.version(3).stores({ cards: null, progress: null });

  return database;
}

const db = createDb();

export { db };

// ---------- meta helpers ----------

export async function getMeta<T>(key: string, fallback: T): Promise<T> {
  const row = await db.meta.get(key);
  return row === undefined ? fallback : (row.value as T);
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  await db.meta.put({ key, value });
}

/** Stable per-install id, used to attribute review events to a device. */
export async function getDeviceId(): Promise<string> {
  const existing = await getMeta<string | null>("deviceId", null);
  if (existing) return existing;
  const id = crypto.randomUUID();
  await setMeta("deviceId", id);
  return id;
}

export const DEFAULT_SETTINGS: Settings = {
  key: "settings",
  themePref: DEFAULT_THEME,
  niqqudPref: "fading",
  pronunciationPref: "sephardic",
  dailyGoal: 20,
  soundEnabled: true,
  notifications: {
    enabled: false,
    quietHoursStart: 22,
    quietHoursEnd: 8,
    streakReminders: true,
  },
};

/**
 * Settings rows written before a field existed are missing it, so merge over
 * the defaults rather than returning the stored row directly.
 */
export async function getSettings(): Promise<Settings> {
  const stored = await db.settings.get("settings");
  return { ...DEFAULT_SETTINGS, ...stored, key: "settings" };
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await getSettings()), ...patch, key: "settings" as const };
  await db.settings.put(next);
  return next;
}

/**
 * Wipe local data only. Used by "sign out" and by the dev panel to prove that
 * a fresh device really does rebuild its state from the server.
 */
export async function clearLocalData(): Promise<void> {
  await db.transaction(
    "rw",
    [db.srsCards, db.reviewLogs, db.unitProgress, db.decks, db.assessments, db.meta],
    async () => {
      await Promise.all([
        db.srsCards.clear(),
        db.reviewLogs.clear(),
        db.unitProgress.clear(),
        db.decks.clear(),
        db.assessments.clear(),
        db.meta.where("key").notEqual("deviceId").delete(),
      ]);
    },
  );
}

/**
 * Ask the browser to keep our storage. Without this, IndexedDB is evictable
 * under storage pressure — the PWA caveat called out in spec §2.1.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false;
  if (await navigator.storage.persisted()) return true;
  return navigator.storage.persist();
}

export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
  if (!navigator.storage?.estimate) return null;
  const { usage = 0, quota = 0 } = await navigator.storage.estimate();
  return { usage, quota };
}
