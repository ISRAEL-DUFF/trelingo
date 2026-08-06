import { contentFor, hasContent } from "@/content";
import { courses, type CourseId } from "@/content/course";
import type { Language } from "@/content/language";
import type { Passage, PassageToken } from "@/content/schema";

/**
 * Choosing the verse — all of Cold Read's judgement, none of its rendering.
 *
 * Pure and synchronous on purpose: it takes the set of known word ids and hands
 * back a verse, so the whole selection can be tested against fabricated
 * learners without a database or a browser. See cold-read-spec.md.
 *
 * THE ENABLER, because nothing here works without it: word ids are stable
 * across tracks within a language. Jonah and Genesis share 127 ids (h413,
 * h3068, h5921); Mark and John share 524 (agapao, meno, oida). Hebrew ids are
 * Strong's keys and Greek ids are lemma slugs, so the two can never collide.
 * That is what makes "a word you know, in a book you have never opened" a
 * thing that exists.
 */

/** A three-word verse is not an achievement. */
export const MIN_TAUGHT = 6;

/** Below this the moment does not land; see `pick` for what happens instead. */
export const TARGET_FLOOR = 0.75;

/** Under this many known words there is nothing to find. */
export const MIN_KNOWN_WORDS = 20;

export interface Scored {
  courseId: CourseId;
  passage: Passage;
  /** Tokens the course teaches — the only ones scored. See `coverage`. */
  taught: PassageToken[];
  /** Of those, the ones the learner knows. */
  hits: number;
  /** hits / taught.length. NOT hits / tokens.length — see the header note. */
  coverage: number;
  /** Tokens with no wordId: articles and particles the course never teaches. */
  untaught: number;
}

/**
 * Tokens split into what can be scored and what cannot.
 *
 * A token with no `wordId` is one the course does not teach as vocabulary. It
 * is 1–3% of Hebrew and 40% of Greek — measured — so this is not a rounding
 * error, it is the difference between the two languages' scores meaning the
 * same thing. Counting them as unknown would cap every Greek verse near 60%;
 * counting them as known would assert the learner can read ὁ on evidence the
 * app does not have and can never get, because it never taught them.
 *
 * They are therefore neither. The reveal says so out loud every time.
 */
export const isTaught = (t: PassageToken): boolean => t.wordId !== null;

export function scorePassage(
  courseId: CourseId,
  passage: Passage,
  known: ReadonlySet<string>,
): Scored | null {
  const taught = passage.tokens.filter(isTaught);
  if (taught.length < MIN_TAUGHT) return null;
  const hits = taught.reduce((n, t) => n + (known.has(t.wordId!) ? 1 : 0), 0);
  return {
    courseId,
    passage,
    taught,
    hits,
    coverage: hits / taught.length,
    untaught: passage.tokens.length - taught.length,
  };
}

/**
 * Tracks in this language the learner has never opened.
 *
 * "Never opened" is zero completed units, not zero cards — a learner who
 * reviewed a Genesis word inside a cross-track review session has still never
 * read Genesis, and the headline should still say so.
 */
export function unstudiedTracks(language: Language["id"], completed: ReadonlySet<CourseId>): CourseId[] {
  return courses
    .filter((c) => c.language === language && hasContent(c.id) && !completed.has(c.id))
    .map((c) => c.id);
}

export interface Choice {
  best: Scored;
  /** False when nothing cleared TARGET_FLOOR and the copy has to soften. */
  clearedFloor: boolean;
  /** How many verses were in the running, for the "another" button to reason about. */
  pool: number;
}

/**
 * The verse.
 *
 * MOST HITS WINS, not highest coverage, and that is the whole feel of the game:
 * "you read 14 of 16" is a moment and "you read 3 of 3" is not. Coverage only
 * gates entry and breaks ties.
 *
 * When nothing clears the floor it returns the best available with
 * `clearedFloor: false` rather than refusing. The screen changes its wording;
 * it does not pretend the learner did better than they did.
 */
export function pick(
  trackIds: readonly CourseId[],
  known: ReadonlySet<string>,
  seen: ReadonlySet<string>,
): Choice | null {
  const scored: Scored[] = [];
  for (const courseId of trackIds) {
    for (const passage of contentFor(courseId).passages) {
      if (seen.has(passage.id)) continue;
      const s = scorePassage(courseId, passage, known);
      if (s) scored.push(s);
    }
  }
  if (!scored.length) return null;

  const better = (a: Scored, b: Scored) =>
    a.hits !== b.hits
      ? b.hits - a.hits
      : a.coverage !== b.coverage
        ? b.coverage - a.coverage
        : // Deterministic, so the same learner state always yields the same
          // verse and a test can assert on it.
          a.passage.id.localeCompare(b.passage.id);

  const above = scored.filter((s) => s.coverage >= TARGET_FLOOR);
  const pool = above.length ? above : scored;
  const best = [...pool].sort(better)[0]!;
  return { best, clearedFloor: above.length > 0, pool: pool.length };
}
