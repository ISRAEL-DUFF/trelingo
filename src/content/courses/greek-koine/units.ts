import type { ContentBundle } from "../../schema";

/**
 * Koine learning path.
 *
 * Hand-authored, unlike the vocabulary: the corpus can derive what a word means
 * morphologically, but not what to teach first. Ordering runs from the most
 * transparent noun paradigms toward verbs and the passages that need them.
 *
 * Each unit's vocabulary drills are generated from `wordIds`; only the exercises
 * that carry real teaching weight are written out.
 */
function vocabDrills(unitId: string, wordIds: string[]): ContentBundle["units"][number]["exercises"] {
  const out: ContentBundle["units"][number]["exercises"] = [];
  wordIds.forEach((wordId, i) => {
    out.push({
      id: `${unitId}-mc-${wordId}`,
      type: "mc_vocab",
      wordId,
      direction: "recognition",
      prompt: "What does this word mean?",
    });
    if (i % 2 === 1) {
      out.push({
        id: `${unitId}-mcp-${wordId}`,
        type: "mc_vocab",
        wordId,
        direction: "production",
        prompt: "Which word means this?",
      });
    }
  });
  return out;
}

type UnitSpec = {
  id: string;
  title: string;
  subtitle: string;
  type: ContentBundle["units"][number]["type"];
  words: string[];
  passageId?: string;
  level: number;
  extra?: ContentBundle["units"][number]["exercises"];
};

const SPECS: UnitSpec[] = [
  {
    id: "gk01", title: "In the Beginning", subtitle: "John 1:1", type: "mixed", level: 0,
    words: ["arche", "logos", "theos"], passageId: "john-1-1",
    extra: [
      {
        id: "gk01-tr-1", type: "translation", prompt: "Translate this clause.",
        text: "ἐν ἀρχῇ ἦν ὁ λόγος",
        acceptable: ["in the beginning was the Word", "in the beginning was the word"],
        keywords: ["beginning", "word"],
        note: "Greek has no indefinite article, and the definite ὁ marks λόγος as the subject.",
      },
    ],
  },
  {
    id: "gk02", title: "The Second Declension", subtitle: "The -ος pattern", type: "vocab", level: 0,
    words: ["kosmos", "anthropos", "nomos", "ouranos"],
  },
  {
    id: "gk03", title: "Light and Life", subtitle: "John 1:4", type: "mixed", level: 0,
    words: ["zoe", "skotia"], passageId: "john-1-4",
  },
  {
    id: "gk04", title: "The First Declension", subtitle: "The -η and -α patterns", type: "vocab", level: 1,
    words: ["hemera", "kardia", "eirene", "hora"],
  },
  {
    id: "gk05", title: "Darkness Did Not Overcome It", subtitle: "John 1:5", type: "reading", level: 1,
    words: ["doxa", "aletheia"], passageId: "john-1-5",
  },
  {
    id: "gk06", title: "Cases", subtitle: "Nominative and accusative", type: "grammar", level: 1,
    words: ["huios", "adelphos"],
    extra: [
      {
        id: "gk06-ps-1", type: "parsing", prompt: "Parse this noun.",
        text: "θεόν", familyId: "θε",
        morphology: { highlight: [2, 3], kind: "ending" },
        fields: ["case", "number", "gender"],
        answer: { case: "accusative", number: "s", gender: "m" },
        note: "πρός takes the accusative, so θεός becomes θεόν. The stem never moves.",
      },
      {
        id: "gk06-ps-2", type: "parsing", prompt: "Parse this noun.",
        text: "λόγος", familyId: "λογ",
        morphology: { highlight: [3, 4], kind: "ending" },
        fields: ["case", "number", "gender"],
        answer: { case: "nominative", number: "s", gender: "m" },
        note: "-ος is the 2nd-declension nominative singular. Compare the accusative λόγον.",
      },
    ],
  },
  {
    id: "gk07", title: "The Good News", subtitle: "Mark 1:1", type: "mixed", level: 2,
    words: ["euangelion", "ergon", "teknon"], passageId: "mark-1-1",
    extra: [
      {
        id: "gk07-tr-1", type: "translation", prompt: "Translate this phrase.",
        text: "ἀρχὴ τοῦ εὐαγγελίου",
        acceptable: ["the beginning of the good news", "the beginning of the gospel", "beginning of the gospel"],
        keywords: ["beginning"],
        note: "τοῦ εὐαγγελίου is genitive — Greek's way of saying “of the gospel”.",
      },
    ],
  },
  {
    id: "gk08", title: "People and Places", subtitle: "Core nouns", type: "vocab", level: 2,
    words: ["kyrios", "doulos", "mathetes", "hodos"],
  },
  {
    id: "gk09", title: "Verbs: the -ω Ending", subtitle: "Present active", type: "grammar", level: 2,
    words: ["pisteuo", "akouo", "blepo"],
    extra: [
      {
        id: "gk09-cj-1", type: "conjugation",
        prompt: "Present active of πιστεύω — 3rd person singular (“he/she believes”)",
        familyId: "πιστ",
        choices: ["πιστεύει", "πιστεύω", "πιστεύομεν", "πιστεύετε"],
        answer: "πιστεύει",
        note: "The stem πιστευ- never changes; only the ending tells you who is doing it.",
      },
    ],
  },
  {
    id: "gk10", title: "More Verbs", subtitle: "Common actions", type: "vocab", level: 3,
    words: ["grapho", "meno", "lambano", "ginosko"],
  },
  {
    id: "gk11", title: "Word Families", subtitle: "One stem, many words", type: "mixed", level: 3,
    words: ["agape", "agapao", "pistos", "lego"],
    extra: [
      {
        id: "gk11-cc-1", type: "construct_chain",
        prompt: "Which of these is NOT built on the same stem as πίστις (faith)?",
        choices: ["πιστεύω", "πιστός", "λόγος"],
        answer: "λόγος",
        familyId: "πιστ",
        note: "πιστεύω (believe) and πιστός (faithful) share the stem πιστ-. λόγος does not.",
      },
    ],
  },
  {
    id: "gk12", title: "Faith, Sin and Grace", subtitle: "The vocabulary of the letters", type: "vocab", level: 4,
    words: ["hamartia", "ekklesia", "basileia", "kairos", "hagios", "agathos", "aionios", "kainos", "protos", "krino", "sozo", "phaino"],
  },
];

export const units: ContentBundle["units"] = SPECS.map((s, i) => ({
  id: s.id,
  orderIndex: i,
  title: s.title,
  subtitle: s.subtitle,
  type: s.type,
  requires: i === 0 ? null : SPECS[i - 1]!.id,
  placementLevel: s.level,
  wordIds: s.words,
  ...(s.passageId ? { passageId: s.passageId } : {}),
  exercises: [...vocabDrills(s.id, s.words), ...(s.extra ?? [])],
}));
