import { describe, it, expect } from "vitest";
import { GREEK_ATTIC, GREEK_KOINE, HEBREW_BIBLICAL, courses, getCourse, scriptOf } from "./course";

/**
 * Course configuration invariants.
 *
 * These guard the things that would silently misrepresent a language — wrong
 * script, wrong direction, or Hebrew terminology shown to a Greek learner.
 */

describe("course registry", () => {
  it("has unique ids", () => {
    expect(new Set(courses.map((c) => c.id)).size).toBe(courses.length);
  });

  it("resolves a registered script module for every course", () => {
    for (const c of courses) expect(() => scriptOf(c)).not.toThrow();
  });

  it("defaults to the Hebrew course", () => {
    expect(getCourse().id).toBe("hebrew-biblical");
  });

  it("throws on an unknown course rather than silently falling back", () => {
    expect(() => getCourse("nope" as never)).toThrow();
  });
});

describe("script wiring", () => {
  it("gives Hebrew a right-to-left script and Greek a left-to-right one", () => {
    expect(scriptOf(HEBREW_BIBLICAL).direction).toBe("rtl");
    expect(scriptOf(GREEK_KOINE).direction).toBe("ltr");
    expect(scriptOf(GREEK_ATTIC).direction).toBe("ltr");
  });

  it("uses a Greek-capable font for Greek — Frank Ruhl Libre has no Greek glyphs", () => {
    expect(GREEK_KOINE.fontStack).toMatch(/Gentium/);
    expect(HEBREW_BIBLICAL.fontStack).toMatch(/Frank Ruhl/);
  });
});

describe("the two Greek courses share language-level configuration", () => {
  // D1 makes them separate courses; this is what stops them drifting apart.
  it.each(["script", "fontStack", "parseFields", "supportsFading", "diacriticsCopy"] as const)(
    "agree on %s",
    (key) => {
      expect(GREEK_KOINE[key]).toEqual(GREEK_ATTIC[key]);
    },
  );

  it("differ only in identity and accent", () => {
    expect(GREEK_KOINE.id).not.toBe(GREEK_ATTIC.id);
    expect(GREEK_KOINE.accentColor).not.toBe(GREEK_ATTIC.accentColor);
  });
});

describe("diacritics setting is described in the learner's own language", () => {
  it("calls them vowel points for Hebrew and accents for Greek", () => {
    expect(HEBREW_BIBLICAL.diacriticsCopy.label).toMatch(/niqqud/i);
    // Showing "vowel points (niqqud)" to a Greek learner would be nonsense.
    expect(GREEK_KOINE.diacriticsCopy.label).not.toMatch(/niqqud/i);
    expect(GREEK_KOINE.diacriticsCopy.label).toMatch(/accent/i);
  });

  it("offers fading only where the script has an honest progression", () => {
    // Unpointed Hebrew is a real reading target; unaccented Greek is not, and
    // accents can be contrastive (τίς "who?" vs τις "someone") — §4.5.
    expect(HEBREW_BIBLICAL.supportsFading).toBe(true);
    expect(GREEK_KOINE.supportsFading).toBe(false);
    expect(GREEK_ATTIC.supportsFading).toBe(false);
  });

  it("keeps supportsFading consistent with the script's stage count", () => {
    for (const c of courses) {
      expect(c.supportsFading).toBe(scriptOf(c).stages > 0);
    }
  });

  it("provides copy for every setting value", () => {
    for (const c of courses) {
      for (const k of ["always", "fading", "off"] as const) {
        expect(c.diacriticsCopy[k].length, `${c.id}.${k}`).toBeGreaterThan(0);
      }
    }
  });
});

describe("parse fields match the language", () => {
  const ids = (c: (typeof courses)[number]) => c.parseFields.map((f) => f.id);

  it("gives Hebrew binyan and Greek case/voice/mood", () => {
    expect(ids(HEBREW_BIBLICAL)).toContain("binyan");
    expect(ids(HEBREW_BIBLICAL)).not.toContain("case");
    expect(ids(GREEK_KOINE)).toEqual(expect.arrayContaining(["case", "voice", "mood"]));
    expect(ids(GREEK_KOINE)).not.toContain("binyan");
  });

  it("distinguishes the gender sets — Hebrew has common, Greek has neuter", () => {
    const gender = (c: (typeof courses)[number]) =>
      c.parseFields.find((f) => f.id === "gender")!.options.map((o) => o.value);
    expect(gender(HEBREW_BIBLICAL)).toContain("c");
    expect(gender(HEBREW_BIBLICAL)).not.toContain("n");
    expect(gender(GREEK_KOINE)).toContain("n");
    expect(gender(GREEK_KOINE)).not.toContain("c");
  });
});
