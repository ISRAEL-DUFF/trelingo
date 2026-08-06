/**
 * "Day One" — the content, Genesis 1:1–5.
 *
 * THE TEXT NOW COMES FROM THE CORPUS. It was hand-typed out of a prototype
 * .jsx until Genesis 1–11 landed as a track and it could finally be checked
 * against OSHB, character by character. It checked out: every consonant, every
 * vowel point, every shin and sin dot correct. The only gap was cantillation
 * and meteg, in eight places. So this conversion did not fix a pile of errors
 * — it means the text is DERIVED rather than trusted, there is one copy of
 * Genesis 1 in this repo instead of two, and the next game does not depend on
 * whoever types it being equally careful.
 *
 * CANTILLATION IS STRIPPED, deliberately and visibly. The te'amim are the chant
 * and the phrasing; a first-time reader meeting the alphabet does not need them
 * competing with the vowel points. The tracks show the text whole — this is a
 * beginner game's licence, taken explicitly rather than by omission.
 *
 * THE TEACHING IS STILL ENTIRELY HAND-WRITTEN and always will be. The corpus
 * supplies the text, the order and 19% of the glosses; the other 81% are
 * overridden below. Bundle glosses are CITATION glosses — וַיֹּאמֶר arrives as
 * "to say", הָיְתָה as "to be, to happen", מְרַחֶפֶת as "to hover, to brood" —
 * which is right in a lesson meeting a lemma and wrong under a word in a story.
 * Day One's rate is higher than the corpus average because its glosses are
 * pitched at someone who has never read a word of Hebrew.
 *
 * ITS RULE IS FORM → MEANING, NEVER FORM → LABEL. A learner is asked "who was?"
 * and answers "she was" — not "3fs perfect". The word תֹהוּ is glossed
 * "formless" and never called an abstract noun. That is a deliberate stance
 * against how Hebrew is usually taught, and it is why the drills ask what they
 * ask; keep it if these are ever extended.
 *
 * The glosses are pitched at a first-time reader and are looser than the
 * glossaries elsewhere in this app — אֵת is given as "→ points at what got
 * acted on" rather than "the direct object marker", because the learner meeting
 * it here has no use for the term. A Hebraist reviewing this should judge it as
 * teaching copy, not as lexicography.
 */

import { buildLevels, type LevelSource } from "../corpus";
import type { Drill, Level, VerseWord } from "../sunrise/types";

// The shapes live in ../sunrise/types, shared with the Greek game. Re-exported
// so this file still reads as the whole of Day One's content contract.
export type { Drill, Level, VerseWord };

/** Every level is Genesis, and every level hides the chant marks. */
const GEN = { courseId: "genesis", strip: "cantillation" } as const;

