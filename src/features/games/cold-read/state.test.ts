import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db, clearLocalData, getMeta } from "@/db";
import { newCard } from "@/srs/engine";
import {
  COLD_READ_KEY,
  clearSeen,
  enoughToPlay,
  knownWordIds,
  readState,
  recordRead,
  studiedCourses,
} from "./state";
import { MIN_KNOWN_WORDS } from "./select";

beforeEach(async () => {
  await clearLocalData();
});

/** A card in whatever state the test needs, under a given course. */
async function card(
  courseId: string,
  wordId: string,
  over: Partial<ReturnType<typeof newCard>> = {},
) {
  await db.srsCards.put({ ...newCard(wordId), ...over, courseId } as never);
}

describe("what counts as known", () => {
  it("counts a review card", async () => {
    await card("jonah", "h413", { state: "review" });
    expect([...(await knownWordIds())]).toEqual(["h413"]);
  });

  it("does not count a card still in learning", async () => {
    await card("jonah", "h413", { state: "learning" });
    expect((await knownWordIds()).size).toBe(0);
  });

  it("does not count a leech, however good its card looks", async () => {
    // Forgotten eight times. Whatever the interval says, that is not a word you
    // read cold.
    await card("jonah", "h413", { state: "review", isLeech: true, intervalDays: 90 });
    expect((await knownWordIds()).size).toBe(0);
  });

  it("counts a card that is due, because due means needs refreshing not forgotten", async () => {
    await card("jonah", "h413", { state: "review", dueAt: Date.now() - 86_400_000 });
    expect((await knownWordIds()).has("h413")).toBe(true);
  });

  it("collapses the same word across courses into one id", async () => {
    /*
     * Cards are keyed [courseId+wordId], so h413 learned in Jonah and met again
     * in Genesis is two rows. The game asks "can you read this word", which is
     * one question, so it must be one answer.
     */
    await card("jonah", "h413", { state: "review" });
    await card("genesis", "h413", { state: "review" });
    await card("ruth", "h3068", { state: "review" });
    const known = await knownWordIds();
    expect(known.size).toBe(2);
    expect([...known].sort()).toEqual(["h3068", "h413"]);
  });

  it("holds the cold-start line", async () => {
    for (let i = 0; i < MIN_KNOWN_WORDS - 1; i++) await card("jonah", `h${i}`, { state: "review" });
    expect(enoughToPlay(await knownWordIds())).toBe(false);
    await card("jonah", "h999", { state: "review" });
    expect(enoughToPlay(await knownWordIds())).toBe(true);
  });
});

describe("which books count as opened", () => {
  it("is completed units, not cards", async () => {
    // A learner who met a Genesis word inside a cross-track review session has
    // still never read Genesis, and the headline should still say so.
    await card("genesis", "h430", { state: "review" });
    expect((await studiedCourses()).size).toBe(0);

    await db.unitProgress.put({
      courseId: "genesis",
      unitId: "gen001",
      completedAt: Date.now(),
      score: 100,
      synced: 0,
    } as never);
    expect([...(await studiedCourses())]).toEqual(["genesis"]);
  });
});

describe("the record", () => {
  it("starts empty and survives a row written by an older build", async () => {
    expect(await readState()).toEqual({ reads: 0, best: 0, seen: [] });
    await db.meta.put({ key: COLD_READ_KEY, value: { reads: 3 } });
    expect(await readState()).toEqual({ reads: 3, best: 0, seen: [] });
  });

  it("counts reads and remembers what was shown", async () => {
    await recordRead("gen-1-1", 0.8);
    const s = await recordRead("gen-1-2", 0.6);
    expect(s.reads).toBe(2);
    expect(s.seen).toEqual(["gen-1-1", "gen-1-2"]);
  });

  it("keeps the best score, never the latest", async () => {
    await recordRead("gen-1-1", 0.9);
    const s = await recordRead("gen-1-2", 0.4);
    expect(s.best).toBe(0.9);
  });

  it("does not list the same verse twice", async () => {
    await recordRead("gen-1-1", 0.8);
    const s = await recordRead("gen-1-1", 0.8);
    expect(s.seen).toEqual(["gen-1-1"]);
    expect(s.reads).toBe(2);
  });

  it("clears seen without losing the counters", async () => {
    await recordRead("gen-1-1", 0.9);
    const s = await clearSeen();
    expect(s.seen).toEqual([]);
    expect(s.reads).toBe(1);
    expect(s.best).toBe(0.9);
  });

  it("stores under a key backup.ts will carry", async () => {
    // meta is exported whole, so this rides export/import with no exporter
    // change — but only while the key actually exists in that table.
    await recordRead("gen-1-1", 0.5);
    expect(await getMeta(COLD_READ_KEY, null)).not.toBeNull();
  });
});
