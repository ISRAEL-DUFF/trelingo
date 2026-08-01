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
import { HEBREW_PARSE_FIELDS, type ParseFieldDef } from "./parse-fields";
import "@/lib/script/hebrew"; // registers the Hebrew script module

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
};

export const courses: Course[] = [HEBREW_BIBLICAL];

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

/** Props to spread onto any element rendering this course's text. */
export function textProps(course: Course = getCourse()) {
  const s = scriptOf(course);
  return { dir: s.direction, lang: s.lang } as const;
}
