/**
 * SM-2 spaced repetition scheduler.
 *
 * Spec §5.3 calls this "the trust-critical piece of the whole product", so a few
 * rules hold throughout:
 *
 *  - Pure functions. No clock reads, no storage, no randomness. The caller
 *    supplies `now`. This is what makes the whole thing testable and what lets
 *    the server recompute identical state from a ReviewLog stream (§5.2).
 *  - Real calendar days, not a virtual day counter. The prototype's
 *    "simulate next day" button does not exist here.
 *  - Card state is *derived*. Given the same ordered list of reviews you always
 *    get the same card, which is what makes offline multi-device sync safe.
 */

export type Rating = 0 | 1 | 2 | 3; // Again | Hard | Good | Easy

export const RATING_LABELS: Record<Rating, string> = {
  0: "Again",
  1: "Hard",
  2: "Good",
  3: "Easy",
};

export type CardState = "new" | "learning" | "review" | "lapsed";

export interface SrsCard {
  wordId: string;
  ease: number;
  /** Scheduling interval in whole days. 0 means "again today". */
  intervalDays: number;
  repetitions: number;
  lapses: number;
  state: CardState;
  /** Epoch ms. A card is due when dueAt <= start of the current local day + 1 day. */
  dueAt: number;
  lastReviewedAt: number | null;
  /** Flagged after too many lapses; surfaced to the user for re-learning. */
  isLeech: boolean;
}

export interface ReviewEvent {
  wordId: string;
  rating: Rating;
  reviewedAt: number;
}

export interface SrsConfig {
  startingEase: number;
  minEase: number;
  easyBonus: number;
  hardPenalty: number;
  againPenalty: number;
  /** Lapse count at which a card is flagged as a leech (spec §4 Phase 3). */
  leechThreshold: number;
  /** Ceiling on interval growth, so a card never disappears for a decade. */
  maxIntervalDays: number;
  /** Baseline cap on new cards introduced per day. */
  newCardsPerDay: number;
}

export const DEFAULT_CONFIG: SrsConfig = {
  startingEase: 2.5,
  minEase: 1.3,
  easyBonus: 0.15,
  hardPenalty: 0.15,
  againPenalty: 0.2,
  leechThreshold: 8,
  maxIntervalDays: 365,
  newCardsPerDay: 12,
};

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Local midnight for the day containing `ts`. All due logic is day-granular. */
export function startOfLocalDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Whole local days between two timestamps (can be negative). */
export function daysBetween(from: number, to: number): number {
  return Math.round((startOfLocalDay(to) - startOfLocalDay(from)) / DAY_MS);
}

export function newCard(wordId: string, config: SrsConfig = DEFAULT_CONFIG): SrsCard {
  return {
    wordId,
    ease: config.startingEase,
    intervalDays: 0,
    repetitions: 0,
    lapses: 0,
    state: "new",
    dueAt: 0, // due immediately
    lastReviewedAt: null,
    isLeech: false,
  };
}

/**
 * Apply one review to a card. Pure: same inputs always produce the same output.
 */
export function scheduleCard(
  card: SrsCard,
  rating: Rating,
  reviewedAt: number,
  config: SrsConfig = DEFAULT_CONFIG,
): SrsCard {
  let { ease, intervalDays, repetitions, lapses, state } = card;

  if (rating === 0) {
    // Failed. Reset the interval and count a lapse — but only count it as a
    // lapse if the card had actually graduated. Failing a brand-new card during
    // its first learning session isn't forgetting, it's just learning.
    if (state === "review") lapses += 1;
    repetitions = 0;
    intervalDays = 0;
    ease = Math.max(config.minEase, ease - config.againPenalty);
    state = card.state === "new" ? "learning" : "lapsed";
  } else {
    if (repetitions === 0) intervalDays = 1;
    else if (repetitions === 1) intervalDays = 3;
    else intervalDays = Math.round(intervalDays * ease);

    // Hard shortens the step as well as lowering ease; without this, "Hard" and
    // "Good" schedule identically on the first two reviews, which makes the
    // button meaningless early on — exactly when learners press it most.
    if (rating === 1) {
      ease = Math.max(config.minEase, ease - config.hardPenalty);
      intervalDays = Math.max(1, Math.round(intervalDays * 0.8));
    }
    if (rating === 3) {
      ease = ease + config.easyBonus;
      intervalDays = Math.round(intervalDays * 1.3);
    }

    intervalDays = Math.min(config.maxIntervalDays, intervalDays);
    repetitions += 1;
    state = "review";
  }

  const isLeech = lapses >= config.leechThreshold;

  return {
    ...card,
    ease,
    intervalDays,
    repetitions,
    lapses,
    state,
    isLeech,
    lastReviewedAt: reviewedAt,
    // interval 0 => due again in this same session, so keep dueAt in the past.
    dueAt: intervalDays === 0 ? reviewedAt : startOfLocalDay(reviewedAt) + intervalDays * DAY_MS,
  };
}

