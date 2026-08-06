import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db, clearLocalData, getMeta, setMeta, getDeviceId, DEFAULT_SETTINGS } from "./index";
import { completeUnit, getCard, recordReview, touchStreak } from "./repo";
import { exportBackup, importBackup, BACKUP_VERSION, type Backup } from "./backup";

/**
 * The rules these tests exist to hold:
 *
 *  1. Import MERGES, never destroys. A restore onto a device that already has
 *     progress must not lose either side.
 *  2. Import is IDEMPOTENT. Running the same file twice must change nothing the
 *     second time — which is why every merge rule is max/union/earliest and
 *     never a sum.
 *  3. The review log wins. Card state in the file is a convenience for words
 *     with no reviews yet; wherever a log exists, the card is re-derived from
 *     it (spec §5.2).
 */

beforeEach(async () => {
  await clearLocalData();
  await db.srsCards.clear();
  await db.meta.clear();
});

describe("exportBackup", () => {
  it("captures reviews, progress and meta", async () => {
    await recordReview("bara", 2, 1_000);
    await completeUnit("u1", 0.9);
    await setMeta("xp", 120);

    const backup = await exportBackup();

    expect(backup.app).toBe("trelingo");
    expect(backup.backupVersion).toBe(BACKUP_VERSION);
    expect(backup.reviewLogs).toHaveLength(1);
    expect(backup.reviewLogs[0]!.wordId).toBe("bara");
    expect(backup.progress.map((p) => p.unitId)).toContain("u1");
    expect(backup.meta.xp).toBe(120);
  });

  it("omits the device id, which identifies the install and not the learner", async () => {
    await getDeviceId();
    const backup = await exportBackup();
    expect(await getMeta("deviceId", null)).not.toBeNull();
    expect(backup.meta).not.toHaveProperty("deviceId");
  });

  it("carries the whole meta table, so placement unlocks are not silently dropped", async () => {
    await setMeta("placementUnlocked:jonah", ["jon01", "jon02"]);
    const backup = await exportBackup();
    expect(backup.meta["placementUnlocked:jonah"]).toEqual(["jon01", "jon02"]);
  });
});

