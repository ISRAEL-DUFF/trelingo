/**
 * Matthew — the fourth whole Koine book.
 *
 * Split by provenance, as the others are:
 *
 *   generated.ts  vocabulary, families and passages DERIVED from MorphGNT and
 *                 the SBLGNT by scripts/import-morphgnt.mjs. Regenerate, don't
 *                 edit.
 *   units.ts      the path — DERIVED here too, from the text's own order,
 *                 because a continuous book supplies its own sequence.
 *
 * Human judgement lives in scripts/build-matthew-glossary.mjs: glosses,
 * distractors, teaching notes, and the ids that keep two words apart.
 *
 * WHAT THIS BOOK PROVED. That the ORDER books are added in changes what they
 * cost. Luke was the obvious next Gospel when Mark was done; after John landed,
 * Matthew needed 526 new glosses against Luke's 934 for the same amount of
 * text, because Matthew's overlap with Mark is enormous and Luke's is not.
 * Re-measuring before curating saved roughly four hundred glosses of work.
 */
import { CONTENT_SCHEMA_VERSION, type ContentBundle } from "../../schema";
import { families, words, passages } from "./generated";
import { sections, units } from "./units";

export const greekMatthewBundle = {
  schemaVersion: CONTENT_SCHEMA_VERSION,
  families,
  words,
  units,
  passages,
  sections,
} satisfies ContentBundle;

/** What a Koine specialist should check before this reaches real learners. */
export const MATTHEW_REVIEW_NOTES: { id: string; note: string }[] = [
  {
    id: "scope",
    note: "The whole gospel — 1,068 verses, 18,329 running words, 1,519 taught words across 1,015 families, 538 units over 28 chapters. It is the largest track in the app. Chapter 5 introduces 119 new words and chapter 28 introduces eight: the Sermon on the Mount and the parable chapter carry Matthew's own vocabulary, and the passion narrative is almost all words the reader already has from Mark.",
  },
  {
    id: "glosses",
    note: "526 lemmas were written for this book; the remaining 1,154 are inherited from the John, Mark, 1 John and Gospels glossaries, because a Greek word means what it means and re-authoring θεός would only be a fresh chance to disagree with myself. All carry hand-picked distractors — none auto-generated. They are short TEACHING meanings for a beginner reading Matthew, not lexicon entries. A Koine specialist should read all of them.",
  },
  {
    id: "the-hard-word",
    note: "ἐπιούσιος in the Lord's Prayer (6:11) is glossed 'daily, for the coming day' and that is a reasoned guess, not a translation. The word occurs nowhere else in surviving Greek literature before this, and the traditional English rendering rests on Jerome as much as on evidence. A reviewer should decide whether a beginner's gloss ought to admit the uncertainty on the card itself.",
  },
  {
    id: "untranslated-words",
    note: "Matthew leaves four words in their Semitic form and the glosses follow him rather than smoothing them over: ῥακά (5:22, an Aramaic insult he does not translate), μαμωνᾶς (6:24, treated as the name of a rival master), κορβανᾶς (27:6, the temple treasury) and ἠλί (27:46, which he then translates himself). κουστωδία (27:65) is the reverse case — a Latin loanword, custodia, in Greek dress.",
  },
  {
    id: "id-collisions",
    note: "Six pairs collapse to the same id once breathings and accents are dropped in transliteration: ὅλος/ὅλως, δέ/δή, γῆ/γέ, ἕκτος/ἐκτός, δῶμα/δόμα and ὅμως/ὦμος. The builder's collision guard caught every one; without it the second word of each pair would have silently overwritten the first learner's card. The six carry explicit hand-assigned ids, which a reviewer should sanity-check.",
  },
  {
    id: "function-words",
    note: "Fourteen glossed words are not taught as vocabulary because their part of speech marks them function words — ἔνθεν, ποσάκις, ἑπτάκις, ἑβδομηκοντάκις, ἕνεκα, παραχρῆμα, ἐντός, ἐκτός, πικρῶς, διό, καθά, ἀπέναντι, μήτε, γέ. They still gloss on tap inside a passage; they simply do not become SRS cards. That rule was added during Mark to stop ὁ and καί becoming vocabulary, and it catches some real adverbs as collateral.",
  },
  {
    id: "unattested-entries",
    note: "755 inherited glossary entries were skipped because the words do not occur in Matthew — ἀντίχριστος and παράκλητος from 1 John, Κάϊν, σφάζω and the rest. The importer teaches only what the book actually attests, which is the rule that keeps a track's vocabulary honest to its own text.",
  },
  {
    id: "missing-verses",
    note: "17:21, 18:11 and 23:14 are absent. They are not an import failure: the SBLGNT critical text does not print them, judging them later harmonising additions from Mark and Luke. Units group by the verses that exist, so chapter 23 has a unit spanning 13–15, and the subtitle shows the true range rather than implying unbroken numbering. The WEB English fetched for the book has 1,071 verses against the Greek's 1,068 for the same reason.",
  },
  {
    id: "hapax",
    note: "95 words occur exactly once in the whole New Testament. That is the highest count of any track here, and it is concentrated in Matthew's own material: the farm tools of chapter 3, the spices of the woes in 23, the coins, the birds, and some two dozen names from the genealogy. Frequency counts are over the complete New Testament, so the hapax badge is earned rather than inferred from this book alone.",
  },
  {
    id: "names",
    note: "The genealogy of 1:1–17 introduces around forty proper names in fourteen verses, most occurring twice and never again. They are taught because the chapter cannot be read without them, but they carry almost no transfer, and a reviewer may reasonably want the first six units handled differently — as a reading exercise rather than a vocabulary one.",
  },
  {
    id: "cross-track",
    note: "Two names in the genealogy are people this app already teaches from the Hebrew side: Βόες is the Boaz of the Ruth track and Ῥούθ is Ruth herself. Their notes say so. Nothing in the app links the two tracks yet; a reader who has done Ruth will simply recognise them.",
  },
  {
    id: "stems",
    note: "Stems are derived by paradigm invariance — the longest common prefix across a lemma's attested forms — with 75 hand overrides and 62 manual entries carried over from earlier tracks. The augment and perfect reduplication defeat the common-prefix rule (ἠγάπησεν, πεπίστευκα), and in compounds the augment sits inside the word (ἀπήγγειλεν). Filtering augmented indicatives out of the derivation was tried on an earlier track and REVERTED: coverage rose but 12 of 13 hand-verified stems came out wrong.",
  },
  {
    id: "translation",
    note: "World English Bible, public domain by explicit dedication, fetched by scripts/fetch-web-nt.mjs, which pins the version by name and asserts the licence for every chapter before writing anything. Chosen over the ASV (public domain only by age) and the KJV (a perpetual Crown letters-patent right in the UK).",
  },
];
