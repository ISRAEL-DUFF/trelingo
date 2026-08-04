import "fake-indexeddb/auto";
import { describe, it, expect } from "vitest";
import { createDb } from "./index";

/**
 * The stored shape, at a single schema version.
 *
 * This file replaces a migration suite that tested five upgrades — course
 * scoping, a primary-key rebuild, a settings rename, a track-id rename — none
 * of which had ever run against a real user's data, because there are no users.
 * Testing upgrades from shapes that never shipped is ceremony.
 *
 * What survives is what those tests were really protecting: that the compound
 * keys hold, that two tracks can carry the same word id, and that global state
 * stays global. Those are properties of the schema, not of any migration.
 *
 * When anyone is actually storing data this becomes append-only again, and a
 * seeded upgrade test comes back with the first `.version(2)`.
 */

const fresh = () => createDb(`t-${Math.random()}`);

describe("schema", () => {
  it("opens at version 1 with no upgrade path", async () => {
    const db = fresh();
    await db.open();
    expect(db.verno).toBe(1);
    db.close();
  });

  it("keys cards by track AND word, so one word can live in several tracks", async () => {
    const db = fresh();
    const card = {
      ease: 2.5, intervalDays: 1, repetitions: 1, lapses: 0,
      state: "review" as const, dueAt: 5, lastReviewedAt: 4, isLeech: false,
    };
    // λόγος is taught in both Greek tracks. Keyed by wordId alone, the second
    // write would silently overwrite the first.
    await db.srsCards.bulkPut([
      { courseId: "koine-gospels", wordId: "logos", ...card },
      { courseId: "attic-prose", wordId: "logos", ...card, intervalDays: 9 },
    ]);
    const rows = await db.srsCards.where("wordId").equals("logos").toArray();
    expect(rows).toHaveLength(2);
    expect(await db.srsCards.get(["attic-prose", "logos"])).toMatchObject({ intervalDays: 9 });
    db.close();
  });

  it("keys unit progress the same way", async () => {
    const db = fresh();
    await db.unitProgress.bulkPut([
      { courseId: "shoresh", unitId: "u01", completedAt: 1, score: 0.9, synced: 1 },
      { courseId: "jonah", unitId: "u01", completedAt: 2, score: 0.8, synced: 0 },
    ]);
    expect(await db.unitProgress.count()).toBe(2);
    db.close();
  });

  it("can read every row of one track without touching another", async () => {
    const db = fresh();
    const card = {
      ease: 2.5, intervalDays: 1, repetitions: 0, lapses: 0,
      state: "new" as const, dueAt: 0, lastReviewedAt: null, isLeech: false,
    };
    await db.srsCards.bulkPut([
      { courseId: "shoresh", wordId: "bara", ...card },
      { courseId: "jonah", wordId: "h430", ...card },
    ]);
    const jonah = await db.srsCards.where("courseId").equals("jonah").toArray();
    expect(jonah.map((c) => c.wordId)).toEqual(["h430"]);
    db.close();
  });

  it("keeps streak and XP global rather than per track (D2)", async () => {
    const db = fresh();
    await db.meta.put({ key: "xp", value: 120 });
    const row = await db.meta.get("xp");
    // No courseId anywhere near it: a streak measures showing up, which is one
    // habit across every track.
    expect(row).toEqual({ key: "xp", value: 120 });
    db.close();
  });
});
