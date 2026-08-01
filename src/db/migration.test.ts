import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import Dexie from "dexie";
import { createDb } from "./index";

/**
 * v1 → v2 migration.
 *
 * This is the only change in the project that can destroy a learner's history,
 * so it is tested against a **populated** v1 database. An upgrade that has only
 * ever run against an empty database has not been tested — the failure mode is
 * silent data loss for existing users, discovered after release.
 *
 * v1 keyed cards by `wordId` alone. With more than one course that collides:
 * Attic λόγος and Koine λόγος are different words with the same id. v2 scopes
 * every row by course and backfills existing rows to hebrew-biblical, which is
 * what they are by definition — it was the only course that ever existed.
 */

const V1_SCHEMA = {
  cards: "wordId, state, dueAt, isLeech",
  reviewLogs: "id, wordId, reviewedAt, synced",
  progress: "unitId, completedAt, synced",
  decks: "id, createdAt",
  assessments: "id, createdAt, kind",
  settings: "key",
  meta: "key",
};

/** A v1 database as it existed on a real learner's device. */
async function seedV1(name: string) {
  const v1 = new Dexie(name);
  v1.version(1).stores(V1_SCHEMA);
  await v1.open();

  await v1.table("cards").bulkPut([
    { wordId: "bara", ease: 2.5, intervalDays: 8, repetitions: 3, lapses: 0, state: "review", dueAt: 1e12, lastReviewedAt: 9e11, isLeech: false },
    { wordId: "shamar", ease: 1.9, intervalDays: 0, repetitions: 0, lapses: 9, state: "lapsed", dueAt: 1, lastReviewedAt: 9e11, isLeech: true },
    { wordId: "elohim", ease: 2.5, intervalDays: 0, repetitions: 0, lapses: 0, state: "new", dueAt: 0, lastReviewedAt: null, isLeech: false },
  ]);
  await v1.table("reviewLogs").bulkPut([
    { id: "r1", wordId: "bara", rating: 2, reviewedAt: 9e11, deviceId: "dev-1", synced: 1 },
    { id: "r2", wordId: "shamar", rating: 0, reviewedAt: 9e11 + 1, deviceId: "dev-1", synced: 0 },
  ]);
  await v1.table("progress").bulkPut([
    { unitId: "u01", completedAt: 9e11, score: 0.9, synced: 1 },
    { unitId: "u02", completedAt: 9e11, score: 0.5, synced: 0 },
  ]);
  await v1.table("decks").bulkPut([{ id: "d1", name: "Roots", wordIds: ["bara"], createdAt: 9e11 }]);
  await v1.table("meta").bulkPut([
    { key: "xp", value: 1234 },
    { key: "deviceId", value: "dev-1" },
    { key: "streak", value: { current: 5, longest: 9, freezesAvailable: 1, lastActiveDate: "2026-07-30" } },
  ]);
  await v1.table("settings").put({
    key: "settings", themePref: "dark", niqqudPref: "fading",
    pronunciationPref: "sephardic", dailyGoal: 20, soundEnabled: true,
    notifications: { enabled: false, quietHoursStart: 22, quietHoursEnd: 8, streakReminders: true },
  });

  v1.close();
}

let dbName = "";
beforeEach(() => {
  dbName = `shoresh-migration-${Math.random().toString(36).slice(2)}`;
});

