import { describe, it, expect } from "vitest";
import { isHapax, FrequencySchema } from "./schema";
import { contentFor, availableCourseIds } from "./index";
import { setActiveCourse, type CourseId } from "./course";

/**
 * Word frequency, and the one claim it must never get wrong.
 *
 * "Hapax legomenon" means once in a CORPUS. Ruth has 133 lexemes occurring once
 * in Ruth and only eight occurring once in the Hebrew Bible — אֹזֶן "ear" is
 * once here and 188 times in the Bible. Reporting the in-book count alone, or
 * calling a sampled-corpus singleton a hapax, would teach a learner that
 * ordinary words are rare. These pin the guard.
 */

describe("what makes a hapax", () => {
  const f = (o: Partial<ReturnType<typeof base>> = {}) => ({ ...base(), ...o });
  const base = () => ({ inTrack: 1, inCorpus: 1, corpus: "the Hebrew Bible", corpusComplete: true });

  it("is once in a corpus that was counted in full", () => {
    expect(isHapax(f())).toBe(true);
  });

  it("is NOT claimed from a sampled corpus, however few the occurrences", () => {
    // A word can appear once in 34,000 tokens of Attic prose and be entirely
    // ordinary in Greek. The sample cannot settle it, so it must not try.
    expect(isHapax(f({ corpusComplete: false, corpus: "this Attic prose corpus" }))).toBe(false);
    expect(isHapax(f({ corpusComplete: undefined }))).toBe(false);
  });

  it("is NOT claimed from an in-book count alone", () => {
    expect(isHapax({ inTrack: 1 })).toBe(false);
  });

  it("is not claimed for a word occurring more than once", () => {
    expect(isHapax(f({ inCorpus: 2 }))).toBe(false);
  });

  it("says nothing when there is no frequency at all", () => {
    expect(isHapax(undefined)).toBe(false);
  });
});

describe("the schema refuses incoherent counts", () => {
  it("rejects a corpus count with no corpus named", () => {
    expect(FrequencySchema.safeParse({ inTrack: 1, inCorpus: 5 }).success).toBe(false);
  });

  it("rejects a book count larger than the corpus containing it", () => {
    // 4× in Ruth but 2× in the whole Bible is arithmetically impossible, and
    // would mean the two numbers were counted by different rules.
    expect(
      FrequencySchema.safeParse({ inTrack: 4, inCorpus: 2, corpus: "the Hebrew Bible" }).success,
    ).toBe(false);
  });

  it("accepts an in-track count on its own", () => {
    expect(FrequencySchema.safeParse({ inTrack: 3 }).success).toBe(true);
  });
});

describe.each(availableCourseIds())("course: %s", (courseId: CourseId) => {
  setActiveCourse(courseId);
  const content = contentFor(courseId);
  const isHebrewBook = ["jonah", "ruth"].includes(courseId);

  it("never reports a track count higher than the corpus count", () => {
    for (const w of content.words) {
      const f = w.frequency;
      if (!f?.inCorpus || f.inTrack === undefined) continue;
      expect(f.inCorpus, `${w.id} ${w.text}`).toBeGreaterThanOrEqual(f.inTrack);
    }
  });

  it("names a corpus wherever it gives a corpus count", () => {
    for (const w of content.words) {
      if (w.frequency?.inCorpus) expect(w.frequency.corpus, w.id).toBeTruthy();
    }
  });

  it("only marks a corpus complete where one really was counted in full", () => {
    // This is a fact about the CORPUS, not the language. Hebrew counts all 39
    // books of the Tanakh; Koine counts all 27 of the New Testament — both
    // complete, both entitled to the hapax badge. Attic's reference is the
    // Perseus treebank, a 549k-token sample of a literature far larger, so it
    // is never complete however many tokens it holds.
    const COMPLETE: Partial<Record<CourseId, string>> = {
      jonah: "the Hebrew Bible",
      ruth: "the Hebrew Bible",
      esther: "the Hebrew Bible",
      "koine-gospels": "the New Testament",
      "1john": "the New Testament",
      mark: "the New Testament",
      john: "the New Testament",
    };
    for (const w of content.words) {
      const f = w.frequency;
      if (!f?.inCorpus) continue;
      expect(f.corpusComplete ?? false, `${courseId} ${w.id}`).toBe(f.corpus === COMPLETE[courseId]);
    }
  });

  it("never marks the Attic treebank complete", () => {
    if (courseId !== "attic-prose") return;
    for (const w of content.words) {
      expect(w.frequency?.corpusComplete ?? false, w.id).toBe(false);
    }
  });

  if (isHebrewBook) {
    it("gives every word a whole-Bible count", () => {
      const missing = content.words.filter((w) => !w.frequency?.inCorpus);
      expect(missing.map((w) => w.text)).toEqual([]);
    });

    it("agrees with the in-book token count it was derived from", () => {
      // The two numbers come from different passes; if they disagree, one of
      // them is measuring something other than what it says.
      const seen = new Map<string, number>();
      for (const p of content.passages) {
        for (const t of p.tokens) {
          if (t.wordId) seen.set(t.wordId, (seen.get(t.wordId) ?? 0) + 1);
        }
      }
      for (const w of content.words) {
        if (!w.frequency) continue;
        expect(w.frequency.inTrack, `${w.id} ${w.text}`).toBe(seen.get(w.id) ?? 0);
      }
    });
  }
});

