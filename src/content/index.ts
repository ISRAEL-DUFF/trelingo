/**
 * Content loader.
 *
 * Bundles are per track, imported statically. Everything a screen needs is
 * resolved through `contentFor(trackId)`, which defaults to the active track —
 * so switching track switches path, vocabulary, families and passages together,
 * with no call site branching on language.
 *
 * WHY NOT LAZY. Content is the largest thing the app ships — Jonah's 48 verses
 * compile to 195 KB — and a whole-book track like Genesis would be several MB,
 * which makes per-track code splitting look obviously right. It was tried and
 * reverted, for two reasons:
 *
 *   1. Today there is no problem. Four tracks, ~300 KB in total.
 *   2. Content belongs behind an API, not in the JS bundle. Once it is fetched
 *      rather than compiled in, per-track chunks are moot — and the book is the
 *      natural unit to fetch, since a learner reads one for weeks and then has
 *      it offline for good.
 *
 * When that lands, the loading concern moves to the API layer and needs a
 * content version stamp so a corrected gloss can invalidate a cached book.
 *
 * Derived lookups are memoised per track: they are pure functions of a bundle.
 */
import { validateBundle, type ContentBundle } from "./schema";
import { getActiveCourseId, type CourseId } from "./course";
import { hebrewBiblicalBundle, CONTENT_REVIEW_NOTES } from "./courses/hebrew-biblical";
import { hebrewJonahBundle, JONAH_REVIEW_NOTES } from "./courses/hebrew-jonah";
import { hebrewRuthBundle, RUTH_REVIEW_NOTES } from "./courses/hebrew-ruth";
import { hebrewEstherBundle, ESTHER_REVIEW_NOTES } from "./courses/hebrew-esther";
import { greekKoineBundle, KOINE_REVIEW_NOTES } from "./courses/greek-koine";
import { greek1JohnBundle, ONE_JOHN_REVIEW_NOTES } from "./courses/greek-1john";
import { greekMarkBundle, MARK_REVIEW_NOTES } from "./courses/greek-mark";
import { greekJohnBundle, JOHN_REVIEW_NOTES } from "./courses/greek-john";
import { greekAtticBundle, ATTIC_REVIEW_NOTES } from "./courses/greek-attic";

const BUNDLES: Partial<Record<CourseId, ContentBundle>> = {
  "shoresh": hebrewBiblicalBundle,
  "jonah": hebrewJonahBundle,
  "ruth": hebrewRuthBundle,
  "esther": hebrewEstherBundle,
  "koine-gospels": greekKoineBundle,
  "1john": greek1JohnBundle,
  "mark": greekMarkBundle,
  "john": greekJohnBundle,
  "attic-prose": greekAtticBundle,
};

/** What a specialist should check before a track reaches learners. */
export type ReviewNote = { id: string; note: string };

/*
 * Each track carries its own caveats, and the settings screen used to show
 * Hebrew's for every track — which meant the Attic licence blocker, the single
 * most important note in the project, was written down and never displayed.
 */
const REVIEW_NOTES: Partial<Record<CourseId, ReviewNote[]>> = {
  "shoresh": CONTENT_REVIEW_NOTES,
  "jonah": JONAH_REVIEW_NOTES,
  "ruth": RUTH_REVIEW_NOTES,
  "esther": ESTHER_REVIEW_NOTES,
  "koine-gospels": KOINE_REVIEW_NOTES,
  "1john": ONE_JOHN_REVIEW_NOTES,
  "mark": MARK_REVIEW_NOTES,
  "john": JOHN_REVIEW_NOTES,
  "attic-prose": ATTIC_REVIEW_NOTES,
};

export function reviewNotesFor(courseId: CourseId = getActiveCourseId()): ReviewNote[] {
  return REVIEW_NOTES[courseId] ?? [];
}

export function getBundle(courseId: CourseId = getActiveCourseId()): ContentBundle {
  const bundle = BUNDLES[courseId];
  if (!bundle) throw new Error(`No content bundle registered for track "${courseId}"`);
  return bundle;
}

/** True when a track has content and can actually be entered. */
export function hasContent(courseId: CourseId): boolean {
  return BUNDLES[courseId] !== undefined;
}

/** Every track that has content, for the picker. */
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
  /**
   * In-track counts for hand-authored courses that have no importer.
   *
   * Shoresh's 44 words were written by hand and carry no Strong's key, so no
   * pipeline ever counted them and they arrive with no frequency at all. The
   * whole-Bible figure genuinely cannot be supplied — assigning Strong's
   * numbers by hand is the risky manual step lexeme-spike-findings.md §5 warns
   * about — but "how often does this appear in what I am reading" needs no
   * lexicon, only the passages already in the bundle.
   *
   * Filled only where the word actually occurs, so a word taught but not yet
   * met in any verse stays silent rather than claiming zero.
   */
  const inTrack = bundle.passages.reduce<Record<string, number>>((acc, p) => {
    for (const t of p.tokens) if (t.wordId) acc[t.wordId] = (acc[t.wordId] ?? 0) + 1;
    return acc;
  }, {});
  const words = bundle.words.map((w) =>
    w.frequency || !inTrack[w.id] ? w : { ...w, frequency: { inTrack: inTrack[w.id]! } },
  );
  bundle = { ...bundle, words };

  const wordsByFamily = bundle.words.reduce<Record<string, ContentBundle["words"]>>((acc, w) => {
    if (w.familyId) (acc[w.familyId] ??= []).push(w);
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
