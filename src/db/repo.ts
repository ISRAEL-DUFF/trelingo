/**
 * Repository layer — every domain operation the UI needs, all local-first.
 *
 * Two rules this layer enforces:
 *
 *  1. Recording a review writes an immutable log entry AND updates the derived
 *     card in one transaction. The log is the truth (spec §5.2); the card table
 *     is a cache of the derivation so the path screen need not replay history.
 *  2. Every learning row is scoped to a course (D1). Functions take an optional
 *     `courseId` defaulting to the active course, so call sites read naturally
 *     while multi-course support is available where it matters.
 *
 * XP and streak are deliberately NOT scoped (D2): a streak measures showing up,
 * which is one habit across every course.
 */
import { db, getDeviceId, getMeta, setMeta, type LocalCard, type LocalDeck } from "./index";
import {
  DEFAULT_CONFIG,
  buildReviewQueue,
  deriveCard,
  dueCounts,
  newCard,
  scheduleCard,
  type Rating,
  type ReviewEvent,
  type SrsCard,
} from "@/srs/engine";
import { unitById, words } from "@/content";
import { DEFAULT_COURSE_ID, type CourseId } from "@/content/course";
import type { StreakState, UnitProgress } from "@/api/types";

/** Pass this instead of a course id to work across every course (D4). */
export const ALL_COURSES = "all" as const;
export type CourseScope = CourseId | typeof ALL_COURSES;

const scoped = (courseId: CourseScope) =>
  courseId === ALL_COURSES ? db.srsCards.toArray() : db.srsCards.where({ courseId }).toArray();

// ---------- cards ----------

export async function getAllCards(courseId: CourseScope = DEFAULT_COURSE_ID): Promise<LocalCard[]> {
  return scoped(courseId);
}

export async function getCard(
  wordId: string,
  courseId: CourseId = DEFAULT_COURSE_ID,
): Promise<LocalCard | undefined> {
  return db.srsCards.get([courseId, wordId]);
}

/** Introduce vocabulary as new cards, skipping any the learner already has. */
export async function ensureCards(
  wordIds: string[],
  courseId: CourseId = DEFAULT_COURSE_ID,
): Promise<void> {
  const keys = wordIds.map((id) => [courseId, id] as [CourseId, string]);
  const existing = new Set((await db.srsCards.bulkGet(keys)).filter(Boolean).map((c) => c!.wordId));
  const fresh = wordIds
    .filter((id) => !existing.has(id))
    .map((id) => ({ ...newCard(id), courseId }));
  if (fresh.length) await db.srsCards.bulkPut(fresh);
}

/**
 * Record one review. Writes the event log and the derived card atomically, so a
 * crash between them cannot leave the two disagreeing.
 */
export async function recordReview(
  wordId: string,
  rating: Rating,
  now = Date.now(),
  courseId: CourseId = DEFAULT_COURSE_ID,
): Promise<LocalCard> {
  const deviceId = await getDeviceId();
  const existing = (await db.srsCards.get([courseId, wordId])) ?? { ...newCard(wordId), courseId };
  const updated: LocalCard = { ...scheduleCard(existing, rating, now), courseId };

  await db.transaction("rw", [db.srsCards, db.reviewLogs], async () => {
    await db.reviewLogs.add({
      id: crypto.randomUUID(),
      courseId,
      wordId,
      rating,
      reviewedAt: now,
      deviceId,
      synced: 0,
    });
    await db.srsCards.put(updated);
  });

  return updated;
}

/**
 * Rebuild every card in a course from its local log. Used as a repair path if
 * the derived cache is ever suspect.
 */
export async function rebuildCardsFromLogs(courseId: CourseId = DEFAULT_COURSE_ID): Promise<void> {
  const logs = await db.reviewLogs.where({ courseId }).toArray();
  const events: ReviewEvent[] = logs.map((l) => ({
    wordId: l.wordId,
    rating: l.rating,
    reviewedAt: l.reviewedAt,
  }));
  const existing = await db.srsCards.where({ courseId }).toArray();
  const wordIds = new Set([...existing.map((c) => c.wordId), ...logs.map((l) => l.wordId)]);
  const rebuilt = [...wordIds].map((id) => ({ ...deriveCard(id, events), courseId }));
  if (rebuilt.length) await db.srsCards.bulkPut(rebuilt);
}

/**
 * Adopt the card state the server derived, then replay anything this device has
 * not pushed yet.
 *
 * This is what makes a reinstall or a second device work. The server's cards
 * already reflect every event it knows about, so they are the correct base;
 * unsynced local events are by definition absent from that derivation, so they
 * are applied on top rather than being lost or double-counted.
 */
