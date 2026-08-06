import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db, clearLocalData, getMeta } from "@/db";
import {
  NO_PROGRESS,
  progressKey,
  readProgress,
  recordFinish,
  recordLevel,
  resetProgress,
} from "./progress";
import { GRADED_QUESTIONS, LEVELS, LIGHT_PER_QUESTION, lightBefore } from "./hebrew-dayone/levels";

const GAME = "hebrew-day-one";

beforeEach(async () => {
  await clearLocalData();
});

describe("recording", () => {
  it("starts at nothing", async () => {
    expect(await readProgress(GAME)).toEqual(NO_PROGRESS);
  });

  it("counts a finished level as one done, not zero", async () => {
    // recordLevel takes an INDEX. Finishing level 0 must read as 1 level done,
    // or the first verse would never be remembered at all.
    const p = await recordLevel(GAME, 0);
    expect(p.furthest).toBe(1);
  });

  it("never walks backwards when an earlier level is replayed", async () => {
    await recordLevel(GAME, 3);
    const p = await recordLevel(GAME, 0);
    expect(p.furthest).toBe(4);
  });

  it("is idempotent — the same level twice is the same progress", async () => {
    const once = await recordLevel(GAME, 2);
    const twice = await recordLevel(GAME, 2);
    expect(twice).toEqual(once);
  });

  it("marks a finish and keeps the FIRST completion date", async () => {
    const first = await recordFinish(GAME, LEVELS.length);
    expect(first.completed).toBe(true);
    expect(first.runs).toBe(1);
    expect(first.furthest).toBe(LEVELS.length);

    const second = await recordFinish(GAME, LEVELS.length);
    expect(second.runs).toBe(2);
    expect(second.completedAt).toBe(first.completedAt);
  });

  it("keeps `completed` after a reset, but sends them back to the start", async () => {
    await recordFinish(GAME, LEVELS.length);
    const p = await resetProgress(GAME);
    expect(p.furthest).toBe(0);
    // Replaying must not erase the fact that they finished it once.
    expect(p.completed).toBe(true);
    expect(p.runs).toBe(1);
  });

  it("keeps games apart", async () => {
    await recordLevel(GAME, 2);
    expect((await readProgress("greek-reading-drills")).furthest).toBe(0);
  });

  it("stores under a key the backup merge rule will match", async () => {
    // backup.ts matches /^games:.+:progress$/. If this key shape ever changes,
    // progress silently falls through to the destructive "local wins" default.
    await recordLevel(GAME, 1);
    expect(progressKey(GAME)).toBe("games:hebrew-day-one:progress");
    expect(await getMeta(progressKey(GAME), null)).not.toBeNull();
    expect(/^games:.+:progress$/.test(progressKey(GAME))).toBe(true);
  });

  it("survives a row written by an older build with fewer fields", async () => {
    // meta is untyped, so a value stored before `runs` existed is possible.
    await db.meta.put({ key: progressKey(GAME), value: { furthest: 2 } });
    const p = await readProgress(GAME);
    expect(p).toEqual({ furthest: 2, completed: false, runs: 0 });
  });
});

describe("the resumed sky", () => {
  it("starts at night for a fresh run", () => {
    expect(lightBefore(0)).toBe(0);
  });

  it("puts a resumed player exactly where a clean run would have left them", () => {
    // Resuming at verse N must match the light a straight-through player has
    // after finishing N verses — otherwise the sky disagrees with the rail.
    let running = 0;
    for (let i = 0; i < LEVELS.length; i++) {
      expect(lightBefore(i)).toBeCloseTo(Math.min(1, running), 10);
      running += LEVELS[i]!.drills.filter((d) => d.t !== "order").length * LIGHT_PER_QUESTION;
    }
  });

  it("reaches the same total the live ramp does", () => {
    expect(lightBefore(LEVELS.length)).toBeCloseTo(
      Math.min(1, GRADED_QUESTIONS * LIGHT_PER_QUESTION),
      10,
    );
  });

  it("is already past the ink flip when resuming at the last verse", () => {
    // Resume at verse 5 and the ground is bright, so the ink must already be
    // dark. A resumed run that started with pale text on a bright sky would be
    // unreadable for exactly as long as it took to answer one question.
    expect(lightBefore(LEVELS.length - 1)).toBeGreaterThan(0.72);
  });

  it("never overshoots", () => {
    for (let i = 0; i <= LEVELS.length; i++) {
      expect(lightBefore(i)).toBeLessThanOrEqual(1);
      expect(lightBefore(i)).toBeGreaterThanOrEqual(0);
    }
  });
});
