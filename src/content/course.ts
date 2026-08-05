/**
 * Tracks — a curriculum inside a variety, and the leaf of the hierarchy.
 *
 *   Language   Hebrew, Greek                    → content/language.ts
 *     Variety    Biblical Hebrew, Koine, Attic  → content/variety.ts
 *       Track      Shoresh, Jonah               ← this file
 *         Unit       a lesson
 *
 * A track carries ONLY what distinguishes one curriculum from another within
 * the same variety: which texts, which vocabulary, in which order, and an
 * accent colour. Script and font come from the language; parse fields, the word
 * "root" versus "stem", fading and diacritics copy come from the variety. A
 * track cannot disagree with either, because it declares neither.
 *
 * NAMING. The type is still `Course` and ids are still `CourseId`, because that
 * is what the storage layer and API call this level — `courseId` is half of the
 * Dexie primary key for every SRS card and unit progress row.
 *
 * The ids themselves are now named for the TRACK (`shoresh`, `jonah`,
 * `koine-gospels`, `attic-prose`) rather than for the language. They used to be
 * language-first — `hebrew-biblical` was Shoresh, inside a variety called
 * `biblical-hebrew`, the same words reversed meaning different things. Renamed
 * in Dexie v5; see TRACK_ID_RENAMES.
 */
import { getLanguage, type Language } from "./language";
import {
  ATTIC_GREEK,
  BIBLICAL_HEBREW,
  KOINE_GREEK,
  getVariety,
  type Variety,
  type VarietyId,
} from "./variety";
import { type ScriptModule } from "@/lib/script";
import { scriptOfLanguage } from "./language";
import { type ParseFieldDef } from "./parse-fields";

export type CourseId = "shoresh" | "jonah" | "ruth" | "esther" | "ecclesiastes" | "haggai" | "malachi" | "obadiah" | "koine-gospels" | "1john" | "mark" | "john" | "matthew" | "attic-prose" | "latin";

/** Fields a track inherits rather than declares. */
type Inherited = Pick<Variety, "supportsFading" | "morphemeNoun" | "diacriticsCopy" | "parseFields"> &
  Pick<Language, "script" | "fontStack">;

export interface Course extends Inherited {
  id: CourseId;
  /** The variety this track belongs to. */
  variety: VarietyId;
  /** The variety's language, denormalised for convenience. */
  language: Language["id"];
  /** Track name, shown under the variety: "Shoresh", "Jonah". */
  name: string;
  subtitle: string;

  /**
   * The only visual override a track gets (D7). The shared palette is reused
   * unchanged; this drives the header and per-track highlights.
   */
  accentColor: string;
}

/**
 * Pull every inherited field down from the variety and its language.
 *
 * Spread rather than looked up through `course.variety` so the call sites that
 * read `course.script` or `course.parseFields` keep working — and so it is
 * impossible to construct a track that declares a script its language does not
 * have, or parse fields its variety does not use.
 */
function inherit(v: Variety): Inherited & { variety: VarietyId; language: Language["id"] } {
  const l = getLanguage(v.language);
  return {
    variety: v.id,
    language: l.id,
    script: l.script,
    fontStack: l.fontStack,
    supportsFading: v.supportsFading,
    morphemeNoun: v.morphemeNoun,
    diacriticsCopy: v.diacriticsCopy,
    parseFields: v.parseFields,
  };
}

export const HEBREW_BIBLICAL: Course = {
  ...inherit(BIBLICAL_HEBREW),
  id: "shoresh",
  name: "Shoresh",
  subtitle: "Genesis, Psalms, Ruth",
  accentColor: "var(--gold)",
};

export const HEBREW_JONAH: Course = {
  ...inherit(BIBLICAL_HEBREW),
  id: "jonah",
  name: "Jonah",
  subtitle: "One whole book, start to finish",
  accentColor: "var(--sage)",
};

/**
 * The second whole book, and the first that cost no engineering.
 *
 * Jonah proved the shape; Ruth proved the pipeline, which took a book name and
 * nothing else. Placed after Jonah because finishing Jonah leaves a reader at
 * 52% of Ruth (coverage-findings.md §4) — a step up rather than a restart.
 */
export const HEBREW_RUTH: Course = {
  ...inherit(BIBLICAL_HEBREW),
  id: "ruth",
  name: "Ruth",
  subtitle: "Four chapters, the easiest narrative in the canon",
  accentColor: "var(--sage)",
};