export async function adoptServerCards(
  serverCards: readonly SrsCard[],
  courseId: CourseId = DEFAULT_COURSE_ID,
): Promise<void> {
  const unsynced = await db.reviewLogs.where("synced").equals(0).toArray();
  const pendingByWord = new Map<string, ReviewEvent[]>();
  for (const l of unsynced) {
    if (l.courseId !== courseId) continue;
    const list = pendingByWord.get(l.wordId) ?? [];
    list.push({ wordId: l.wordId, rating: l.rating, reviewedAt: l.reviewedAt });
    pendingByWord.set(l.wordId, list);
  }

  const merged: LocalCard[] = serverCards.map((incoming) => {
    let card: SrsCard = { ...incoming };
    const pending = pendingByWord.get(card.wordId);
    if (pending) {
      for (const e of pending.sort((a, b) => a.reviewedAt - b.reviewedAt)) {
        card = scheduleCard(card, e.rating, e.reviewedAt);
      }
      pendingByWord.delete(card.wordId);
    }
    return { ...card, courseId };
  });

  // Words the server has never seen (reviewed offline on this device only).
  for (const [wordId, events] of pendingByWord) {
    merged.push({ ...deriveCard(wordId, events), courseId });
  }

  if (merged.length) await db.srsCards.bulkPut(merged);
}

/**
 * Build a review session queue.
 *
 * Defaults to the active course (D4). Passing ALL_COURSES merges every course
 * into one session — offered as an explicit opt-in rather than the default,
 * because alternating between right-to-left pointed Hebrew and left-to-right
 * polytonic Greek mid-session carries a real cognitive cost.
 */
export async function getReviewQueue(
  now = Date.now(),
  newCardLimit?: number,
  courseId: CourseScope = DEFAULT_COURSE_ID,
): Promise<LocalCard[]> {
  const cards = await scoped(courseId);
  return buildReviewQueue(cards, now, {
    newCardLimit: newCardLimit ?? DEFAULT_CONFIG.newCardsPerDay,
  }) as LocalCard[];
}

/** A session limited to one custom deck (spec §4 Phase 7). */
export async function getDeckQueue(
  wordIds: string[],
  now = Date.now(),
  courseId: CourseId = DEFAULT_COURSE_ID,
): Promise<LocalCard[]> {
  const keys = wordIds.map((id) => [courseId, id] as [CourseId, string]);
  const cards = (await db.srsCards.bulkGet(keys)).map(
    (c, i) => c ?? { ...newCard(wordIds[i]!), courseId },
  );
  return buildReviewQueue(cards, now, { newCardLimit: cards.length }) as LocalCard[];
}

export async function getDueCounts(now = Date.now(), courseId: CourseScope = DEFAULT_COURSE_ID) {
  return dueCounts(await scoped(courseId), now);
}

export async function getRecentEvents(
  sinceDays = 30,
  courseId: CourseScope = DEFAULT_COURSE_ID,
): Promise<ReviewEvent[]> {
  const cutoff = Date.now() - sinceDays * 24 * 60 * 60 * 1000;
  const logs = await db.reviewLogs.where("reviewedAt").aboveOrEqual(cutoff).toArray();
  return logs
    .filter((l) => courseId === ALL_COURSES || l.courseId === courseId)
    .map((l) => ({ wordId: l.wordId, rating: l.rating, reviewedAt: l.reviewedAt }));
}

/** Cards flagged as leeches, for the "needs attention" screen. */
export async function getLeeches(courseId: CourseScope = DEFAULT_COURSE_ID): Promise<LocalCard[]> {
  return (await scoped(courseId)).filter((c) => c.isLeech);
}

// ---------- progress ----------

export async function getProgress(courseId: CourseScope = DEFAULT_COURSE_ID): Promise<UnitProgress[]> {
  return courseId === ALL_COURSES
    ? db.unitProgress.toArray()
    : db.unitProgress.where({ courseId }).toArray();
}

export async function getCompletedUnitIds(
  courseId: CourseId = DEFAULT_COURSE_ID,
): Promise<string[]> {
  return (await db.unitProgress.where({ courseId }).toArray()).map((p) => p.unitId);
}

