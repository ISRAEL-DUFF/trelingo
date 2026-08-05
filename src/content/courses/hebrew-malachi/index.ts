/**
 * Malachi — the sixth whole-text Hebrew course.
 *
 * Split by provenance, as the others are:
 *
 *   generated.ts  vocabulary, families and passages DERIVED from OSHB and
 *                 Strong's by scripts/import-oshb.mjs. Regenerate, don't edit.
 *   units.ts      the path — DERIVED here too, from the text's own order.
 *
 * Human judgement lives in scripts/build-malachi-glossary.mjs.
 *
 * WHY IT FOLLOWS HAGGAI. On its own Malachi needs 113 new glosses; after Haggai
 * it needs 101. The two are both post-exilic, both preoccupied with the temple
 * and its priesthood, and both use the messenger vocabulary that gives Malachi
 * his name — so the order was chosen for the overlap, the same reasoning that
 * put Matthew after John rather than Luke.
 */
import { CONTENT_SCHEMA_VERSION, type ContentBundle } from "../../schema";
import { families, words, passages } from "./generated";
import { sections, units } from "./units";

export const hebrewMalachiBundle = {
  schemaVersion: CONTENT_SCHEMA_VERSION,
  families,
  words,
  units,
  passages,
  sections,
} satisfies ContentBundle;

/** What a Hebraist should check before this reaches real learners. */
export const MALACHI_REVIEW_NOTES: { id: string; note: string }[] = [
  {
    id: "scope",
    note: "The whole book — 55 verses, 876 running words, 306 lexemes, 28 units across 3 chapters. Second smallest track in the app after Haggai.",
  },
  {
    id: "chapters",
    note: "THREE chapters, not four. The Hebrew runs to 3:24; what English Bibles print as chapter 4 is 3:19–24 here. The WLC and JPS 1917 both use the Hebrew numbering so they align without adjustment, but a reader coming from an English Bible will find the last six verses — the Elijah promise — one chapter earlier than expected. Worth a word in the UI rather than only in this note.",
  },
  {
    id: "why-this-book",
    note: "Selected by the same measurement that chose Haggai: against the 1,047 lexemes the four earlier Hebrew tracks teach, Malachi already reads at 77% of its running words and 71 more carry it past 95%. Only Haggai and Obadiah score better.",
  },
  {
    id: "glosses",
    note: "All 306 lexemes carry hand-written glosses and hand-picked distractors. 105 were written for this book; the rest are inherited from the five earlier Hebrew tracks, Haggai included. A Hebraist should read all of them.",
  },
  {
    id: "registers",
    note: "Three vocabularies a reader of the earlier tracks will not have. The cult — מִנְחָה, מִזְבֵּחַ, tithes, blind and lame animals. The covenant — בְּרִית six times and בָּגַד 'to deal treacherously' five. And the assayer's workshop in chapter 3: refiner's fire, fuller's soap, silver strained clear. The last of these is where the book's best-known image lives and the glosses lean into the metallurgy.",
  },
  {
    id: "gaal-collision",
    note: "גָּאַל in 1:7 means 'to defile'. It is spelled identically to the גָּאַל 'to redeem' that the Ruth track teaches over four chapters, and they are unrelated roots. The gloss carries a note saying so; a reviewer should judge whether that is prominent enough, because a learner arriving from Ruth will read the wrong word without noticing.",
  },
  {
    id: "hapax",
    note: "Five true hapax legomena: מַלְאָכִי the prophet's own name, מַתְּלָאָה 'what a weariness' (the priests' snort in 1:13), חֲבֶרֶת 'companion' in the marriage passage, קְדֹרַנִּית 'in mourning garb', and עָסַס 'to tread down'. Counts are over all 39 books of the Tanakh.",
  },
  {
    id: "contested",
    note: "Two places where the gloss commits and scholars do not. קָבַע in 3:8 — 'will a man rob God?' — is rare enough that 'defraud' is a live alternative, and the note says so. And whether מַלְאָכִי is a personal name at all, or a title lifted from 3:1, is unsettled; the gloss treats it as a name because the book's superscription does.",
  },
  {
    id: "roots",
    note: "121 of 306 lexemes carry a root, 93 derived by the safe primitive-root rule and 28 hand-supplied where the pairing is visible in Malachi itself. Strong's derivation chains are refused as everywhere else, leaving 185 unrooted.",
  },
  {
    id: "translation",
    note: "JPS 1917, public domain, via Sefaria, fetched by scripts/fetch-jps1917.mjs, which pins the version by title and asserts the licence for every chapter before writing.",
  },
];
