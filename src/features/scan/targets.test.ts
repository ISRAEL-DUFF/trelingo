import { describe, it, expect, beforeEach } from "vitest";
import { scanTargets, scanScope, canScan, pickTarget, hitsIn } from "./targets";
import { contentFor } from "@/content";
import { setActiveCourse } from "@/content/course";
import { scriptOf } from "@/content/course";

/**
 * Scan-and-find target derivation.
 *
 * The two properties that decide whether this is a reading exercise or a
 * spot-the-shape puzzle: the prompt must be a MEANING, and the answers must not
 * look alike. Everything here defends one or the other.
 */

const jonah = () => {
  setActiveCourse("jonah");
  return contentFor("jonah");
};
const allUnits = (courseId: "jonah" | "shoresh" | "koine-gospels") =>
  new Set(contentFor(courseId).units.map((u) => u.id));

beforeEach(() => setActiveCourse("jonah"));

describe("the descent motif — the case the whole feature was pitched on", () => {
  it("finds ירד threading through the book, in forms that do not resemble each other", () => {
    const c = jonah();
    const targets = scanTargets(c, scanScope(c, allUnits("jonah")));
    const descent = targets.find((t) => t.familyId === "ירד");

    expect(descent, "ירד is not a scan target").toBeDefined();
    expect(descent!.gloss).toBe("to go down");

    // Down to Joppa, down into the ship, down into the hold, down to the roots
    // of the mountains — four hits across chapters 1 and 2.
    expect(descent!.hits).toHaveLength(4);
    expect(new Set(descent!.hits.map((h) => h.passageId))).toEqual(
      new Set(["jonah-1-3", "jonah-1-5", "jonah-2-7"]),
    );

    // The point: a learner cannot match one shape. וַיֵּרֶד and יָרַדְתִּי share
    // no visible prefix, and folding proves the difference is morphological
    // rather than cantillation.
    const fold = scriptOf().fold;
    expect(new Set(descent!.hits.map((h) => fold(h.text))).size).toBeGreaterThanOrEqual(2);
  });

  it("is only reachable because a unit now records BOTH its verses", () => {
    // Three of the four hits are in 1:3 and 1:5, which are the FIRST verse of
    // their two-verse units. While a unit recorded only its milestone verse,
    // those verses were unlocked by nothing and this target did not exist.
    const c = jonah();
    const scope = scanScope(c, allUnits("jonah"));
    expect(scope.map((p) => p.id)).toContain("jonah-1-3");
    expect(scope.map((p) => p.id)).toContain("jonah-1-5");
    expect(scope).toHaveLength(c.passages.length);
  });
});

describe("what may be a target", () => {
  const targets = () => {
    const c = jonah();
    return scanTargets(c, scanScope(c, allUnits("jonah")));
  };

  it("always has a meaning to prompt with, never only a form", () => {
    for (const t of targets()) {
      expect(t.gloss.length, t.familyId).toBeGreaterThan(0);
      expect(t.letters.length, t.familyId).toBeGreaterThan(0);
    }
  });

  it("never offers a one-form target, which could be solved by shape", () => {
    for (const t of targets()) expect(t.forms, t.familyId).toBeGreaterThanOrEqual(2);
  });

  it("never offers a single occurrence, which is a lookup and not a search", () => {
    for (const t of targets()) expect(t.hits.length, t.familyId).toBeGreaterThanOrEqual(2);
  });

  it("never confines a target to one verse, which is not scanning", () => {
    // Both occurrences inside one sentence is a comprehension question about
    // that sentence. The exercise is movement ACROSS a chapter.
    for (const t of targets()) expect(t.verses, t.familyId).toBeGreaterThanOrEqual(2);
  });

  it("counts forms AFTER folding, so cantillation is not mistaken for morphology", () => {
    // יְהוָה is printed with five different accents in chapter 1. Counted raw it
    // looks like the richest target in the book; it is one form.
    const fold = scriptOf().fold;
    for (const t of targets()) {
      const folded = new Set(t.hits.map((h) => fold(h.text)));
      expect(folded.size, t.familyId).toBe(t.forms);
    }
  });

  it("excludes function words, because their glosses are not scannable meanings", () => {
    // אֶל "to, unto" and כִּי "because" are the two most frequent repeats in
    // Jonah 1. Neither carries a root, so restricting to families drops them.
    const ids = targets().map((t) => t.familyId);
    expect(ids).not.toContain("h413");
    expect(ids).not.toContain("h3588");
    expect(ids).not.toContain("h3808");
  });

  it("puts the richest target first", () => {
    const list = targets();
    for (let i = 1; i < list.length; i++) {
      const a = list[i - 1]!;
      const b = list[i]!;
      expect(
        a.forms > b.forms ||
          (a.forms === b.forms && a.hits.length >= b.hits.length),
        `${a.familyId} should not rank below ${b.familyId}`,
      ).toBe(true);
    }
  });

  it("is deterministic", () => {
    const c = jonah();
    const a = scanTargets(c, scanScope(c, allUnits("jonah")));
    const b = scanTargets(c, scanScope(c, allUnits("jonah")));
    expect(b.map((t) => t.familyId)).toEqual(a.map((t) => t.familyId));
  });
});

