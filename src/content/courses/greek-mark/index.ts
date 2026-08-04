/**
 * Mark — the whole gospel.
 *
 * Split by provenance as every course is: generated.ts is derived from
 * MorphGNT, units.ts from the text's own order, and the human judgement lives
 * in scripts/build-mark-glossary.mjs.
 *
 * SHIPPED IN TWO PASSES, AND THAT IS WORTH RECORDING. Mark is 11,286 running
 * words over 1,341 lemmas, of which 1,158 had no gloss anywhere in this project
 * — five times 1 John and nearly four times Ruth. Curating that in a single
 * pass would have meant auto-generated glosses, which every course here
 * refuses. Chapters 1–4 shipped first; the remaining twelve followed at the
 * same standard. `import-morphgnt.mjs --chapters` made the staging possible
 * without forking anything, and remains available for the next long book.
 */
import { CONTENT_SCHEMA_VERSION, type ContentBundle } from "../../schema";
import { families, words, passages } from "./generated";
import { sections, units } from "./units";

export const greekMarkBundle = {
  schemaVersion: CONTENT_SCHEMA_VERSION,
  families,
  words,
  units,
  passages,
  sections,
} satisfies ContentBundle;

/** What a Koine specialist should check before this reaches real learners. */
export const MARK_REVIEW_NOTES: { id: string; note: string }[] = [
  {
    id: "scope",
    note: "The WHOLE gospel — 673 verses, 11,286 running words, 1,192 taught lexemes, 339 units across 16 chapters. This is by far the largest track in the app: more running text than every other track combined. It was curated in two passes, chapters 1–4 first and 5–16 second, at one standard.",
  },
  {
    id: "glosses",
    note: "1,158 entries are written for this course and 249 reused from the 1 John and Gospels glossaries — a Greek word means what it means, and re-authoring θεός would only be a fresh chance to disagree with myself. NONE are auto-generated. Reused entries gloss passage tokens but are taught only where the word actually occurs in Mark. Glosses are short TEACHING meanings for a beginner, not lexicon entries, and at this volume they need a specialist's eye more than any earlier course did.",
  },
  {
    id: "unsplit-words",
    note: "437 of the 1,192 taught words carry NO morpheme highlight, because paradigm invariance cannot establish a stem for them — ἐγείρω, θέλω, ἐσθίω, ἀκολουθέω and εἷς among them. They are still taught. The importer used to drop such words entirely, which was defensible for a four-verse demonstration track and plainly wrong over a gospel: it silently excluded 429 content words. Hebrew settled this long ago — a word whose root cannot be established is shown plain and still taught — and Greek now does the same. Nothing is guessed; the highlight is simply absent.",
  },
  {
    id: "function-words",
    note: "Function words are GLOSSED so that no tap-to-gloss card is blank, but never TAUGHT as vocabulary — ὁ alone occurs 359 times and would swamp the review queue. Before the change above they were excluded by accident, as a side effect of having no stem; now the exclusion is stated by part of speech.",
  },
  {
    id: "stems",
    note: "Stem/ending splits are derived by paradigm invariance across the whole New Testament; 87 carry a hand-checked stem because a Greek verb's augment or perfect reduplication breaks the common prefix — and in a compound the augment sits INSIDE, so ἀπήγγειλεν truncates the prefix to ἀπ-. Passage tokens are split only where the surface form actually begins with the stem, so augmented and reduplicated forms are shown plain rather than split wrongly. These 87 are the least trustworthy content here.",
  },
  {
    id: "missing-verses",
    note: "FIVE VERSES OF THE ENGLISH HAVE NO GREEK: Mark 7:16, 9:44, 9:46, 11:26 and 15:28. These are textual variants that SBLGNT omits and the World English Bible retains, so the counts differ by design — 678 verses of translation against 673 of Greek. A learner comparing the two will notice, and should be told rather than left to wonder.",
  },
  {
    id: "longer-ending",
    note: "Mark 16:9–20, the longer ending, IS included because SBLGNT carries it. Its authenticity is disputed on textual grounds that this project takes no position on; a reviewer may reasonably want it flagged in the app rather than presented as continuous with what precedes it.",
  },
  {
    id: "frequency",
    note: "Every word carries occurrences in Mark and across the whole New Testament, counted from MorphGNT. εὐθύς — Mark's signature adverb — shows 42 occurrences here against 59 in the entire New Testament, so Mark holds 71% of them, which is the single clearest number in the course about how one author writes.",
  },
  {
    id: "chapter-balance",
    note: "Chapter 1 introduces 148 new lexemes and chapter 11 only 12. That is the gospel's own shape, and it means the later units are far lighter than their verse counts suggest. The section headers carry the counts.",
  },
  {
    id: "translation",
    note: "World English Bible, public domain, fetched by scripts/fetch-web-nt.mjs with the translation pinned by name and its licence asserted per chapter. A sixteen-chapter fetch drew a rate limit, so the fetcher now backs off and retries once rather than writing a file with a chapter missing. See NOTICE.md.",
  },
  {
    id: "proper-names",
    note: "The gospel carries a large number of proper names and transliterated Aramaic — ταλιθα κουμ, εφφαθα, αββα, ἐλωΐ, ραββουνι. They are taught because the text cannot be read without them, but they carry no transfer and a reviewer may want them handled as a separate category.",
  },
];
