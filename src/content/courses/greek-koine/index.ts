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
    note: "The Attic course is now built from AGDT 2.1 by its own spike and pipeline, but is NOT cleared to ship: its corpus licence is contradictory at source. See ATTIC_REVIEW_NOTES in courses/greek-attic. Nothing there affects Koine, whose licences are clean.",
  },
];
