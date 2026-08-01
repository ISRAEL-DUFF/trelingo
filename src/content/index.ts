/**
 * Content loader.
 *
 * Bundles are per course (D1). Everything a screen needs is resolved through
 * `contentFor(courseId)`, which defaults to the **active** course — so switching
 * course switches the path, vocabulary, families and passages together, with no
 * call site branching on language.
 *
 * Derived lookups are memoised per course: they are pure functions of a bundle,
 * and rebuilding them on every render of the path screen would be wasteful.
 */
import { validateBundle, type ContentBundle } from "./schema";
import { getActiveCourseId, type CourseId } from "./course";
import { hebrewBiblicalBundle, CONTENT_REVIEW_NOTES } from "./courses/hebrew-biblical";
import { greekKoineBundle } from "./courses/greek-koine";

const BUNDLES: Partial<Record<CourseId, ContentBundle>> = {
  "hebrew-biblical": hebrewBiblicalBundle,
  "greek-koine": greekKoineBundle,
};

export function getBundle(courseId: CourseId = getActiveCourseId()): ContentBundle {
  const bundle = BUNDLES[courseId];
  if (!bundle) throw new Error(`No content bundle registered for course "${courseId}"`);
  return bundle;
}

/** True when a course has content and can actually be entered. */
export function hasContent(courseId: CourseId): boolean {
  return BUNDLES[courseId] !== undefined;
}

/** Every course that has content, for the picker. */
export function availableCourseIds(): CourseId[] {
  return Object.keys(BUNDLES) as CourseId[];
}

export interface CourseContent extends ContentBundle {
  familyById: Map<string, ContentBundle["families"][number]>;
  wordById: Map<string, ContentBundle["words"][number]>;
  unitById: Map<string, ContentBundle["units"][number]>;
  passageById: Map<string, ContentBundle["passages"][number]>;
  /** Words grouped by family — powers the family sheet (spec §4 Phase 4). */
  wordsByFamily: Record<string, ContentBundle["words"]>;
  /** Every passage a family appears in, for the family card's "seen in" list. */
  passagesByFamily: Record<string, string[]>;
  /** Unit that introduces a given word, for "you learned this in…" links. */
  unitByWordId: Record<string, string>;
}

const cache = new Map<CourseId, CourseContent>();

function build(bundle: ContentBundle): CourseContent {
  const wordsByFamily = bundle.words.reduce<Record<string, ContentBundle["words"]>>((acc, w) => {
    (acc[w.familyId] ??= []).push(w);
    return acc;
  }, {});

  const passagesByFamily = bundle.passages.reduce<Record<string, string[]>>((acc, p) => {
    for (const t of p.tokens) {
      if (!t.familyId) continue;
      (acc[t.familyId] ??= []).push(p.id);
    }
    for (const k of Object.keys(acc)) acc[k] = [...new Set(acc[k])];
    return acc;
  }, {});

  const unitByWordId = bundle.units.reduce<Record<string, string>>((acc, u) => {
    for (const id of u.wordIds) acc[id] ??= u.id;
    return acc;
  }, {});

  return {
    ...bundle,
    familyById: new Map(bundle.families.map((f) => [f.id, f])),
    wordById: new Map(bundle.words.map((w) => [w.id, w])),
    unitById: new Map(bundle.units.map((u) => [u.id, u])),
    passageById: new Map(bundle.passages.map((p) => [p.id, p])),
    wordsByFamily,
    passagesByFamily,
    unitByWordId,
  };
}

/**
 * Everything a screen needs for one course. Defaults to the active course.
 */
export function contentFor(courseId: CourseId = getActiveCourseId()): CourseContent {
  const hit = cache.get(courseId);
  if (hit) return hit;
  const built = build(getBundle(courseId));
  cache.set(courseId, built);
  return built;
}

export * from "./schema";
export { CONTENT_REVIEW_NOTES };

/**
 * Validate a course's bundle. Throws with every error at once rather than the
 * first, so a content author fixes one list instead of playing whack-a-mole.
 */
export function getContent(courseId: CourseId = getActiveCourseId()): ContentBundle {
  const { bundle, errors } = validateBundle(getBundle(courseId), courseId);
  if (errors.length) {
    throw new Error(
      `Content for "${courseId}" failed validation:\n${errors.map((e) => `  - ${e}`).join("\n")}`,
    );
  }
  return bundle;
}
