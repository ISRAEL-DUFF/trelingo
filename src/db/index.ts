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
import { type CourseId } from "@/content/course";
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
  diacriticsPref: "always" | "fading" | "off";
  pronunciationPref: PronunciationVariant;
  dailyGoal: number;
  soundEnabled: boolean;
  notifications: NotificationPrefs;
}

export interface Meta {
  key: string;
  value: unknown;
}

/**
 * The app is Trelingo. "Shoresh" is one Hebrew TRACK inside it, and naming the
 * database after a track was a leftover from when the app had only that one.
 */
export const DB_NAME = "trelingo";

/**
 * Databases from before the rename, deleted once on boot.
 *
 * There are no users, so there is nothing to preserve — but a stale IndexedDB
 * sitting under an old name is invisible clutter that would outlive several
 * more refactors, and on a device that already ran the old schema it would also
 * hold the only copy of some now-unreachable rows.
 */
const ORPHANED_DATABASES = ["shoresh"];

export async function deleteOrphanedDatabases(): Promise<void> {
  await Promise.all(
    ORPHANED_DATABASES.map((n) => Dexie.delete(n).catch(() => undefined)),
  );
}

export type TrelingoDb = Dexie & {
  /** Compound key: the same word id can exist in more than one track. */
  srsCards: Table<LocalCard, [CourseId, string]>;
  reviewLogs: EntityTable<LocalReviewLog, "id">;
  unitProgress: Table<LocalProgress, [CourseId, string]>;
  decks: EntityTable<LocalDeck, "id">;
  assessments: EntityTable<AssessmentResult, "id">;
  settings: EntityTable<Settings, "key">;
  meta: EntityTable<Meta, "key">;
};

/**
 * Build a database instance.
 *
 * Parameterised by name purely so tests can work against a throwaway database.
 *
 * ONE VERSION, DELIBERATELY. This schema previously carried five versions of
 * migration history — course scoping, a primary-key rebuild, a settings rename,
 * a track-id rename — accumulated while the shape was still being found. None
 * of it had ever run against a real user's data, because there are no users
 * yet, so all of it was ceremony that could only rot.
 *
 * The moment anyone is actually storing data, this becomes append-only again:
 * bump the version, add a `.stores()` block, never edit this one. The five
 * versions that were here are gone from the code but the lesson is not —
 * IndexedDB cannot change a store's keyPath, so a compound key that needs
 * altering means a new store and a copy, not a `.modify()`.
 */
export function createDb(name = DB_NAME): TrelingoDb {
  const database = new Dexie(name) as TrelingoDb;

  database.version(1).stores({
    // Compound keys: the same word id legitimately exists in more than one
    // track — Attic λόγος and Koine λόγος are different cards.
    srsCards: "[courseId+wordId], courseId, wordId, state, dueAt, isLeech",
    unitProgress: "[courseId+unitId], courseId, unitId, completedAt, synced",
    reviewLogs: "id, courseId, wordId, reviewedAt, synced",
    decks: "id, courseId, createdAt",
    assessments: "id, courseId, createdAt, kind",
    settings: "key",
    // XP, streak and deviceId live here unscoped, per D2 — a streak measures
    // showing up, which is one habit across every track.
    meta: "key",
  });

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
  diacriticsPref: "fading",
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
