import type { Exercise, Unit } from "../../schema";

/**
 * The learning path. Units are a linear chain (`requires`), each shippable on
 * its own, most of them ending in a real verse.
 *
 * Vocabulary drills are generated from `wordIds` rather than hand-written, so
 * the hand-authored exercises below are only the ones that carry real teaching
 * weight: conjugation, parsing, binyan contrast, construct chains, translation.
 */

/** Expand a unit's vocabulary into recognition + production drills. */
function vocabDrills(unitId: string, wordIds: string[]): Exercise[] {
  const out: Exercise[] = [];
  wordIds.forEach((wordId, i) => {
    out.push({
      id: `${unitId}-mc-${wordId}`,
      type: "mc_vocab",
      wordId,
      direction: "recognition",
      prompt: "What does this word mean?",
    });
    // Every other word also gets asked in the harder direction.
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

const u01: Unit = {
  id: "u01",
  orderIndex: 0,
  title: "In the Beginning",
  subtitle: "Genesis 1:1",
  type: "mixed",
  requires: null,
  placementLevel: 0,
  wordIds: ["bereshit", "bara", "elohim", "el", "shamayim", "erets"],
  passageId: "gen-1-1",
  exercises: [
    ...vocabDrills("u01", ["bereshit", "bara", "elohim", "el", "shamayim", "erets"]),
    {
      id: "u01-tr-1",
      type: "translation",
      prompt: "Translate this phrase.",
      text: "בָּרָא אֱלֹהִים",
      acceptable: ["God created", "God has created", "created God"],
      keywords: ["god", "creat"],
      note: "Hebrew normally puts the verb before its subject, so בָּרָא אֱלֹהִים is “God created”, not “he created God”.",
    },
  ],
};

const u02: Unit = {
  id: "u02",
  orderIndex: 1,
  title: "The Root שׁ־מ־ר",
  subtitle: "Guarding and keeping",
  type: "vocab",
  requires: "u01",
  placementLevel: 0,
  wordIds: ["shamar", "shomer", "mishmeret"],
  exercises: [
    ...vocabDrills("u02", ["shamar", "shomer", "mishmeret"]),
    {
      id: "u02-cc-1",
      type: "construct_chain",
      prompt: "Three words, one root. Which of these is NOT built on שׁ־מ־ר?",
      choices: ["שָׁמַר", "שֹׁמֵר", "מִשְׁמֶרֶת", "מִזְמוֹר"],
      answer: "מִזְמוֹר",
      familyId: "שׁמר",
      note: "מִזְמוֹר is from ז־מ־ר (make music). The מ־ prefix looks similar, but the three root letters underneath are different.",
    },
  ],
};

const u03: Unit = {
  id: "u03",
  orderIndex: 2,
  title: "The Qal Perfect",
  subtitle: "Completed action",
  type: "grammar",
  requires: "u02",
  placementLevel: 1,
  wordIds: ["shamru", "yishmor", "barakh"],
  passageId: "num-6-24",
  exercises: [
    ...vocabDrills("u03", ["shamru", "yishmor"]),
    {
      id: "u03-cj-1",
      type: "conjugation",
      prompt: "Qal perfect of שׁ־מ־ר — 3rd person common plural (“they guarded”)",
      familyId: "שׁמר",
      choices: ["שָׁמְרוּ", "שָׁמַרְתִּי", "שֹׁמֵר", "יִשְׁמֹר"],
      answer: "שָׁמְרוּ",
      note: "The ־וּ ending marks a 3rd person plural perfect.",
    },
    {
      id: "u03-cj-2",
      type: "conjugation",
      prompt: "Which form is the qal imperfect (“he will guard”)?",
      familyId: "שׁמר",
      choices: ["יִשְׁמֹר", "שָׁמַר", "שָׁמְרוּ", "שֹׁמֵר"],
      answer: "יִשְׁמֹר",
      note: "The יִ־ prefix marks 3rd person masculine singular imperfect. Perfect adds endings; imperfect adds prefixes.",
    },
    {
      id: "u03-cj-3",
      type: "conjugation",
      prompt: "Qal perfect of כ־ת־ב — 3rd person masculine singular (“he wrote”)",
      familyId: "כתב",
      choices: ["כָּתַב", "כֹּתֵב", "יִכְתֹּב", "כָּתְבוּ"],
      answer: "כָּתַב",
      note: "The a-a vowel pattern (kātaḇ) is the qal perfect 3ms signature — the same shape as שָׁמַר.",
    },
  ],
};

const u04: Unit = {
  id: "u04",
  orderIndex: 3,
  title: "Let There Be Light",
  subtitle: "Genesis 1:3",
  type: "mixed",
  requires: "u03",
  placementLevel: 1,
  wordIds: ["vayomer", "or", "yehi", "choshekh"],
  passageId: "gen-1-3",
  exercises: [
    ...vocabDrills("u04", ["vayomer", "or", "yehi", "choshekh"]),
    {
      id: "u04-ps-1",
      type: "parsing",
      prompt: "Parse this verb.",
      text: "וַיֹּאמֶר",
      familyId: "אמר",
      morphology: { highlight: [2, 3, 4], kind: "root" },
      fields: ["binyan", "tense", "person", "gender", "number"],
      answer: { binyan: "qal", tense: "imperfect", person: "3", gender: "m", number: "s" },
      note: "Waw-consecutive plus imperfect. It looks like a future tense but narrates the past — the workhorse of biblical storytelling.",
    },
    {
      id: "u04-lis-1",
      type: "listening_mc",
      wordId: "or",
      prompt: "Listen, then choose the meaning.",
    },
  ],
};

const u05: Unit = {
  id: "u05",
  orderIndex: 4,
  title: "Day and Night",
  subtitle: "Genesis 1:5",
  type: "mixed",
  requires: "u04",
  placementLevel: 1,
  wordIds: ["yom", "laylah", "tov", "vayar", "vayiqra", "qara"],
  passageId: "gen-1-5",
  exercises: [
    ...vocabDrills("u05", ["yom", "laylah", "tov", "vayar", "vayiqra", "qara"]),
    {
      id: "u05-cc-1",
      type: "construct_chain",
      prompt: "Which pair shares a root?",
      choices: ["וַיִּקְרָא / קָרָא", "יוֹם / לָיְלָה", "אוֹר / חֹשֶׁךְ", "טוֹב / רַע"],
      answer: "וַיִּקְרָא / קָרָא",
      familyId: "קרא",
      note: "The other pairs are opposites in meaning, which is not the same thing as sharing a root.",
    },
    {
      id: "u05-lis-1",
      type: "listening_mc",
      wordId: "yom",
      prompt: "Listen, then choose the meaning.",
    },
  ],
};

const u06: Unit = {
  id: "u06",
  orderIndex: 5,
  title: "Parsing Verbs",
  subtitle: "Person, gender, number",
  type: "grammar",
  requires: "u05",
  placementLevel: 2,
  wordIds: ["katav"],
  exercises: [
    ...vocabDrills("u06", ["katav"]),
    {
      id: "u06-ps-1",
      type: "parsing",
      prompt: "Parse this verb.",
      text: "שָׁמְרוּ",
      familyId: "שׁמר",
      morphology: { highlight: [0, 1, 2], kind: "root" },
      fields: ["tense", "person", "number"],
      answer: { tense: "perfect", person: "3", number: "p" },
      note: "The ־וּ ending is doing all the work here.",
    },
    {
      id: "u06-ps-2",
      type: "parsing",
      prompt: "Parse this verb.",
      text: "אֶחְסָר",
      familyId: "חסר",
      morphology: { highlight: [1, 2, 3], kind: "root" },
      fields: ["tense", "person", "number"],
      answer: { tense: "imperfect", person: "1", number: "s" },
      note: "The א־ prefix is the 1st person singular imperfect marker — “I shall …”.",
    },
    {
      id: "u06-ps-3",
      type: "parsing",
      prompt: "Parse this form.",
      text: "שֹׁמֵר",
      familyId: "שׁמר",
      morphology: { highlight: [0, 1, 2], kind: "root" },
      fields: ["binyan", "tense", "gender", "number"],
      answer: { binyan: "qal", tense: "participle", gender: "m", number: "s" },
      note: "A participle has no person — it describes an ongoing doer, not a completed act.",
    },
  ],
};

const u07: Unit = {
  id: "u07",
  orderIndex: 6,
  title: "The LORD Is My Shepherd",
  subtitle: "Psalm 23:1",
  type: "mixed",
  requires: "u06",
  placementLevel: 2,
  wordIds: ["mizmor", "roi", "roeh", "echsar"],
  passageId: "ps-23-1",
  exercises: [
    ...vocabDrills("u07", ["mizmor", "roi", "roeh", "echsar"]),
    {
      id: "u07-tr-1",
      type: "translation",
      prompt: "Translate this clause.",
      text: "יְהוָה רֹעִי",
      acceptable: [
        "the LORD is my shepherd",
        "the LORD my shepherd",
        "YHWH is my shepherd",
        "the Lord is my shepherd",
      ],
      keywords: ["shepherd"],
      note: "There is no “is” in the Hebrew. Two nouns side by side make a sentence.",
    },
  ],
};

const u08: Unit = {
  id: "u08",
  orderIndex: 7,
  title: "Construct Chains",
  subtitle: "How Hebrew says “of”",
  type: "grammar",
  requires: "u07",
  placementLevel: 3,
  wordIds: ["davar", "devar", "melekh"],
  exercises: [
    ...vocabDrills("u08", ["davar", "devar", "melekh"]),
    {
      id: "u08-cc-1",
      type: "construct_chain",
      prompt: "“The word of the LORD” — which form is correct?",
      choices: ["דְּבַר יְהוָה", "הַדָּבָר יְהוָה", "דָּבָר שֶׁל יְהוָה", "דָּבָר וְיְהוָה"],
      answer: "דְּבַר יְהוָה",
      familyId: "דבר",
      note: "In a construct chain the first noun shortens: דָּבָר becomes דְּבַר. Biblical Hebrew has no separate word for “of”, and שֶׁל is later Hebrew.",
    },
    {
      id: "u08-cc-2",
      type: "construct_chain",
      prompt: "“The word of the king” — which form is correct?",
      choices: ["דְּבַר הַמֶּלֶךְ", "הַדְּבַר מֶלֶךְ", "דָּבָר הַמֶּלֶךְ", "מֶלֶךְ הַדָּבָר"],
      answer: "דְּבַר הַמֶּלֶךְ",
      familyId: "דבר",
      note: "Only the *last* noun in the chain takes the definite article, but the whole chain reads as definite.",
    },
  ],
};

const u09: Unit = {
  id: "u09",
  orderIndex: 8,
  title: "The Root א־ה־ב",
  subtitle: "Love",
  type: "vocab",
  requires: "u08",
  placementLevel: 3,
  wordIds: ["ahav", "ahavah", "ohev"],
  exercises: [
    ...vocabDrills("u09", ["ahav", "ahavah", "ohev"]),
    {
      id: "u09-ps-1",
      type: "parsing",
      prompt: "Parse this form.",
      text: "אֹהֵב",
      familyId: "אהב",
      morphology: { highlight: [0, 1, 2], kind: "root" },
      fields: ["tense", "gender", "number"],
      answer: { tense: "participle", gender: "m", number: "s" },
      note: "Same ō-ē pattern as שֹׁמֵר. One vowel pattern, learned once, unlocks hundreds of words.",
    },
  ],
};

const u10: Unit = {
  id: "u10",
  orderIndex: 9,
  title: "The Binyanim",
  subtitle: "One root, seven stems",
  type: "grammar",
  requires: "u09",
  placementLevel: 4,
  wordIds: ["gadal", "giddel", "higdil", "lamad", "limmed", "dibber"],
  exercises: [
    ...vocabDrills("u10", ["gadal", "giddel", "higdil", "lamad", "limmed"]),
    {
      id: "u10-bc-1",
      type: "binyan_compare",
      prompt: "Same root ג־ד־ל, three stems. Match each form to its meaning.",
      familyId: "גדל",
      forms: [
        { text: "גָּדַל", translit: "gāḏal", binyan: "qal", gloss: "he was great" },
        { text: "גִּדֵּל", translit: "giddēl", binyan: "piel", gloss: "he raised, brought up" },
        { text: "הִגְדִּיל", translit: "hiḡdîl", binyan: "hiphil", gloss: "he magnified" },
      ],
      note: "Qal is the plain state, piel intensifies or makes transitive, hiphil is causative. The root's meaning bends but never breaks.",
    },
    {
      id: "u10-bc-2",
      type: "binyan_compare",
      prompt: "Same root ל־מ־ד, two stems. Match each form to its meaning.",
      familyId: "למד",
      forms: [
        { text: "לָמַד", translit: "lāmaḏ", binyan: "qal", gloss: "he learned" },
        { text: "לִמַּד", translit: "limmaḏ", binyan: "piel", gloss: "he taught" },
      ],
      note: "Piel turns “learn” into “cause to learn” — teach. The doubled middle letter is the tell.",
    },
    {
      id: "u10-ps-1",
      type: "parsing",
      prompt: "Parse this verb.",
      text: "דִּבֶּר",
      familyId: "דבר",
      morphology: { highlight: [0, 1, 2], kind: "root" },
      fields: ["binyan", "tense", "person", "gender", "number"],
      answer: { binyan: "piel", tense: "perfect", person: "3", gender: "m", number: "s" },
      note: "The dagesh doubling the ב is what makes this piel rather than qal.",
    },
  ],
};

const u11: Unit = {
  id: "u11",
  orderIndex: 10,
  title: "Participles",
  subtitle: "The ō-ē pattern",
  type: "mixed",
  requires: "u10",
  placementLevel: 4,
  wordIds: ["shofet", "qadosh"],
  exercises: [
    ...vocabDrills("u11", ["shofet", "qadosh"]),
    {
      id: "u11-cc-1",
      type: "construct_chain",
      prompt: "Which of these is a qal active participle?",
      choices: ["שֹׁפֵט", "שָׁפַט", "יִשְׁפֹּט", "מִשְׁפָּט"],
      answer: "שֹׁפֵט",
      familyId: "שׁפט",
      note: "ō then ē between the root letters. שָׁפַט is perfect, יִשְׁפֹּט imperfect, מִשְׁפָּט a noun (“judgement”).",
    },
    {
      id: "u11-tr-1",
      type: "translation",
      prompt: "Translate this phrase.",
      text: "שֹׁמֵר יִשְׂרָאֵל",
      acceptable: ["the keeper of Israel", "keeper of Israel", "the guardian of Israel", "he who keeps Israel"],
      keywords: ["israel"],
      note: "From Psalm 121:4. A participle in construct: “the one guarding Israel”.",
    },
  ],
};

const u12: Unit = {
  id: "u12",
  orderIndex: 11,
  title: "Your People, My People",
  subtitle: "Ruth 1:16",
  type: "reading",
  requires: "u11",
  placementLevel: 5,
  wordIds: ["am", "halakh", "shuv"],
  passageId: "ruth-1-16",
  exercises: [
    ...vocabDrills("u12", ["am", "halakh", "shuv"]),
    {
      id: "u12-tr-1",
      type: "translation",
      prompt: "Translate this clause.",
      text: "עַמֵּךְ עַמִּי",
      acceptable: ["your people are my people", "your people is my people", "your people, my people", "your people shall be my people"],
      keywords: ["people"],
      note: "Two forms of עַם, distinguished only by their possessive endings: ־ֵךְ “your (f.)” and ־ִי “my”.",
    },
  ],
};

export const units: Unit[] = [u01, u02, u03, u04, u05, u06, u07, u08, u09, u10, u11, u12];
export const unitById = new Map(units.map((u) => [u.id, u]));
