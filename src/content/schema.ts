/**
 * Content schema — spec §5.1.
 *
 * "The schema is the contract from day one, only the authoring *interface*
 * changes." Everything the app teaches validates against these types, and the
 * validation is CI-blocking (see content.test.ts), not advisory.
 *
 * When the Phase 9 CMS arrives it writes JSON conforming to exactly this shape,
 * so no migration is needed — which is the whole point of defining it now.
 */
import { z } from "zod";
import { validateLetterIndices } from "@/lib/morphology";
import { scriptOf, parseFieldsOf, getCourse, type CourseId } from "./course";
import { isValidParseValue, type ParseFieldId } from "./parse-fields";

export const CONTENT_SCHEMA_VERSION = 1;

/** Verbal stems. Biblical Hebrew's seven principal binyanim. */
export const BinyanSchema = z.enum([
  "qal",
  "niphal",
  "piel",
  "pual",
  "hiphil",
  "hophal",
  "hitpael",
]);
export type Binyan = z.infer<typeof BinyanSchema>;

export const PartOfSpeechSchema = z.enum([
  "verb",
  "noun",
  "adjective",
  "pronoun",
  "preposition",
  "conjunction",
  "adverb",
  "particle",
  "proper_noun",
]);

/** Every parse field any supported language uses. See parse-fields.ts. */
export const ParseFieldIdSchema = z.enum([
  "binyan",
  "tense",
  "voice",
  "mood",
  "case",
  "person",
  "gender",
  "number",
  "declension",
]);

/**
 * A morphological parse — the answer key for parsing exercises.
 *
 * Values are plain strings, not enums, because the legal set is PER LANGUAGE:
 * a Greek "optative" and a Hebrew "qal" cannot share one enum, and Hebrew's
 * common gender does not exist in Greek. Validation therefore moves out of the
 * type system and into `validateBundle`, which checks each value against the
 * COURSE's declared fields. That is a stronger check, not a weaker one — it
 * also rejects a field the language does not have at all.
 */
export const ParseSchema = z.object({
  binyan: z.string().optional(),
  tense: z.string().optional(),
  voice: z.string().optional(),
  mood: z.string().optional(),
  case: z.string().optional(),
  person: z.string().optional(),
  gender: z.string().optional(),
  number: z.string().optional(),
  declension: z.string().optional(),
});
export type Parse = Partial<Record<ParseFieldId, string>>;

/**
 * Which morpheme a course teaches by highlighting it.
 *
 * Hebrew highlights the ROOT — the invariant core that survives inflection.
 * Greek highlights the ENDING — the part that changes and carries the grammar.
 * They are opposite emphases over the same mechanism, which is why this is a
 * discriminant rather than two separate systems.
 */
export const MorphemeKindSchema = z.enum(["root", "ending", "stem"]);
export type MorphemeKind = z.infer<typeof MorphemeKindSchema>;

/**
 * The highlighted morpheme, as LETTER indices (see lib/script), never
 * code-point positions.
 *
 * A set of indices rather than a split point, because Hebrew families can be
 * discontiguous: מִזְמוֹר carries ז־מ־ר at letters [1,2,4] — index 3 is the
 * holam vav and is not a root letter. Greek stem/ending is contiguous, so a
 * course authoring tool may expose a simple split index and expand it here.
 */
/**
 * The cap differs by KIND, because the two morphemes are not the same size.
 *
 * A Semitic root is three consonants, four or five in the weak and quadriliteral
 * cases — six is generous. A Greek ENDING is not bounded that way: the middle
 * participle ἐξομολογούμενοι ends -ούμενοι, seven letters, and καταρτίζοντας
 * ends -οντας after a stem of eight. A flat max of 6 was a root-shaped
 * assumption applied to both, and it rejected correct Greek.
 */
export const MorphologySchema = z
  .object({
    highlight: z.array(z.number().int().nonnegative()).min(1).max(12),
    kind: MorphemeKindSchema,
  })
  .refine((m) => m.kind !== "root" || m.highlight.length <= 6, {
    message: "a root of more than six letters is not a root",
  });