const SOURCES: LevelSource[] = [
  {
    ...GEN,
    passageId: "gen-1-1",
    title: "The first words",
    teach: {
      he: "בָּרָא",
      en: "he created",
      line: "Hebrew reads right to left. Start at the right edge and move left.",
    },
    gloss: {
      0: "in the beginning",
      1: "he created",
      2: "God",
      3: "→ points at what got acted on",
      4: "the heavens",
      5: "and → points at what got acted on",
      6: "the earth",
    },
    drills: [
      { t: "meaning", token: 1, opts: ["he created", "he saw", "he called", "he said"] },
      { t: "meaning", token: 2, opts: ["God", "light", "the earth", "the deep"] },
      { t: "reverse", token: 6, opts: ["הָאָרֶץ", "הַשָּׁמַיִם", "אוֹר", "חֹשֶׁךְ"] },
      { t: "meaning", token: 4, opts: ["the heavens", "the waters", "the morning", "the deep"] },
      {
        t: "tapAll",
        prompt: "Tap both things that got created.",
        pick: [4, 6],
        why: "אֵת is a little signpost. It has no meaning of its own — it just points ahead and says: this next thing is what the verb happened to.",
      },
      { t: "reverse", token: 0, opts: ["בְּרֵאשִׁית", "בָּרָא", "בֵּין", "בֹקֶר"] },
      { t: "order" },
    ],
  },
  {
    ...GEN,
    passageId: "gen-1-2",
    title: "Darkness over the deep",
    teach: {
      he: "הַ",
      en: "the",
      line: "A ה stuck to the front of a word means “the.” הַמָּיִם is waters with a the on it.",
    },
    gloss: {
      0: "and the earth",
      1: "she was",
      2: "formless",
      3: "and empty",
      4: "and darkness",
      5: "over",
      6: "the face of",
      7: "the deep",
      8: "and the wind",
      9: "of God",
      10: "she was hovering",
      11: "over",
      12: "the face of",
      13: "the waters",
    },
    drills: [
      {
        t: "meaning",
        token: 4,
        // The verse has וְחֹשֶׁךְ; the noun is taught bare here because the
        // tapAll two drills later is what teaches the prefix.
        lemma: { text: "חֹשֶׁךְ", gloss: "darkness" },
        opts: ["darkness", "light", "evening", "water"],
      },
      {
        t: "who",
        token: 1,
        prompt: "Who was?",
        ans: "she was",
        opts: ["he was", "she was", "they were"],
        why: "That ־ָה ending on the end is a she. And it fits: אֶרֶץ, the earth, is a she-word in Hebrew.",
      },
      {
        t: "meaning",
        token: 13,
        // The verse has הַמָּיִם — same reason as חֹשֶׁךְ above.
        lemma: { text: "מַיִם", gloss: "waters" },
        opts: ["waters", "heavens", "darkness", "wind"],
      },
      {
        t: "tapAll",
        prompt: "Tap every word wearing a הַ — every word with a “the.”",
        pick: [0, 13],
        why: "Same little ה, same job, wherever it shows up. You will now see it everywhere.",
      },
      {
        t: "who",
        token: 10,
        prompt: "Who is hovering?",
        ans: "she is",
        opts: ["he is", "she is", "they are"],
        why: "רוּחַ — wind, breath, spirit — is a she-word too, so the hovering word is dressed to match it.",
      },
      { t: "reverse", token: 5, opts: ["עַל", "אֵת", "בֵּין", "כִּי"] },
      { t: "order" },
    ],
  },
  {
    ...GEN,
    passageId: "gen-1-3",
    title: "Let there be",
    teach: {
      he: "וַ",
      en: "and then",
      line: "A וַ on the front is the story moving. It means: and then this happened.",
    },
    gloss: {
      0: "and he said",
      1: "God",
      2: "let there be",
      4: "and there was",
    },
    drills: [
      { t: "meaning", token: 3, opts: ["light", "day", "morning", "good"] },
      { t: "meaning", token: 0, opts: ["and he said", "and he saw", "and he called", "and he made"] },
      {
        t: "when",
        token: 2,
        prompt: "Is this something that happened, or something wanted?",
        ans: "Wanted — let it be",
        opts: ["It happened", "Wanted — let it be"],
        why: "יְהִי is the wish. It is the word God speaks.",
      },
      {
        t: "when",
        token: 4,
        prompt: "And this one?",
        ans: "It happened",
        opts: ["It happened", "Wanted — let it be"],
        why: "Same root, one letter added: וַ, and then. The wish, then the וַ, then the world. That gap is the whole verse.",
      },
      { t: "reverse", token: 4, opts: ["וַיְהִי", "יְהִי", "וַיַּרְא", "הָיְתָה"] },
      { t: "order" },
    ],
  },
  {
    ...GEN,
    passageId: "gen-1-4",
    title: "He saw that it was good",
    teach: {
      he: "וַיַּרְא",
      en: "and he saw",
      line: "You already know וַ. Everything after it is new; everything before it you keep.",
    },
    gloss: {
      0: "and he saw",
      1: "God",
      2: "→ points at what got acted on",
      3: "the light",
      4: "that",
      6: "and he separated",
      7: "God",
      9: "the light",
      10: "and between",
      11: "the darkness",
    },
    drills: [
      { t: "meaning", token: 5, opts: ["good", "one", "great", "whole"] },
      { t: "meaning", token: 0, opts: ["and he saw", "and he said", "and he called", "and he separated"] },
      {
        t: "tapAll",
        prompt: "Tap the two things being held apart.",
        pick: [9, 11],
        why: "בֵּין … וּבֵין — between and between. Hebrew says it twice, once for each side.",
      },
      { t: "reverse", token: 11, opts: ["הַחֹשֶׁךְ", "הָאוֹר", "הָאָרֶץ", "הַמָּיִם"] },
      {
        t: "when",
        token: 6,
        prompt: "Happened, or wanted?",
        ans: "It happened",
        opts: ["It happened", "Wanted — let it be"],
        why: "The וַ tells you before you know anything else about the word.",
      },
      { t: "order" },
    ],
  },
  {
    ...GEN,
    passageId: "gen-1-5",
    title: "Day one",
    teach: {
      he: "לָ",
      en: "to, for",
      line: "A לְ on the front means to or for. לָאוֹר is to the light.",
    },
    gloss: {
      0: "and he called",
      1: "God",
      2: "to the light",
      4: "and to the darkness",
      5: "he called",
      7: "and there was",
      9: "and there was",
    },
    drills: [
      { t: "meaning", token: 3, opts: ["day", "night", "morning", "light"] },
      { t: "meaning", token: 6, opts: ["night", "evening", "darkness", "deep"] },
      {
        t: "tapAll",
        prompt: "Tap both times you are told the world moved on.",
        pick: [7, 9],
        why: "וַיְהִי again — the same two words you met at the light. Third time you have seen it.",
      },
      { t: "reverse", token: 12, opts: ["אֶחָד", "אוֹר", "עֶרֶב", "טוֹב"] },
      {
        t: "who",
        token: 5,
        prompt: "Who called?",
        ans: "he did",
        opts: ["he did", "she did", "they did"],
        why: "Bare, no ending, no prefix — that plain shape is a he.",
      },
      { t: "order" },
    ],
  },
];

