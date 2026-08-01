import { describe, it, expect } from "vitest";
import { fold, greekScript, isGreekLetter, stripDiacritics, toLetterClusters } from "./greek";
import { letterCount as countLetters, lettersAt, validateLetterIndices } from "@/lib/morphology";

/**
 * Mirrors hebrew.test.ts, plus the three Greek-specific hazards verified against
 * real MorphGNT data in Spike A: precomposition, final sigma, and the absence of
 * an honest fade progression.
 */

const ARCHE = "ἀρχῇ"; // dative of ἀρχή — smooth breathing + iota subscript
const LOGOS = "λόγος"; // ends in final sigma
const ELYTHEN = "ἐλύθην"; // aorist passive of λύω — augment before the stem
const LELYKA = "λέλυκα"; // perfect — reduplication before the stem

const letterCount = (w: string) => countLetters(greekScript, w);

describe("toLetterClusters", () => {
  it("treats a precomposed accented letter as one letter", () => {
    // ἀ is a single code point (U+1F00), not alpha + breathing.
    expect(toLetterClusters(ARCHE).map((c) => c.text)).toEqual(["ἀ", "ρ", "χ", "ῇ"]);
    expect(letterCount(ARCHE)).toBe(4);
  });

  it("gives the SAME letter count whether the input is NFC or NFD", () => {
    // Without normalising, a decomposed source would shift every morpheme index.
    for (const w of [ARCHE, LOGOS, ELYTHEN, LELYKA]) {
      expect(letterCount(w.normalize("NFD"))).toBe(letterCount(w.normalize("NFC")));
    }
  });

  it("round-trips: joining clusters reproduces the input", () => {
    for (const w of [ARCHE, LOGOS, ELYTHEN, LELYKA]) {
      expect(toLetterClusters(w).map((c) => c.text).join("")).toBe(w.normalize("NFC"));
    }
  });

  it("counts letters, not code points, on decomposed input", () => {
    const decomposed = ARCHE.normalize("NFD");
    expect([...decomposed].length).toBeGreaterThan(4); // raw code points
    expect(letterCount(decomposed)).toBe(4); // actual letters
  });

  it("handles an empty string", () => {
    expect(toLetterClusters("")).toEqual([]);
  });
});

describe("stripDiacritics", () => {
  it("removes accents, breathings and iota subscript", () => {
    expect(stripDiacritics(ARCHE)).toBe("αρχη");
    expect(stripDiacritics(LOGOS)).toBe("λογος");
  });

  it("works on precomposed input — the trap that makes this non-trivial", () => {
    // A naive combining-mark filter is a silent no-op here, because in NFC the
    // marks are part of the code point.
    expect(ARCHE.replace(/\p{Mn}/gu, "")).toBe(ARCHE); // the naive version does nothing
    expect(stripDiacritics(ARCHE)).not.toBe(ARCHE); // ours actually strips
  });

  it("is idempotent", () => {
    expect(stripDiacritics(stripDiacritics(ARCHE))).toBe(stripDiacritics(ARCHE));
  });

  it("never changes the number of letters", () => {
    for (const w of [ARCHE, LOGOS, ELYTHEN, LELYKA]) {
      expect(letterCount(stripDiacritics(w))).toBe(letterCount(w));
    }
  });
});

describe("fold — final sigma", () => {
  it("folds final sigma onto sigma so stem matching works at word end", () => {
    expect(fold(LOGOS)).toBe("λογοσ");
    expect(fold("λογοσ")).toBe(fold(LOGOS));
  });

  it("makes a stem findable inside its own inflected form", () => {
    // λόγος / λόγῳ share the stem λογ-; without folding, the ς would break it.
    expect(fold("λόγῳ").startsWith("λογ")).toBe(true);
    expect(fold(LOGOS).startsWith("λογ")).toBe(true);
  });

  it("is case-insensitive, so sentence-initial capitals match", () => {
    expect(fold("Ἐν")).toBe(fold("ἐν"));
  });
});

describe("isGreekLetter", () => {
  it("accepts basic and extended Greek letters", () => {
    for (const w of [ARCHE, LOGOS, ELYTHEN]) {
      expect(toLetterClusters(w).every(isGreekLetter)).toBe(true);
    }
  });

  it("rejects punctuation and Latin", () => {
    expect(toLetterClusters("·")[0] && isGreekLetter(toLetterClusters("·")[0]!)).toBe(false);
    expect(isGreekLetter(toLetterClusters("a")[0]!)).toBe(false);
  });
});

describe("morpheme indices — the product's core claim, in Greek", () => {
  it("selects the ending of a 2nd-declension noun", () => {
    // λόγ|ος — the split the prototype got wrong (see greek-build-plan.md §7).
    expect(lettersAt(greekScript, LOGOS, [3, 4]).join("")).toBe("ος");
    expect(validateLetterIndices(greekScript, LOGOS, [3, 4]).ok).toBe(true);
  });

  it("selects a stem sitting behind an augment", () => {
    // ἐλύθην: augment ἐ-, then stem λυ-.
    expect(lettersAt(greekScript, ELYTHEN, [1, 2]).map(stripDiacritics).join("")).toBe("λυ");
  });

  it("selects a stem sitting behind a reduplication", () => {
    // λέλυκα: reduplication λε-, stem λυ-, ending -κα.
    expect(lettersAt(greekScript, LELYKA, [2, 3]).map(stripDiacritics).join("")).toBe("λυ");
  });

  it("rejects an out-of-range index", () => {
    const r = validateLetterIndices(greekScript, LOGOS, [3, 99]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/out of range/);
  });

  it("rejects an empty-ending split, the prototype's other failure", () => {
    // χάρις had stemEnd === length, highlighting nothing at all.
    expect(validateLetterIndices(greekScript, "χάρις", [5]).ok).toBe(false);
  });
});

describe("script module contract", () => {
  it("reads left to right, unlike Hebrew", () => {
    expect(greekScript.direction).toBe("ltr");
    expect(greekScript.lang).toBe("grc");
  });

  it("declares no fade progression", () => {
    // Unaccented Greek is not a reading target; see §4.5.
    expect(greekScript.stages).toBe(0);
    expect(greekScript.fade(ARCHE, 6)).toBe(ARCHE);
  });

  it("joins stem letters with a hyphen, not a maqqef", () => {
    expect(greekScript.joinLetters("λυ")).toBe("λ-υ");
  });
});
