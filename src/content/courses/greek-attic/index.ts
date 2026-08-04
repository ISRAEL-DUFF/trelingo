/**
 * Attic Greek course bundle.
 *
 * Split by provenance exactly as Koine is:
 *
 *   generated.ts  vocabulary, families and passages DERIVED from AGDT 2.1 by
 *                 scripts/import-agdt.mjs. Do not edit by hand — regenerate.
 *   units.ts      the learning path, HAND-AUTHORED.
 *
 * LICENCE: CC BY-SA 3.0 US, from the upstream Perseus treebank. This content
 * is an adaptation and inherits ShareAlike — see NOTICE.md and the `licence`
 * entry in ATTIC_REVIEW_NOTES. The remaining caveats below are about CONTENT
 * QUALITY (corpus size, Thucydides weighting, hand-supplied stems), not rights.
 */
import { CONTENT_SCHEMA_VERSION, type ContentBundle } from "../../schema";
import { families, words, passages } from "./generated";
import { units } from "./units";

export const greekAtticBundle = {
  schemaVersion: CONTENT_SCHEMA_VERSION,
  families,
  words,
  units,
  passages,
} satisfies ContentBundle;

/** What has to be settled before this reaches real learners. */
export const ATTIC_REVIEW_NOTES: { id: string; note: string }[] = [
  {
    id: "licence",
    note: "RESOLVED — the course may ship. Content is built from the UPSTREAM AGDT 2.1 XML, whose repository is the copyright holder's own (Perseus Digital Library, Tufts University) and states CC BY-SA 3.0 US. The Universal Dependencies conversion of the same treebank is labelled CC BY-NC-SA 2.5; a downstream converter cannot add a NonCommercial restriction to BY-SA material, so that label is the conversion's problem, and we never use it. Trelingo is free and non-commercial besides, so our use is permitted under either reading. What remains is an obligation rather than a blocker: credit Perseus, and redistribute this derived content under BY-SA 3.0 US or a later compatible version. See NOTICE.md.",
  },
  {
    id: "corpus-narrowness",
    note: "The corpus is Thucydides 1, Plato's Euthyphro and four speeches of Lysias — 34,023 tokens, a third of the Koine slice. The build plan assumed Xenophon's Anabasis and Plato's Apology; AGDT 2.1 contains neither. 52.7% of inflected lemmas appear in a single form, which is why there are 10 hand-supplied stems here against Koine's 13 on triple the data.",
  },
  {
    id: "thucydides-weight",
    note: "Thucydides is 66% of the available prose and is famously difficult. The unit ordering leans on Plato and on transparent paradigms to compensate, but a beginner course resting this heavily on Thucydides is a compromise, not a design.",
  },
  {
    id: "dialect-filter",
    note: "Only Attic prose is read, and forms whose first letter differs from the lemma's are dropped from stem derivation — 7,641 of 34,023 tokens. That filter targets crasis (τἀνθρώπων) and Doric alpha (ἁμέρα for ἡμέρα), which took the spike's spot check from 8/8 to 6/8 when tragedy was pooled in. It is a blunt instrument and will also drop some legitimate forms.",
  },
  {
    id: "stem-overrides",
    note: "10 entries carry a hand-supplied stem: the verbs (λέγω, ἔχω, ποιέω, ἡγέομαι, παρέχω), θάλασσα, χρῆμα, μέγας, νεώτερος and Ἀθηναῖος. These are the least trustworthy splits in the course. μέγας and χρῆμα are genuinely irregular — their real stems (μεγαλ-, χρηματ-) are invisible in the nominative — and the notes on those entries say so.",
  },
  {
    id: "omissions",
    note: "Two frequent words were cut. πολύς: its derived stem πολ- collides with πόλις, and it is suppletive besides (πολλή, πολλῶν). γῆ: its stem really is the single letter γ-, the word being a contraction of γέα, so the split γ|ῆ is correct and useless at once. A specialist may want either back with a hand-built family.",
  },
  {
    id: "passage-highlighting",
    note: "Passage tokens are only split where the glossary vouches for the stem AND the surface form actually begins with it. That is why γέγονεν in the Euthyphro passage carries no highlight: γίγνομαι reduplicates, and a fixed stem length would have cut it at γέγο|νεν. Silence is the correct output there, but it does mean the passages teach less than they look like they should.",
  },
  {
    id: "glosses",
    note: "As with Koine, glosses are short teaching meanings, not lexicon entries. δίκη ranges from “custom” to “penalty”; λόγος in Plato is usually “argument”, not “word”.",
  },
  {
    id: "frequency",
    note: "Frequencies are counted across the WHOLE Perseus treebank — 33 works, 549,289 tokens — not merely the Attic prose subset this course reads from, because a broader reference is a more useful number. It is still a SAMPLE of Greek, so it is marked incomplete and no Attic word can ever be labelled a hapax legomenon: a lemma occurring once in half a million tokens may be perfectly ordinary in a literature of millions. Koine gets the badge because the New Testament is a complete corpus; Attic has no equivalent and does not pretend to.",
  },
];
