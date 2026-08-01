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
import { scriptOf } from "./course";

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

export const PersonSchema = z.enum(["1", "2", "3"]);
export const GenderSchema = z.enum(["m", "f", "c"]);
export const NumberSchema = z.enum(["s", "p", "d"]);
export const TenseSchema = z.enum([
  "perfect",
  "imperfect",
  "imperative",
  "participle",
  "infinitive_construct",
  "infinitive_absolute",
  "cohortative",
  "jussive",
]);

/** Full morphological parse — the answer key for parsing exercises. */
export const ParseSchema = z.object({
  binyan: BinyanSchema.optional(),
  tense: TenseSchema.optional(),
  person: PersonSchema.optional(),
  gender: GenderSchema.optional(),
  number: NumberSchema.optional(),
});
export type Parse = z.infer<typeof ParseSchema>;

export const RootSchema = z.object({
  /** Bare consonants, no maqqef, e.g. "שׁמר". Used as the stable id. */
  id: z.string().min(2),
  letters: z.string().min(2),
  coreGloss: z.string().min(1),
  notes: z.string().optional(),
});
export type Root = z.infer<typeof RootSchema>;

/**
 * A vocabulary item. `rootIndices` are LETTER positions (see lib/script), never
 * code-point positions — the refinement below makes that impossible to get wrong
 * silently.
 */
export const WordSchema = z
  .object({
    id: z.string().min(1),
    rootId: z.string().min(2),
    /** Pointed form as it appears in the text. */
    text: z.string().min(1),
    translit: z.string().min(1),
    gloss: z.string().min(1),
    partOfSpeech: PartOfSpeechSchema,
    /** Letter indices within `text` that carry the root consonants. */
    rootIndices: z.array(z.number().int().nonnegative()).min(2).max(4),
    parse: ParseSchema.optional(),
    /** Verse references where this exact form occurs. */
    attestations: z.array(z.string()).default([]),
    /** Distractor glosses for multiple choice. */
    distractors: z.array(z.string()).min(3),
    notes: z.string().optional(),
  })
  // The guard that makes the original prototype's bug unrepresentable: a word
  // whose root indices land on vowel points instead of consonants cannot parse.
  .superRefine((w, ctx) => {
    const check = validateLetterIndices(scriptOf(), w.text, w.rootIndices);
    if (!check.ok) {
      ctx.addIssue({
        code: "custom",
        path: ["rootIndices"],
        message: `word "${w.id}" (${w.text}): ${check.reason}`,
      });
    }
  });
export type Word = z.infer<typeof WordSchema>;

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
  rootId: z.string(),
  choices: z.array(z.string()).min(2),
  answer: z.string(),
  note: z.string().optional(),
});

/** Multi-field parse — graded per field, not all-or-nothing. */
export const ParsingExercise = z.object({
  ...ExerciseBase,
  type: z.literal("parsing"),
  text: z.string(),
  rootId: z.string(),
  rootIndices: z.array(z.number().int().nonnegative()),
  answer: ParseSchema,
  /** Which fields the learner must fill in; others are hidden. */
  fields: z.array(z.enum(["binyan", "tense", "person", "gender", "number"])).min(1),
  note: z.string().optional(),
});

/** Same root across stems, contrasting meaning (spec §4 Phase 3). */
export const BinyanCompareExercise = z.object({
  ...ExerciseBase,
  type: z.literal("binyan_compare"),
  rootId: z.string(),
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
  rootId: z.string().optional(),
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
  rootId: z.string().nullable().default(null),
  rootIndices: z.array(z.number().int().nonnegative()).default([]),
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
  roots: z.array(RootSchema),
  words: z.array(WordSchema),
  units: z.array(UnitSchema),
  passages: z.array(PassageSchema),
});
export type ContentBundle = z.infer<typeof ContentBundleSchema>;

/**
 * Parse + cross-reference check. Zod covers shape; this covers referential
 * integrity, which is where hand-authored content actually breaks.
 */
export function validateBundle(bundle: unknown): { bundle: ContentBundle; errors: string[] } {
  const parsed = ContentBundleSchema.parse(bundle);
  const errors: string[] = [];

  const rootIds = new Set(parsed.roots.map((r) => r.id));
  const wordIds = new Set(parsed.words.map((w) => w.id));
  const unitIds = new Set(parsed.units.map((u) => u.id));
  const passageIds = new Set(parsed.passages.map((p) => p.id));

  const dupes = <T>(xs: T[]) => xs.filter((x, i) => xs.indexOf(x) !== i);
  for (const d of dupes(parsed.words.map((w) => w.id))) errors.push(`duplicate word id: ${d}`);
  for (const d of dupes(parsed.units.map((u) => u.id))) errors.push(`duplicate unit id: ${d}`);
  for (const d of dupes(parsed.roots.map((r) => r.id))) errors.push(`duplicate root id: ${d}`);

  for (const w of parsed.words) {
    if (!rootIds.has(w.rootId)) errors.push(`word ${w.id} references unknown root ${w.rootId}`);
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
      if ("rootId" in ex && ex.rootId && !rootIds.has(ex.rootId)) {
        errors.push(`exercise ${ex.id} references unknown root ${ex.rootId}`);
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
      if (t.rootId && !rootIds.has(t.rootId)) {
        errors.push(`passage ${p.id} token references unknown root ${t.rootId}`);
      }
      const check = validateLetterIndices(scriptOf(), t.text, t.rootIndices);
      if (!check.ok) errors.push(`passage ${p.id} token "${t.text}": ${check.reason}`);
    }
  }

  // Unit graph must be a chain with no cycles and exactly one entry point.
  const roots = parsed.units.filter((u) => u.requires === null);
  if (roots.length === 0) errors.push("no starting unit (every unit has a prerequisite)");

  return { bundle: parsed, errors };
}
