/**
 * Haggai — the fifth whole-text Hebrew course, and the smallest.
 *
 * Split by provenance, as the others are:
 *
 *   generated.ts  vocabulary, families and passages DERIVED from OSHB and
 *                 Strong's by scripts/import-oshb.mjs. Regenerate, don't edit.
 *   units.ts      the path — DERIVED here too, from the text's own order.
 *
 * Human judgement lives in scripts/build-haggai-glossary.mjs.
 *
 * WHY THIS BOOK. It was chosen by measurement rather than by taste. Against the
 * 1,047 lexemes Jonah, Ruth, Esther and Ecclesiastes teach, every book of the
 * Hebrew Bible was scored on how many further words it needs to reach 95% token
 * coverage — the point at which a text is read with a lexicon rather than
 * decoded with one. Haggai came first at 32, ahead of Obadiah's 58 and
 * Malachi's 71, with the next tier above 130. It cost 61 glosses in total,
 * against Ecclesiastes' 285.
 */
import { CONTENT_SCHEMA_VERSION, type ContentBundle } from "../../schema";
import { families, words, passages } from "./generated";
import { sections, units } from "./units";

export const hebrewHaggaiBundle = {
  schemaVersion: CONTENT_SCHEMA_VERSION,
  families,
  words,
  units,
  passages,
  sections,
} satisfies ContentBundle;

/** What a Hebraist should check before this reaches real learners. */
export const HAGGAI_REVIEW_NOTES: { id: string; note: string }[] = [
  {
    id: "scope",
    note: "The whole book — 38 verses, 601 running words, 201 lexemes, 20 units across 2 chapters. The smallest track in the app by a wide margin, and deliberately so: after Ecclesiastes' 113 units, a reader should be able to finish an entire prophet in an evening.",
  },
  {
    id: "why-this-book",
    note: "Selected by measurement. Every book of the Hebrew Bible was scored on how many new words a reader of Jonah, Ruth, Esther and Ecclesiastes needs to reach 95% coverage of its running words. Haggai needs 32 — the lowest in the canon. It already reads at 76% before a single new word is learned.",
  },
  {
    id: "glosses",
    note: "All 201 lexemes carry hand-written glosses and hand-picked distractors. Only 61 were written for this book; the other 140 are inherited from the four earlier Hebrew tracks. A Hebraist should read all of them.",
  },
  {
    id: "hosts",
    note: "צָבָא is the commonest word a reader will not already know — 14 occurrences in 38 verses, nearly all in יְהוָה צְבָאוֹת. It is glossed 'an army, a host' with a note on the title, but a reviewer may prefer to teach the phrase as a unit rather than the noun on its own, since it almost never appears alone here.",
  },
  {
    id: "ambiguity",
    note: "חֶמְדַּת כָּל־הַגּוֹיִם in 2:7 is genuinely contested — 'the desire of all nations' or 'the treasures of all nations', with the verb singular and the noun plural. The gloss on חֶמְדָּה gives 'desire, what is precious' and the note says the argument exists rather than settling it.",
  },
  {
    id: "torah",
    note: "תּוֹרָה in 2:11 is glossed 'instruction, law' with a note that here it means a specific priestly ruling rather than the Pentateuch. That distinction matters and a reviewer should confirm the note is doing enough work, since the reader's next encounter with the word will almost certainly be the other sense.",
  },
  {
    id: "hapax",
    note: "One true hapax legomenon: מַלְאֲכוּת 'a message' in 1:13, which occurs nowhere else in the Hebrew Bible. It sits next to מַלְאָךְ 'messenger' in the same clause — Haggai is called the LORD's messenger delivering the LORD's message — and the note says so.",
  },
  {
    id: "dates",
    note: "Every oracle is dated by regnal year, month and day of Darius I, which makes this the most precisely dated book in the Hebrew Bible. The unit titles preserve the dates. The ordinals שִׁשִּׁי 'sixth' and תְּשִׁיעִי 'ninth' are taught for that reason and for no other.",
  },
  {
    id: "roots",
    note: "60 of 201 lexemes carry a root, all but 9 derived by the safe primitive-root rule; Strong's 'from HXXXX' chains are refused as everywhere else. No root was refused for an elided radical.",
  },
  {
    id: "translation",
    note: "JPS 1917, public domain, via Sefaria, fetched by scripts/fetch-jps1917.mjs, which pins the version by title and asserts the licence for every chapter before writing.",
  },
];
