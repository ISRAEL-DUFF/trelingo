import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db, clearLocalData, getMeta } from "./index";
import {
  adoptServerCards,
  completeUnit,
  ensureCards,
  getCompletedUnitIds,
  getDueCounts,
  getReviewQueue,
  recordReview,
  rebuildCardsFromLogs,
  touchStreak,
} from "./repo";
import { newCard, scheduleCard, type SrsCard } from "@/srs/engine";

/**
 * These cover the two defects found while clicking through the running app:
 *
 *  1. A reinstalled device pulled the server's derived cards and then threw them
 *     away by rebuilding from an empty local log, losing all SRS state.
 *  2. Unsynced local reviews had to survive that adoption without being
 *     double-counted.
 */

beforeEach(async () => {
  await clearLocalData();
  await db.cards.clear();
});

describe("recordReview", () => {
  it("writes an immutable log entry and the derived card together", async () => {
    await recordReview("bara", 2, Date.now());
    expect(await db.reviewLogs.count()).toBe(1);
    const card = await db.cards.get("bara");
    expect(card?.repetitions).toBe(1);
    expect(card?.state).toBe("review");
  });

  it("marks new logs unsynced so the next sync picks them up", async () => {
    await recordReview("bara", 2);
    const log = (await db.reviewLogs.toArray())[0]!;
    expect(log.synced).toBe(0);
    expect(log.deviceId).toBeTruthy();
  });

  it("accumulates history rather than overwriting", async () => {
    const t = Date.now();
    await recordReview("bara", 2, t);
    await recordReview("bara", 0, t + 1000);
    expect(await db.reviewLogs.count()).toBe(2);
    expect((await db.cards.get("bara"))?.intervalDays).toBe(0); // last rating was Again
  });
});

describe("rebuildCardsFromLogs", () => {
  it("reproduces card state from the log alone", async () => {
    const t = Date.now();
    await recordReview("bara", 2, t);
    await recordReview("bara", 3, t + 86400000);
    const before = await db.cards.get("bara");

    await db.cards.clear();
    await rebuildCardsFromLogs();
    expect(await db.cards.get("bara")).toEqual(before);
  });
});

describe("adoptServerCards — the reinstall path", () => {
  it("restores SRS state on a device with no local log at all", async () => {
    // This is the exact failure found in the browser: wipe, sync, no cards.
    const server: SrsCard[] = [
      { ...newCard("bara"), state: "review", repetitions: 3, intervalDays: 8, dueAt: Date.now() + 8e8 },
      { ...newCard("shamar"), state: "lapsed", lapses: 2, intervalDays: 0, dueAt: Date.now() },
    ];
    expect(await db.cards.count()).toBe(0);

    await adoptServerCards(server);

    expect(await db.cards.count()).toBe(2);
    expect((await db.cards.get("bara"))?.intervalDays).toBe(8);
    expect((await db.cards.get("shamar"))?.lapses).toBe(2);
  });

  it("replays unsynced local reviews on top of the server's state", async () => {
    const t = Date.now();
    await recordReview("bara", 2, t); // local only, not yet pushed

    const serverVersion: SrsCard = { ...newCard("bara") }; // server hasn't seen it
    await adoptServerCards([serverVersion]);

    const card = await db.cards.get("bara");
    // The local review must still be reflected, exactly once.
    expect(card?.repetitions).toBe(1);
    expect(card?.intervalDays).toBe(1);
  });

  it("does not double-count a review the server already knows about", async () => {
    const t = Date.now();
    await recordReview("bara", 2, t);
    await db.reviewLogs.toCollection().modify({ synced: 1 }); // server has it now

    // Server's derivation of that same single review.
    const serverCard = scheduleCard(newCard("bara"), 2, t);
    await adoptServerCards([serverCard]);

    const card = await db.cards.get("bara");
    expect(card?.repetitions).toBe(1); // not 2
    expect(card?.intervalDays).toBe(1);
  });

  it("keeps words the server has never seen", async () => {
    await recordReview("offline-only", 2, Date.now());
    await adoptServerCards([]); // server knows nothing
    expect(await db.cards.get("offline-only")).toBeDefined();
  });

  it("is idempotent — syncing twice changes nothing", async () => {
    const server: SrsCard[] = [
      { ...newCard("bara"), state: "review", repetitions: 2, intervalDays: 3 },
    ];
    await adoptServerCards(server);
    const first = await db.cards.get("bara");
    await adoptServerCards(server);
    expect(await db.cards.get("bara")).toEqual(first);
  });
});

