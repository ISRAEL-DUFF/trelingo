import { validateBundle, type ContentBundle, CONTENT_SCHEMA_VERSION } from "./schema";
import { roots, rootById } from "./roots";
import { words, wordById } from "./words";
import { units, unitById } from "./units";
import { passages, passageById } from "./passages";

export const rawBundle = {
  schemaVersion: CONTENT_SCHEMA_VERSION,
  roots,
  words,
  units,
  passages,
} satisfies ContentBundle;

export { roots, words, units, passages, rootById, wordById, unitById, passageById };
export * from "./schema";

/** Words grouped by root — powers the root browser (spec §4 Phase 4). */
export const wordsByRoot = words.reduce<Record<string, typeof words>>((acc, w) => {
  (acc[w.rootId] ??= []).push(w);
  return acc;
}, {});

/** Every passage a given root appears in, for the root card's "seen in" list. */
export const passagesByRoot = passages.reduce<Record<string, string[]>>((acc, p) => {
  for (const t of p.tokens) {
    if (!t.rootId) continue;
    (acc[t.rootId] ??= []).push(p.id);
  }
  for (const k of Object.keys(acc)) acc[k] = [...new Set(acc[k])];
  return acc;
}, {});

/** Unit that introduces a given word, for "you learned this in…" links. */
export const unitByWordId = units.reduce<Record<string, string>>((acc, u) => {
  for (const id of u.wordIds) acc[id] ??= u.id;
  return acc;
}, {});

export function getContent(): ContentBundle {
  const { bundle, errors } = validateBundle(rawBundle);
  if (errors.length) {
    throw new Error(`Content failed validation:\n${errors.map((e) => `  - ${e}`).join("\n")}`);
  }
  return bundle;
}

/**
 * Items a Hebraist should check before this content is shown to real learners.
 * Kept in the codebase rather than a side document so it travels with the data;
 * surfaced in Settings → Content provenance.
 */
export const CONTENT_REVIEW_NOTES: { id: string; note: string }[] = [
  {
    id: "shamayim",
    note: "The root of שָׁמַיִם is genuinely disputed. Filed under שׁ־מ־י here for teaching consistency; a specialist may prefer to present it as an unanalysed noun.",
  },
  {
    id: "roots-general",
    note: "Root glosses are deliberately short 'core meanings' for teaching. They are not lexicon entries and flatten real semantic range.",
  },
  {
    id: "transliteration",
    note: "Transliteration follows a broadly academic (SBL-style) scheme. It has not been checked for consistency against a single published standard.",
  },
  {
    id: "passages-cantillation",
    note: "Verses carry vowel points but no cantillation marks. Confirm this matches how you want learners to first meet the text.",
  },
  {
    id: "u11-tr-1",
    note: "שֹׁמֵר יִשְׂרָאֵל is quoted from Psalm 121:4, which is outside the units' vocabulary. Included as a participle example; move or gloss it if that breaks the 'only what you've covered' rule.",
  },
];
