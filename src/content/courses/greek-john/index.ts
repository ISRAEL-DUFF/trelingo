/**
 * John — the whole gospel.
 *
 * Split by provenance as every course is: generated.ts derived from MorphGNT,
 * units.ts from the text's own order, human judgement in
 * scripts/build-john-glossary.mjs.
 *
 * WHAT THIS BOOK COST, AND WHY SO LITTLE. John is 15,438 running words — more
 * than Mark — over just 999 lemmas, the highest token-per-lemma ratio of any
 * book measured at 15.5. Only 341 of those lemmas needed a gloss written:
 * Mark, 1 John and the Gospels track already covered 658. Mark took two passes;
 * John took one, on more text. That is what a corpus pipeline is for.
 */
import { CONTENT_SCHEMA_VERSION, type ContentBundle } from "../../schema";
import { families, words, passages } from "./generated";
import { sections, units } from "./units";

export const greekJohnBundle = {
  schemaVersion: CONTENT_SCHEMA_VERSION,
  families,
  words,
  units,
  passages,
  sections,
} satisfies ContentBundle;

/** What a Koine specialist should check before this reaches real learners. */
export const JOHN_REVIEW_NOTES: { id: string; note: string }[] = [
  {
    id: "scope",
    note: "The whole gospel — 866 verses, 15,438 running words, 869 taught lexemes, 21 chapters. The largest track in the app by running words. John repeats itself more than any other book here: 15.5 tokens per lemma, against Mark's 8.4 and Ruth's 4.2, which is why a small vocabulary carries so much text.",
  },
  {
    id: "glosses",
    note: "341 entries are written for this course; 1,407 are reused from the Mark, 1 John and Gospels glossaries. NONE are auto-generated. Reused entries gloss passage tokens but are taught only where the word occurs in John. A specialist should still read the 341 — they include the vocabulary peculiar to this gospel, where a general NT gloss is least likely to fit.",
  },
  {
    id: "vocabulary-shape",
    note: "Chapter 1 introduces 159 new words and chapter 17 introduces TWO. The farewell discourse (13–17) is almost entirely vocabulary the reader already has, which makes it by far the easiest continuous Greek in the app despite its reputation. The section headers carry the counts.",
  },
  {
    id: "unsplit-words",
    note: "321 of 869 taught words carry no morpheme highlight, because paradigm invariance cannot establish a stem. They are taught plain rather than dropped — the same rule Hebrew has always applied to unrooted words. Nothing is guessed.",
  },
  {
    id: "translation",
    note: "World English Bible, public domain, fetched by scripts/fetch-web-nt.mjs with the translation pinned by name and its licence asserted per chapter. The English has 879 verses against 866 of Greek: SBLGNT omits John 5:4 and brackets 7:53–8:11, the pericope adulterae, which the WEB retains. See the note below.",
  },
  {
    id: "pericope-adulterae",
    note: "John 7:53–8:11, the woman taken in adultery, is ABSENT from the Greek here because SBLGNT does not print it — the manuscript evidence places it outside the earliest text of John, and different editions handle it differently. The English translation includes it, so a learner reading both will find twelve verses with no Greek beneath them. That is a genuine textual question, not a defect, and it should probably be surfaced in the app rather than left to be discovered.",
  },
  {
    id: "no-parse-on-verb-headwords",
    note: "Verb headwords carry no parse, for the same reason as every other Greek track: a citation form is 1st singular present active indicative by definition, so sampling an occurrence can only mislead.",
  },
];
