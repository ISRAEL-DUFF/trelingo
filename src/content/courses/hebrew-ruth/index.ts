/**
 * Ruth — the second whole-text Hebrew course.
 *
 * Split by provenance, as the others are:
 *
 *   generated.ts  vocabulary, families and passages DERIVED from OSHB and
 *                 Strong's by scripts/import-oshb.mjs. Regenerate, don't edit.
 *   units.ts      the path — DERIVED here too, from the text's own order,
 *                 because a continuous book supplies its own sequence.
 *
 * Human judgement lives in scripts/build-ruth-glossary.mjs: glosses,
 * distractors, teaching notes, and the roots the safe rule cannot reach.
 *
 * WHAT THIS BOOK PROVED. Jonah was the first whole book and needed a new
 * pipeline. Ruth needed none: the importer, the emitter and the JPS fetcher all
 * took a book name. The only genuinely new work was 310 lexemes of Hebrew
 * judgement, which is as it should be — a corpus pipeline that still costs
 * engineering on its second use is not finished.
 */
import { CONTENT_SCHEMA_VERSION, type ContentBundle } from "../../schema";
import { families, words, passages } from "./generated";
import { sections, units } from "./units";

export const hebrewRuthBundle = {
  schemaVersion: CONTENT_SCHEMA_VERSION,
  families,
  words,
  units,
  passages,
  sections,
} satisfies ContentBundle;

/** What a Hebraist should check before this reaches real learners. */
export const RUTH_REVIEW_NOTES: { id: string; note: string }[] = [
  {
    id: "scope",
    note: "The whole book — 85 verses, 1,306 running words, 310 lexemes, 43 units across 4 chapters. Ruth is the easiest continuous narrative in the Hebrew Bible: prose, a small cast, and more than half of it dialogue. Chapter 1 carries 123 of the 310 lexemes.",
  },
  {
    id: "glosses",
    note: "All 310 lexemes carry hand-written glosses and hand-picked distractors — none are auto-generated, which was a standing weakness in earlier courses. They are short TEACHING meanings for a beginner reading Ruth, not lexicon entries, and they flatten real semantic range: חֶסֶד is given as 'steadfast love' where no English word fits, and נֶפֶשׁ as 'life, soul, self' where the word means the living breathing person. A Hebraist should read all of them.",
  },
  {
    id: "roots-withheld",
    note: "Roots are derived only where Strong's marks the lemma itself a primitive root and the radicals are actually present. Its 'from HXXXX' derivation chains are refused outright, which leaves 178 of 310 lexemes unrooted. Following them would assert that בֵּן 'son' derives from בָּנָה 'to build' and that עִיר 'city' comes from עור 'to awake'. That is the root fallacy mechanised — see jonah-spike-findings.md §3.",
  },
  {
    id: "roots-supplied",
    note: "49 roots are hand-supplied and are the least trustworthy content here, though the bar was set higher than in Jonah: a root is supplied only where the pairing is visible IN RUTH ITSELF. קרה/מִקְרֶה appear in the same clause of 2:3; נכר carries both 'recognise' and 'foreigner' in 2:10; מרר is marked on מָרָא because 1:20 supplies the etymology in the same breath. Three further roots were attempted and REFUSED by the importer because the first radical had elided — יָלַךְ, מוֹדַע and מוֹדַעַת — and those refusals were left standing.",
  },
  {
    id: "family-glosses",
    note: "Every family with more than one member carries an AUTHORED coreGloss. 86 single-member families take their gloss from their one word, which is trivially correct rather than an assumption. This is the debt Jonah still carries and Ruth deliberately does not.",
  },
  {
    id: "frequency",
    note: "Every word carries two counts: occurrences in Ruth, and occurrences across all 39 books of the Tanakh, counted from OSHB by scripts/build-hebrew-frequency.mjs. The whole-Bible figures were spot-checked against standard counts and agree within 0.3% (חֶסֶד 251 against ~248, גָּאַל 105 against ~104, אָב 1,213 against ~1,210). YHWH reads 6,521 because OSHB keys the Adonai-pointed variant separately as H3069; 6,521 + 306 = 6,827 against the usual 6,828.",
  },
  {
    id: "hapax",
    note: "Ruth contains EIGHT true hapax legomena — עָגַן (1:13), מָרָא (1:20), צָבַט (2:14), צֶבֶת (2:16), מוֹדַעַת (3:2), טְרוֹם (3:14), and the two spellings of Salmon in the genealogy. That is the number a learner should see, not the 133 lexemes that merely occur once in Ruth: אֹזֶן 'ear' occurs once here and 188 times in the Bible. The hapax badge is shown only where the corpus counted was complete, which is why no Greek word receives it.",
  },
  {
    id: "hapax-density",
    note: "133 of 310 lexemes occur exactly once IN RUTH — a different and much larger set than the 8 true hapax legomena; and chapters 3–4 are especially thin — the threshing-floor and legal scenes use vocabulary found almost nowhere else (מַרְגְלָה, צֶבֶת, תְּמוּרָה, אַלְמֹנִי). Those units will feel harder than their length suggests, and the review queue carries less of the load there.",
  },
  {
    id: "translation",
    note: "JPS 1917, public domain, via Sefaria, fetched by scripts/fetch-jps1917.mjs. Sefaria's DEFAULT English for Ruth is 'Tanakh: The Holy Scriptures, published by JPS' (CC-BY-NC) and its newest is the Gender-Sensitive Edition (CC-BY-NC); neither is ours to ship. The fetcher pins the 1917 version by title and asserts license === 'Public Domain' for every chapter, refusing to write anything if either check fails.",
  },
  {
    id: "no-parse-on-headwords",
    note: "Verb headwords carry no parse. The headword is Strong's citation form — a lexical entry, not an inflection — so labelling אָמַר '3ms perfect' would assert something about a dictionary form. Passage tokens keep their real parses.",
  },
  {
    id: "names",
    note: "38 lexemes are proper names, several appearing once in the closing genealogy (Hezron, Ram, Amminadab, Nahshon, Salmon). They are taught as vocabulary because the text cannot be read without them, but they carry no roots and little transfer, and a reviewer may reasonably want the genealogy handled differently.",
  },
];