describe("scope — only text the learner has finished", () => {
  it("is empty before anything is completed", () => {
    const c = jonah();
    expect(scanScope(c, new Set())).toEqual([]);
    expect(canScan(c, new Set())).toBe(false);
  });

  it("never includes a verse from an unfinished unit", () => {
    const c = jonah();
    const done = new Set(c.units.slice(0, 4).map((u) => u.id));
    const allowed = new Set(c.units.filter((u) => done.has(u.id)).flatMap((u) => u.passageIds ?? []));
    for (const p of scanScope(c, done)) expect(allowed.has(p.id), p.id).toBe(true);
  });

  it("narrows to one chapter when the track has them", () => {
    const c = jonah();
    const all = scanScope(c, allUnits("jonah"));
    const ch1 = scanScope(c, allUnits("jonah"), "jonah-1");
    expect(ch1.length).toBeGreaterThan(0);
    expect(ch1.length).toBeLessThan(all.length);
    for (const p of ch1) expect(p.id.startsWith("jonah-1-")).toBe(true);
  });

  it("returns passages in text order, which is reading order", () => {
    const c = jonah();
    const scope = scanScope(c, allUnits("jonah"));
    const positions = scope.map((p) => c.passages.indexOf(p));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });
});

describe("rounds", () => {
  it("rotates rather than repeating the same target", () => {
    const c = jonah();
    const targets = scanTargets(c, scanScope(c, allUnits("jonah"), "jonah-1"));
    expect(targets.length).toBeGreaterThan(1);
    expect(pickTarget(targets, 0)!.familyId).not.toBe(pickTarget(targets, 1)!.familyId);
    // And wraps rather than running out.
    expect(pickTarget(targets, targets.length)!.familyId).toBe(pickTarget(targets, 0)!.familyId);
  });

  it("has nothing to pick when there are no targets", () => {
    expect(pickTarget([], 0)).toBeUndefined();
  });
});

describe("hit lookup", () => {
  it("gives the token indices to mark in one verse, and no others", () => {
    const c = jonah();
    const descent = scanTargets(c, scanScope(c, allUnits("jonah"))).find((t) => t.familyId === "ירד")!;
    const inVerse = hitsIn(descent, "jonah-1-3");
    expect(inVerse.size).toBe(2); // down to Joppa, down into the ship
    const passage = c.passageById.get("jonah-1-3")!;
    for (const i of inVerse) expect(passage.tokens[i]!.familyId).toBe("ירד");
    expect(hitsIn(descent, "jonah-3-1").size).toBe(0);
  });

  it("agrees with the passage tokens for EVERY target, in every track", () => {
    for (const courseId of ["jonah", "shoresh", "koine-gospels"] as const) {
      setActiveCourse(courseId);
      const c = contentFor(courseId);
      const targets = scanTargets(c, scanScope(c, allUnits(courseId)));
      for (const t of targets) {
        for (const h of t.hits) {
          const token = c.passageById.get(h.passageId)?.tokens[h.tokenIndex];
          expect(token, `${courseId} ${t.familyId} ${h.passageId}[${h.tokenIndex}]`).toBeDefined();
          expect(token!.familyId).toBe(t.familyId);
          expect(token!.text).toBe(h.text);
        }
      }
    }
  });
});

describe("every track", () => {
  it("either offers real targets or cleanly offers none", () => {
    for (const courseId of ["jonah", "shoresh", "koine-gospels"] as const) {
      setActiveCourse(courseId);
      const c = contentFor(courseId);
      const targets = scanTargets(c, scanScope(c, allUnits(courseId)));
      // Whatever the count, nothing malformed may reach the screen.
      for (const t of targets) {
        expect(t.hits.length).toBeGreaterThanOrEqual(2);
        expect(t.forms).toBeGreaterThanOrEqual(2);
        expect(t.verses).toBeGreaterThanOrEqual(2);
        expect(t.gloss).toBeTruthy();
      }
      expect(canScan(c, allUnits(courseId))).toBe(targets.length > 0);
    }
  });

  it("gives Jonah enough targets for the feature to be worth opening", () => {
    setActiveCourse("jonah");
    const c = contentFor("jonah");
    for (const [section, least] of [["jonah-1", 8], ["jonah-3", 4], ["jonah-4", 6]] as const) {
      const n = scanTargets(c, scanScope(c, allUnits("jonah"), section)).length;
      expect(n, section).toBeGreaterThanOrEqual(least);
    }
  });
});