/**
 * The third whole book, and the first where CURATION compounded rather than
 * only the pipeline.
 *
 * Esther's glossary inherits Jonah's and Ruth's at build time, so 164 of its
 * 464 lexemes cost nothing. Placed last of the three because it is twice Ruth's
 * length and front-loads a third of its vocabulary into chapter 1 — the Persian
 * court has to be described before anything happens in it.
 */
export const HEBREW_ESTHER: Course = {
  ...inherit(BIBLICAL_HEBREW),
  id: "esther",
  name: "Esther",
  subtitle: "Ten chapters in a Persian court",
  accentColor: "var(--sage)",
};

/**
 * The fourth whole book, and the first that is not a story.
 *
 * Placed after the three narratives because it is harder than its length: 5.3
 * tokens per lexeme against Esther's 6.6, late Hebrew, and an argument rather
 * than a plot. It is also the cheapest book left — 277 of its 562 lexemes were
 * already glossed.
 */
export const HEBREW_ECCLESIASTES: Course = {
  ...inherit(BIBLICAL_HEBREW),
  id: "ecclesiastes",
  name: "Ecclesiastes",
  subtitle: "Wisdom poetry, twelve chapters",
  accentColor: "var(--sage)",
};

/**
 * The fifth Hebrew book, and the first chosen by measurement rather than taste.
 *
 * Every book of the Hebrew Bible was scored on how many new words a reader of
 * the four earlier tracks needs to reach 95% coverage of its running words.
 * Haggai came first at 32 — the lowest in the canon.
 */
export const HEBREW_HAGGAI: Course = {
  ...inherit(BIBLICAL_HEBREW),
  id: "haggai",
  name: "Haggai",
  subtitle: "Two chapters, the easiest book in the canon",
  accentColor: "var(--sage)",
};

/**
 * Placed after Haggai for the overlap: on its own Malachi needs 113 new
 * glosses, after Haggai 101. Both are post-exilic and both are about the temple
 * and its priesthood — the same reasoning that put Matthew after John.
 */
export const HEBREW_MALACHI: Course = {
  ...inherit(BIBLICAL_HEBREW),
  id: "malachi",
  name: "Malachi",
  subtitle: "Three chapters, a quarrel with the priests",
  accentColor: "var(--sage)",
};

/**
 * The shortest book in the Hebrew Bible, and the third chosen by measurement.
 *
 * Placed after Malachi deliberately: Obadiah is entirely about Edom, and
 * Malachi had already taught Esau, Edom and the vocabulary of ruin. 61 glosses
 * instead of 72.
 */
export const HEBREW_OBADIAH: Course = {
  ...inherit(BIBLICAL_HEBREW),
  id: "obadiah",
  name: "Obadiah",
  subtitle: "Twenty-one verses against Edom",
  accentColor: "var(--sage)",
};

/**
 * Koine and Attic each have exactly one track today.
 *
 * That is the asymmetry the third level exposes rather than creates: Biblical
 * Hebrew has two curricula and the Greek varieties have one apiece. A second
 * Koine track slots in beside this one without touching anything else.
 */
export const GREEK_KOINE: Course = {
  ...inherit(KOINE_GREEK),
  id: "koine-gospels",
  name: "The Gospels",
  subtitle: "John, Mark and the letters",
  accentColor: "#2b5876", // aegean — the one hue the Greek demo added (D7)
};

/**
 * The first whole Koine book, and the end of a long asymmetry.
 *
 * Greek held four verses against Hebrew's 133 until this landed. 1 John was
 * chosen on measured grounds rather than tradition — though tradition happens
 * to agree — see units.ts.
 */
export const GREEK_1JOHN: Course = {
  ...inherit(KOINE_GREEK),
  id: "1john",
  name: "1 John",
  subtitle: "One whole letter, the densest repetition in the New Testament",
  accentColor: "var(--sage)",
};

/**
 * The whole gospel — 673 verses, the longest track in the app by some distance.
 * Shipped as chapters 1–4 first and completed in a second pass; the staging is
 * recorded in courses/greek-mark rather than hidden.
 */
export const GREEK_MARK: Course = {
  ...inherit(KOINE_GREEK),
  id: "mark",
  name: "Mark",
  subtitle: "A whole gospel, chapter by chapter",
  accentColor: "var(--sage)",
};

/**
 * The fourth Koine track, and the cheapest to build. 341 new glosses against
 * Mark's 1,158, on more text — because Mark, 1 John and the Gospels already
 * covered two-thirds of its vocabulary.
 */
export const GREEK_JOHN: Course = {
  ...inherit(KOINE_GREEK),
  id: "john",
  name: "John",
  subtitle: "A whole gospel, and the smallest vocabulary in the New Testament",
  accentColor: "var(--sage)",
};

