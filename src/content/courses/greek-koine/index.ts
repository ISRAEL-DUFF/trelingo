/**
 * Koine Greek — verification seed.
 *
 * ⚠️ THIS IS NOT THE PHASE 5 CURRICULUM. It is a deliberately tiny bundle whose
 * only job is to make the multi-course machinery exercisable end to end: a
 * second course a learner can actually enter, hold separate progress in, and
 * review — which is what Phase 4's exit criteria require.
 *
 * Provenance: every split here was DERIVED, not authored. The stem/ending
 * boundaries come from the MorphGNT paradigm-invariance analysis in
 * spike-a-findings.md §4, where they spot-checked 11/11 against hand-verified
 * answers — including λόγος, θεός and κόσμος, the three the prototype got wrong.
 *
 * Still required before this is shown to real learners (spike-a-findings.md §7):
 *   - a specialist to review glosses, distractors and pedagogical ordering;
 *   - the full derivation pipeline, rather than this hand-transcribed excerpt.
 *
 * Note the morphology `kind` throughout: Greek highlights the **ending**, the
 * inverse of Hebrew's root. That is the product's central pedagogical claim
 * flipping per language, over one mechanism.
 */
import { CONTENT_SCHEMA_VERSION, type ContentBundle } from "../../schema";

const families: ContentBundle["families"] = [
  { id: "αρχ", letters: "αρχ", coreGloss: "beginning, rule", notes: "Behind ἀρχή (beginning) and ἄρχων (ruler)." },
  { id: "λογ", letters: "λογ", coreGloss: "word, reason, account", notes: "Behind λόγος, λέγω (say) and every English -logy." },
  { id: "θε", letters: "θε", coreGloss: "god", notes: "Behind θεός and θεολογία." },
  { id: "κοσμ", letters: "κοσμ", coreGloss: "order, world, adornment", notes: "The same root gives both “cosmos” and “cosmetic”." },
];

const words: ContentBundle["words"] = [
  {
    id: "arche",
    familyId: "αρχ",
    text: "ἀρχή",
    translit: "archē",
    gloss: "beginning",
    partOfSpeech: "noun",
    // ἀρχ|ή — 1st declension nominative singular.
    morphology: { highlight: [3], kind: "ending" },
    parse: { case: "nominative", number: "s", gender: "f", declension: "1" },
    attestations: ["John 1:1"],
    distractors: ["end", "word", "light"],
    notes: "In the dative ἀρχῇ the stem ἀρχ- is unchanged; only the ending moves.",
  },
  {
    id: "logos",
    familyId: "λογ",
    text: "λόγος",
    translit: "logos",
    gloss: "word, reason",
    partOfSpeech: "noun",
    // λόγ|ος — the split the prototype got wrong (greek-build-plan.md §7).
    morphology: { highlight: [3, 4], kind: "ending" },
    parse: { case: "nominative", number: "s", gender: "m", declension: "2" },
    attestations: ["John 1:1"],
    distractors: ["light", "life", "flesh"],
    notes: "2nd declension. The -ος ending marks nominative singular; the accusative is λόγον.",
  },
  {
    id: "theos",
    familyId: "θε",
    text: "θεός",
    translit: "theos",
    gloss: "God",
    partOfSpeech: "noun",
    // θε|ός — stem is just θε-, which is why the ending is two letters.
    morphology: { highlight: [2, 3], kind: "ending" },
    parse: { case: "nominative", number: "s", gender: "m", declension: "2" },
    attestations: ["John 1:1"],
    distractors: ["spirit", "world", "truth"],
  },
  {
    id: "kosmos",
    familyId: "κοσμ",
    text: "κόσμος",
    translit: "kosmos",
    gloss: "world",
    partOfSpeech: "noun",
    morphology: { highlight: [4, 5], kind: "ending" },
    parse: { case: "nominative", number: "s", gender: "m", declension: "2" },
    attestations: [],
    distractors: ["temple", "heaven", "sin"],
    notes: "Same -ος ending as λόγος — one pattern, learned once.",
  },
];

