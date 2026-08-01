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
export const MorphologySchema = z.object({
  highlight: z.array(z.number().int().nonnegative()).min(1).max(6),
  kind: MorphemeKindSchema,
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
 * A vocabulary item. `morphology.highlight` holds LETTER positions (see
 * lib/script), never code-point positions — the refinement below makes that
 * impossible to get wrong silently.
 */
export const WordSchema = z
  .object({
    id: z.string().min(1),
    familyId: z.string().min(2),
    /** Pointed/accented form as it appears in the text. */
    text: z.string().min(1),
    translit: z.string().min(1),
    gloss: z.string().min(1),
    partOfSpeech: PartOfSpeechSchema,
    /** The morpheme this course highlights on this word. */
    morphology: MorphologySchema,
    parse: ParseSchema.optional(),
    /** Verse references where this exact form occurs. */
    attestations: z.array(z.string()).default([]),
    /** Distractor glosses for multiple choice. */
    distractors: z.array(z.string()).min(3),
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

export const ExerciseSchema = z.discriminatedUnion("type", [
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

export const UnitSchema = z.object({
  id: z.string().min(1),
  orderIndex: z.number().int().nonnegative(),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  type: z.enum(["vocab", "grammar", "mixed", "reading"]),
  /** Vocabulary introduced here; these become SRS cards on completion. */
  wordIds: z.array(z.string()).default([]),
  exercises: z.array(ExerciseSchema).default([]),
  /** The real verse this unit unlocks, if any (spec principle 2). */
  passageId: z.string().optional(),
  /** Unit that must be completed first. Null for the first unit. */
  requires: z.string().nullable().default(null),
  /** Placement test can grant this unit directly at or above this level. */
  placementLevel: z.number().int().min(0).default(0),
});
export type Unit = z.infer<typeof UnitSchema>;

export const ContentBundleSchema = z.object({
  schemaVersion: z.literal(CONTENT_SCHEMA_VERSION),
  families: z.array(WordFamilySchema),
  words: z.array(WordSchema),
  units: z.array(UnitSchema),
  passages: z.array(PassageSchema),
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
    if (!familyIds.has(w.familyId)) errors.push(`word ${w.id} references unknown family ${w.familyId}`);
    checkParse(`word ${w.id}`, w.parse);
    const highlight = validateLetterIndices(script, w.text, w.morphology.highlight);
    if (!highlight.ok) errors.push(`word "${w.id}" (${w.text}): ${highlight.reason}`);
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
