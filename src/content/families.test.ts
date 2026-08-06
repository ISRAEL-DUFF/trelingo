import { describe, it, expect } from "vitest";
import { contentFor } from "@/content";
import { courses, type CourseId } from "@/content/course";

/**
 * A family is a claim that two words share a root. It has to be true.
 *
 * THE BUG THESE PIN. Both Greek importers derive a stem as the longest common
 * prefix across a lemma's attested forms, then used that string as the
 * `familyId`. For compound verbs the augment breaks the prefix at the
 * preposition — ἀναβαίνω has ἀνέβη among its forms — so every ἀνα- verb landed
 * in a family called ἀν, seventeen members deep, alongside ἀνήρ, "a man".
 *
 * The app's central claim is that a shared morpheme pays off across a family.
 * The family sheet was disproving it. See scripts/greek-families.mjs.
 */

const GREEK = courses.filter((c) => c.language === "greek").map((c) => c.id);
const HEBREW = courses.filter((c) => c.language === "hebrew").map((c) => c.id);

/** familyId -> the distinct words filed under it, across every track. */
function familiesAcross(ids: CourseId[]) {
  const fam = new Map<string, Map<string, string>>();
  for (const id of ids) {
    for (const w of contentFor(id).words) {
      if (!w.familyId) continue;
      if (!fam.has(w.familyId)) fam.set(w.familyId, new Map());
      fam.get(w.familyId)!.set(w.text, w.gloss);
    }
  }
  return fam;
}

describe("Greek families", () => {
  const fam = familiesAcross(GREEK);

  it("never files a man with a verb of going up", () => {
    /*
     * The case that started it. Neither claims a family, because the only
     * thing they share is two letters.
     *
     * NEITHER KEEPS ITS HIGHLIGHT EITHER, and that was a correction made while
     * fixing this: the plan had been to drop the family and leave the split
     * alone, on the grounds that ἀν- really is invariant across ἀνήρ/ἀνδρός.
     * But the split those words carried was ἀν + αβαίνω — six letters of verb
     * marked as an ending — so it was not a defensible analysis worth keeping.
     * It also breaks content.test.ts's older invariant that a highlight must
     * name a family, since the highlight is how a learner reaches one.
     */
    const matthew = contentFor("matthew");
    const aner = matthew.words.find((w) => w.text === "ἀνήρ")!;
    const anabaino = matthew.words.find((w) => w.text === "ἀναβαίνω")!;
    expect(aner.familyId).toBeNull();
    expect(anabaino.familyId).toBeNull();
    expect(aner.morphology).toBeUndefined();
    expect(anabaino.morphology).toBeUndefined();
  });

  it("has no family whose id is a preposition", () => {
    /*
     * Greek prepositions are a closed set, so this is checkable rather than a
     * matter of taste. Before the rule these were the six largest families in
     * the app.
     */
    const prepositions = [
      "ἀν", "ἀνα", "ἀπ", "ἀπο", "ἀφ", "δι", "δια", "ἐν", "ἐξ", "ἐκ",
      "ἐπ", "ἐπι", "ἐφ", "κατ", "κατα", "καθ", "μετ", "μετα", "παρ", "παρα",
      "περι", "προ", "προσ", "συ", "συν", "συμ", "συγ", "ὑπ", "ὑπο", "ὑπερ",
      "εἰσ", "ἀντ",
    ];
    for (const p of prepositions) {
      expect(fam.has(p), `family "${p}" is a preposition, not a root`).toBe(false);
    }
  });

  it("still has συντ, a known residual, and that is a deliberate trade", () => {
    /*
     * συντρίβω and συντίθεμαι diverge one letter past συν-, giving a
     * four-letter "stem" of συντ that no length bar catches. A rule of
     * "preposition plus at most one letter" would have caught it — and also
     * caught δικ, which is δι- plus a letter by coincidence and is a real
     * family: δίκη, δίκαιος, δικαστής.
     *
     * One bogus pair is not worth one genuine family of three, so the rule
     * stayed at exact match and this survives. Pinned rather than hidden: if
     * someone finds a rule that takes συντ without taking δικ, this test is
     * where they will see that it is safe to tighten.
     */
    expect([...(fam.get("συντ")?.keys() ?? [])].sort()).toEqual(["συντίθεμαι", "συντρίβω"]);
    expect([...(fam.get("δικ")?.keys() ?? [])].length).toBeGreaterThanOrEqual(2);
  });

  it("keeps the families that are real", () => {
    const members = (id: string) => [...(fam.get(id)?.keys() ?? [])];
    expect(members("πιστ")).toEqual(expect.arrayContaining(["πιστεύω", "πίστις", "πιστός"]));
    expect(members("ἀγαπ")).toEqual(expect.arrayContaining(["ἀγαπάω", "ἀγάπη"]));
    expect(members("ψευ")).toEqual(expect.arrayContaining(["ψεύστης", "ψεῦδος"]));
  });

  it("keeps its biggest families small enough to be plausible", () => {
    /*
     * A genuine Greek family in a single book is a handful of words. Anything
     * approaching double figures means a prefix has been mistaken for a root
     * again — that is what the old ἀν(17) and ἐπ(16) looked like.
     */
    const biggest = Math.max(...[...fam.values()].map((m) => m.size));
    expect(biggest).toBeLessThanOrEqual(6);
  });
});

describe("Hebrew families", () => {
  const fam = familiesAcross(HEBREW);

  it("are built from roots rather than from spelling", () => {
    // Hebrew takes its families from Strong's primitive roots — a lexical
    // source — which is why it never had this problem. Guarded so a future
    // change to the Hebrew importer cannot quietly adopt the Greek approach.
    const biggest = Math.max(...[...fam.values()].map((m) => m.size));
    expect(biggest).toBeLessThanOrEqual(6);
  });

  it("uses consonantal roots, never a pointed or prefixed form", () => {
    /*
     * A Hebrew family id is bare consonants — no vowel points, no ha-, no wa-.
     * A vowel inside one would mean a surface form had been taken for a root:
     * Greek's failure in Hebrew dress.
     *
     * TWO SPELLINGS OF ONE LETTER ARE ALLOWED, and that is a finding rather
     * than a convenience. A shin is a LETTER, and this codebase writes it two
     * ways: the generated tracks emit the presentation form U+FB2A (one code
     * point, which is how the OSHB importer stops sin and shin ever merging),
     * while the hand-authored Shoresh track writes base + combining dot,
     * U+05E9 U+05C1 (two). Measured: 110 of 445 generated ids use FB2A/FB2B,
     * and nine Shoresh ids use the decomposed form.
     *
     * So שׁמר from Shoresh and שׁמר from a generated track are DIFFERENT STRINGS
     * and would never group together. Nothing merges families across tracks
     * today so nothing is broken, but the divergence is real and is recorded
     * here rather than papered over.
     */
    const CONSONANTS = /^[\u05D0-\u05EA\uFB2A\uFB2B\u05C1\u05C2]+$/u;
    for (const id of fam.keys()) {
      expect(CONSONANTS.test(id), `family "${id}"`).toBe(true);
    }
  });
});

describe("every family is reachable", () => {
  it("declares each family a word points at", () => {
    // A dangling familyId renders a family card with no members.
    for (const id of [...GREEK, ...HEBREW]) {
      const content = contentFor(id);
      const declared = new Set(content.families.map((f) => f.id));
      for (const w of content.words) {
        if (w.familyId) expect(declared.has(w.familyId), `${id}: ${w.text} -> ${w.familyId}`).toBe(true);
      }
    }
  });
});