const passages: ContentBundle["passages"] = [
  {
    id: "john-1-1",
    reference: "John 1:1",
    translation: "In the beginning was the Word, and the Word was with God, and the Word was God.",
    // Converted from MorphGNT; function words carry no morpheme to highlight.
    tokens: [
      { text: "Ἐν", translit: "en", gloss: "in", wordId: null, familyId: null, morphology: null },
      { text: "ἀρχῇ", translit: "archē", gloss: "the beginning", wordId: "arche", familyId: "αρχ", morphology: { highlight: [3], kind: "ending" }, parse: { case: "dative", number: "s", gender: "f" } },
      { text: "ἦν", translit: "ēn", gloss: "was", wordId: null, familyId: null, morphology: null },
      { text: "ὁ", translit: "ho", gloss: "the", wordId: null, familyId: null, morphology: null },
      { text: "λόγος", translit: "logos", gloss: "Word", wordId: "logos", familyId: "λογ", morphology: { highlight: [3, 4], kind: "ending" }, parse: { case: "nominative", number: "s", gender: "m" } },
      { text: "καὶ", translit: "kai", gloss: "and", wordId: null, familyId: null, morphology: null },
      { text: "ὁ", translit: "ho", gloss: "the", wordId: null, familyId: null, morphology: null },
      { text: "λόγος", translit: "logos", gloss: "Word", wordId: "logos", familyId: "λογ", morphology: { highlight: [3, 4], kind: "ending" }, parse: { case: "nominative", number: "s", gender: "m" } },
      { text: "ἦν", translit: "ēn", gloss: "was", wordId: null, familyId: null, morphology: null },
      { text: "πρὸς", translit: "pros", gloss: "with", wordId: null, familyId: null, morphology: null },
      { text: "τὸν", translit: "ton", gloss: "the", wordId: null, familyId: null, morphology: null },
      { text: "θεόν", translit: "theon", gloss: "God", wordId: "theos", familyId: "θε", morphology: { highlight: [2, 3], kind: "ending" }, parse: { case: "accusative", number: "s", gender: "m" } },
      { text: "καὶ", translit: "kai", gloss: "and", wordId: null, familyId: null, morphology: null },
      { text: "θεὸς", translit: "theos", gloss: "God", wordId: "theos", familyId: "θε", morphology: { highlight: [2, 3], kind: "ending" }, parse: { case: "nominative", number: "s", gender: "m" } },
      { text: "ἦν", translit: "ēn", gloss: "was", wordId: null, familyId: null, morphology: null },
      { text: "ὁ", translit: "ho", gloss: "the", wordId: null, familyId: null, morphology: null },
      { text: "λόγος", translit: "logos", gloss: "Word", wordId: "logos", familyId: "λογ", morphology: { highlight: [3, 4], kind: "ending" }, parse: { case: "nominative", number: "s", gender: "m" } },
    ],
    notes:
      "θεόν and θεὸς are the same word in different cases — accusative after πρός, then nominative. Only the ending moves.",
  },
];

const units: ContentBundle["units"] = [
  {
    id: "g-u01",
    orderIndex: 0,
    title: "In the Beginning",
    subtitle: "John 1:1",
    type: "mixed",
    requires: null,
    placementLevel: 0,
    wordIds: ["arche", "logos", "theos", "kosmos"],
    passageId: "john-1-1",
    exercises: [
      { id: "g-u01-mc-arche", type: "mc_vocab", wordId: "arche", direction: "recognition", prompt: "What does this word mean?" },
      { id: "g-u01-mc-logos", type: "mc_vocab", wordId: "logos", direction: "recognition", prompt: "What does this word mean?" },
      { id: "g-u01-mcp-logos", type: "mc_vocab", wordId: "logos", direction: "production", prompt: "Which word means this?" },
      { id: "g-u01-mc-theos", type: "mc_vocab", wordId: "theos", direction: "recognition", prompt: "What does this word mean?" },
      { id: "g-u01-mc-kosmos", type: "mc_vocab", wordId: "kosmos", direction: "recognition", prompt: "What does this word mean?" },
      {
        id: "g-u01-ps-1",
        type: "parsing",
        prompt: "Parse this noun.",
        text: "θεόν",
        familyId: "θε",
        morphology: { highlight: [2, 3], kind: "ending" },
        fields: ["case", "number", "gender"],
        answer: { case: "accusative", number: "s", gender: "m" },
        note: "πρός takes the accusative, so “with God” puts θεός into θεόν. The stem never moves.",
      },
      {
        id: "g-u01-tr-1",
        type: "translation",
        prompt: "Translate this clause.",
        text: "ἐν ἀρχῇ ἦν ὁ λόγος",
        acceptable: [
          "in the beginning was the Word",
          "in the beginning was the word",
          "in beginning was the Word",
        ],
        keywords: ["beginning", "word"],
        note: "Greek has no indefinite article, and the definite ὁ marks λόγος as the subject.",
      },
    ],
  },
];

export const greekKoineBundle = {
  schemaVersion: CONTENT_SCHEMA_VERSION,
  families,
  words,
  units,
  passages,
} satisfies ContentBundle;
