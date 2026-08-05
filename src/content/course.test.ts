import { describe, it, expect } from "vitest";
import { GREEK_ATTIC, GREEK_KOINE, HEBREW_BIBLICAL, HEBREW_JONAH, courses, getCourse, languageOf, morphemeLabel, scriptOf, tracksOf, varietyOf } from "./course";
import { GREEK, HEBREW, languages } from "./language";
import { BIBLICAL_HEBREW, KOINE_GREEK, varieties, varietiesByLanguage } from "./variety";
import { reviewNotesFor } from "./index";

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
    expect(getCourse().id).toBe("shoresh");
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

/**
 * The hierarchy is Language › Variety › Track › Unit.
 *
 * These four tracks were once four peers in one list, which put Koine and Attic
 * — which are VARIETIES of Greek — at the same level as Shoresh and Jonah,
 * which are two curricula inside a single variety of Hebrew. Adding Modern
 * Hebrew is what exposes the error: it belongs beside Biblical Hebrew, not
 * beside Jonah.
 *
 * These assertions pin each fact to the level that owns it.
 */
describe("the three-level hierarchy", () => {
  /** Owned by the language: facts about the writing system. */
  const FROM_LANGUAGE = ["script", "fontStack"] as const;
  /** Owned by the variety: facts about that form of the language. */
  const FROM_VARIETY = ["parseFields", "supportsFading", "morphemeNoun", "diacriticsCopy"] as const;

  it("nests varieties under languages", () => {
    const grouped = varietiesByLanguage();
    expect(grouped.map((g) => g.language.name)).toEqual(["Hebrew", "Greek"]);
    expect(grouped.flatMap((g) => g.varieties).map((v) => v.name)).toEqual([
      "Biblical Hebrew",
      "Koine Greek",
      "Attic Greek",
    ]);
  });

  it("nests tracks under varieties, never directly under a language", () => {
    for (const t of courses) {
      expect(varietyOf(t).id, t.id).toBe(t.variety);
      expect(varietyOf(t).language, t.id).toBe(t.language);
    }
    expect(tracksOf("biblical-hebrew").map((t) => t.name)).toEqual(["Shoresh", "Jonah", "Ruth", "Esther", "Ecclesiastes", "Haggai", "Malachi", "Obadiah"]);
    // Koine now has two tracks and Attic one — the asymmetry the third level
    // exposes rather than creates, and the reason adding 1 John beside The
    // Gospels needed no structural change at all.
    expect(tracksOf("koine-greek").map((t) => t.name)).toEqual(["The Gospels", "1 John", "Mark", "John", "Matthew"]);
    expect(tracksOf("attic-greek").length).toBe(1);
  });

  it.each(FROM_LANGUAGE)("takes %s from the language", (key) => {
    for (const t of courses) expect(t[key], t.id).toEqual(languageOf(t)[key]);
  });

  it.each(FROM_VARIETY)("takes %s from the variety", (key) => {
    for (const t of courses) expect(t[key], t.id).toEqual(varietyOf(t)[key]);
  });

  it("lets two tracks of ONE variety differ only in curriculum and accent", () => {
    // Shoresh and Jonah are the same Biblical Hebrew taught two ways.
    for (const key of [...FROM_LANGUAGE, ...FROM_VARIETY]) {
      expect(HEBREW_BIBLICAL[key]).toEqual(HEBREW_JONAH[key]);
    }
    expect(HEBREW_BIBLICAL.variety).toBe(HEBREW_JONAH.variety);
    expect(HEBREW_BIBLICAL.id).not.toBe(HEBREW_JONAH.id);
    expect(HEBREW_BIBLICAL.accentColor).not.toBe(HEBREW_JONAH.accentColor);
  });

  it("keeps two VARIETIES of one language independently changeable", () => {
    // Koine and Attic agree on everything today. That is a fact about the
    // content, not a rule — they share a language, not a variety, so nothing
    // here may assume one follows the other.
    expect(GREEK_KOINE.language).toBe(GREEK_ATTIC.language);
    expect(GREEK_KOINE.variety).not.toBe(GREEK_ATTIC.variety);
    for (const key of FROM_LANGUAGE) expect(GREEK_KOINE[key]).toEqual(GREEK_ATTIC[key]);
  });

  it("keeps Hebrew and Greek distinct at the level that owns each fact", () => {
    expect(HEBREW.script).not.toBe(GREEK.script);
    expect(BIBLICAL_HEBREW.morphemeNoun).not.toBe(KOINE_GREEK.morphemeNoun);
    expect(BIBLICAL_HEBREW.supportsFading).not.toBe(KOINE_GREEK.supportsFading);
  });

  it("registers nothing orphaned at any level", () => {
    const usedLanguages = new Set(varieties.map((v) => v.language));
    for (const l of languages) expect(usedLanguages.has(l.id), `${l.id} has no varieties`).toBe(true);
    const usedVarieties = new Set(courses.map((c) => c.variety));
    for (const v of varieties) expect(usedVarieties.has(v.id), `${v.id} has no tracks`).toBe(true);
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

  it("names the morpheme the way the language does", () => {
    // Hebrew teaches the root; Greek teaches the stem/ending. Saying "root" to
    // a Greek learner is the same class of error as "niqqud" was.
    expect(HEBREW_BIBLICAL.morphemeNoun).toBe("root");
    expect(GREEK_KOINE.morphemeNoun).toBe("stem");
    for (const c of courses) expect(c.morphemeNoun.length, c.id).toBeGreaterThan(0);
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

describe("morpheme label", () => {
  // Screens said "Roots" to a Greek learner because they hardcoded the word.
  // Everything user-visible now goes through morphemeLabel.
  it("speaks each course's own language", () => {
    expect(morphemeLabel(HEBREW_BIBLICAL)).toEqual({
      one: "root", many: "roots", One: "Root", Many: "Roots",
    });
    expect(morphemeLabel(GREEK_KOINE)).toEqual({
      one: "stem", many: "stems", One: "Stem", Many: "Stems",
    });
  });

  it("produces non-empty forms for every course", () => {
    for (const c of courses) {
      const m = morphemeLabel(c);
      for (const [k, v] of Object.entries(m)) expect(v.length, `${c.id}.${k}`).toBeGreaterThan(0);
    }
  });
});

describe("content provenance is per course", () => {
  // The settings sheet showed Hebrew's notes for every course, which hid the
  // Attic licence blocker — the single most important note in the project.
  it("gives every track its own notes", () => {
    for (const c of courses) expect(reviewNotesFor(c.id).length, c.id).toBeGreaterThan(0);
  });

  it("does not show one track's caveats under another", () => {
    const hebrew = reviewNotesFor("shoresh").map((n) => n.id);
    const attic = reviewNotesFor("attic-prose").map((n) => n.id);
    expect(new Set(hebrew)).not.toEqual(new Set(attic));
  });

  it("surfaces the Attic licence blocker in the app, not only in the repo", () => {
    const notes = reviewNotesFor("attic-prose");
    expect(notes[0]!.id).toBe("licence");
    expect(notes[0]!.note).toMatch(/NonCommercial/);
  });
});