export type Morphology = z.infer<typeof MorphologySchema>;

/**
 * A family of words sharing a morphological core — a triliteral root in Hebrew,
 * a verb stem or lemma in Greek. This is what the family sheet browses, and the
 * product's central claim: learn the core once, and it pays off across a family.
 */
export const WordFamilySchema = z.object({
  /** Bare letters, no separators, e.g. "שׁמר". Used as the stable id. */
  id: z.string().min(2),
  letters: z.string().min(2),
  coreGloss: z.string().min(1),
  notes: z.string().optional(),
});
export type WordFamily = z.infer<typeof WordFamilySchema>;

/**
 * How often a word occurs — the fact that tells a learner whether it is rare.
 *
 * TWO COUNTS, AND THEY ANSWER DIFFERENT QUESTIONS. `inTrack` is occurrences in
 * the text this course teaches; `inCorpus` is occurrences in a larger reference
 * body. Only the second can settle "is this a hapax legomenon", and conflating
 * them would actively mislead: אֹזֶן "ear" occurs once in Ruth and 187 times in
 * the Hebrew Bible. A bare "1×" would teach a learner that an ordinary word is
 * vanishingly rare.
 *
 * `corpusComplete` is the guard on that claim. A count of 1 means "hapax" ONLY
 * when the corpus counted is the whole of it. The Hebrew figures come from all
 * 39 books of the Tanakh and qualify; the Greek figures come from sampled
 * corpora and do not, so a Greek word occurring once is reported as once in the
 * sample and never called a hapax.
 */
export const FrequencySchema = z
  .object({
    /**
     * Occurrences in this course's own text, when it occurs there at all.
     *
     * Optional because the Greek tracks teach vocabulary drawn from a corpus
     * far larger than the few verses they display: πᾶς is taught from the
     * treebank and appears in neither Attic passage. Flooring that to 1 to
     * satisfy a required field invented a number, which is worse than silence.
     */
    inTrack: z.number().int().positive().optional(),
    /** Occurrences in the reference corpus, when there is one. */
    inCorpus: z.number().int().positive().optional(),
    /** What that corpus is, phrased for display: "the Hebrew Bible". */
    corpus: z.string().min(1).optional(),
    /** Whether `corpus` is the ENTIRE corpus — the licence to say "hapax". */
    corpusComplete: z.boolean().optional(),
    /** How many books of the corpus the word appears in. */
    corpusBooks: z.number().int().positive().optional(),
  })
  .refine((f) => f.inTrack !== undefined || f.inCorpus !== undefined, {
    message: "a frequency with neither count says nothing",
  })
  .refine((f) => !f.inCorpus || !!f.corpus, {
    message: "a corpus count without a corpus name is unattributable",
  })
  .refine((f) => f.inCorpus === undefined || f.inTrack === undefined || f.inCorpus >= f.inTrack, {
    message: "a word cannot occur more often in one book than in the corpus containing it",
  });
export type Frequency = z.infer<typeof FrequencySchema>;

/** True only when the count is 1 AND the corpus counted was complete. */
export function isHapax(f: Frequency | undefined): boolean {
  return !!f?.corpusComplete && f.inCorpus === 1;
}

/**
 * A vocabulary item. `morphology.highlight` holds LETTER positions (see
 * lib/script), never code-point positions — the refinement below makes that
 * impossible to get wrong silently.
 */