describe("completeUnit", () => {
  it("records progress and seeds cards for the unit's vocabulary", async () => {
    await completeUnit("u01", 0.8);
    expect(await getCompletedUnitIds()).toContain("u01");
    expect(await db.cards.count()).toBeGreaterThan(0);
  });

  it("keeps the best score when a unit is replayed", async () => {
    await completeUnit("u01", 0.9);
    await completeUnit("u01", 0.4);
    expect((await db.progress.get("u01"))?.score).toBe(0.9);
  });

  it("does not reset cards for words already being learned", async () => {
    await ensureCards(["bara"]);
    await recordReview("bara", 2);
    const before = await db.cards.get("bara");
    await completeUnit("u01", 1);
    expect(await db.cards.get("bara")).toEqual(before);
  });
});

describe("streak", () => {
  it("increments at most once per day, however many lessons are finished", async () => {
    const day = new Date(2026, 5, 1, 10);
    await touchStreak(day);
    await touchStreak(new Date(2026, 5, 1, 20));
    expect((await getMeta<{ current: number }>("streak", { current: 0 })).current).toBe(1);
  });

  it("continues across consecutive days", async () => {
    await touchStreak(new Date(2026, 5, 1, 10));
    await touchStreak(new Date(2026, 5, 2, 10));
    const s = await getMeta<{ current: number; longest: number }>("streak", { current: 0, longest: 0 });
    expect(s.current).toBe(2);
    expect(s.longest).toBe(2);
  });

  it("spends a freeze to cover a missed day", async () => {
    await touchStreak(new Date(2026, 5, 1, 10));
    await touchStreak(new Date(2026, 5, 4, 10)); // two days missed
    const s = await getMeta<{ current: number; freezesAvailable: number }>("streak", {
      current: 0,
      freezesAvailable: 0,
    });
    expect(s.current).toBe(2);
    expect(s.freezesAvailable).toBe(1); // one consumed
  });

  it("resets once the freezes run out", async () => {
    await touchStreak(new Date(2026, 5, 1));
    await touchStreak(new Date(2026, 5, 5)); // freeze 1
    await touchStreak(new Date(2026, 5, 9)); // freeze 2
    await touchStreak(new Date(2026, 5, 13)); // none left
    const s = await getMeta<{ current: number; longest: number }>("streak", { current: 0, longest: 0 });
    expect(s.current).toBe(1);
    expect(s.longest).toBe(3);
  });
});

describe("review queue", () => {
  it("is a snapshot that survives rating every card in it", async () => {
    await ensureCards(["a", "b", "c"]);
    const queue = await getReviewQueue();
    expect(queue).toHaveLength(3);
    for (const c of queue) await recordReview(c.wordId, 2);
    expect(queue).toHaveLength(3); // unchanged by the ratings
  });

  it("drops cards that are no longer due on the next build", async () => {
    await ensureCards(["a"]);
    await recordReview("a", 2);
    expect(await getReviewQueue()).toHaveLength(0);
  });

  it("counts new and due separately", async () => {
    await ensureCards(["a", "b"]);
    await recordReview("a", 0); // stays due today
    const counts = await getDueCounts();
    expect(counts.new).toBe(1);
    expect(counts.due).toBe(1);
  });
});

describe("clearLocalData", () => {
  it("wipes learning data but keeps the device identity", async () => {
    await recordReview("bara", 2);
    const deviceId = await getMeta<string | null>("deviceId", null);
    await clearLocalData();
    expect(await db.reviewLogs.count()).toBe(0);
    expect(await db.cards.count()).toBe(0);
    expect(await getMeta<string | null>("deviceId", null)).toBe(deviceId);
  });
});
