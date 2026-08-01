/**
 * Shoresh — Biblical Hebrew course bundle.
 *
 * A course owns its own families, vocabulary, units and passages outright
 * (decision D1: no shared namespace between courses). This file is the only
 * entry point; nothing outside imports the data files directly.
 */
import { CONTENT_SCHEMA_VERSION, type ContentBundle } from "../../schema";
import { families } from "./families";
import { words } from "./words";
import { units } from "./units";
import { passages } from "./passages";

export const hebrewBiblicalBundle = {
  schemaVersion: CONTENT_SCHEMA_VERSION,
  families,
  words,
  units,
  passages,
} satisfies ContentBundle;

/**
 * Items a Hebraist should check before this content reaches real learners.
 * Kept in the codebase rather than a side document so it travels with the data;
 * surfaced in Settings → Content provenance.
 */
export const CONTENT_REVIEW_NOTES: { id: string; note: string }[] = [
  {
    id: "shamayim",
    note: "The root of שָׁמַיִם is genuinely disputed. Filed under שׁ־מ־י here for teaching consistency; a specialist may prefer to present it as an unanalysed noun.",
  },
  {
    id: "families-general",
    note: "Family glosses are deliberately short 'core meanings' for teaching. They are not lexicon entries and flatten real semantic range.",
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