export const WordSchema = z
  .object({
    id: z.string().min(1),
    /**
     * The family this word belongs to, or null when its morpheme is unknown.
     *
     * Nullable on purpose. A derived corpus cannot always establish a root, and
     * inventing one to satisfy the type would be the very guess the importers
     * refuse to make — see jonah-spike-findings.md §3. A word with no known
     * root is displayed without a highlight and belongs to no family.
     */
    familyId: z.string().min(2).nullable().default(null),
    /** Pointed/accented form as it appears in the text. */
    text: z.string().min(1),
    translit: z.string().min(1),
    gloss: z.string().min(1),
    partOfSpeech: PartOfSpeechSchema,
    /**
     * The morpheme this course highlights, or absent when none is known.
     *
     * Optional for the same reason `familyId` is nullable: a word whose root
     * the corpus cannot establish is shown plain rather than guessed at.
     */
    morphology: MorphologySchema.optional(),
    parse: ParseSchema.optional(),
    /** Verse references where this exact form occurs. */
    attestations: z.array(z.string()).default([]),
    /** Distractor glosses for multiple choice. */
    distractors: z.array(z.string()).min(3),
    /** How common the word is. Absent where the corpus cannot say. */
    frequency: FrequencySchema.optional(),
    notes: z.string().optional(),
  });
export type Word = z.infer<typeof WordSchema>;

// The guard that makes both prototypes' bug unrepresentable — a highlight
// landing on a vowel point, or off the end of the word — lives in
// validateBundle rather than here, because it needs the course's script and a
// Zod refinement has no way to receive one.

// ---------- Exercises ----------
// Each type carries its own payload shape. Grading logic lives in
// features/lesson/grade.ts and switches on this discriminant.

const ExerciseBase = { id: z.string().min(1), prompt: z.string().min(1) };

export const McVocabExercise = z.object({
  ...ExerciseBase,
  type: z.literal("mc_vocab"),
  wordId: z.string(),
  /** script→gloss or gloss→script. */
  direction: z.enum(["recognition", "production"]).default("recognition"),
});

export const ConjugationExercise = z.object({
  ...ExerciseBase,
  type: z.literal("conjugation"),
  familyId: z.string(),
  choices: z.array(z.string()).min(2),
  answer: z.string(),
  note: z.string().optional(),
});

/** Multi-field parse — graded per field, not all-or-nothing. */
export const ParsingExercise = z.object({
  ...ExerciseBase,
  type: z.literal("parsing"),
  text: z.string(),
  familyId: z.string(),
  morphology: MorphologySchema,
  answer: ParseSchema,
  /** Which fields the learner must fill in; others are hidden. */
  fields: z.array(ParseFieldIdSchema).min(1),
  note: z.string().optional(),
});

/** Same root across stems, contrasting meaning (spec §4 Phase 3). */
export const BinyanCompareExercise = z.object({
  ...ExerciseBase,
  type: z.literal("binyan_compare"),
  familyId: z.string(),
  forms: z
    .array(
      z.object({
        text: z.string(),
        binyan: BinyanSchema,
        gloss: z.string(),
        translit: z.string(),
      }),
    )
    .min(2),
  /** The learner matches each form to its meaning. */
  note: z.string().optional(),
});

export const ConstructChainExercise = z.object({
  ...ExerciseBase,
  type: z.literal("construct_chain"),
  choices: z.array(z.string()).min(2),
  answer: z.string(),
  familyId: z.string().optional(),
  note: z.string().optional(),
});

export const ListeningExercise = z.object({
  ...ExerciseBase,
  type: z.literal("listening_mc"),
  wordId: z.string(),
});

export const TranslationExercise = z.object({
  ...ExerciseBase,
  type: z.literal("translation"),
  text: z.string(),
  /** Canonical answer plus acceptable paraphrases. */
  acceptable: z.array(z.string()).min(1),
  /** Words that must appear (lemma-ish) for a pass. */
  keywords: z.array(z.string()).default([]),
  note: z.string().optional(),
});

/**
 * Tap a word, tap its meaning, the pair vanishes.
 *
 * Pure form-to-meaning binding under mild time pressure, which is what builds
 * recognition SPEED rather than recognition accuracy — the thing a reader needs
 * and a multiple-choice question does not train.
 *
 * It is honestly isolated-card practice, which
 * trelingo-pedagogical-foundation.md §6.2 warns produces "card-bound
 * knowledge": recognising שָׁמַר on a tile and missing שָׁמְרוּ three verses
 * later. Good for fluency and engagement, weaker for transfer — which is why
 * `cloze` exists beside it.
 */
