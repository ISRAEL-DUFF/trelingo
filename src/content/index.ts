/**
 * Content loader.
 *
 * Bundles are per course (decision D1). Today there is one; adding Koine means
 * registering another bundle here and nothing else. The derived lookups below
 * are built from the ACTIVE course, so screens keep importing `words`,
 * `families` and friends exactly as before.
 *
 * When multiple courses are active (Phase 4) these become functions of a course
 * id rather than module-level constants — the call sites are already written
 * against "the current course", which is what makes that change small.
 */
import { validateBundle, type ContentBundle } from "./schema";
import { DEFAULT_COURSE_ID, type CourseId } from "./course";
import { hebrewBiblicalBundle, CONTENT_REVIEW_NOTES } from "./courses/hebrew-biblical";

const BUNDLES: Partial<Record<CourseId, ContentBundle>> = {
  "hebrew-biblical": hebrewBiblicalBundle,
};

export function getBundle(courseId: CourseId = DEFAULT_COURSE_ID): ContentBundle {
  const bundle = BUNDLES[courseId];
  if (!bundle) throw new Error(`No content bundle registered for course "${courseId}"`);
  return bundle;
}

/** Every course that actually has content, for the picker. */
export function availableCourseIds(): CourseId[] {
  return Object.keys(BUNDLES) as CourseId[];
}

export const rawBundle = getBundle();

export const { families, words, units, passages } = rawBundle;

export const familyById = new Map(families.map((f) => [f.id, f]));
export const wordById = new Map(words.map((w) => [w.id, w]));
export const unitById = new Map(units.map((u) => [u.id, u]));
export const passageById = new Map(passages.map((p) => [p.id, p]));

export * from "./schema";
export { CONTENT_REVIEW_NOTES };

/** Words grouped by family — powers the family sheet (spec §4 Phase 4). */
export const wordsByFamily = words.reduce<Record<string, typeof words>>((acc, w) => {
  (acc[w.familyId] ??= []).push(w);
  return acc;
}, {});

/** Every passage a given family appears in, for the family card's "seen in" list. */
export const passagesByFamily = passages.reduce<Record<string, string[]>>((acc, p) => {
  for (const t of p.tokens) {
    if (!t.familyId) continue;
    (acc[t.familyId] ??= []).push(p.id);
  }
  for (const k of Object.keys(acc)) acc[k] = [...new Set(acc[k])];
  return acc;
}, {});

/** Unit that introduces a given word, for "you learned this in…" links. */
export const unitByWordId = units.reduce<Record<string, string>>((acc, u) => {
  for (const id of u.wordIds) acc[id] ??= u.id;
  return acc;
}, {});

/**
 * Validate a course's bundle. Throws with every error at once rather than the
 * first, so a content author fixes one list instead of playing whack-a-mole.
 */
export function getContent(courseId: CourseId = DEFAULT_COURSE_ID): ContentBundle {
  const { bundle, errors } = validateBundle(getBundle(courseId));
  if (errors.length) {
    throw new Error(
      `Content for "${courseId}" failed validation:\n${errors.map((e) => `  - ${e}`).join("\n")}`,
    );
  }
  return bundle;
}
