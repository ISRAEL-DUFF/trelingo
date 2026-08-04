/**
 * 1 John — the first whole-text Koine course.
 *
 * Split by provenance, as every other course is:
 *
 *   generated.ts  vocabulary, families and passages DERIVED from MorphGNT by
 *                 scripts/import-morphgnt.mjs --book. Regenerate, don't edit.
 *   units.ts      the path — DERIVED here too, from the text's own order.
 *
 * Human judgement lives in scripts/build-1john-glossary.mjs: glosses,
 * distractors, teaching notes, families, and the 76 hand-checked stems the
 * corpus cannot derive.
 *
 * WHAT THIS BOOK FIXES. Until now the app held two whole Hebrew books, 133
 * verses between them, against four Koine verses and two Attic. Greek was a
 * demonstration, not a course — scan-and-find could not run there at all for
 * want of text. This is 105 verses.
 */
import { CONTENT_SCHEMA_VERSION, type ContentBundle } from "../../schema";
import { families, words, passages } from "./generated";
import { sections, units } from "./units";

export const greek1JohnBundle = {
  schemaVersion: CONTENT_SCHEMA_VERSION,
  families,
  words,
  units,
  passages,
  sections,
} satisfies ContentBundle;

/** What a Koine specialist should check before this reaches real learners. */
export const ONE_JOHN_REVIEW_NOTES: { id: string; note: string }[] = [
  {
    id: "scope",
    note: "The whole letter — 105 verses, 2,137 running words, 233 distinct lemmas of which 179 are taught as vocabulary, 53 units across 5 chapters. Chosen on measured grounds: 9.2 tokens per lemma and only 38% of its vocabulary occurring once, against Jude's 74% and Mark's 48%. It is the densest repetition of any candidate book and a fifth the size of Mark.",
  },
  {
    id: "glosses",
    note: "All 233 lemmas carry hand-written glosses and hand-picked distractors, including the 54 function words the course does not teach as vocabulary — a token with no glossary entry renders a blank tap-to-gloss card, and this letter is 359 occurrences of ὁ. Glosses are short TEACHING meanings, not lexicon entries: κόσμος is 'the world' where the letter means human life organised without God, and ἱλασμός is given as 'an atoning sacrifice' where no English word fits.",
  },
  {
    id: "stems",
    note: "76 of 179 taught words carry a HAND-CHECKED stem rather than a derived one, far more than the Gospels track's 13. The cause is structural: paradigm invariance takes the common prefix across a lemma's attested forms, and a Greek verb's augment (ἠγάπησεν) and perfect reduplication (πεπίστευκα) share no leading letter with the present. Filtering augmented indicatives out was tried and REJECTED — it lifted coverage from 103 words to 143 while producing confidently wrong stems, disagreeing with 12 of the 13 hand-verified overrides (πιστεύω came out as 'π', μένω as 'μέ'). These 76 are the least trustworthy content here and should be checked one by one.",
  },
  {
    id: "frequency",
    note: "Every word carries occurrences in 1 John and across the whole New Testament, counted from MorphGNT. νίκη 'victory' in 5:4 is a genuine New Testament hapax legomenon and is badged as one — the first word in any Greek track to earn it. Several others are near-hapax and are not badged: ἀγγελία and ἱλασμός occur twice in the NT, χρῖσμα and ἀνθρωποκτόνος three times, all of them concentrated in this letter.",
  },
  {
    id: "translation",
    note: "World English Bible, public domain, fetched by scripts/fetch-web-nt.mjs, which pins the translation by name and asserts its licence per chapter before writing anything. The WEB was chosen over the ASV and the KJV because it is explicitly DEDICATED to the public domain rather than merely old — the KJV carries a perpetual Crown right in the United Kingdom, which a project this careful about NonCommercial conflicts should not take on when a cleaner option exists.",
  },
  {
    id: "chapter-balance",
    note: "The chapters are very uneven: chapter 2 introduces 62 new lexemes and chapter 5 only 14. That is the letter's own shape — it circles back on the same vocabulary — and it means the later units are far lighter than their verse counts suggest. The section headers show the new-word counts rather than pretending otherwise.",
  },
  {
    id: "no-parse-on-verb-headwords",
    note: "Verb headwords carry no parse. A Greek verb's citation form is 1st singular present active indicative by definition, so sampling an occurrence can only mislead — the Gospels importer once labelled κρίνω 'future' by matching a future form. Passage tokens keep their real parses.",
  },
];