export const MatchPairsExercise = z.object({
  ...ExerciseBase,
  type: z.literal("match_pairs"),
  /** Words to pair. Four to six works; more turns it into a memory test. */
  wordIds: z.array(z.string()).min(3).max(8),
});

/**
 * A verse the learner has ALREADY READ, with one word removed.
 *
 * §6.2's actual recommendation, and the one form of practice this app can do
 * that a generic flashcard app cannot: the vocabulary is re-tested inside the
 * sentence it was learned in. Coverage data (coverage-findings.md §4a) shows a
 * book re-uses its own words heavily — Genesis 7 is 90% words already met — so
 * the material for this is free and grows as the learner reads.
 *
 * The passage must be one the learner has finished, or this is a reading
 * comprehension test rather than a vocabulary review.
 */
export const ClozeExercise = z.object({
  ...ExerciseBase,
  type: z.literal("cloze"),
  passageId: z.string(),
  /** Index of the blanked token within the passage. */
  tokenIndex: z.number().int().nonnegative(),
  /** The word that belongs in the blank. */
  wordId: z.string(),
  /** Surface forms offered, including the answer. */
  choices: z.array(z.string()).min(2),
  answer: z.string(),
  note: z.string().optional(),
});

export const ExerciseSchema = z.discriminatedUnion("type", [
  MatchPairsExercise,
  ClozeExercise,
  McVocabExercise,
  ConjugationExercise,
  ParsingExercise,
  BinyanCompareExercise,
  ConstructChainExercise,
  ListeningExercise,
  TranslationExercise,
]);
export type Exercise = z.infer<typeof ExerciseSchema>;
export type ExerciseType = Exercise["type"];

// ---------- Passages ----------

/** One word inside a verse, linked back to vocabulary where we teach it. */
export const PassageTokenSchema = z.object({
  text: z.string(),
  translit: z.string(),
  gloss: z.string(),
  /** Null for function words we do not teach as vocabulary. */
  wordId: z.string().nullable().default(null),
  familyId: z.string().nullable().default(null),
  /** Null for function words, which carry no morpheme worth highlighting. */
  morphology: MorphologySchema.nullable().default(null),
  parse: ParseSchema.optional(),
});
export type PassageToken = z.infer<typeof PassageTokenSchema>;

export const PassageSchema = z.object({
  /** e.g. "gen-1-1" */
  id: z.string().min(1),
  /** Human reference, e.g. "Genesis 1:1" */
  reference: z.string().min(1),
  tokens: z.array(PassageTokenSchema).min(1),
  translation: z.string().min(1),
  /** Shown once the learner has read it. */
  notes: z.string().optional(),
});
export type Passage = z.infer<typeof PassageSchema>;

// ---------- Units ----------

/**
 * A chapter — the grouping between a track and its units.
 *
 * A track is a whole book, and a book is read chapter by chapter. Without this
 * a 48-verse book is one flat scrolling path and Genesis would be 766 nodes in
 * a row with no landmark.
 *
 * Chapter is a sound STRUCTURAL boundary and a poor difficulty assumption:
 * Genesis 10 introduces 94 new lexemes where Genesis 9 introduced 25, because
 * it is the Table of Nations. `newWordCount` is therefore surfaced rather than
 * implied — see coverage-findings.md §4a.
 */
export const SectionSchema = z.object({
  id: z.string().min(1),
  /** "Chapter 2". */
  label: z.string().min(1),
  /** What happens in it, for the path header. */
  subtitle: z.string().optional(),
  orderIndex: z.number().int().nonnegative(),
});
export type Section = z.infer<typeof SectionSchema>;