/**
 * Rebuild a card from its full review history. This is the function that makes
 * spec §5.2 work: the client and server both derive state from the same ordered
 * event stream, so two devices reviewing offline can never permanently disagree.
 */
export function deriveCard(
  wordId: string,
  events: readonly ReviewEvent[],
  config: SrsConfig = DEFAULT_CONFIG,
): SrsCard {
  const ordered = [...events]
    .filter((e) => e.wordId === wordId)
    .sort((a, b) => a.reviewedAt - b.reviewedAt);
  let card = newCard(wordId, config);
  for (const e of ordered) card = scheduleCard(card, e.rating, e.reviewedAt, config);
  return card;
}

/** Is this card due as of `now`? Day-granular: anything due earlier today counts. */
export function isDue(card: SrsCard, now: number): boolean {
  return card.dueAt <= startOfLocalDay(now) + DAY_MS - 1;
}

/**
 * Build a review session queue.
 *
 * Ordering puts lapsed cards first (they are the most fragile), then cards by
 * how overdue they are, then new cards up to the daily cap. The returned array
 * is a *snapshot*: the session iterates over this list and must not re-filter
 * against live card state mid-session, or rated cards drop out from under the
 * index and get skipped.
 */
export function buildReviewQueue(
  cards: readonly SrsCard[],
  now: number,
  opts: { newCardLimit?: number; includeNew?: boolean } = {},
): SrsCard[] {
  const { newCardLimit = DEFAULT_CONFIG.newCardsPerDay, includeNew = true } = opts;
  const due = cards.filter((c) => c.state !== "new" && isDue(c, now));
  const fresh = includeNew ? cards.filter((c) => c.state === "new").slice(0, newCardLimit) : [];

  const rank = (c: SrsCard) => (c.state === "lapsed" ? 0 : 1);
  due.sort((a, b) => rank(a) - rank(b) || a.dueAt - b.dueAt);

  return [...due, ...fresh];
}

/** Counts for the path screen and the "N cards due" notification copy. */
export function dueCounts(cards: readonly SrsCard[], now: number) {
  let due = 0;
  let fresh = 0;
  let leeches = 0;
  for (const c of cards) {
    if (c.state === "new") fresh++;
    else if (isDue(c, now)) due++;
    if (c.isLeech) leeches++;
  }
  return { due, new: fresh, leeches, total: cards.length };
}

/**
 * Adaptive new-card pacing (spec §4 Phase 7). If recent recall is poor the
 * learner is drowning, so slow down introduction of new material rather than
 * piling on. Returns a cap, never below 2 — some forward motion is important
 * for morale even in a bad week.
 */
export function adaptiveNewCardLimit(
  recentEvents: readonly ReviewEvent[],
  config: SrsConfig = DEFAULT_CONFIG,
  windowDays = 7,
  now: number = Date.now(),
): number {
  const cutoff = startOfLocalDay(now) - windowDays * DAY_MS;
  const recent = recentEvents.filter((e) => e.reviewedAt >= cutoff);
  if (recent.length < 20) return config.newCardsPerDay; // not enough signal yet

  const againRate = recent.filter((e) => e.rating === 0).length / recent.length;
  if (againRate > 0.4) return Math.max(2, Math.round(config.newCardsPerDay * 0.25));
  if (againRate > 0.25) return Math.max(2, Math.round(config.newCardsPerDay * 0.5));
  if (againRate < 0.08) return Math.round(config.newCardsPerDay * 1.5);
  return config.newCardsPerDay;
}

/** Rolling retention rate, surfaced in stats and used by the pacing logic. */
export function retentionRate(events: readonly ReviewEvent[], windowDays = 7, now = Date.now()): number | null {
  const cutoff = startOfLocalDay(now) - windowDays * DAY_MS;
  const recent = events.filter((e) => e.reviewedAt >= cutoff);
  if (recent.length === 0) return null;
  return recent.filter((e) => e.rating > 0).length / recent.length;
}

/** Human-readable next-interval preview for each rating button. */
export function previewIntervals(
  card: SrsCard,
  now: number,
  config: SrsConfig = DEFAULT_CONFIG,
): Record<Rating, string> {
  const fmt = (days: number) => {
    if (days === 0) return "today";
    if (days === 1) return "1 day";
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.round(days / 30)} mo`;
    return `${(days / 365).toFixed(1)} yr`;
  };
  return {
    0: fmt(scheduleCard(card, 0, now, config).intervalDays),
    1: fmt(scheduleCard(card, 1, now, config).intervalDays),
    2: fmt(scheduleCard(card, 2, now, config).intervalDays),
    3: fmt(scheduleCard(card, 3, now, config).intervalDays),
  };
}