/**
 * The fourth whole Koine book, and the one that proved ORDER changes cost.
 *
 * When Mark was finished, Luke was the obvious next Gospel. After John landed,
 * Matthew needed 526 new glosses to Luke's 934 for the same amount of text —
 * Matthew's overlap with Mark is enormous and Luke's is not. Re-measuring
 * before curating saved about four hundred glosses.
 */
export const GREEK_MATTHEW: Course = {
  ...inherit(KOINE_GREEK),
  id: "matthew",
  name: "Matthew",
  subtitle: "The whole gospel, twenty-eight chapters",
  accentColor: "var(--sage)",
};

export const GREEK_ATTIC: Course = {
  ...inherit(ATTIC_GREEK),
  id: "attic-prose",
  // Named for what the corpus actually contains. Xenophon was in the original
  // plan, but AGDT 2.1 has no Xenophon at all — see ATTIC_REVIEW_NOTES.
  name: "Prose Readings",
  subtitle: "Plato · Thucydides · Lysias",
  accentColor: "#211d1a", // charcoal
};

export const courses: Course[] = [HEBREW_BIBLICAL, HEBREW_JONAH, HEBREW_RUTH, HEBREW_ESTHER, HEBREW_ECCLESIASTES, HEBREW_HAGGAI, HEBREW_MALACHI, HEBREW_OBADIAH, GREEK_KOINE, GREEK_1JOHN, GREEK_MARK, GREEK_JOHN, GREEK_MATTHEW, GREEK_ATTIC];

/** The tracks belonging to one variety. */
export function tracksOf(varietyId: VarietyId): Course[] {
  return courses.filter((c) => c.variety === varietyId);
}

export function varietyOf(course: Course = getCourse()): Variety {
  return getVariety(course.variety);
}

export function languageOf(course: Course = getCourse()): Language {
  return getLanguage(course.language);
}

export const courseById = new Map(courses.map((c) => [c.id, c]));

export const DEFAULT_COURSE_ID: CourseId = "shoresh";

/**
 * The active course.
 *
 * Held here, outside React, because the repository and sync layers need it too
 * and neither can call a hook. The UI subscribes via `useActiveCourse()`.
 *
 * Mirrored into localStorage so the boot script can apply the right accent and
 * font before first paint — the same reason the theme is mirrored.
 */
const ACTIVE_COURSE_KEY = "trelingo.activeTrack";

function readStoredCourseId(): CourseId {
  try {
    const raw = localStorage.getItem(ACTIVE_COURSE_KEY);
    if (raw && courseById.has(raw as CourseId)) return raw as CourseId;
  } catch {
    /* private mode — fall through */
  }
  return DEFAULT_COURSE_ID;
}

let activeCourseId: CourseId = typeof localStorage === "undefined" ? DEFAULT_COURSE_ID : readStoredCourseId();

const listeners = new Set<() => void>();

export function getActiveCourseId(): CourseId {
  return activeCourseId;
}

export function setActiveCourse(id: CourseId): void {
  if (!courseById.has(id)) throw new Error(`Unknown course "${id}"`);
  if (id === activeCourseId) return;
  activeCourseId = id;
  try {
    localStorage.setItem(ACTIVE_COURSE_KEY, id);
  } catch {
    /* non-fatal */
  }
  applyCourse(getCourse(id));
  listeners.forEach((l) => l());
}

export function subscribeToCourse(l: () => void): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** Defaults to the ACTIVE course, so call sites follow the learner's choice. */
export function getCourse(id: CourseId = activeCourseId): Course {
  const c = courseById.get(id);
  if (!c) throw new Error(`Unknown course "${id}"`);
  return c;
}

export function scriptOf(course: Course = getCourse()): ScriptModule {
  return scriptOfLanguage(languageOf(course));
}

export function parseFieldsOf(course: Course = getCourse()): ParseFieldDef[] {
  return course.parseFields;
}

/**
 * The four forms of the morpheme noun that screens actually need.
 *
 * Every user-visible mention of the thing a course teaches goes through this.
 * Hardcoding "root" was the same error as hardcoding "niqqud": a Greek learner
 * was being shown a Hebrew word for something Greek does not have.
 */
export function morphemeLabel(course: Course = getCourse()) {
  const one = course.morphemeNoun;
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  // "root"/"stem"/"ending" all pluralise with -s; assert rather than assume.
  return { one, many: `${one}s`, One: cap(one), Many: cap(`${one}s`) };
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