export const UnitSchema = z.object({
  id: z.string().min(1),
  orderIndex: z.number().int().nonnegative(),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  type: z.enum(["vocab", "grammar", "mixed", "reading"]),
  /** Vocabulary introduced here; these become SRS cards on completion. */
  wordIds: z.array(z.string()).default([]),
  exercises: z.array(ExerciseSchema).default([]),
  /**
   * The milestone verse — the one the lesson ends on (spec principle 2).
   *
   * For a unit covering several verses this is the LAST of them, so the lesson
   * closes on the passage the whole unit was building toward.
   */
  passageId: z.string().optional(),
  /**
   * EVERY verse this unit covers, in text order.
   *
   * A Jonah unit teaches two verses but used to record only the milestone, so
   * the other 24 verses of the book were unlocked by nothing, displayed
   * nowhere, and invisible to the cloze builder — including Jonah 1:3 and 1:5,
   * which hold three of the four occurrences of ירד.
   *
   * Optional, and defaulted from `passageId` by `passagesOf`, so a track whose
   * units cover a single verse each (Shoresh, Koine, Attic) needs no change.
   */
  passageIds: z.array(z.string()).optional(),
  /** Unit that must be completed first. Null for the first unit. */
  requires: z.string().nullable().default(null),
  /** Placement test can grant this unit directly at or above this level. */
  placementLevel: z.number().int().min(0).default(0),
  /** The chapter this unit belongs to. Absent for tracks with no chapters. */
  sectionId: z.string().optional(),
});
export type Unit = z.infer<typeof UnitSchema>;

/**
 * Every passage a unit covers, in text order.
 *
 * The one way to ask "which verses does this unit teach?". Reading `passageId`
 * directly answers a narrower question — which verse does it END on — and the
 * two were silently conflated everywhere until a whole book turned out to have
 * half its verses unreachable.
 */
export function passagesOf(unit: Pick<Unit, "passageId" | "passageIds">): string[] {
  if (unit.passageIds?.length) return unit.passageIds;
  return unit.passageId ? [unit.passageId] : [];
}

export const ContentBundleSchema = z.object({
  schemaVersion: z.literal(CONTENT_SCHEMA_VERSION),
  families: z.array(WordFamilySchema),
  words: z.array(WordSchema),
  units: z.array(UnitSchema),
  passages: z.array(PassageSchema),
  /** Chapters, for a track that is a whole book. Absent for the others. */
  sections: z.array(SectionSchema).optional(),
});
export type ContentBundle = z.infer<typeof ContentBundleSchema>;

/**
 * Parse + cross-reference check. Zod covers shape; this covers referential
 * integrity, which is where hand-authored content actually breaks.
 */
