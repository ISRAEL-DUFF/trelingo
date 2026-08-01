import { describe, it, expect } from "vitest";
import {
  rawBundle,
  getContent,
  getBundle,
  availableCourseIds,
  units,
  words,
  families,
  passages,
  wordsByFamily,
} from "./index";
import { validateBundle } from "./schema";
import { lettersAt, validateLetterIndices } from "@/lib/morphology";
import { scriptOf } from "./course";

const script = scriptOf();

/**
 * Spec §5.3: "Content schema validation: CI-blocking, not just a warning."
 * These tests are the gate. If content is wrong, the build fails.
 */

/** Is `small` a subsequence of `big`? Weak families legitimately show fewer letters. */
function isSubsequence(small: string[], big: string[]): boolean {
  let i = 0;
  for (const c of big) if (i < small.length && small[i] === c) i++;
  return i === small.length;
}

describe("content bundle", () => {
  // Every registered course is validated, not just the active one — otherwise
  // adding Koine would ship unvalidated until someone switched to it.
  it.each(availableCourseIds())("%s: passes schema and referential-integrity validation", (id) => {
    const { errors } = validateBundle(getBundle(id));
    expect(errors).toEqual([]);
  });

  it.each(availableCourseIds())("%s: loads without throwing", (id) => {
    expect(() => getContent(id)).not.toThrow();
  });

  it("has at least one course registered", () => {
    expect(availableCourseIds().length).toBeGreaterThan(0);
    expect(rawBundle.words.length).toBeGreaterThan(0);
  });

  it("has the breadth the roadmap assumes", () => {
    expect(units.length).toBeGreaterThanOrEqual(12);
    expect(words.length).toBeGreaterThanOrEqual(40);
    expect(passages.length).toBeGreaterThanOrEqual(5);
  });
});

describe("root indices — the product's core claim", () => {
  it.each(words.map((w) => [w.id, w] as const))(
    "%s: every root index lands on a real consonant",
    (_id, w) => {
      const check = validateLetterIndices(script, w.text, w.morphology.highlight);
      expect(check.ok, check.ok ? "" : check.reason).toBe(true);
    },
  );

  it.each(words.map((w) => [w.id, w] as const))(
    "%s: highlighted letters are actually the declared root's letters",
    (_id, w) => {
      // Catches both mis-indexed families and words filed under the wrong root.
      const picked = lettersAt(script, w.text, w.morphology.highlight);
      const rootLetters = Array.from(script.stripDiacritics(w.familyId));
      expect(
        isSubsequence(picked, rootLetters),
        `${w.text} indices [${w.morphology.highlight}] select "${picked.join("")}", not a subsequence of root "${rootLetters.join("")}"`,
      ).toBe(true);
    },
  );

  it("never highlights the whole word (that would teach nothing)", () => {
    for (const w of words) {
      if (script.toLetterClusters(w.text).length > 3) {
        expect(w.morphology.highlight.length).toBeLessThan(script.toLetterClusters(w.text).length);
      }
    }
  });

  it("keeps root indices in ascending order, matching reading order", () => {
    for (const w of words) {
      expect(w.morphology.highlight, `${w.id}`).toEqual([...w.morphology.highlight].sort((a, b) => a - b));
    }
  });
});

describe("passage tokens", () => {
  it.each(passages.map((p) => [p.id, p] as const))("%s: token morphemes are valid", (_id, p) => {
    for (const t of p.tokens) {
      // Function words legitimately have no morpheme to highlight.
      if (!t.morphology) continue;
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
    const rootIds = new Set(families.map((r) => r.id));
    for (const p of passages) {
      for (const t of p.tokens) {
        if (t.familyId) expect(rootIds.has(t.familyId), `${p.id}: ${t.familyId}`).toBe(true);
      }
    }
  });
});

describe("unit graph", () => {
  it("is a single chain with one entry point", () => {
    const starts = units.filter((u) => u.requires === null);
    expect(starts).toHaveLength(1);
  });

  it("has no cycles and reaches every unit from the start", () => {
    const byId = new Map(units.map((u) => [u.id, u]));
    const seen = new Set<string>();
    for (const u of units) {
      let cursor: string | null = u.id;
      const path = new Set<string>();
      while (cursor) {
        expect(path.has(cursor), `cycle at ${cursor}`).toBe(false);
        path.add(cursor);
        cursor = byId.get(cursor)?.requires ?? null;
      }
      seen.add(u.id);
    }
    expect(seen.size).toBe(units.length);
  });

  it("orders units consistently with their prerequisites", () => {
    const order = new Map(units.map((u) => [u.id, u.orderIndex]));
    for (const u of units) {
      if (u.requires) expect(order.get(u.id)!).toBeGreaterThan(order.get(u.requires)!);
    }
  });

  it("gives every unit something to do", () => {
    for (const u of units) expect(u.exercises.length, u.id).toBeGreaterThan(0);
  });

  it("introduces each word in exactly one unit", () => {
    const seen = new Map<string, string>();
    for (const u of units) {
      for (const id of u.wordIds) {
        expect(seen.has(id), `${id} introduced in both ${seen.get(id)} and ${u.id}`).toBe(false);
        seen.set(id, u.id);
      }
    }
  });

  it("has non-decreasing placement levels along the chain", () => {
    const byId = new Map(units.map((u) => [u.id, u]));
    for (const u of units) {
      if (u.requires) {
        expect(u.placementLevel).toBeGreaterThanOrEqual(byId.get(u.requires)!.placementLevel);
      }
    }
  });
});

describe("exercises", () => {
  const allExercises = units.flatMap((u) => u.exercises);

  it("have unique ids across the whole bundle", () => {
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
        expect(ex.answer[f], `${ex.id} asks for ${f} but has no answer for it`).toBeDefined();
      }
    }
  });

  it("gives binyan-comparison exercises distinct glosses to match against", () => {
    for (const ex of allExercises) {
      if (ex.type !== "binyan_compare") continue;
      const glosses = ex.forms.map((f) => f.gloss);
      expect(new Set(glosses).size, ex.id).toBe(glosses.length);
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
        expect(at!, `${ex.id} drills ${ex.wordId} before it is taught`).toBeLessThanOrEqual(u.orderIndex);
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

  it("groups multiple words under the teaching families, so the root browser is not empty", () => {
    const taught = ["שׁמר", "אהב", "דבר", "גדל", "רעה", "אלה", "קרא"];
    for (const r of taught) {
      expect(wordsByFamily[r]?.length ?? 0, `root ${r}`).toBeGreaterThanOrEqual(2);
    }
  });

  it("uses ids that are stable, url-safe and unique", () => {
    for (const w of words) expect(w.id, w.id).toMatch(/^[a-z0-9-]+$/);
    expect(new Set(words.map((w) => w.id)).size).toBe(words.length);
  });
});
