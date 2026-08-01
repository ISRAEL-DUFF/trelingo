/**
 * Local-first storage (spec principle 5: "Local-first, sync-second").
 *
 * Every read and write the UI performs goes here, never to the network. Sync is
 * a background reconciliation between this store and the server; if it never
 * runs, the app still works completely. That is what makes offline real rather
 * than aspirational.
 */
import Dexie, { type EntityTable } from "dexie";
import type { SrsCard } from "@/srs/engine";
import type {
  AssessmentResult,
  Deck,
  NotificationPrefs,
  PronunciationVariant,
  ReviewLogEntry,
  UnitProgress,
} from "@/api/types";

export interface LocalReviewLog extends ReviewLogEntry {
  /** 0 = not yet pushed to the server, 1 = acknowledged. Indexed for sync. */
  synced: 0 | 1;
}

export interface LocalProgress extends UnitProgress {
  synced: 0 | 1;
}

export interface Settings {
  key: "settings";
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

const db = new Dexie("shoresh") as Dexie & {
  cards: EntityTable<SrsCard, "wordId">;
  reviewLogs: EntityTable<LocalReviewLog, "id">;
  progress: EntityTable<LocalProgress, "unitId">;
  decks: EntityTable<Deck, "id">;
  assessments: EntityTable<AssessmentResult, "id">;
  settings: EntityTable<Settings, "key">;
  meta: EntityTable<Meta, "key">;
};

/**
 * Versioned schema. Bump the version and add a new `.stores()` block to migrate;
 * never edit an existing one, or clients that already ran it will diverge.
 */
db.version(1).stores({
  cards: "wordId, state, dueAt, isLeech",
  reviewLogs: "id, wordId, reviewedAt, synced",
  progress: "unitId, completedAt, synced",
  decks: "id, createdAt",
  assessments: "id, createdAt, kind",
  settings: "key",
  meta: "key",
});

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

export async function getSettings(): Promise<Settings> {
  return (await db.settings.get("settings")) ?? DEFAULT_SETTINGS;
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
    [db.cards, db.reviewLogs, db.progress, db.decks, db.assessments, db.meta],
    async () => {
      await Promise.all([
        db.cards.clear(),
        db.reviewLogs.clear(),
        db.progress.clear(),
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