/**
 * The distinction this whole feature exists to make, on real content.
 */
describe("Ruth tells rare from merely-once-here", () => {
  setActiveCourse("ruth");
  const content = contentFor("ruth");
  const byText = new Map(content.words.map((w) => [w.text, w]));

  it("finds exactly the book's true hapax legomena", () => {
    const hapax = content.words.filter((w) => isHapax(w.frequency)).map((w) => w.text);
    expect(hapax).toHaveLength(8);
    // עָגַן in 1:13 is the famous one — the verb occurs nowhere else in the Bible.
    expect(hapax).toContain("עָגַן");
    expect(hapax).toContain("צֶבֶת"); // the bundles of 2:16
  });

  it("does NOT call a common word rare just because Ruth uses it once", () => {
    const ear = byText.get("אֹזֶן")!;
    expect(ear.frequency!.inTrack).toBe(1);
    expect(ear.frequency!.inCorpus).toBeGreaterThan(150);
    expect(isHapax(ear.frequency)).toBe(false);
  });

  it("counts far fewer hapax than words occurring once in the book", () => {
    const onceHere = content.words.filter((w) => w.frequency?.inTrack === 1).length;
    const hapax = content.words.filter((w) => isHapax(w.frequency)).length;
    expect(onceHere).toBeGreaterThan(100);
    expect(hapax).toBeLessThan(onceHere / 10);
  });
});

/**
 * Greek gets the same two counts, and the same discipline about what a 1 means.
 */
describe("Greek", () => {
  it("gives Koine whole-New-Testament counts it can be checked against", () => {
    setActiveCourse("koine-gospels");
    const byText = new Map(contentFor("koine-gospels").words.map((w) => [w.text, w]));
    // Standard NT counts. λόγος and ζωή are exact; θεός differs by ~1% because
    // SBLGNT is a different text from the editions those figures are quoted from.
    expect(byText.get("λόγος")!.frequency!.inCorpus).toBe(330);
    expect(byText.get("ζωή")!.frequency!.inCorpus).toBe(135);
    expect(byText.get("ἀρχή")!.frequency!.inCorpus).toBe(55);
    expect(byText.get("θεός")!.frequency!.inCorpus).toBeGreaterThan(1290);
    for (const w of byText.values()) {
      expect(w.frequency?.corpus, w.id).toBe("the New Testament");
      expect(w.frequency?.corpusComplete, w.id).toBe(true);
    }
  });

  it("gives Attic treebank counts and withholds the hapax verdict", () => {
    setActiveCourse("attic-prose");
    const words = contentFor("attic-prose").words;
    for (const w of words) {
      expect(w.frequency?.corpus, w.id).toBe("the Perseus Greek treebank");
      // However few the occurrences, a sample cannot establish rarity in Greek.
      expect(isHapax(w.frequency), w.id).toBe(false);
    }
    expect(words.every((w) => (w.frequency?.inCorpus ?? 0) > 0)).toBe(true);
  });

  it("counts the track's own verses exactly, or says nothing", () => {
    // πᾶς is taught from the treebank and appears in neither Attic passage.
    // Reporting "1× here" to satisfy a required field would be a made-up
    // number; the field is simply absent instead.
    for (const courseId of ["koine-gospels", "attic-prose"] as const) {
      setActiveCourse(courseId);
      const c = contentFor(courseId);
      const seen = new Map<string, number>();
      for (const p of c.passages) {
        for (const t of p.tokens) if (t.wordId) seen.set(t.wordId, (seen.get(t.wordId) ?? 0) + 1);
      }
      for (const w of c.words) {
        const actual = seen.get(w.id) ?? 0;
        expect(w.frequency?.inTrack, `${courseId} ${w.id} ${w.text}`).toBe(actual || undefined);
      }
    }
  });
});
