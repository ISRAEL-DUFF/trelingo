import type { Passage } from "./schema";

/**
 * Real, unedited verses — spec principle 2: "Learners should feel they're
 * reading the Bible, not a synthetic curriculum."
 *
 * Every token carries its own root indices so the reader can highlight roots
 * inline, and links back to a vocabulary entry where we teach that word. Tokens
 * with `wordId: null` are function words (object markers, particles, the divine
 * name) that we gloss but do not drill.
 *
 * Text is the consonantal + Masoretic pointed text as conventionally printed;
 * cantillation marks are omitted throughout to keep the learning surface clean.
 */
export const passages: Passage[] = [
  {
    id: "gen-1-1",
    reference: "Genesis 1:1",
    translation: "In the beginning God created the heavens and the earth.",
    tokens: [
      { text: "בְּרֵאשִׁית", translit: "bərēʾšîṯ", gloss: "in the beginning", wordId: "bereshit", rootId: "ראשׁ", rootIndices: [1, 2, 3] },
      { text: "בָּרָא", translit: "bārāʾ", gloss: "he created", wordId: "bara", rootId: "ברא", rootIndices: [0, 1, 2] },
      { text: "אֱלֹהִים", translit: "ʾĕlōhîm", gloss: "God", wordId: "elohim", rootId: "אלה", rootIndices: [0, 1, 2] },
      { text: "אֵת", translit: "ʾēṯ", gloss: "(marks the direct object)", wordId: null, rootId: null, rootIndices: [] },
      { text: "הַשָּׁמַיִם", translit: "haššāmayim", gloss: "the heavens", wordId: "shamayim", rootId: "שׁמי", rootIndices: [1, 2, 3] },
      { text: "וְאֵת", translit: "wəʾēṯ", gloss: "and (marks the direct object)", wordId: null, rootId: null, rootIndices: [] },
      { text: "הָאָרֶץ", translit: "hāʾāreṣ", gloss: "the earth", wordId: "erets", rootId: "ארץ", rootIndices: [1, 2, 3] },
    ],
    notes: "אֵת is untranslatable in English — it simply marks what follows as the direct object of the verb.",
  },
  {
    id: "gen-1-3",
    reference: "Genesis 1:3",
    translation: "And God said, “Let there be light,” and there was light.",
    tokens: [
      { text: "וַיֹּאמֶר", translit: "wayyōʾmer", gloss: "and he said", wordId: "vayomer", rootId: "אמר", rootIndices: [2, 3, 4] },
      { text: "אֱלֹהִים", translit: "ʾĕlōhîm", gloss: "God", wordId: "elohim", rootId: "אלה", rootIndices: [0, 1, 2] },
      { text: "יְהִי", translit: "yəhî", gloss: "let there be", wordId: "yehi", rootId: "היה", rootIndices: [1, 2] },
      { text: "אוֹר", translit: "ʾôr", gloss: "light", wordId: "or", rootId: "אור", rootIndices: [0, 1, 2] },
      { text: "וַיְהִי", translit: "wayhî", gloss: "and there was", wordId: null, rootId: "היה", rootIndices: [2, 3] },
      { text: "אוֹר", translit: "ʾôr", gloss: "light", wordId: "or", rootId: "אור", rootIndices: [0, 1, 2] },
    ],
    notes: "יְהִי and וַיְהִי are the same root ה־י־ה. Hebrew makes the command and its fulfilment echo each other.",
  },
  {
    id: "gen-1-5",
    reference: "Genesis 1:5",
    translation: "And God called the light Day, and the darkness he called Night.",
    tokens: [
      { text: "וַיִּקְרָא", translit: "wayyiqrāʾ", gloss: "and he called", wordId: "vayiqra", rootId: "קרא", rootIndices: [2, 3, 4] },
      { text: "אֱלֹהִים", translit: "ʾĕlōhîm", gloss: "God", wordId: "elohim", rootId: "אלה", rootIndices: [0, 1, 2] },
      { text: "לָאוֹר", translit: "lāʾôr", gloss: "to the light", wordId: "or", rootId: "אור", rootIndices: [1, 2, 3] },
      { text: "יוֹם", translit: "yôm", gloss: "day", wordId: "yom", rootId: "יום", rootIndices: [0, 1, 2] },
      { text: "וְלַחֹשֶׁךְ", translit: "wəlaḥōšeḵ", gloss: "and to the darkness", wordId: "choshekh", rootId: "חשׁך", rootIndices: [2, 3, 4] },
      { text: "קָרָא", translit: "qārāʾ", gloss: "he called", wordId: "qara", rootId: "קרא", rootIndices: [0, 1, 2] },
      { text: "לָיְלָה", translit: "lāyəlâ", gloss: "night", wordId: "laylah", rootId: "ליל", rootIndices: [0, 1, 2] },
    ],
    notes: "Notice the same root ק־ר־א twice: once with the waw-consecutive prefix, once bare.",
  },
  {
    id: "num-6-24",
    reference: "Numbers 6:24",
    translation: "May the LORD bless you and keep you.",
    tokens: [
      { text: "יְבָרֶכְךָ", translit: "yəḇāreḵəḵā", gloss: "may he bless you", wordId: null, rootId: "ברך", rootIndices: [1, 2, 3] },
      { text: "יְהוָה", translit: "YHWH", gloss: "the LORD", wordId: null, rootId: null, rootIndices: [] },
      { text: "וְיִשְׁמְרֶךָ", translit: "wəyišmreḵā", gloss: "and may he keep you", wordId: null, rootId: "שׁמר", rootIndices: [2, 3, 4] },
    ],
    notes: "The first half of the Priestly Blessing — and your first sighting of שׁ־מ־ר inside a real verse.",
  },
  {
    id: "ps-23-1",
    reference: "Psalm 23:1",
    translation: "A psalm of David. The LORD is my shepherd; I shall not lack.",
    tokens: [
      { text: "מִזְמוֹר", translit: "mizmôr", gloss: "a psalm", wordId: "mizmor", rootId: "זמר", rootIndices: [1, 2, 4] },
      { text: "לְדָוִד", translit: "ləḏāwiḏ", gloss: "of David", wordId: null, rootId: null, rootIndices: [] },
      { text: "יְהוָה", translit: "YHWH", gloss: "the LORD", wordId: null, rootId: null, rootIndices: [] },
      { text: "רֹעִי", translit: "rōʿî", gloss: "my shepherd", wordId: "roi", rootId: "רעה", rootIndices: [0, 1] },
      { text: "לֹא", translit: "lōʾ", gloss: "not", wordId: null, rootId: null, rootIndices: [] },
      { text: "אֶחְסָר", translit: "ʾeḥsār", gloss: "I shall lack", wordId: "echsar", rootId: "חסר", rootIndices: [1, 2, 3] },
    ],
    notes: "Hebrew has no verb “to be” in the present — “the LORD my shepherd” simply means “the LORD is my shepherd”.",
  },
  {
    id: "ruth-1-16",
    reference: "Ruth 1:16 (excerpt)",
    translation: "Your people shall be my people, and your God my God.",
    tokens: [
      { text: "עַמֵּךְ", translit: "ʿammēḵ", gloss: "your people", wordId: "am", rootId: "עמם", rootIndices: [0, 1] },
      { text: "עַמִּי", translit: "ʿammî", gloss: "my people", wordId: "am", rootId: "עמם", rootIndices: [0, 1] },
      { text: "וֵאלֹהַיִךְ", translit: "wēʾlōhayiḵ", gloss: "and your God", wordId: "elohim", rootId: "אלה", rootIndices: [1, 2, 3] },
      { text: "אֱלֹהָי", translit: "ʾĕlōhāy", gloss: "my God", wordId: "elohim", rootId: "אלה", rootIndices: [0, 1, 2] },
    ],
    notes: "Ruth says this to Naomi. Two nouns, each said twice with a different possessive ending — the whole line turns on those suffixes.",
  },
];

export const passageById = new Map(passages.map((p) => [p.id, p]));
