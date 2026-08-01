import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db, clearLocalData } from "./index";
import {
  ALL_COURSES,
  completeUnit,
  ensureCards,
  getCard,
  getCompletedUnitIds,
  getDueCounts,
  getProgress,
  getReviewQueue,
  recordReview,
  touchStreak,
  getStreak,
} from "./repo";
import { getActiveCourseId, setActiveCourse } from "@/content/course";

/**
 * Phase 4 exit criteria: a learner can hold progress in more than one course
 * simultaneously without interference, and the streak survives a session in any
 * one of them (D2).
 *
 * The collision these guard against is concrete: `logos` exists in both Greek
 * courses, and under the pre-v2 `wordId`-only key the second write silently
 * overwrote the first.
 */

const HE = "hebrew-biblical";
const KOINE = "greek-koine";

beforeEach(async () => {
  setActiveCourse(HE);
  await clearLocalData();
  await db.srsCards.clear();
});

describe("course isolation", () => {
  it("keeps identically-named cards in different courses apart", async () => {
    await recordReview("logos", 2, Date.now(), KOINE);
    await recordReview("logos", 0, Date.now(), "greek-attic");

    const koine = await getCard("logos", KOINE);
    const attic = await getCard("logos", "greek-attic");

    expect(koine!.repetitions).toBe(1); // rated Good
    expect(attic!.repetitions).toBe(0); // rated Again
    expect(await db.srsCards.count()).toBe(2);
  });

  it("scopes the review queue to the active course", async () => {
    await ensureCards(["bara", "shamar"], HE);
    await ensureCards(["logos"], KOINE);

    expect((await getReviewQueue(Date.now(), 20, HE)).map((c) => c.wordId).sort()).toEqual([
      "bara",
      "shamar",
    ]);
    expect((await getReviewQueue(Date.now(), 20, KOINE)).map((c) => c.wordId)).toEqual(["logos"]);
  });

  it("merges every course only when explicitly asked (D4)", async () => {
    await ensureCards(["bara"], HE);
    await ensureCards(["logos"], KOINE);

    expect(await getReviewQueue(Date.now(), 20, HE)).toHaveLength(1);
    expect(await getReviewQueue(Date.now(), 20, ALL_COURSES)).toHaveLength(2);
  });

  it("scopes due counts per course", async () => {
    await ensureCards(["bara", "shamar", "elohim"], HE);
    await ensureCards(["logos"], KOINE);

    expect((await getDueCounts(Date.now(), HE)).new).toBe(3);
    expect((await getDueCounts(Date.now(), KOINE)).new).toBe(1);
    expect((await getDueCounts(Date.now(), ALL_COURSES)).new).toBe(4);
  });

  it("scopes unit progress, so finishing a Hebrew unit does not advance Greek", async () => {
    await completeUnit("u01", 0.9, HE);

    expect(await getCompletedUnitIds(HE)).toContain("u01");
    expect(await getCompletedUnitIds(KOINE)).toEqual([]);
    expect(await getProgress(ALL_COURSES)).toHaveLength(1);
  });

  it("lets the same unit id exist in two courses without collision", async () => {
    await completeUnit("u01", 0.9, HE);
    await completeUnit("u01", 0.4, KOINE);

    expect(await getProgress(ALL_COURSES)).toHaveLength(2);
    expect((await getProgress(HE))[0]!.score).toBe(0.9);
    expect((await getProgress(KOINE))[0]!.score).toBe(0.4);
  });

  it("keeps review logs attributed to their course", async () => {
    await recordReview("bara", 2, Date.now(), HE);
    await recordReview("logos", 2, Date.now(), KOINE);

    const logs = await db.reviewLogs.toArray();
    expect(logs).toHaveLength(2);
    expect(logs.find((l) => l.wordId === "bara")!.courseId).toBe(HE);
    expect(logs.find((l) => l.wordId === "logos")!.courseId).toBe(KOINE);
  });
});

describe("the active course drives the defaults", () => {
  it("records into whichever course is active", async () => {
    setActiveCourse(KOINE);
    expect(getActiveCourseId()).toBe(KOINE);
    await recordReview("logos", 2);

    expect(await getCard("logos", KOINE)).toBeDefined();
    expect(await getCard("logos", HE)).toBeUndefined();
  });

  it("switching course switches the queue without losing the other", async () => {
    setActiveCourse(HE);
    await ensureCards(["bara"]);
    setActiveCourse(KOINE);
    await ensureCards(["logos"]);

    expect((await getReviewQueue()).map((c) => c.wordId)).toEqual(["logos"]);
    setActiveCourse(HE);
    expect((await getReviewQueue()).map((c) => c.wordId)).toEqual(["bara"]);
  });

  it("rejects an unknown course rather than silently writing to the default", async () => {
    expect(() => setActiveCourse("nope" as never)).toThrow();
  });
});

describe("streak is global across courses (D2)", () => {
  it("counts a session in any course toward one streak", async () => {
    const day1 = new Date(2026, 5, 1, 10);
    const day2 = new Date(2026, 5, 2, 10);

    setActiveCourse(HE);
    await touchStreak(day1);
    // Studying Greek the next day continues the same streak.
    setActiveCourse(KOINE);
    await touchStreak(day2);

    const streak = await getStreak();
    expect(streak.current).toBe(2);
    expect(streak.longest).toBe(2);
  });

  it("does not double-count two courses studied on the same day", async () => {
    const day = new Date(2026, 5, 1, 10);
    setActiveCourse(HE);
    await touchStreak(day);
    setActiveCourse(KOINE);
    await touchStreak(new Date(2026, 5, 1, 20));

    expect((await getStreak()).current).toBe(1);
  });
});