export const LEVELS: Level[] = buildLevels(SOURCES);

/** Kept for the tests, which check the overlay rather than the resolved output. */
export const LEVEL_SOURCES = SOURCES;

/**
 * How much the sky brightens per newly-answered question.
 *
 * THE REBUILD DRILL DOES NOT COUNT. Finishing an `order` drill advances the
 * round directly and never scores, so only the 27 graded questions move the
 * sky: 27 × 0.035 = 0.945. A perfect run therefore arrives at the last screen
 * with the sun ALMOST up, and the finale sets it the rest of the way. That is
 * the original's behaviour and it is better than the arithmetic suggests — the
 * last sliver of dawn lands on "You read that."
 *
 * Repeats earned by a miss deliberately do not brighten it either: the sky
 * measures ground covered, not answers given.
 */
export const LIGHT_PER_QUESTION = 0.035;

/** Every drill in the game, rebuilds included. */
export const TOTAL_QUESTIONS = LEVELS.reduce((n, l) => n + l.drills.length, 0);

/** The ones that actually score, and so the ones that move the sky. */
export const GRADED_QUESTIONS = LEVELS.reduce(
  (n, l) => n + l.drills.filter((d) => d.t !== "order").length,
  0,
);

/**
 * How bright the sky should already be when resuming at a given level.
 *
 * A player who continues at verse 4 has covered three verses of ground, and the
 * sky is the record of ground covered — so it starts where a clean run would
 * have left it, not at night. Counting the GRADED questions in the levels
 * before this one is the same arithmetic the live ramp does, which is why it is
 * derived here rather than stored: a stored number would drift the moment a
 * drill was added, and the sky would disagree with the rail beside it.
 *
 * This is also what keeps the `risen` ink flip honest on a resumed run. Resume
 * at verse 4 and the ground is already past 0.72, so the ink is already dark —
 * exactly as it would be for someone who had played straight through.
 */
export function lightBefore(levelIndex: number): number {
  const graded = LEVELS.slice(0, levelIndex).reduce(
    (n, l) => n + l.drills.filter((d) => d.t !== "order").length,
    0,
  );
  return Math.min(1, graded * LIGHT_PER_QUESTION);
}

/** A miss comes back this many places later, rather than costing a life. */
export const MISS_RETURNS_AFTER = 4;

/** Every N correct in a row throws a spark. */
export const SPARK_EVERY = 5;
