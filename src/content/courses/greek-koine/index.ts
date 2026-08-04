/**
 * Koine Greek course bundle.
 *
 * Split by provenance, deliberately:
 *
 *   generated.ts  vocabulary, families and passages DERIVED from MorphGNT by
 *                 the pipeline in scripts/. Do not edit by hand — regenerate.
 *   units.ts      the learning path, HAND-AUTHORED. A corpus can tell you what
 *                 a word means morphologically, not what to teach first.
 *
 * Glosses and distractors inside generated.ts come from
 * scripts/koine-glossary.json and are the human contribution to an otherwise
 * derived file. See CONTENT_REVIEW_NOTES below for what still needs a specialist.
 */
import { CONTENT_SCHEMA_VERSION, type ContentBundle } from "../../schema";
import { families, words, passages } from "./generated";
import { units } from "./units";

export const greekKoineBundle = {
  schemaVersion: CONTENT_SCHEMA_VERSION,
  families,
  words,
  units,
  passages,
} satisfies ContentBundle;

/** What a Koine specialist should check before this reaches real learners. */
export const KOINE_REVIEW_NOTES: { id: string; note: string }[] = [
  {
    id: "frequency",
    note: "Every word carries two counts: occurrences in this track's four verses, and occurrences across the whole New Testament, counted from MorphGNT by scripts/build-greek-frequency.mjs (137,554 tokens, 5,461 lemmas). Spot-checked against standard figures: λόγος 330 and ζωή 135 and ἀρχή 55 are exact; θεός reads 1,307 against the usual ~1,317 because SBLGNT differs from the editions those counts are quoted from. The NT is a COMPLETE corpus, so a lemma occurring once in it is a genuine hapax legomenon and the badge is earned — none of this track's 47 words is one, since they were chosen for frequency.",
  },
  {
    id: "glosses",
    note: "Glosses are standard short NT lexical meanings chosen for teaching. They flatten real semantic range and are not lexicon entries. λόγος in particular carries far more than “word”.",
  },
  {
    id: "stem-overrides",
    note: "12 verbs and 1 adjective (αἰώνιος) have a hand-supplied stem because the corpus could not derive one — contract, suppletive and μι-verbs, per spike-a-findings.md §4.4. These are the least trustworthy splits in the course and should be checked first.",
  },
  {
    id: "families",
    note: "Family grouping is a curation decision, not a derived one. λόγος and λέγω are filed together despite the ο/ε ablaut; a specialist may prefer to separate them, or to group more widely.",
  },
  {
    id: "corpus-slice",
    note: "Stems were derived from Matthew, Mark, Luke, John, Acts and Romans only. A fuller corpus would give richer paradigms and reduce the number of manual overrides.",
  },
  {
    id: "attic",
    note: "The Attic course is built from AGDT 2.1 by its own spike and pipeline and is cleared to ship — see ATTIC_REVIEW_NOTES in courses/greek-attic. Nothing there affects Koine. Koine's own licences carry no NonCommercial clause, but they are not obligation-free: MorphGNT is CC BY-SA, so this course's derived parses inherit ShareAlike and must be redistributed under a compatible licence. See NOTICE.md.",
  },
];