describe("importBackup", () => {
  it("restores a review history onto an empty device and re-derives the card", async () => {
    await recordReview("bara", 2, 1_000);
    await recordReview("bara", 2, 90_000_000);
    const expected = await getCard("bara");
    const backup = await exportBackup();

    await clearLocalData();
    await db.srsCards.clear();
    expect(await getCard("bara")).toBeUndefined();

    const summary = await importBackup(backup);

    expect(summary.reviewLogs).toBe(2);
    const restored = await getCard("bara");
    expect(restored).toBeDefined();
    // Derived, not copied: every scheduling field agrees with the original.
    expect(restored!.repetitions).toBe(expected!.repetitions);
    expect(restored!.intervalDays).toBe(expected!.intervalDays);
    expect(restored!.ease).toBeCloseTo(expected!.ease, 10);
    expect(restored!.dueAt).toBe(expected!.dueAt);
  });

  it("is idempotent — importing twice changes nothing", async () => {
    await recordReview("bara", 2, 1_000);
    await completeUnit("u1", 0.8);
    await setMeta("xp", 50);
    const backup = await exportBackup();

    await importBackup(backup);
    const afterOnce = {
      logs: await db.reviewLogs.count(),
      progress: await db.unitProgress.count(),
      card: await getCard("bara"),
      xp: await getMeta("xp", 0),
    };

    const second = await importBackup(backup);

    expect(second.reviewLogs).toBe(0); // nothing new accepted
    expect(await db.reviewLogs.count()).toBe(afterOnce.logs);
    expect(await db.unitProgress.count()).toBe(afterOnce.progress);
    expect(await getMeta("xp", 0)).toBe(afterOnce.xp);
    expect(await getCard("bara")).toEqual(afterOnce.card);
  });

  it("merges two devices' reviews rather than letting either win", async () => {
    // Device A
    await recordReview("bara", 2, 1_000);
    const fromA = await exportBackup();

    // Device B, independently
    await clearLocalData();
    await db.srsCards.clear();
    await recordReview("shamar", 2, 2_000);

    await importBackup(fromA);

    expect(await db.reviewLogs.count()).toBe(2);
    expect(await getCard("bara")).toBeDefined();
    expect(await getCard("shamar")).toBeDefined();
  });

  it("re-derives a card from the union of both devices' events", async () => {
    await recordReview("bara", 2, 1_000);
    const fromA = await exportBackup();

    await clearLocalData();
    await db.srsCards.clear();
    await recordReview("bara", 2, 90_000_000);
    expect((await getCard("bara"))!.repetitions).toBe(1);

    await importBackup(fromA);

    // Two events now, so the card must reflect both — not just the local one.
    expect((await getCard("bara"))!.repetitions).toBe(2);
  });

  it("keeps a card the file carries for a word with no reviews yet", async () => {
    await completeUnit("u1", 1);
    await db.srsCards.put({ courseId: "shoresh", ...newishCard("elohim") });
    const backup = await exportBackup();

    await clearLocalData();
    await db.srsCards.clear();
    await importBackup(backup);

    const card = await getCard("elohim");
    expect(card).toBeDefined();
    expect(card!.state).toBe("new");
  });

  it("takes the earliest completion and the best score for a unit", async () => {
    // Written directly: completeUnit stamps Date.now(), and this is about which
    // of two timestamps survives a merge.
    await db.unitProgress.put({
      courseId: "shoresh",
      unitId: "u1",
      completedAt: 5_000,
      score: 0.5,
      synced: 0,
    });
    const backup = await exportBackup();

    await clearLocalData();
    await db.srsCards.clear();
    await db.unitProgress.put({
      courseId: "shoresh",
      unitId: "u1",
      completedAt: 9_000,
      score: 0.9,
      synced: 0,
    });

    await importBackup(backup);

    const row = await db.unitProgress.get(["shoresh", "u1"]);
    expect(row!.completedAt).toBe(5_000);
    expect(row!.score).toBe(0.9);
  });

  it("takes the higher xp rather than summing, so a re-import cannot inflate it", async () => {
    await setMeta("xp", 500);
    const backup = await exportBackup();
    await setMeta("xp", 120);

    await importBackup(backup);
    expect(await getMeta("xp", 0)).toBe(500);

    await importBackup(backup);
    expect(await getMeta("xp", 0)).toBe(500);
  });

  it("does not overwrite a longer local streak with a shorter one from the file", async () => {
    await touchStreak();
    await setMeta("streak", {
      current: 2,
      longest: 3,
      freezesAvailable: 1,
      lastActiveDate: "2026-01-01",
    });
    const backup = await exportBackup();

    await setMeta("streak", {
      current: 9,
      longest: 40,
      freezesAvailable: 0,
      lastActiveDate: "2026-06-01",
    });

    await importBackup(backup);

    const streak = await getMeta<{ current: number; longest: number; lastActiveDate: string }>(
      "streak",
      { current: 0, longest: 0, lastActiveDate: "" },
    );
    expect(streak.longest).toBe(40);
    expect(streak.current).toBe(9); // the more recently active side keeps the run
    expect(streak.lastActiveDate).toBe("2026-06-01");
  });

  it("unions placement unlocks across devices", async () => {
    await setMeta("placementUnlocked:jonah", ["jon01", "jon02"]);
    const backup = await exportBackup();
    await setMeta("placementUnlocked:jonah", ["jon02", "jon03"]);

    await importBackup(backup);

    expect((await getMeta<string[]>("placementUnlocked:jonah", [])).sort()).toEqual([
      "jon01",
      "jon02",
      "jon03",
    ]);
  });

  it("marks imported reviews unsynced so a later account push cannot miss them", async () => {
    await recordReview("bara", 2, 1_000);
    await db.reviewLogs.toCollection().modify({ synced: 1 });
    const backup = await exportBackup();

    await clearLocalData();
    await db.srsCards.clear();
    await importBackup(backup);

    const logs = await db.reviewLogs.toArray();
    expect(logs.every((l) => l.synced === 0)).toBe(true);
  });

  it("restores settings", async () => {
    await db.settings.put({ ...DEFAULT_SETTINGS, dailyGoal: 45, soundEnabled: false });
    const backup = await exportBackup();

    await clearLocalData();
    await importBackup(backup);

    const s = await db.settings.get("settings");
    expect(s!.dailyGoal).toBe(45);
    expect(s!.soundEnabled).toBe(false);
  });
});

