/**
 * Jonah — a whole-text Hebrew course.
 *
 * Split by provenance, as the other courses are:
 *
 *   generated.ts  vocabulary, families and passages DERIVED from OSHB and
 *                 Strong's by scripts/import-oshb.mjs. Regenerate, don't edit.
 *   units.ts      the path — DERIVED here too, from the text's own order,
 *                 because a continuous book supplies its own sequence.
 *
 * Human judgement lives in scripts/build-jonah-glossary.mjs: glosses,
 * distractors, teaching notes, and the roots the safe rule cannot reach.
 *
 * WHY A WHOLE BOOK. The other three tracks teach 41–47 words drawn from verses
 * scattered across five or six books whose vocabularies overlap by about half —
 * not a slow path to reading something, but no path to reading anything.
 *
 * Vocabulary compounds far harder inside a book than between books
 * (coverage-findings.md §4a): finishing Jonah leaves a reader at 52% of Ruth,
 * but finishing Genesis 6 leaves them at 90% of Genesis 7. So a track is a whole
 * book, read chapter by chapter, and the sections are those chapters.
 */
import { CONTENT_SCHEMA_VERSION, type ContentBundle } from "../../schema";
import { families, words, passages } from "./generated";
import { sections, units } from "./units";

export const hebrewJonahBundle = {
  schemaVersion: CONTENT_SCHEMA_VERSION,
  families,
  words,
  units,
  passages,
  sections,
} satisfies ContentBundle;

/** What a Hebraist should check before this reaches real learners. */
export const JONAH_REVIEW_NOTES: { id: string; note: string }[] = [
  {
    id: "scope",
    note: "The whole book — 48 verses, 688 running words, 245 lexemes, 25 units across 4 chapters. Chapter 2 is a psalm and behaves differently from the rest: poetry, not wayyiqtol narrative, and its vocabulary is correspondingly less useful elsewhere in the book.",
  },
  {
    id: "roots-withheld",
    note: "Roots are derived only where Strong's marks the lemma itself a primitive root. Its 'from HXXXX' derivation chains are refused outright, which costs about 20 percentage points of coverage. Following them would assert that עִיר 'city' derives from עור 'to awake', that the object marker אֵת comes from אוֹת 'sign', and that יְהוָה is built on היה. That is the root fallacy mechanised — see jonah-spike-findings.md §3.",
  },
  {
    id: "roots-supplied",
    note: "34 roots are hand-supplied and are the least trustworthy content here. They were limited to cases where a noun sits beside its own verb in the same chapter (זֶבַח/זָבַח, נֶדֶר/נָדַר, סַעַר/סָעַר) or where the verb is unambiguous (דָּבָר from דבר). פָּנִים, עִיר, אֵת and מַלָּח were deliberately left unrooted despite Strong's offering derivations.",
  },
  {
    id: "family-glosses",
    note: "34 of 97 families carry a coreGloss inferred from their most frequent member rather than authored. That silently assumes a family has one shared meaning — sound for ירא, and precisely the assumption that fails for a form-only family. They are marked UNREVIEWED in generated.ts and should be authored or the schema should let coreGloss be absent.",
  },
  {
    id: "weak-forms",
    note: "A root is marked on a form showing all but its last radical (geminate רעע in רַע, III-he נקה in נָקִי), and on an initial-נ root whose נ has assimilated (נדר in וַיִּדְּרוּ). Anything weaker is refused, so a single shared letter cannot masquerade as a root.",
  },
  {
    id: "glosses",
    note: "All 245 lexemes now carry hand-written glosses and hand-picked distractors — none are auto-generated. They remain short TEACHING meanings for a beginner reading Jonah, not lexicon entries, and they flatten real semantic range: נֶפֶשׁ is 'soul, life, person' where the word means the living breathing self, and חֶסֶד is given as 'steadfast love' where no single English word fits. A Hebraist should still read them.",
  },
  {
    id: "chapter-2-vocabulary",
    note: "Chapter 2 is a psalm, and its 59 lexemes are the least reusable in the book — מְצוֹלָה 'the deep', מִשְׁבָּר 'breaker', סוּף 'reeds', תְּהוֹם 'abyss', שַׁחַת 'the pit'. Several occur once here and nowhere else in Jonah. It also sits second, immediately after the hardest chapter, which may warrant gentler treatment even though reading order is fixed by the text.",
  },
  {
    id: "translation",
    note: "JPS 1917, public domain, via Sefaria. Sefaria's DEFAULT English for Jonah is the current copyrighted JPS Gender-Sensitive Edition; the fetcher pins the 1917 version by title and asserts its licence per chapter rather than trusting the default.",
  },
  {
    id: "no-parse-on-headwords",
    note: "Verb headwords carry no parse. The headword is Strong's citation form — a lexical entry, not an inflection — so labelling אָמַר '3ms perfect' would assert something about a dictionary form. Passage tokens keep their real parses.",
  },
];
