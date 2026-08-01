/**
 * Course definitions (greek-build-plan.md §4.1).
 *
 * A `Course` carries everything the UI needs in order to stop asking "which
 * language is this?". Components read direction, lang, fonts and the script
 * module from here and never branch on language themselves.
 *
 * Per decision D1 there is no `Track` type — Koine and Attic will be separate
 * courses. Per D7 courses do not carry a palette; they carry a single accent
 * colour and reuse the shared light/dark theme.
 */
import { scriptFor, type ScriptId, type ScriptModule } from "@/lib/script";
import { GREEK_PARSE_FIELDS, HEBREW_PARSE_FIELDS, type ParseFieldDef } from "./parse-fields";
import "@/lib/script/hebrew"; // registers the Hebrew script module
import "@/lib/script/greek"; // registers the Greek script module

export type CourseId = "hebrew-biblical" | "greek-koine" | "greek-attic" | "latin";

export interface Course {
  id: CourseId;
  name: string;
  subtitle: string;

  /** Which script module supplies clustering, folding and direction. */
  script: ScriptId;
  fontStack: string;

  /**
   * The only visual override per course (D7). The shared palette is reused
   * unchanged; this drives the header and per-course highlights.
   */
  accentColor: string;

  /** Whether this course has an honest diacritic-fading progression (Hebrew yes, Greek no). */
  supportsFading: boolean;

  /** How this language's diacritics are described to the learner. */
  diacriticsCopy: {
    /** Field label, e.g. "Vowel points (niqqud)". */
    label: string;
    always: string;
    fading: string;
    off: string;
  };

  /** Morphological fields this language uses, with their legal values. */
  parseFields: ParseFieldDef[];
}

export const HEBREW_BIBLICAL: Course = {
  id: "hebrew-biblical",
  name: "Shoresh",
  subtitle: "Biblical Hebrew · Genesis, Psalms, Ruth",
  script: "hebrew",
  fontStack: "'Frank Ruhl Libre', 'Times New Roman', serif",
  accentColor: "var(--gold)",
  supportsFading: true,
  parseFields: HEBREW_PARSE_FIELDS,
  diacriticsCopy: {
    label: "Vowel points (niqqud)",
    always: "Full pointing everywhere.",
    fading:
      "Points drop away in stages as each word's card matures, so you're weaned onto unpointed text.",
    off: "Consonants only, as in a Torah scroll.",
  },
};

/**
 * Language-level configuration, shared BY REFERENCE across every course of that
 * language. Defining it once is what stops the two Greek courses drifting apart
 * on script, font or parse fields — they may differ only in curriculum,
 * vocabulary and accent colour (D1).
 */
const GREEK_COMMON = {
  script: "greek",
  // Gentium Plus has full polytonic coverage. Frank Ruhl Libre has no Greek
  // glyphs at all — measured, not assumed (greek-build-plan.md §3.5).
  fontStack: "'Gentium Plus', 'New Athena Unicode', 'Times New Roman', serif",
  parseFields: GREEK_PARSE_FIELDS,
  // Unaccented Greek is not a reading target — see §4.5.
  supportsFading: false,
  diacriticsCopy: {
    label: "Accents and breathings",
    always: "Accents and breathings shown, as in every printed edition.",
    // Offered, but not as a learning ramp: unaccented Greek is not a target, and
    // accents can be contrastive (τίς "who?" vs τις "someone").
    fading: "Not available for Greek — accents carry meaning and are never dropped.",
    off: "Bare letters, as in an inscription or an early manuscript.",
  },
} as const satisfies Pick<
  Course,
  "script" | "fontStack" | "parseFields" | "supportsFading" | "diacriticsCopy"
>;

export const GREEK_KOINE: Course = {
  id: "greek-koine",
  name: "Koine Greek",
  subtitle: "New Testament · Septuagint",
  accentColor: "#2b5876", // aegean — the one hue the Greek demo added (D7)
  ...GREEK_COMMON,
};

export const GREEK_ATTIC: Course = {
  id: "greek-attic",
  name: "Attic Greek",
  subtitle: "Plato · Xenophon · classical prose",
  accentColor: "#211d1a", // charcoal
  ...GREEK_COMMON,
};

export const courses: Course[] = [HEBREW_BIBLICAL, GREEK_KOINE, GREEK_ATTIC];

export const courseById = new Map(courses.map((c) => [c.id, c]));

/**
 * The active course. A single course exists today; Phase 4 replaces this with a
 * user-selected value. Keeping the indirection here means call sites are already
 * written against "the current course" rather than against Hebrew.
 */
export const DEFAULT_COURSE_ID: CourseId = "hebrew-biblical";

export function getCourse(id: CourseId = DEFAULT_COURSE_ID): Course {
  const c = courseById.get(id);
  if (!c) throw new Error(`Unknown course "${id}"`);
  return c;
}

export function scriptOf(course: Course = getCourse()): ScriptModule {
  return scriptFor(course.script);
}

export function parseFieldsOf(course: Course = getCourse()): ParseFieldDef[] {
  return course.parseFields;
}

/**
 * Apply the active course's presentation to the document.
 *
 * Sets `data-course` (which selects the accent hue in CSS) and the script font.
 * Everything else — the light/dark palette — is shared and untouched, per D7.
 */
export function applyCourse(course: Course = getCourse()): void {
  const root = document.documentElement;
  root.dataset.course = course.id;
  root.style.setProperty("--script-font", course.fontStack);
  root.style.setProperty("--accent", course.accentColor);
}

/** Props to spread onto any element rendering this course's text. */
export function textProps(course: Course = getCourse()) {
  const s = scriptOf(course);
  return { dir: s.direction, lang: s.lang } as const;
}
