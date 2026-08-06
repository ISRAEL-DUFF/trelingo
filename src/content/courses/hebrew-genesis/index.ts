/**
 * Genesis 1–11 — the primeval history.
 *
 * Split by provenance, as every course is:
 *
 *   generated.ts  vocabulary, families and passages DERIVED from OSHB and
 *                 Strong's by scripts/import-oshb.mjs. Regenerate, don't edit.
 *   units.ts      the path — DERIVED here too, from the text's own order.
 *
 * Human judgement lives in scripts/build-genesis-glossary.mjs.
 *
 * THE FIRST TRACK THAT IS A SLICE OF A BOOK RATHER THAN A WHOLE ONE, and the
 * reason is arithmetic. Genesis entire needs 973 new glosses on top of the 577
 * lemmas the seven earlier Hebrew tracks already cover — more than Luke, which
 * was parked for exactly that. Chapters 1–11 need 285.
 *
 * The seam is real rather than convenient. The primeval history is a unit: it
 * runs from creation to the scattering at Babel and closes on Terah's family
 * leaving Ur, with 11:30 — 'and Sarai was barren' — setting the problem the
 * whole Abraham cycle answers. Stopping at 12:1 stops where the text does.
 *
 * WHAT THE SEVEN EARLIER TRACKS PAID FOR. 80.7% of Genesis's running words were
 * already glossed before this track existed. Narrative Hebrew repeats itself,
 * and Ruth and Jonah are narrative — וַיֹּאמֶר and וַיֵּלֶךְ and אִישׁ arrived
 * years ago. That is what a corpus pipeline compounds into.
 */
import { CONTENT_SCHEMA_VERSION, type ContentBundle } from "../../schema";
import { families, words, passages } from "./generated";
import { sections, units } from "./units";

export const hebrewGenesisBundle = {
  schemaVersion: CONTENT_SCHEMA_VERSION,
  families,
  words,
  units,
  passages,
  sections,
} satisfies ContentBundle;

/** What a Hebraist should check before this reaches real learners. */
export const GENESIS_REVIEW_NOTES: { id: string; note: string }[] = [
  {
    id: "scope",
    note: "Genesis 1–11 only — 299 verses, 3,793 running words, 604 taught lexemes, 151 units over 11 chapters. Chapters 12–50 are a further 728 glosses and are not in this track. The path stops at 11:32, the death of Terah.",
  },
  {
    id: "glosses",
    note: "285 entries are written for this course; 1,271 are reused from the Jonah, Ruth, Esther, Ecclesiastes, Haggai, Malachi and Obadiah glossaries. NONE are auto-generated — the importer reported 0 auto-filled distractor sets. A specialist should still read the 285: they carry the cosmological vocabulary, which is where a general gloss is least likely to fit.",
  },
  {
    id: "the-hardest-words-are-first",
    note: "Chapter 1 introduces 96 new words and chapter 2 another 87 — a third of the track's vocabulary in its first two chapters, because רָקִיעַ, מָאוֹר, תֹהוּ, בֹּהוּ, צֶלֶם and דְּמוּת occur almost nowhere else. Several have no clean English at all and the glosses are teaching compromises, not lexicography. תֹהוּ וָבֹהוּ in particular is glossed as two words although it functions as one phrase.",
  },
  {
    id: "puns-are-notes-never-roots",
    note: "These chapters turn on wordplay — נֹחַ/נחם at 5:29, חַוָּה/חַי at 3:20, פֶּלֶג/פָּלַג at 10:25, יֶפֶת/פָּתָה at 9:27, בָּבֶל/בָּלַל at 11:9, אָדָם/אֲדָמָה throughout, and עָרוּם/עֵירֹם across 2:25–3:1. Every one is described in a teaching note and NONE is encoded as a shared root, because most are phonetic echoes rather than etymologies. A reviewer should check that the notes claim only what the text claims.",
  },
  {
    id: "roots",
    note: "173 of 604 lexemes carry a root (29%) — 137 derived by the safe Strong's rule, 36 hand-supplied. Four were declined because the form is weak and does not contain its radical. 427 have no primitive root reachable without chaining, and are taught plain rather than guessed at. Hand-supplied roots here are רמשׂ, שרץ, שרף and נוע, each supplied only because the learner meets both family members inside these eleven chapters.",
  },
  {
    id: "genealogies",
    note: "Chapters 5, 10 and 11 are a third of the track. Chapter 10 alone introduces 94 new words, nearly all proper names — the Table of Nations is roughly seventy peoples and places in one list. They are glossed and taught rather than skipped, but a reviewer may reasonably think a learner does not need to hold the Girgashite in spaced repetition, and the placement levels are the lever if so.",
  },
  {
    id: "translation",
    note: "JPS 1917, public domain, fetched by scripts/fetch-jps1917.mjs with the version pinned by title and its licence asserted per chapter. 299 verses of Hebrew, 299 of English, aligned without adjustment — Genesis has no versification divergence in this range.",
  },
  {
    id: "divine-name",
    note: "יְהוָה is glossed 'the LORD (YHWH)', inherited from the Jonah glossary, and Genesis 2–3 uses the compound יְהוָה אֱלֹהִים throughout, which OSHB tokenises as two words. A reader meets them as two taught lexemes side by side rather than as one name.",
  },
];
