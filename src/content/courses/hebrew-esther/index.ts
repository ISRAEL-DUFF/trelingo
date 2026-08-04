/**
 * Esther — the third whole-text Hebrew course.
 *
 * Split by provenance, as the others are:
 *
 *   generated.ts  vocabulary, families and passages DERIVED from OSHB and
 *                 Strong's by scripts/import-oshb.mjs. Regenerate, don't edit.
 *   units.ts      the path — DERIVED here too, from the text's own order,
 *                 because a continuous book supplies its own sequence.
 *
 * Human judgement lives in scripts/build-esther-glossary.mjs: glosses,
 * distractors, teaching notes, and the roots the safe rule cannot reach.
 *
 * WHAT THIS BOOK PROVED. Ruth showed the pipeline took a book name. Esther
 * shows the CURATION compounds too: its glossary inherits Jonah's and Ruth's
 * entries at build time rather than retyping them, so 164 of 464 lexemes came
 * for free and a correction to a shared word is now made in one place. Two
 * real defects surfaced and were fixed in the importer rather than worked
 * around here — Sefaria keys verses "Esther.1.1" where OSHB says "Esth.1.1",
 * which had silently imported all 167 verses with no English; and "Esth" was
 * being shown to readers as a book title.
 */
import { CONTENT_SCHEMA_VERSION, type ContentBundle } from "../../schema";
import { families, words, passages } from "./generated";
import { sections, units } from "./units";

export const hebrewEstherBundle = {
  schemaVersion: CONTENT_SCHEMA_VERSION,
  families,
  words,
  units,
  passages,
  sections,
} satisfies ContentBundle;

/** What a Hebraist should check before this reaches real learners. */
export const ESTHER_REVIEW_NOTES: { id: string; note: string }[] = [
  {
    id: "scope",
    note: "The whole book — 167 verses, 3,057 running words, 464 lexemes, 86 units across 10 chapters. That is twice Ruth and three times Jonah, and it is the largest Hebrew track in the app. Chapter 1 alone carries 155 of the 464 lexemes; chapter 7 introduces twelve.",
  },
  {
    id: "glosses",
    note: "All 464 lexemes carry hand-written glosses and hand-picked distractors — none auto-generated. 300 were written for this book and 164 inherited from the Jonah and Ruth glossaries. They are short TEACHING meanings for a beginner reading Esther, not lexicon entries: דָּת is given as 'a law, a decree' where the word is a Persian loan covering edict, custom and religion; מִשְׁתֶּה as 'a feast' where it literally means 'a drinking'. A Hebraist should read all of them.",
  },
  {
    id: "inherited-entries",
    note: "The 164 inherited entries were written while reading Jonah or Ruth, not Esther, and their teaching notes were written for those books — the gate explained through Boaz, sackcloth through Jonah's cattle. Any note naming another book is dropped automatically rather than silently re-pointed, and the twelve that matter here — שַׁעַר, שַׂק, גּוֹרָל, לֵב, הָפַךְ, חֵן, חַיִל, כְּלִי, פָּקַד, קָרוֹב, אַל and שִׁפְחָה — were re-authored against Esther's own verses. 35 notes remain dropped, all on words that barely appear here. A reviewer should still expect the inherited GLOSSES to read as slightly off-centre in places: they were chosen to fit a different book.",
  },
  {
    id: "roots-withheld",
    note: "Roots are derived only where Strong's marks the lemma itself a primitive root and the radicals are actually present. Its 'from HXXXX' derivation chains are refused outright, which leaves 278 of 464 lexemes unrooted. Following them would assert that מַלְכוּת 'royalty' and מֶלֶךְ 'king' are related by rule rather than by observation — which here they happen to be, but the same rule elsewhere derives עִיר 'city' from עור 'to awake'. See jonah-spike-findings.md §3.",
  },
  {
    id: "roots-supplied",
    note: "70 roots are hand-supplied and are the least trustworthy content here. The Ruth bar was kept: a root is supplied only where the pairing is visible IN ESTHER ITSELF. מָלַךְ/מֶלֶךְ/מַלְכָּה/מַלְכוּת all stand in the first three verses; כָּתַב and כְּתָב share almost every decree; פְּרָזִי and פְּרָזָה sit in 9:19. None was refused by the importer for an elided radical, which is a weaker signal here than in Ruth — Esther's vocabulary is unusually nominal.",
  },
  {
    id: "root-collisions",
    note: "Three pairs share consonants on the page and are held apart deliberately. בִּזָּה 'plunder' is rooted to בזז while בָּזָה 'to despise' is rooted to בזה. שֵׁנָה 'sleep', שָׁנָה 'to change' and שָׁנָה 'a year' are written almost identically and only 'to change' is given a root at all; the other two are deliberately left unrooted so they cannot be filed together. מַר 'bitter' and מֹר 'myrrh' are unrelated. A reviewer should check these first: a wrong root here does not merely fail to teach, it teaches something false.",
  },
  {
    id: "family-glosses",
    note: "Every family with more than one member carries an AUTHORED coreGloss. 87 single-member families take their gloss from their one word, which is trivially correct rather than an assumption. This is the debt Jonah still carries and Ruth and Esther deliberately do not.",
  },
  {
    id: "hapax",
    note: "Esther contains 43 true hapax legomena — words occurring once in the whole Hebrew Bible — against Ruth's eight, in a book only twice the length. Most are Persian: כַּרְפַּס and בַּהַט and סֹחֶרֶת from the garden-party furnishings of 1:6, רַמָּךְ 'royal mare' from the courier verse, and twenty-three of the personal names — the six chamberlains of 1:10 who are named and never mentioned again, five of the seven princes, Hadassah, Shaashgaz, and all ten of Haman's sons. 173 further lexemes occur once IN ESTHER, which is a different and much larger set — the hapax badge is shown only for the first.",
  },
  {
    id: "names",
    note: "53 lexemes are proper nouns: 42 people (including Haman's ten sons, named once in a single roll-call), 7 places and 4 Babylonian month names. That is 11% of the book's vocabulary, far more than Ruth's, and it is the price of the one book of the Hebrew Bible set entirely outside the land. They carry no roots and little transfer. The seven eunuchs of 1:10 and the seven princes of 1:14 are each distinguishable only by spelling, so their exercises are in effect transliteration drills; a reviewer may reasonably want those roll-calls handled differently.",
  },
  {
    id: "translation",
    note: "JPS 1917, public domain, via Sefaria, fetched by scripts/fetch-jps1917.mjs, which pins the 1917 version by title and asserts license === 'Public Domain' for every chapter. Sefaria keys the book 'Esther' where OSHB keys it 'Esth', and the importer now remaps the prefix — before that fix all 167 verses imported with an empty translation and nothing complained.",
  },
  {
    id: "no-parse-on-headwords",
    note: "Verb headwords carry no parse. The headword is Strong's citation form — a lexical entry, not an inflection — so labelling it '3ms perfect' would assert something about a dictionary form. Passage tokens keep their real parses.",
  },
  {
    id: "the-name",
    note: "Esther never names God. No word for the divine appears in the book, which is why יהוה is absent from a 464-lexeme Hebrew vocabulary — that absence is the text, not a gap in the import. Mordecai's 'relief and deliverance shall arise from another place' (4:14) is as close as it comes, and the gloss on הַצָּלָה says so.",
  },
];