describe("importBackup rejects what it cannot trust", () => {
  const valid = (): Backup => ({
    app: "trelingo",
    backupVersion: BACKUP_VERSION,
    exportedAt: Date.now(),
    reviewLogs: [],
    cards: [],
    progress: [],
    decks: [],
    assessments: [],
    settings: null,
    meta: {},
  });

  it("refuses a file that is not a Trelingo backup", async () => {
    await expect(
      importBackup({ ...valid(), app: "something-else" } as unknown as Backup),
    ).rejects.toThrow(
      /not a Trelingo backup/i,
    );
  });

  it("refuses a backup from a newer version it cannot understand", async () => {
    await expect(
      importBackup({ ...valid(), backupVersion: BACKUP_VERSION + 1 } as Backup),
    ).rejects.toThrow(/newer version/i);
  });

  it("refuses arbitrary JSON", async () => {
    await expect(importBackup({ hello: "world" } as unknown as Backup)).rejects.toThrow();
  });

  it("refuses a file whose rows are the wrong shape", async () => {
    const bad = valid();
    (bad.reviewLogs as unknown[]) = [{ id: "x" }];
    await expect(importBackup(bad)).rejects.toThrow(/review log/i);
  });

  it("leaves existing data untouched when it rejects", async () => {
    await recordReview("bara", 2, 1_000);
    await expect(importBackup({ hello: "world" } as unknown as Backup)).rejects.toThrow();
    expect(await db.reviewLogs.count()).toBe(1);
    expect(await getCard("bara")).toBeDefined();
  });
});

/** A card as `ensureCards` would create it: introduced, never reviewed. */
function newishCard(wordId: string) {
  return {
    wordId,
    ease: 2.5,
    intervalDays: 0,
    repetitions: 0,
    lapses: 0,
    state: "new" as const,
    dueAt: 0,
    lastReviewedAt: null,
    isLeech: false,
  };
}

describe("game progress", () => {
  const KEY = "games:hebrew-day-one:progress";

  it("rides export/import without the exporter knowing games exist", async () => {
    await setMeta(KEY, { furthest: 3, completed: false, runs: 0 });
    const file = await exportBackup();
    expect(file.meta[KEY]).toEqual({ furthest: 3, completed: false, runs: 0 });

    await clearLocalData();
    await importBackup(file);
    expect(await getMeta(KEY, null)).toEqual({ furthest: 3, completed: false, runs: 0 });
  });

  it("NEVER discards a finished run for a local one that is behind", async () => {
    /*
     * The bug this rule exists for. The fallback merge is "local wins if
     * present" — a device on verse 2 has a local value, so without the rule
     * the import keeps verse 2 and the finish is gone. Rule 1 says merge, never
     * destroy, and this is the case where the conservative default destroys.
     */
    await setMeta(KEY, { furthest: 5, completed: true, completedAt: 1000, runs: 2 });
    const finished = await exportBackup();

    await clearLocalData();
    await setMeta(KEY, { furthest: 2, completed: false, runs: 0 });
    await importBackup(finished);

    expect(await getMeta(KEY, null)).toEqual({
      furthest: 5,
      completed: true,
      completedAt: 1000,
      runs: 2,
    });
  });

  it("does not walk a local player back when the FILE is the stale side", async () => {
    await setMeta(KEY, { furthest: 1, completed: false, runs: 0 });
    const stale = await exportBackup();

    await clearLocalData();
    await setMeta(KEY, { furthest: 4, completed: false, runs: 0 });
    await importBackup(stale);

    expect(await getMeta<{ furthest: number }>(KEY, { furthest: 0 })).toMatchObject({ furthest: 4 });
  });

  it("keeps the earliest completion date, whichever side holds it", async () => {
    await setMeta(KEY, { furthest: 5, completed: true, completedAt: 500, runs: 1 });
    const early = await exportBackup();

    await clearLocalData();
    await setMeta(KEY, { furthest: 5, completed: true, completedAt: 9000, runs: 1 });
    await importBackup(early);

    expect(await getMeta<{ completedAt: number }>(KEY, { completedAt: 0 })).toMatchObject({
      completedAt: 500,
    });
  });

  it("is idempotent — importing twice does not double the run count", async () => {
    await setMeta(KEY, { furthest: 5, completed: true, completedAt: 1, runs: 3 });
    const file = await exportBackup();

    await clearLocalData();
    await setMeta(KEY, { furthest: 5, completed: true, completedAt: 1, runs: 3 });
    await importBackup(file);
    const once = await getMeta(KEY, null);
    await importBackup(file);

    expect(await getMeta(KEY, null)).toEqual(once);
  });

  it("restores progress onto a device that has never played it", async () => {
    await setMeta(KEY, { furthest: 5, completed: true, completedAt: 42, runs: 1 });
    const file = await exportBackup();

    await clearLocalData();
    await importBackup(file);

    expect(await getMeta(KEY, null)).toEqual({
      furthest: 5,
      completed: true,
      completedAt: 42,
      runs: 1,
    });
  });
});
