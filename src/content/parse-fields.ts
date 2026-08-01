/**
 * Morphological parse fields, per language (greek-build-plan.md §4.4).
 *
 * Hebrew and Greek share person, gender and number and almost nothing else:
 *
 *   Hebrew   binyan, tense (perfect/imperfect/…), gender includes COMMON
 *   Greek    case, voice, mood, declension, gender includes NEUTER
 *
 * Even the shared fields carry different value sets — which is exactly why the
 * options cannot be hardcoded in the parsing exercise UI. A course declares its
 * fields here; the UI renders whatever it is given and the content validator
 * checks answers against the same list.
 */

export type ParseFieldId =
  | "binyan"
  | "tense"
  | "voice"
  | "mood"
  | "case"
  | "person"
  | "gender"
  | "number"
  | "declension";

export interface ParseFieldDef {
  id: ParseFieldId;
  /** Shown above the chip row in the parsing exercise. */
  label: string;
  options: { value: string; label: string }[];
}

const PERSON: ParseFieldDef = {
  id: "person",
  label: "Person",
  options: [
    { value: "1", label: "1st" },
    { value: "2", label: "2nd" },
    { value: "3", label: "3rd" },
  ],
};

const NUMBER_SP: ParseFieldDef = {
  id: "number",
  label: "Number",
  options: [
    { value: "s", label: "Singular" },
    { value: "p", label: "Plural" },
  ],
};

// ---------- Hebrew ----------

export const HEBREW_PARSE_FIELDS: ParseFieldDef[] = [
  {
    id: "binyan",
    label: "Stem (binyan)",
    options: [
      { value: "qal", label: "Qal" },
      { value: "niphal", label: "Niphal" },
      { value: "piel", label: "Piel" },
      { value: "pual", label: "Pual" },
      { value: "hiphil", label: "Hiphil" },
      { value: "hophal", label: "Hophal" },
      { value: "hitpael", label: "Hitpael" },
    ],
  },
  {
    id: "tense",
    label: "Form",
    options: [
      { value: "perfect", label: "Perfect" },
      { value: "imperfect", label: "Imperfect" },
      { value: "imperative", label: "Imperative" },
      { value: "participle", label: "Participle" },
      { value: "infinitive_construct", label: "Inf. construct" },
      { value: "infinitive_absolute", label: "Inf. absolute" },
      { value: "cohortative", label: "Cohortative" },
      { value: "jussive", label: "Jussive" },
    ],
  },
  PERSON,
  {
    id: "gender",
    label: "Gender",
    // Hebrew has COMMON gender; Greek does not.
    options: [
      { value: "m", label: "Masc." },
      { value: "f", label: "Fem." },
      { value: "c", label: "Common" },
    ],
  },
  {
    id: "number",
    label: "Number",
    // Hebrew retains a dual, chiefly on body parts and natural pairs.
    options: [...NUMBER_SP.options, { value: "d", label: "Dual" }],
  },
];

// ---------- Greek ----------

export const GREEK_PARSE_FIELDS: ParseFieldDef[] = [
  {
    id: "tense",
    label: "Tense",
    options: [
      { value: "present", label: "Present" },
      { value: "imperfect", label: "Imperfect" },
      { value: "future", label: "Future" },
      { value: "aorist", label: "Aorist" },
      { value: "perfect", label: "Perfect" },
      { value: "pluperfect", label: "Pluperfect" },
    ],
  },
  {
    id: "voice",
    label: "Voice",
    options: [
      { value: "active", label: "Active" },
      { value: "middle", label: "Middle" },
      { value: "passive", label: "Passive" },
    ],
  },
  {
    id: "mood",
    label: "Mood",
    options: [
      { value: "indicative", label: "Indicative" },
      { value: "subjunctive", label: "Subjunctive" },
      // Largely lost in Koine; kept because Attic needs it and both courses
      // share this field list.
      { value: "optative", label: "Optative" },
      { value: "imperative", label: "Imperative" },
      { value: "infinitive", label: "Infinitive" },
      { value: "participle", label: "Participle" },
    ],
  },
  {
    id: "case",
    label: "Case",
    options: [
      { value: "nominative", label: "Nominative" },
      { value: "genitive", label: "Genitive" },
      { value: "dative", label: "Dative" },
      { value: "accusative", label: "Accusative" },
      { value: "vocative", label: "Vocative" },
    ],
  },
  PERSON,
  {
    id: "gender",
    label: "Gender",
    options: [
      { value: "m", label: "Masc." },
      { value: "f", label: "Fem." },
      { value: "n", label: "Neuter" },
    ],
  },
  NUMBER_SP,
  {
    id: "declension",
    label: "Declension",
    options: [
      { value: "1", label: "1st" },
      { value: "2", label: "2nd" },
      { value: "3", label: "3rd" },
    ],
  },
];

/** Look up a field definition within a course's declared field list. */
export function findField(
  fields: readonly ParseFieldDef[],
  id: string,
): ParseFieldDef | undefined {
  return fields.find((f) => f.id === id);
}

/** True if `value` is a legal value for `fieldId` in this course. */
export function isValidParseValue(
  fields: readonly ParseFieldDef[],
  fieldId: string,
  value: string,
): boolean {
  const f = findField(fields, fieldId);
  return !!f && f.options.some((o) => o.value === value);
}
