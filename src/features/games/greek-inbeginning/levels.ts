import { buildLevels, type LevelSource } from "../corpus";

/**
 * "In the Beginning" — John 1:1–5, the Greek counterpart to Day One.
 *
 * WHY THIS PASSAGE, and it is not an analogy. John 1 is quoting Genesis 1: ἐν
 * ἀρχῇ *is* בְּרֵאשִׁית, deliberately, and a reader who has done Day One meets
 * the same three words in another language on the first screen. Then 1:4–5
 * turns to light shining in darkness, so the sunrise the game is built on stops
 * being decoration and becomes the text.
 *
 * THE TEXT COMES FROM THE CORPUS, unlike Day One's, which was typed by hand out
 * of a prototype. Every accent and breathing here is SBLGNT's via the John
 * track. See ../corpus.ts for what that does and does not buy.
 *
 * THE GLOSSES ARE OVERRIDDEN HEAVILY, and that is expected rather than a
 * failure. Bundle glosses are citation glosses: ἦν arrives as "I am", ἐγένετο
 * as "I become, I happen", κατέλαβεν as "I seize, I overtake". Correct for a
 * lesson meeting a lemma; false in a game that shows a word and says what it
 * means right here.
 *
 * THE DRILLS ARE NOT DAY ONE'S TRANSLATED. Day One's picks target what is hard
 * about HEBREW — the prefixed הַ and וַ and לְ, the she-ending, wish against
 * event. Greek's difficulties are different and the arc follows them:
 *
 *   1:1  ὁ — the article, and how its shape says which word the sentence is about
 *   1:2  word order is free; the endings carry the roles, not the sequence
 *   1:3  ἐγένετο against ἦν — came to be, against simply was
 *   1:4  the -ων ending, which means "of"
 *   1:5  φαίνει against κατέλαβεν — going on, against done and finished
 *
 * One thing does transfer exactly. Day One taught יְהִי against וַיְהִי, the
 * wish and then the event; John 1:3's ἐγένετο against 1:1's ἦν is the same
 * distinction in Greek dress, and a player who has done both should feel it.
 *
 * SAME RULE AS DAY ONE: form → meaning, never form → label. Nothing here names
 * a tense, a case or a paradigm, and levels.test.ts fails the build if it does.
 */
