/**
 * Obadiah — the seventh whole-text Hebrew course, and the shortest book there
 * is.
 *
 * Split by provenance, as the others are:
 *
 *   generated.ts  vocabulary, families and passages DERIVED from OSHB and
 *                 Strong's by scripts/import-oshb.mjs. Regenerate, don't edit.
 *   units.ts      the path — DERIVED here too, from the text's own order.
 *
 * Human judgement lives in scripts/build-obadiah-glossary.mjs.
 *
 * THE THIRD BOOK CHOSEN BY MEASUREMENT, and the clearest demonstration of what
 * curation order buys. Obadiah is entirely about Edom. Malachi opens by
 * contrasting Jacob with Esau and names Edom outright — so by the time this
 * track was built, the vocabulary its whole argument runs on had already been
 * written. 61 glosses, against the 72 it would have needed before Malachi.
 */
import { CONTENT_SCHEMA_VERSION, type ContentBundle } from "../../schema";
import { families, words, passages } from "./generated";
import { sections, units } from "./units";

export const hebrewObadiahBundle = {
  schemaVersion: CONTENT_SCHEMA_VERSION,
  families,
  words,
  units,
  passages,
  sections,
} satisfies ContentBundle;

/** What a Hebraist should check before this reaches real learners. */
export const OBADIAH_REVIEW_NOTES: { id: string; note: string }[] = [
  {
    id: "scope",
    note: "The whole book — 21 verses, 292 running words, 161 lexemes, 11 units in a single chapter. The shortest book in the Hebrew Bible and the smallest track in the app.",
  },
  {
    id: "citation",
    note: "Obadiah has no chapters, so it is normally cited bare — verse 15, not 1:15. The corpus numbers it as chapter 1 and this pipeline follows, so the app reads 'Obadiah 1:15'. Most printed Bibles do the same, but a reviewer may want the display to drop the chapter for this one book.",
  },
  {
    id: "single-section",
    note: "First single-chapter track. The section strip shows one chip rather than a row. It renders correctly, but the strip exists to let a reader jump between chapters and here it does nothing — worth deciding whether to hide it when a track has only one section.",
  },
  {
    id: "glosses",
    note: "All 161 lexemes carry hand-written glosses and hand-picked distractors. Only 61 were written for this book; the rest are inherited from the six earlier Hebrew tracks. A Hebraist should read all of them.",
  },
  {
    id: "order-paid",
    note: "Malachi was curated first and it shows: עֵשָׂו, אֱדוֹם and the vocabulary of ruin all arrived with that track, and this book is about nothing else. Written before Malachi it would have needed 72 glosses. That is the third time the order of books has changed their cost.",
  },
  {
    id: "the-argument",
    note: "Verse 5 is an argument from ordinary experience — thieves take what they want and stop, grape-gatherers leave gleanings — and the glosses for גַּנָּב, בָּצַר and עֹלֵלָה carry a note saying so, because the verse only works if a reader sees that something always survives a robbery except here.",
  },
  {
    id: "hapax",
    note: "Four true hapax legomena in 21 verses: מִצְפֻּן 'hidden treasure', מָזוֹר 'a snare', קֶטֶל 'slaughter', and סְפָרָד — a place nobody can identify, usually guessed as Sardis, and identified by later Jewish tradition with Spain, which is where 'Sephardi' comes from. The note says the identification is traditional rather than established.",
  },
  {
    id: "yhwh-variant",
    note: "H3069 יְהֹוִה appears in verse 1 — the divine name pointed with the vowels of Elohim, used where אֲדֹנָי already stands beside it. OSHB keys it separately from H3068, which is why frequency totals here differ slightly from published counts. The gloss explains the pointing rather than pretending it is a different word.",
  },
  {
    id: "roots",
    note: "51 of 161 lexemes carry a root, 39 derived by the safe primitive-root rule and 12 hand-supplied. Strong's derivation chains are refused as everywhere else.",
  },
  {
    id: "translation",
    note: "JPS 1917, public domain, via Sefaria, fetched by scripts/fetch-jps1917.mjs, which pins the version by title and asserts the licence before writing.",
  },
];
