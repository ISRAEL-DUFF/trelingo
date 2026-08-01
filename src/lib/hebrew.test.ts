import { describe, it, expect } from "vitest";
import {
  MAX_FADE_STAGE,
  fadeNiqqud,
  fadeStageForInterval,
  formatRoot,
  letterCount,
  rootLettersOf,
  stripNiqqud,
  toLetterClusters,
  validateRootIndices,
} from "./hebrew";

// Written with explicit escapes so the expected values are reviewable by eye —
// combining marks are invisible in source.
const BARA = "בָּרָא"; // בָּרָא
const SHAMAR = "שָׁמַר"; // שָׁמַר
const BERESHIT = "בְּרֵאשִׁית"; // בְּרֵאשִׁית

describe("toLetterClusters", () => {
  it("attaches vowel points to the consonant they belong to", () => {
    const cl = toLetterClusters(BARA);
    expect(cl).toHaveLength(3);
    expect(cl.map((c) => c.base)).toEqual(["ב", "ר", "א"]);
    expect(cl[0]!.marks).toHaveLength(2); // qamats + dagesh
    expect(cl[2]!.marks).toHaveLength(0); // bare alef
  });

  it("counts letters, not code points", () => {
    expect(BARA.length).toBe(6); // raw code points
    expect(letterCount(BARA)).toBe(3); // actual letters
    expect(letterCount(BERESHIT)).toBe(6);
  });

  it("round-trips: joining clusters reproduces the input exactly", () => {
    for (const w of [BARA, SHAMAR, BERESHIT]) {
      expect(toLetterClusters(w).map((c) => c.text).join("")).toBe(w);
    }
  });

  it("never orphans a leading combining mark", () => {
    // Defensive: malformed input starting with a mark must not crash or drop it.
    const malformed = "ָב";
    expect(toLetterClusters(malformed).map((c) => c.text).join("")).toBe(malformed);
  });

  it("handles an empty string", () => {
    expect(toLetterClusters("")).toEqual([]);
  });
});

describe("stripNiqqud", () => {
  it("leaves the consonantal skeleton", () => {
    expect(stripNiqqud(BARA)).toBe("ברא");
    expect(stripNiqqud(SHAMAR)).toBe("שמר");
  });

  it("is idempotent", () => {
    expect(stripNiqqud(stripNiqqud(BARA))).toBe(stripNiqqud(BARA));
  });
});

describe("fadeNiqqud", () => {
  it("returns the input unchanged at stage 0", () => {
    expect(fadeNiqqud(BARA, 0)).toBe(BARA);
  });

  it("strips everything at the maximum stage", () => {
    expect(fadeNiqqud(BARA, MAX_FADE_STAGE)).toBe(stripNiqqud(BARA));
  });

  it("drops marks monotonically — later stages never add marks back", () => {
    let prev = Infinity;
    for (let s = 0; s <= MAX_FADE_STAGE; s++) {
      const len = fadeNiqqud(BERESHIT, s).length;
      expect(len).toBeLessThanOrEqual(prev);
      prev = len;
    }
  });

  it("keeps the shin dot until the very last stage", () => {
    // שׁ vs שׂ is phonemic; dropping it early makes words genuinely ambiguous.
    expect(fadeNiqqud(SHAMAR, MAX_FADE_STAGE - 1)).toContain("ׁ");
    expect(fadeNiqqud(SHAMAR, MAX_FADE_STAGE)).not.toContain("ׁ");
  });

  it("drops the dagesh before it drops full vowels", () => {
    expect(fadeNiqqud(BARA, 3)).not.toContain("ּ"); // dagesh gone
    expect(fadeNiqqud(BARA, 3)).toContain("ָ"); // qamats still there
  });

  it("never changes the consonants themselves", () => {
    for (let s = 0; s <= MAX_FADE_STAGE; s++) {
      expect(stripNiqqud(fadeNiqqud(BERESHIT, s))).toBe(stripNiqqud(BERESHIT));
    }
  });

  it("clamps out-of-range stages instead of throwing", () => {
    expect(fadeNiqqud(BARA, -5)).toBe(BARA);
    expect(fadeNiqqud(BARA, 99)).toBe(stripNiqqud(BARA));
  });
});

describe("fadeStageForInterval", () => {
  it("shows full points to a brand-new card", () => {
    expect(fadeStageForInterval(0)).toBe(0);
  });

  it("increases monotonically with maturity", () => {
    const stages = [0, 3, 7, 14, 30, 60, 120, 365].map(fadeStageForInterval);
    expect(stages).toEqual([...stages].sort((a, b) => a - b));
  });

  it("only reaches bare consonants for a well-established card", () => {
    expect(fadeStageForInterval(365)).toBe(MAX_FADE_STAGE);
    expect(fadeStageForInterval(60)).toBeLessThan(MAX_FADE_STAGE);
  });
});

describe("validateRootIndices", () => {
  it("accepts indices that land on consonants", () => {
    expect(validateRootIndices(BARA, [0, 1, 2]).ok).toBe(true);
  });

  it("rejects an out-of-range index", () => {
    const r = validateRootIndices(BARA, [0, 1, 9]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/out of range/);
  });

  it("rejects duplicates", () => {
    expect(validateRootIndices(BARA, [0, 0, 1]).ok).toBe(false);
  });

  it("catches the original prototype bug", () => {
    // The old renderer indexed raw code points, so [0,1,2] on בָּרָא selected
    // bet + qamats + dagesh. Guard that this shape of error is detectable.
    const codePointIndexed = Array.from(BARA);
    expect(codePointIndexed[1]).toBe("ָ"); // a mark, not a letter
    expect(letterCount(BARA)).not.toBe(codePointIndexed.length);
  });
});

describe("rootLettersOf / formatRoot", () => {
  it("extracts the bare root consonants", () => {
    expect(rootLettersOf(SHAMAR, [0, 1, 2])).toEqual(["ש", "מ", "ר"]);
  });

  it("extracts a root under a prefix", () => {
    // bereshit: root ר-א-שׁ sits at letters 1,2,3 behind a prefixed bet.
    expect(rootLettersOf(BERESHIT, [1, 2, 3])).toEqual(["ר", "א", "ש"]);
  });

  it("joins root letters with maqqef for display, keeping the shin dot", () => {
    const out = formatRoot("שׁמר");
    expect(out.split("־")).toEqual(["שׁ", "מ", "ר"]); // maqqef-separated
    expect(out).toContain("ׁ"); // shin dot survives
  });
});