const SOURCES: LevelSource[] = [
  {
    courseId: "john",
    passageId: "john-1-1",
    title: "In the beginning was the Word",
    teach: {
      he: "ὁ",
      en: "the",
      line: "ὁ means “the.” It changes shape as it moves around a sentence, and the shape tells you what each word is doing.",
    },
    gloss: {
      2: "was",
      4: "the Word",
      5: "and",
      7: "the Word",
      8: "was",
      9: "with",
      12: "and",
      14: "was",
      16: "the Word",
    },
    drills: [
      { t: "meaning", token: 4, opts: ["the Word", "the beginning", "the light", "the life"] },
      { t: "meaning", token: 2, opts: ["was", "will be", "came to be", "is not"] },
      {
        t: "tapAll",
        prompt: "Tap every word that means “the.”",
        pick: [3, 6, 10, 15],
        why: "Three of them are ὁ and one is τὸν — the same word, wearing a different ending. That ending is not decoration: ὁ λόγος is the one the sentence is about, and τὸν θεόν is the one it is about him being with.",
      },
      {
        t: "who",
        token: 14,
        prompt: "Who was?",
        ans: "he, she or it was",
        opts: ["I was", "you were", "he, she or it was"],
        why: "The ending carries the person, so Greek needs no separate word for “he.” ἦν on its own already says it.",
      },
      { t: "reverse", token: 11, opts: ["θεόν", "λόγος", "ἀρχῇ", "φῶς"] },
      { t: "order" },
    ],
  },
  {
    courseId: "john",
    passageId: "john-1-2",
    title: "This one was with God",
    teach: {
      he: "οὗτος",
      en: "this one",
      line: "Greek puts words in almost any order it likes. The endings tell you who is doing what — not the order they come in.",
    },
    gloss: { 0: "this one", 1: "was", 4: "with" },
    drills: [
      { t: "meaning", token: 0, opts: ["this one", "that one", "no one", "everyone"] },
      {
        t: "tapAll",
        prompt: "Tap the two words that open this verse exactly as verse 1 opened.",
        pick: [2, 3],
        why: "ἐν ἀρχῇ, again. John is quoting the first line of Genesis, and repeating it here so you cannot miss it.",
      },
      {
        t: "tapAll",
        prompt: "Tap the one word this sentence is about.",
        pick: [0],
        why: "οὗτος comes first here — but in verse 1 the word the sentence was about, ὁ λόγος, came last. Position proved nothing; the ending did.",
      },
      {
        // θεόν and θεὸς are both from verse 1, in the shapes verse 1 has them —
        // including the grave on θεὸς, which is only there because another word
        // follows it. The pair IS the lesson: same word, different ending,
        // different job.
        t: "reverse",
        token: 6,
        opts: ["θεόν", "θεὸς", "λόγος", "ζωὴ"],
        why: "θεόν and θεὸς are one word. The ending moved because its job in the sentence moved.",
      },
      { t: "meaning", token: 3, opts: ["beginning", "end", "middle", "light"] },
      { t: "order" },
    ],
  },
  {
    courseId: "john",
    passageId: "john-1-3",
    title: "All things came to be",
    teach: {
      he: "ἐγένετο",
      en: "came to be",
      line: "ἦν is “was” — going on, with no start and no finish in view. ἐγένετο is “came to be” — something happened.",
    },
    gloss: {
      0: "all things",
      1: "through",
      2: "him",
      3: "came to be",
      4: "and",
      5: "without",
      6: "him",
      7: "came to be",
      8: "not even",
      9: "one thing",
      10: "that",
      11: "has come to be",
    },
    drills: [
      { t: "meaning", token: 3, opts: ["came to be", "was always", "will be", "is seen"] },
      {
        t: "when",
        token: 3,
        prompt: "Was this going on, or did it happen?",
        ans: "It happened",
        opts: ["It happened", "It was simply going on"],
        why: "Set it against verse 1. The Word ἦν — was, no beginning in view. Everything else ἐγένετο — came to be. The whole claim of the verse sits in that difference.",
      },
      { t: "meaning", token: 1, opts: ["through", "without", "in", "toward"] },
      { t: "meaning", token: 5, opts: ["without", "with", "through", "after"] },
      {
        t: "tapAll",
        prompt: "Tap every word that says something came to be.",
        pick: [3, 7, 11],
        why: "Three times in one verse. The third, γέγονεν, is the same word again in another shape — and it says the coming-to-be is done and the result is still standing.",
      },
      { t: "order" },
    ],
  },
  {
    courseId: "john",
    passageId: "john-1-4",
    title: "The light of people",
    teach: {
      he: "τῶν ἀνθρώπων",
      en: "of people",
      line: "An -ων on the end means “of.” τῶν ἀνθρώπων is “of people” — and the τῶν in front is wearing the same ending.",
    },
    gloss: { 1: "him", 3: "was", 4: "and", 6: "the life", 9: "the light", 10: "of the", 11: "of people" },
    drills: [
      { t: "meaning", token: 9, opts: ["the light", "the darkness", "the life", "the word"] },
      { t: "meaning", token: 2, opts: ["life", "light", "death", "beginning"] },
      {
        t: "tapAll",
        prompt: "Tap the two words that together say “of people.”",
        pick: [10, 11],
        why: "Both end in -ων. Greek makes the little word agree with the big one, so “of” is said twice and you only translate it once.",
      },
      {
        // Every option is a form attested in these five verses, and the answer
        // is the form as the TEXT has it: ζωὴ with a grave, because Greek
        // flattens a final acute when another word follows. ζωή, the citation
        // form, is a different string and would never match.
        t: "reverse",
        token: 2,
        opts: ["ζωὴ", "φῶς", "σκοτίᾳ", "ἀρχῇ"],
      },
      {
        t: "when",
        token: 7,
        prompt: "Going on, or did it happen?",
        ans: "It was going on",
        opts: ["It was going on", "It happened"],
        why: "ἦν again — the same “was” as verse 1, still with no start or finish in view. You have now met it beside ἐγένετο and can tell them apart on sight.",
      },
      { t: "order" },
    ],
  },
  {
    courseId: "john",
    passageId: "john-1-5",
    title: "The darkness did not overcome it",
    teach: {
      he: "φαίνει",
      en: "shines",
      line: "φαίνει is happening now, and goes on happening. κατέλαβεν is one act, over and done.",
    },
    gloss: {
      0: "and",
      2: "the light",
      5: "the darkness",
      6: "shines",
      7: "and",
      9: "the darkness",
      10: "it",
      12: "overcame",
    },
    drills: [
      { t: "meaning", token: 6, opts: ["shines", "shone once", "will shine", "went out"] },
      {
        t: "when",
        token: 6,
        prompt: "Is this going on, or done and finished?",
        ans: "Going on",
        opts: ["Going on", "Done and finished"],
        why: "φαίνει is happening as you read it, and keeps happening. Not “shone” — shines.",
      },
      {
        t: "when",
        token: 12,
        prompt: "And this one?",
        ans: "Done and finished",
        opts: ["Going on", "Done and finished"],
        why: "κατέλαβεν is a single completed act — and οὐ in front says it did not happen at all. The light goes on; the attempt to put it out is over.",
      },
      { t: "meaning", token: 5, opts: ["the darkness", "the light", "the evening", "the deep"] },
      {
        t: "tapAll",
        prompt: "Tap both times the darkness is named.",
        pick: [5, 9],
        why: "σκοτίᾳ and σκοτία — one word, two endings. The first is where the light shines; the second is the one that tried and failed.",
      },
      { t: "order" },
    ],
  },
];

export const LEVELS = buildLevels(SOURCES);

/** Kept for the tests, which check the overlay rather than the resolved output. */
export const LEVEL_SOURCES = SOURCES;

/**
 * How much the sky brightens per newly-answered question.
 *
 * Tuned to this game's own drill count, not copied from Day One. Rebuilds never
 * score, so 25 graded questions × 0.038 = 0.95 — the sun is almost up as the
 * last verse closes and the finale sets it the rest of the way. Day One reaches
 * 0.945 by a different route (27 × 0.035); both land in the same place because
 * both were tuned to arrive there.
 */
export const LIGHT_PER_QUESTION = 0.038;

export const TOTAL_QUESTIONS = LEVELS.reduce((n, l) => n + l.drills.length, 0);

export const GRADED_QUESTIONS = LEVELS.reduce(
  (n, l) => n + l.drills.filter((d) => d.t !== "order").length,
  0,
);

/** How bright the sky already is when resuming at a given level. */
export function lightBefore(levelIndex: number): number {
  const graded = LEVELS.slice(0, levelIndex).reduce(
    (n, l) => n + l.drills.filter((d) => d.t !== "order").length,
    0,
  );
  return Math.min(1, graded * LIGHT_PER_QUESTION);
}
