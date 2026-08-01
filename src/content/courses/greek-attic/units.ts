import type { ContentBundle } from "../../schema";

/**
 * Attic learning path.
 *
 * Hand-authored, as in Koine — and here the hand-authoring matters more. The
 * available corpus is 66% Thucydides, who is among the hardest Greek there is
 * (attic-spike-findings.md §5). The ordering below leans deliberately on Plato
 * and on the transparent noun paradigms, and holds Thucydides' syntax back to
 * the two places where a single clause is genuinely readable.
 *
 * Vocabulary drills are generated from `wordIds`; only the exercises carrying
 * real teaching weight are written out.
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
    id: "at01", title: "Thucydides the Athenian", subtitle: "Histories 1.1", type: "mixed", level: 0,
    words: ["polemos", "athenaios"], passageId: "thucydides-opening",
    extra: [
      {
        id: "at01-tr-1", type: "translation", prompt: "Translate this phrase.",
        text: "Θουκυδίδης Ἀθηναῖος",
        acceptable: ["thucydides the athenian", "thucydides, an athenian", "thucydides an athenian"],
        keywords: ["thucydides", "athenian"],
        note: "Greek can put a noun beside a name with no verb and no article — “Thucydides, an Athenian”.",
      },
    ],
  },
  {
    id: "at02", title: "The Second Declension", subtitle: "The -ος and -ον patterns", type: "vocab", level: 0,
    words: ["logos", "nomos", "anthropos", "ergon"],
  },
  {
    id: "at03", title: "What's New, Socrates?", subtitle: "Plato, Euthyphro 2a", type: "mixed", level: 0,
    words: ["neoteros", "hosios"], passageId: "euthyphro-opening",
    extra: [
      {
        id: "at03-tr-1", type: "translation", prompt: "Translate this question.",
        text: "τί νεώτερον;",
        acceptable: ["what's new", "what is new", "what's newer", "what is newer"],
        keywords: ["new"],
        note: "Literally “what newer thing?”. Greek reaches for a comparative where English would not.",
      },
    ],
  },
  {
    id: "at04", title: "The First Declension", subtitle: "The -η pattern", type: "vocab", level: 1,
    words: ["dike", "arche", "gnome", "sponde"],
  },
  {
    id: "at05", title: "Justice", subtitle: "One stem, three words", type: "mixed", level: 1,
    words: ["dikaios", "dikastes"],
    extra: [
      {
        id: "at05-cc-1", type: "construct_chain",
        prompt: "Which of these is NOT built on the same stem as δίκη (justice)?",
        choices: ["δίκαιος", "δικαστής", "νόμος"],
        answer: "νόμος",
        familyId: "δικ",
        note: "δίκαιος (just) and δικαστής (juror) both carry δικ-. νόμος is a different word entirely, though it also belongs to the law.",
      },
      {
        id: "at05-ps-1", type: "parsing", prompt: "Parse this noun.",
        text: "δίκην", familyId: "δικ",
        morphology: { highlight: [3, 4], kind: "ending" },
        fields: ["case", "number", "gender"],
        answer: { case: "accusative", number: "s", gender: "f" },
        note: "First declension: -ην is the accusative singular of an -η noun. The stem δικ- does not move.",
      },
    ],
  },
  {
    id: "at06", title: "The Third Declension", subtitle: "Where the stem hides", type: "grammar", level: 2,
    words: ["polis", "dynamis", "chrema", "aner"],
    extra: [
      {
        id: "at06-ps-1", type: "parsing", prompt: "Parse this noun.",
        text: "πόλει", familyId: "πολ",
        morphology: { highlight: [3, 4], kind: "ending" },
        fields: ["case", "number", "gender"],
        answer: { case: "dative", number: "s", gender: "f" },
        note: "Third declension endings attach straight to the stem πολ-, so the nominative πόλις and the dative πόλει share only three letters.",
      },
      {
        id: "at06-ps-2", type: "parsing", prompt: "Parse this noun.",
        text: "πόλεμον", familyId: "πολεμ",
        morphology: { highlight: [5, 6], kind: "ending" },
        fields: ["case", "number", "gender"],
        answer: { case: "accusative", number: "s", gender: "m" },
        note: "Second declension, for contrast: -ον is the accusative singular. Do not confuse πόλεμος (war) with πόλις (city) — they only look alike.",
      },
    ],
  },
  {
    id: "at07", title: "Land and Sea", subtitle: "The world Thucydides describes", type: "vocab", level: 2,
    words: ["thalassa", "chorion", "basileus"],
  },
  {
    id: "at08", title: "Gods and Men", subtitle: "Core nouns", type: "vocab", level: 2,
    words: ["theos", "pater", "philos", "chronos"],
  },
  {
    id: "at09", title: "Adjectives", subtitle: "Agreeing with the noun", type: "grammar", level: 3,
    words: ["protos", "monos", "oligos", "megas", "hekastos"],
    extra: [
      {
        id: "at09-ps-1", type: "parsing", prompt: "Parse this adjective.",
        text: "νόμος", familyId: "νομ",
        morphology: { highlight: [3, 4], kind: "ending" },
        fields: ["case", "number", "gender"],
        answer: { case: "nominative", number: "s", gender: "m" },
        note: "An adjective takes the same case, number and gender as its noun, and mostly the same endings — so learning -ος here pays twice.",
      },
    ],
  },
  {
    id: "at10", title: "Verbs: the -ω Ending", subtitle: "Present active", type: "grammar", level: 3,
    words: ["lego", "echo", "poieo"],
    extra: [
      {
        id: "at10-cj-1", type: "conjugation",
        prompt: "Present active of λέγω — 3rd person singular (“he/she says”)",
        familyId: "λεγ",
        choices: ["λέγει", "λέγω", "λέγομεν", "λέγετε"],
        answer: "λέγει",
        note: "The stem λεγ- never changes in the present; only the ending says who is speaking.",
      },
    ],
  },
  {
    id: "at11", title: "War and the City", subtitle: "The vocabulary of the Histories", type: "vocab", level: 4,
    words: ["polemios", "barbaros", "nautikos", "pas", "hosos", "hoios", "hegeomai", "parecho"],
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