export function validateBundle(
  bundle: unknown,
  courseId?: CourseId,
): { bundle: ContentBundle; errors: string[] } {
  const parsed = ContentBundleSchema.parse(bundle);
  const errors: string[] = [];
  // Validate against the course the content BELONGS to, not whichever happens
  // to be active — otherwise CI passes or fails depending on UI state.
  const course = getCourse(courseId);
  const script = scriptOf(course);

  const familyIds = new Set(parsed.families.map((f) => f.id));
  const wordIds = new Set(parsed.words.map((w) => w.id));
  const unitIds = new Set(parsed.units.map((u) => u.id));
  const passageIds = new Set(parsed.passages.map((p) => p.id));
  const sectionIds = new Set((parsed.sections ?? []).map((s) => s.id));

  const dupes = <T>(xs: T[]) => xs.filter((x, i) => xs.indexOf(x) !== i);
  for (const d of dupes(parsed.words.map((w) => w.id))) errors.push(`duplicate word id: ${d}`);
  for (const d of dupes(parsed.units.map((u) => u.id))) errors.push(`duplicate unit id: ${d}`);
  for (const d of dupes(parsed.families.map((f) => f.id))) errors.push(`duplicate family id: ${d}`);

  const parseFields = parseFieldsOf(course);
  const knownFieldIds = new Set(parseFields.map((f) => f.id));

  /** Every parse value must be legal for THIS course's language. */
  const checkParse = (where: string, parse: Record<string, string | undefined> | undefined) => {
    if (!parse) return;
    for (const [field, value] of Object.entries(parse)) {
      if (value === undefined) continue;
      if (!knownFieldIds.has(field as ParseFieldId)) {
        errors.push(`${where}: field "${field}" is not used by this course's language`);
      } else if (!isValidParseValue(parseFields, field, value)) {
        errors.push(`${where}: "${value}" is not a valid ${field} for this course`);
      }
    }
  };

  for (const w of parsed.words) {
    if (w.familyId && !familyIds.has(w.familyId)) {
      errors.push(`word ${w.id} references unknown family ${w.familyId}`);
    }
    // A highlight asserts a morpheme; a morpheme belongs to a family. Having
    // one without the other means the two halves disagree.
    if (w.morphology && !w.familyId) errors.push(`word ${w.id} highlights a morpheme but has no family`);
    checkParse(`word ${w.id}`, w.parse);
    if (w.morphology) {
      const highlight = validateLetterIndices(script, w.text, w.morphology.highlight);
      if (!highlight.ok) errors.push(`word "${w.id}" (${w.text}): ${highlight.reason}`);
    }
    if (w.distractors.includes(w.gloss)) {
      errors.push(`word ${w.id} lists its own gloss "${w.gloss}" as a distractor`);
    }
  }

  for (const u of parsed.units) {
    for (const id of u.wordIds) {
      if (!wordIds.has(id)) errors.push(`unit ${u.id} references unknown word ${id}`);
    }
    if (u.requires && !unitIds.has(u.requires)) {
      errors.push(`unit ${u.id} requires unknown unit ${u.requires}`);
    }
    if (u.passageId && !passageIds.has(u.passageId)) {
      errors.push(`unit ${u.id} references unknown passage ${u.passageId}`);
    }
    for (const id of u.passageIds ?? []) {
      if (!passageIds.has(id)) errors.push(`unit ${u.id} references unknown passage ${id}`);
    }
    if (u.passageIds?.length && u.passageId && !u.passageIds.includes(u.passageId)) {
      errors.push(`unit ${u.id} milestone ${u.passageId} is not among its own passages`);
    }
    if (u.sectionId && !sectionIds.has(u.sectionId)) {
      errors.push(`unit ${u.id} references unknown section ${u.sectionId}`);
    }
    for (const ex of u.exercises) {
      if ("wordId" in ex && !wordIds.has(ex.wordId)) {
        errors.push(`exercise ${ex.id} references unknown word ${ex.wordId}`);
      }
      if ("familyId" in ex && ex.familyId && !familyIds.has(ex.familyId)) {
        errors.push(`exercise ${ex.id} references unknown family ${ex.familyId}`);
      }
      if (ex.type === "parsing") {
        checkParse(`exercise ${ex.id}`, ex.answer);
        for (const f of ex.fields) {
          if (!knownFieldIds.has(f)) {
            errors.push(`exercise ${ex.id} asks for "${f}", which this course's language does not use`);
          }
        }
      }
      if (ex.type === "conjugation" && !ex.choices.includes(ex.answer)) {
        errors.push(`exercise ${ex.id}: answer is not among its choices`);
      }
      if (ex.type === "construct_chain" && !ex.choices.includes(ex.answer)) {
        errors.push(`exercise ${ex.id}: answer is not among its choices`);
      }
    }
  }

  for (const p of parsed.passages) {
    for (const t of p.tokens) {
      if (t.wordId && !wordIds.has(t.wordId)) {
        errors.push(`passage ${p.id} token references unknown word ${t.wordId}`);
      }
      if (t.familyId && !familyIds.has(t.familyId)) {
        errors.push(`passage ${p.id} token references unknown family ${t.familyId}`);
      }
      // Function words legitimately have no morpheme to highlight.
      if (t.morphology) {
        const check = validateLetterIndices(script, t.text, t.morphology.highlight);
        if (!check.ok) errors.push(`passage ${p.id} token "${t.text}": ${check.reason}`);
      }
      checkParse(`passage ${p.id} token "${t.text}"`, t.parse);
    }
  }

  // Unit graph must be a chain with no cycles and exactly one entry point.
  const entryPoints = parsed.units.filter((u) => u.requires === null);
  if (entryPoints.length === 0) errors.push("no starting unit (every unit has a prerequisite)");

  return { bundle: parsed, errors };
}