describe("v1 → v2 upgrade with existing data", () => {
  it("preserves every card and backfills courseId", async () => {
    await seedV1(dbName);

    const db = createDb(dbName);
    await db.open();
    const cards = await db.srsCards.toArray();
    db.close();

    expect(cards).toHaveLength(3);
    expect(cards.every((c) => c.courseId === "hebrew-biblical")).toBe(true);
    expect(new Set(cards.map((c) => c.wordId))).toEqual(new Set(["bara", "shamar", "elohim"]));
  });

  it("preserves SRS scheduling state exactly — not just row count", async () => {
    await seedV1(dbName);

    const db = createDb(dbName);
    await db.open();
    const bara = (await db.srsCards.toArray()).find((c) => c.wordId === "bara")!;
    const shamar = (await db.srsCards.toArray()).find((c) => c.wordId === "shamar")!;
    db.close();

    // Losing ease or interval would silently reset a learner's schedule.
    expect(bara.ease).toBe(2.5);
    expect(bara.intervalDays).toBe(8);
    expect(bara.repetitions).toBe(3);
    expect(bara.dueAt).toBe(1e12);
    expect(shamar.lapses).toBe(9);
    expect(shamar.isLeech).toBe(true);
    expect(shamar.state).toBe("lapsed");
  });

  it("preserves the review log, including unsynced entries", async () => {
    await seedV1(dbName);

    const db = createDb(dbName);
    await db.open();
    const logs = await db.reviewLogs.toArray();
    db.close();

    // The log is the source of truth (spec §5.2) — losing it loses everything.
    expect(logs).toHaveLength(2);
    expect(logs.every((l) => l.courseId === "hebrew-biblical")).toBe(true);
    expect(logs.find((l) => l.id === "r2")!.synced).toBe(0);
  });

  it("preserves progress and scopes it by course", async () => {
    await seedV1(dbName);

    const db = createDb(dbName);
    await db.open();
    const progress = await db.unitProgress.toArray();
    db.close();

    expect(progress).toHaveLength(2);
    expect(progress.every((p) => p.courseId === "hebrew-biblical")).toBe(true);
    expect(progress.find((p) => p.unitId === "u01")!.score).toBe(0.9);
  });

  it("keeps XP and streak global rather than scoping them (D2)", async () => {
    await seedV1(dbName);

    const db = createDb(dbName);
    await db.open();
    const xp = await db.meta.get("xp");
    const streak = await db.meta.get("streak");
    const deviceId = await db.meta.get("deviceId");
    db.close();

    expect(xp?.value).toBe(1234);
    expect((streak?.value as { current: number }).current).toBe(5);
    expect(deviceId?.value).toBe("dev-1");
  });

  it("preserves decks and settings", async () => {
    await seedV1(dbName);

    const db = createDb(dbName);
    await db.open();
    const decks = await db.decks.toArray();
    const settings = await db.settings.get("settings");
    db.close();

    expect(decks).toHaveLength(1);
    expect(decks[0]!.courseId).toBe("hebrew-biblical");
    expect(settings?.themePref).toBe("dark");
  });

  it("scopes cards by course, so two courses can hold the same word id", async () => {
    await seedV1(dbName);
    const db = createDb(dbName);
    await db.open();

    // "logos" will exist in both Greek courses. Under v1's wordId-only key the
    // second write would have overwritten the first.
    await db.srsCards.bulkPut([
      { courseId: "greek-koine", wordId: "logos", ease: 2.5, intervalDays: 1, repetitions: 1, lapses: 0, state: "review", dueAt: 5, lastReviewedAt: 4, isLeech: false },
      { courseId: "greek-attic", wordId: "logos", ease: 2.5, intervalDays: 3, repetitions: 2, lapses: 0, state: "review", dueAt: 6, lastReviewedAt: 4, isLeech: false },
    ]);
    const logos = (await db.srsCards.toArray()).filter((c) => c.wordId === "logos");
    db.close();

    expect(logos).toHaveLength(2);
    expect(new Set(logos.map((c) => c.courseId))).toEqual(new Set(["greek-koine", "greek-attic"]));
  });

  it("is idempotent — reopening an already-migrated database changes nothing", async () => {
    await seedV1(dbName);

    const first = createDb(dbName);
    await first.open();
    const before = await first.srsCards.toArray();
    first.close();

    const second = createDb(dbName);
    await second.open();
    const after = await second.srsCards.toArray();
    second.close();

    expect(after).toEqual(before);
  });

  it("upgrades an empty v1 database without error", async () => {
    const empty = new Dexie(dbName);
    empty.version(1).stores(V1_SCHEMA);
    await empty.open();
    empty.close();

    const db = createDb(dbName);
    await db.open();
    expect(await db.srsCards.count()).toBe(0);
    db.close();
  });

  it("creates a fresh database at v2 with no upgrade path needed", async () => {
    const db = createDb(dbName);
    await db.open();
    await db.srsCards.put({
      courseId: "hebrew-biblical", wordId: "x", ease: 2.5, intervalDays: 0,
      repetitions: 0, lapses: 0, state: "new", dueAt: 0, lastReviewedAt: null, isLeech: false,
    });
    expect(await db.srsCards.count()).toBe(1);
    db.close();
  });
});
