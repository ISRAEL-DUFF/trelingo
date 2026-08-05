/**
 * Ecclesiastes — the fourth whole-text Hebrew course, and the first that is not
 * a story.
 *
 * Split by provenance, as the others are:
 *
 *   generated.ts  vocabulary, families and passages DERIVED from OSHB and
 *                 Strong's by scripts/import-oshb.mjs. Regenerate, don't edit.
 *   units.ts      the path — DERIVED here too, from the text's own order.
 *
 * Human judgement lives in scripts/build-ecclesiastes-glossary.mjs: glosses,
 * distractors, teaching notes, the roots the safe rule cannot reach, and the
 * roots it must be stopped from reaching.
 *
 * WHAT THIS BOOK PROVED. That a latent defect can sit in three shipped courses
 * waiting for the right text. The importer stripped the sin/shin dot along with
 * the vowel points, so שׂ and שׁ reduced to one letter — and Jonah, Ruth and
 * Esther never happened to contain both members of a pair that collides.
 * Ecclesiastes contains two: שָׂבַע "to be satisfied" with שָׁבַע "to swear",
 * and שָׂנֵא "to hate" with שָׁנָא "to change". Each pair had been filed as one
 * root family. Fixed in the importer and all four Hebrew tracks regenerated.
 */
import { CONTENT_SCHEMA_VERSION, type ContentBundle } from "../../schema";
import { families, words, passages } from "./generated";
import { sections, units } from "./units";

export const hebrewEcclesiastesBundle = {
  schemaVersion: CONTENT_SCHEMA_VERSION,
  families,
  words,
  units,
  passages,
  sections,
} satisfies ContentBundle;

/** What a Hebraist should check before this reaches real learners. */
export const ECCLESIASTES_REVIEW_NOTES: { id: string; note: string }[] = [
  {
    id: "scope",
    note: "The whole book — 222 verses, 2,999 running words, 562 lexemes, 113 units across 12 chapters. Chapter 1 introduces 98 of the 562 and chapter 2 another 87: a third of the vocabulary in the first sixth of the text, because chapter 2 is an inventory of everything Qoheleth built. Chapter 8 introduces sixteen.",
  },
  {
    id: "not-narrative",
    note: "This is the first Hebrew track that is not a story, and it is harder than its length suggests. 5.3 tokens per lexeme against Esther's 6.6 means a reader meets more words once and never again, so the review queue carries less of the load. It is also late Hebrew — כְּבָר, the relative שֶׁ־ in place of אֲשֶׁר, and Persian loanwords like פַּרְדֵּס — which a learner coming from Ruth will notice and should be told about.",
  },
  {
    id: "glosses",
    note: "All 562 lexemes carry hand-written glosses and hand-picked distractors — none auto-generated. 285 were written for this book and 277 inherited from Jonah, Ruth and Esther. A Hebraist should read all of them.",
  },
  {
    id: "re-authored-glosses",
    note: "Thirteen inherited entries were RE-AUTHORED rather than accepted, because in a narrative a word does its job and the story moves on, while here the same few words carry the argument on every page. הֶבֶל arrived from Jonah as 'vanity, a vapour' and is now 'a breath, a vapour': 'vanity' is Tyndale by way of vanitas and in modern English suggests conceit, which is not the claim. Also re-authored: רוּחַ, שֶׁמֶשׁ, עוֹלָם, עֵת, טוֹב, לֵב, יָדַע. A reviewer should judge whether the new glosses over-correct.",
  },
  {
    id: "sin-shin",
    note: "THE DEFECT THIS BOOK FOUND. consonants() in the importer stripped the sin/shin dot along with the vowel points, because Unicode encodes it as a combining mark in the same block. שׂ and שׁ are different letters, and the result was two false root families: שָׂבַע 'to be satisfied' filed with שָׁבַע 'to swear', and שָׂנֵא 'to hate' with שָׁנָא 'to change'. Jonah, Ruth and Esther contain no such colliding pair, so the bug shipped invisibly three times. Every Hebrew family id now carries the dot and all four tracks were regenerated — a reviewer should spot-check the earlier books' root families, not just this one.",
  },
  {
    id: "homograph-roots",
    note: "עָנָה 'to afflict' (H6031) and עָנָה 'to answer' (H6030) are two distinct primitive roots spelled identically. Families are keyed on consonants, so the rule filed them together and the family sheet would have taught that afflicting and answering are one word. Both are now taught PLAIN with no root at all, via a new `noRoot` flag in the glossary. That is a deliberate loss of two legitimate highlights in exchange for not asserting something false, and a reviewer may disagree with the trade.",
  },
  {
    id: "roots-supplied",
    note: "99 roots are hand-supplied, the most of any Hebrew track, because Qoheleth's argument runs on word families — חכם, סכל, עמל, צדק, רשׁע, חסר, שׁפל. The bar is the one Ruth set: supplied only where the pairing is visible IN ECCLESIASTES ITSELF. 300 lexemes remain unrooted because Strong's 'from HXXXX' chains are refused outright.",
  },
  {
    id: "family-glosses",
    note: "Every family with more than one member carries an AUTHORED coreGloss. 131 single-member families take their gloss from their one word, which is trivially correct rather than an assumption.",
  },
  {
    id: "hapax",
    note: "24 lexemes occur once in the whole Hebrew Bible, several of them in the allegory of old age in chapter 12 and in the accounting vocabulary Qoheleth seems to have coined or borrowed — חֶסְרוֹן, שִׁפְלוּת, הוֹלֵלוּת, מְקָרֶה. Counts are over all 39 books of the Tanakh, so the badge is earned.",
  },
  {
    id: "hard-verses",
    note: "Three places where the gloss is a decision rather than a translation, and the notes say so on the card: שִׁדָּה in 2:8 occurs nowhere else and guesses run from 'ladies' to 'chests'; הָעֹלָם set in the human heart in 3:11 may be 'eternity', 'the world' or 'a sense of time'; and אֲבִיּוֹנָה in 12:5 is either the caper berry failing or desire failing. A specialist should decide whether a beginner's card is the right place for that uncertainty.",
  },
  {
    id: "translation",
    note: "JPS 1917, public domain, via Sefaria, fetched by scripts/fetch-jps1917.mjs, which pins the 1917 version by title and asserts license === 'Public Domain' for every chapter. Sefaria keys the book 'Ecclesiastes' where OSHB keys it 'Eccl'; the importer remaps the prefix, the same fix Esther needed.",
  },
  {
    id: "no-parse-on-headwords",
    note: "Verb headwords carry no parse. The headword is Strong's citation form — a lexical entry, not an inflection. Passage tokens keep their real parses.",
  },
];