export async function completeUnit(
  unitId: string,
  score: number,
  courseId: CourseId = DEFAULT_COURSE_ID,
): Promise<void> {
  const unit = unitById.get(unitId);
  await db.transaction("rw", [db.unitProgress, db.srsCards], async () => {
    const existing = await db.unitProgress.get([courseId, unitId]);
    await db.unitProgress.put({
      courseId,
      unitId,
      completedAt: existing?.completedAt ?? Date.now(),
      score: Math.max(score, existing?.score ?? 0),
      synced: 0,
    });
    if (unit) {
      const keys = unit.wordIds.map((id) => [courseId, id] as [CourseId, string]);
      const have = new Set((await db.srsCards.bulkGet(keys)).filter(Boolean).map((c) => c!.wordId));
      const fresh = unit.wordIds
        .filter((id) => !have.has(id))
        .map((id) => ({ ...newCard(id), courseId }));
      if (fresh.length) await db.srsCards.bulkPut(fresh);
    }
  });
}

/** Placement can unlock units without the learner completing them. */
export async function unlockUnits(
  unitIds: string[],
  courseId: CourseId = DEFAULT_COURSE_ID,
): Promise<void> {
  await setMeta(`placementUnlocked:${courseId}`, unitIds);
}

export async function getPlacementUnlocked(
  courseId: CourseId = DEFAULT_COURSE_ID,
): Promise<string[]> {
  return getMeta<string[]>(`placementUnlocked:${courseId}`, []);
}

// ---------- xp & streak (global — D2) ----------

export async function getXp(): Promise<number> {
  return getMeta<number>("xp", 0);
}

export async function addXp(amount: number): Promise<number> {
  const next = (await getXp()) + amount;
  await setMeta("xp", next);
  return next;
}

const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export async function getStreak(): Promise<StreakState> {
  return getMeta<StreakState>("streak", {
    current: 0,
    longest: 0,
    freezesAvailable: 2,
    lastActiveDate: "",
  });
}

/**
 * Advance the streak for real calendar activity.
 *
 * Unlike the prototype (which incremented per lesson), this increments at most
 * once per day, and a gap of more than one day either burns a freeze or resets.
 * Global across courses: studying Greek keeps a Hebrew streak alive (D2).
 */
export async function touchStreak(now = new Date()): Promise<StreakState> {
  const streak = await getStreak();
  const today = todayKey(now);
  if (streak.lastActiveDate === today) return streak;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const wasYesterday = streak.lastActiveDate === todayKey(yesterday);

  let next: StreakState;
  if (!streak.lastActiveDate || wasYesterday) {
    const current = streak.current + 1;
    next = { ...streak, current, longest: Math.max(current, streak.longest), lastActiveDate: today };
  } else if (streak.freezesAvailable > 0) {
    // Missed at least one day, but a freeze covers the gap.
    next = {
      ...streak,
      freezesAvailable: streak.freezesAvailable - 1,
      current: streak.current + 1,
      longest: Math.max(streak.current + 1, streak.longest),
      lastActiveDate: today,
    };
  } else {
    next = { ...streak, current: 1, lastActiveDate: today };
  }

  await setMeta("streak", next);
  return next;
}

export async function setStreak(streak: StreakState): Promise<void> {
  await setMeta("streak", streak);
}

// ---------- decks ----------

export async function listLocalDecks(courseId: CourseScope = DEFAULT_COURSE_ID): Promise<LocalDeck[]> {
  return courseId === ALL_COURSES ? db.decks.toArray() : db.decks.where({ courseId }).toArray();
}

export async function putLocalDecks(
  decks: readonly { id: string; name: string; wordIds: string[]; createdAt: number }[],
  courseId: CourseId = DEFAULT_COURSE_ID,
): Promise<void> {
  await db.decks.where({ courseId }).delete();
  await db.decks.bulkPut(decks.map((d) => ({ ...d, courseId })));
}

// ---------- stats ----------

export async function getStats(now = Date.now(), courseId: CourseScope = DEFAULT_COURSE_ID) {
  const [cards, allLogs, progress, xp, streak] = await Promise.all([
    scoped(courseId),
    db.reviewLogs.toArray(),
    getProgress(courseId),
    getXp(),
    getStreak(),
  ]);
  const logs = allLogs.filter((l) => courseId === ALL_COURSES || l.courseId === courseId);

  const known = cards.filter((c) => c.state === "review" && c.intervalDays >= 21).length;
  const familiesSeen = new Set(
    cards.map((c) => words.find((w) => w.id === c.wordId)?.familyId).filter(Boolean),
  ).size;

  return {
    counts: dueCounts(cards, now),
    totalReviews: logs.length,
    known,
    familiesSeen,
    unitsCompleted: progress.length,
    xp,
    streak,
  };
}
