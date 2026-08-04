import { describe, it, expect } from "vitest";
import { availableCourseIds, contentFor, getBundle, getContent } from "./index";
import { passagesOf, validateBundle } from "./schema";
import { lettersAt, validateLetterIndices } from "@/lib/morphology";
import { getCourse, languageOf, scriptOf, type CourseId } from "./course";

/**
 * Spec §5.3: "Content schema validation: CI-blocking, not just a warning."
 * These tests are the gate. If content is wrong, the build fails.
 *
 * Every registered course is validated, not just the active one — otherwise a
 * course would ship unvalidated until someone happened to switch to it.
 */

/** Is `small` a subsequence of `big`? Weak families show fewer letters. */
function isSubsequence(small: string[], big: string[]): boolean {
  let i = 0;
  for (const c of big) if (i < small.length && small[i] === c) i++;
  return i === small.length;
}

const COURSES = availableCourseIds();

describe.each(COURSES)("course: %s", (courseId: CourseId) => {
  const content = contentFor(courseId);
  const script = scriptOf(getCourse(courseId));
  const { units, words, families, passages, wordsByFamily } = content;

  describe("bundle", () => {
    it("passes schema and referential-integrity validation", () => {
      const { errors } = validateBundle(getBundle(courseId), courseId);
      expect(errors).toEqual([]);
    });

    it("loads without throwing", () => {
      expect(() => getContent(courseId)).not.toThrow();
    });

    it("has content to teach", () => {
      expect(units.length).toBeGreaterThan(0);
      expect(words.length).toBeGreaterThan(0);
      expect(families.length).toBeGreaterThan(0);
    });
  });

  describe("morphology — the product's core claim", () => {
    // Words with no established root carry no morphology; there is nothing to
    // check on them, and asserting over them would only assert that null is null.
    const marked = words.filter((w) => w.morphology);

    it.each(marked.map((w) => [w.id, w] as const))(
      "%s: every highlighted index lands on a real letter",
      (_id, w) => {
        const check = validateLetterIndices(script, w.text, w.morphology!.highlight);
        expect(check.ok, check.ok ? "" : check.reason).toBe(true);
      },
    );

    it.each(marked.map((w) => [w.id, w] as const))(
      "%s: the highlight agrees with the declared family",
      (_id, w) => {
        const familyLetters = Array.from(script.fold(w.familyId!));
        if (w.morphology!.kind === "ending") {
          // Greek highlights the ENDING, so what is left unhighlighted is the
          // stem. It must be non-empty — an ending covering the whole word is
          // the χάρις failure from greek-build-plan.md §7.
          const family = familyLetters.join("");
          const stem = script.fold(
            script
              .toLetterClusters(w.text)
              .filter((_, i) => !w.morphology!.highlight.includes(i))
              .map((c) => c.text)
              .join(""),
          );
          expect(stem.length, `${w.text}: ending covers the whole word`).toBeGreaterThan(0);

          // The stem normally IS the family. It legitimately differs where a
          // family was grouped by curation rather than derived — λόγος and
          // λέγω share a family across an ο/ε ablaut, so no string relation
          // holds. Those must be genuine multi-word families, not typos.
          const consistent = stem.startsWith(family) || family.startsWith(stem);
          const curated = (wordsByFamily[w.familyId!] ?? []).length > 1;
          expect(
            consistent || curated,
            `${w.text}: stem "${stem}" is unrelated to family "${family}", and that family has only one word — so this is a mistake, not a curation decision`,
          ).toBe(true);
        } else {
          // Hebrew highlights the ROOT: the highlighted letters ARE the family.
          const picked = lettersAt(script, w.text, w.morphology!.highlight).map((l) => script.fold(l));
          expect(
            isSubsequence(picked, familyLetters),
            `${w.text} selects "${picked.join("")}", not a subsequence of "${familyLetters.join("")}"`,
          ).toBe(true);
        }
      },
    );

    it("leaves something unhighlighted, where the morpheme kind requires it", () => {
      for (const w of marked) {
        const len = script.toLetterClusters(w.text).length;
        if (w.morphology!.kind === "ending") {
          // An ending covering the whole word would leave no stem — that is the
          // χάρις failure from greek-build-plan.md §7, inverted.
          expect(w.morphology!.highlight.length, w.id).toBeLessThan(len);
        } else {
          // A bare Hebrew triliteral IS entirely root (בָּרָא = ב־ר־א), so equal
          // is legitimate here; more than the word is not.
          expect(w.morphology!.highlight.length, w.id).toBeLessThanOrEqual(len);
        }
      }
    });

    it("keeps highlight indices in ascending order", () => {
      for (const w of marked) {
        expect(w.morphology!.highlight, w.id).toEqual(
          [...w.morphology!.highlight].sort((a, b) => a - b),
        );
      }
    });

    it("uses the morpheme kind the course actually teaches", () => {
      // Asked of the LANGUAGE, not scraped off the track id. Track ids used to
      // begin with the language ("greek-attic"), and this read that prefix —
      // which broke the moment ids were named for the track instead. Hebrew
      // highlights the root, Greek the ending; that is a fact about the
      // language and now comes from it.
      const expected = languageOf(getCourse(courseId)).id === "greek" ? "ending" : "root";
      for (const w of marked) expect(w.morphology!.kind, w.id).toBe(expected);
    });
  });

  describe("passage tokens", () => {
    it.each(passages.map((p) => [p.id, p] as const))("%s: morphemes are valid", (_id, p) => {
      for (const t of p.tokens) {
        if (!t.morphology) continue; // function words carry no morpheme
        const check = validateLetterIndices(script, t.text, t.morphology.highlight);
        expect(check.ok, check.ok ? "" : `${t.text}: ${!check.ok && check.reason}`).toBe(true);
      }
    });

    it("gives every token a gloss, so tap-to-gloss never shows a blank", () => {
      for (const p of passages) {
        for (const t of p.tokens) expect(t.gloss.length, `${p.id} / ${t.text}`).toBeGreaterThan(0);
      }
    });

    it("only links tokens to families that exist", () => {
      const ids = new Set(families.map((f) => f.id));
      for (const p of passages) {
        for (const t of p.tokens) {
          if (t.familyId) expect(ids.has(t.familyId), `${p.id}: ${t.familyId}`).toBe(true);
        }
      }
    });
  });

  describe("unit graph", () => {
    it("is a single chain with one entry point", () => {
      expect(units.filter((u) => u.requires === null)).toHaveLength(1);
    });

    it("has no cycles", () => {
      const byId = new Map(units.map((u) => [u.id, u]));
      for (const u of units) {
        let cursor: string | null = u.id;
        const path = new Set<string>();
        while (cursor) {
          expect(path.has(cursor), `cycle at ${cursor}`).toBe(false);
          path.add(cursor);
          cursor = byId.get(cursor)?.requires ?? null;
        }
      }
    });

    it("orders units consistently with their prerequisites", () => {
      const order = new Map(units.map((u) => [u.id, u.orderIndex]));
      for (const u of units) {
        if (u.requires) expect(order.get(u.id)!).toBeGreaterThan(order.get(u.requires)!);
      }
    });

    it("gives every unit something to do", () => {
      // Exercises OR text to read. A continuous book eventually produces a unit
      // that introduces no new vocabulary at all — Ruth 3:5–6 is two verses of
      // words the learner already knows — and that is a reading unit, not an
      // empty one. What must never happen is a unit with neither.
      for (const u of units) {
        expect(u.exercises.length + passagesOf(u).length, u.id).toBeGreaterThan(0);
      }
    });

    it("introduces each word in exactly one unit", () => {
      const seen = new Map<string, string>();
      for (const u of units) {
        for (const id of u.wordIds) {
          expect(seen.has(id), `${id} in both ${seen.get(id)} and ${u.id}`).toBe(false);
          seen.set(id, u.id);
        }
      }
    });

    /**
     * Every verse must belong to a unit, or it is content that ships in the
     * bundle and is displayed nowhere.
     *
     * Jonah's units cover two verses each but recorded only the milestone they
     * ended on, so 24 of the book's 48 verses were unlocked by nothing, shown by
     * no screen, and invisible to the cloze builder — including 1:3 and 1:5,
     * which carry three of the four occurrences of ירד. `passagesOf` is the fix;
     * this is the guard that stops it happening to the next book.
     */
    it("leaves no passage unreachable", () => {
      const reachable = new Set(units.flatMap(passagesOf));
      const orphaned = passages.filter((p) => !reachable.has(p.id)).map((p) => p.reference);
      expect(orphaned, `${orphaned.length} verse(s) no unit teaches`).toEqual([]);
    });

    it("ends each multi-verse unit on the last verse it covers", () => {
      for (const u of units) {
        const all = passagesOf(u);
        if (all.length < 2) continue;
        expect(u.passageId, u.id).toBe(all[all.length - 1]);
      }
    });
  });

  describe("exercises", () => {
    const allExercises = units.flatMap((u) => u.exercises);

    it("have unique ids", () => {
      const ids = allExercises.map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("always include the correct answer among the choices", () => {
      for (const ex of allExercises) {
        if (ex.type === "conjugation" || ex.type === "construct_chain") {
          expect(ex.choices, ex.id).toContain(ex.answer);
        }
      }
    });

    it("never offer duplicate choices", () => {
      for (const ex of allExercises) {
        if (ex.type === "conjugation" || ex.type === "construct_chain") {
          expect(new Set(ex.choices).size, ex.id).toBe(ex.choices.length);
        }
      }
    });

    it("only ask parsing questions about fields that have an answer", () => {
      for (const ex of allExercises) {
        if (ex.type !== "parsing") continue;
        for (const f of ex.fields) {
          expect(ex.answer[f], `${ex.id} asks for ${f} with no answer`).toBeDefined();
        }
      }
    });

    it("only drills vocabulary the unit (or an earlier one) has introduced", () => {
      const introducedBy = new Map<string, number>();
      for (const u of units) for (const id of u.wordIds) introducedBy.set(id, u.orderIndex);
      for (const u of units) {
        for (const ex of u.exercises) {
          if (!("wordId" in ex)) continue;
          const at = introducedBy.get(ex.wordId);
          expect(at, `${ex.id} drills ${ex.wordId}, never introduced`).toBeDefined();
          expect(at!, `${ex.id} drills ${ex.wordId} before it is taught`).toBeLessThanOrEqual(
            u.orderIndex,
          );
        }
      }
    });
  });

  describe("vocabulary quality", () => {
    it("gives every word at least three distractors", () => {
      for (const w of words) expect(w.distractors.length, w.id).toBeGreaterThanOrEqual(3);
    });

    it("never lists the right answer as a distractor", () => {
      for (const w of words) expect(w.distractors, w.id).not.toContain(w.gloss);
    });

    it("has no duplicate distractors within a word", () => {
      for (const w of words) expect(new Set(w.distractors).size, w.id).toBe(w.distractors.length);
    });

    it("uses ids that are stable, url-safe and unique", () => {
      for (const w of words) expect(w.id, w.id).toMatch(/^[a-z0-9-]+$/);
      expect(new Set(words.map((w) => w.id)).size).toBe(words.length);
    });

    it("links every word to a family that exists", () => {
      // A word may legitimately have no family — a derived corpus cannot always
      // establish a root, and inventing one is the guess the importers refuse
      // to make. What must never happen is a link to a family that isn't there.
      const ids = new Set(families.map((f) => f.id));
      for (const w of words) {
        if (w.familyId) expect(ids.has(w.familyId), `${w.id} -> ${w.familyId}`).toBe(true);
      }
      expect(Object.keys(wordsByFamily).length).toBeGreaterThan(0);
    });

    it("never highlights a morpheme without saying which family it belongs to", () => {
      for (const w of words) {
        if (w.morphology) expect(w.familyId, `${w.id} highlights but has no family`).toBeTruthy();
      }
    });
  });
});

describe("registry", () => {
  it("registers at least one course with content", () => {
    expect(COURSES.length).toBeGreaterThan(0);
  });

  it("keeps the Hebrew course at the breadth the roadmap assumes", () => {
    const c = contentFor("shoresh");
    expect(c.units.length).toBeGreaterThanOrEqual(12);
    expect(c.words.length).toBeGreaterThanOrEqual(40);
    expect(c.passages.length).toBeGreaterThanOrEqual(5);
  });
});
