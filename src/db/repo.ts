/**
 * Repository layer — every domain operation the UI needs, all local-first.
 *
 * The rule these functions enforce: recording a review writes an immutable log
 * entry AND updates the derived card in one transaction. The log is the truth
 * (spec §5.2); the card table is a cache of the derivation so the path screen
 * doesn't have to replay history on every render.
 */
import { db, getDeviceId, getMeta, setMeta } from "./index";
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
import type { StreakState, UnitProgress } from "@/api/types";

// ---------- cards ----------

export async function getAllCards(): Promise<SrsCard[]> {
  return db.cards.toArray();
}

export async function getCard(wordId: string): Promise<SrsCard | undefined> {
  return db.cards.get(wordId);
}

/** Introduce vocabulary as new cards, skipping any the learner already has. */
export async function ensureCards(wordIds: string[]): Promise<void> {
  const existing = new Set((await db.cards.bulkGet(wordIds)).filter(Boolean).map((c) => c!.wordId));
  const fresh = wordIds.filter((id) => !existing.has(id)).map((id) => newCard(id));
  if (fresh.length) await db.cards.bulkPut(fresh);
}

/**
 * Record one review. Writes the event log and the derived card atomically, so a
 * crash between them cannot leave the two disagreeing.
 */
export async function recordReview(wordId: string, rating: Rating, now = Date.now()): Promise<SrsCard> {
  const deviceId = await getDeviceId();
  const existing = (await db.cards.get(wordId)) ?? newCard(wordId);
  const updated = scheduleCard(existing, rating, now);

  await db.transaction("rw", [db.cards, db.reviewLogs], async () => {
    await db.reviewLogs.add({
      id: crypto.randomUUID(),
      wordId,
      rating,
      reviewedAt: now,
      deviceId,
      synced: 0,
    });
    await db.cards.put(updated);
  });

  return updated;
}

/**
 * Rebuild every card from the local log. Used after a sync pulls down events
 * from another device, and as a repair path if the cache is ever suspect.
 */
export async function rebuildCardsFromLogs(): Promise<void> {
  const logs = await db.reviewLogs.toArray();
  const events: ReviewEvent[] = logs.map((l) => ({
    wordId: l.wordId,
    rating: l.rating,
    reviewedAt: l.reviewedAt,
  }));
  const existing = await db.cards.toArray();
  const wordIds = new Set([...existing.map((c) => c.wordId), ...logs.map((l) => l.wordId)]);
  const rebuilt = [...wordIds].map((id) => deriveCard(id, events));
  await db.cards.bulkPut(rebuilt);
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
export async function adoptServerCards(serverCards: readonly SrsCard[]): Promise<void> {
  const unsynced = await db.reviewLogs.where("synced").equals(0).toArray();
  const pendingByWord = new Map<string, ReviewEvent[]>();
  for (const l of unsynced) {
    const list = pendingByWord.get(l.wordId) ?? [];
    list.push({ wordId: l.wordId, rating: l.rating, reviewedAt: l.reviewedAt });
    pendingByWord.set(l.wordId, list);
  }

  const merged: SrsCard[] = serverCards.map((incoming) => {
    let card: SrsCard = { ...incoming };
    const pending = pendingByWord.get(card.wordId);
    if (pending) {
      for (const e of pending.sort((a, b) => a.reviewedAt - b.reviewedAt)) {
        card = scheduleCard(card, e.rating, e.reviewedAt);
      }
      pendingByWord.delete(card.wordId);
    }
    return card;
  });

  // Words the server has never seen (reviewed offline on this device only).
  for (const [wordId, events] of pendingByWord) {
    merged.push(deriveCard(wordId, events));
  }

  if (merged.length) await db.cards.bulkPut(merged);
}

export async function getReviewQueue(now = Date.now(), newCardLimit?: number): Promise<SrsCard[]> {
  const cards = await db.cards.toArray();
  return buildReviewQueue(cards, now, {
    newCardLimit: newCardLimit ?? DEFAULT_CONFIG.newCardsPerDay,
  });
}

/** A session limited to one custom deck (spec §4 Phase 7). */
export async function getDeckQueue(wordIds: string[], now = Date.now()): Promise<SrsCard[]> {
  const cards = (await db.cards.bulkGet(wordIds))
    .map((c, i) => c ?? newCard(wordIds[i]!))
    .filter(Boolean);
  return buildReviewQueue(cards, now, { newCardLimit: cards.length });
}

export async function getDueCounts(now = Date.now()) {
  return dueCounts(await db.cards.toArray(), now);
}

export async function getRecentEvents(sinceDays = 30): Promise<ReviewEvent[]> {
  const cutoff = Date.now() - sinceDays * 24 * 60 * 60 * 1000;
  const logs = await db.reviewLogs.where("reviewedAt").aboveOrEqual(cutoff).toArray();
  return logs.map((l) => ({ wordId: l.wordId, rating: l.rating, reviewedAt: l.reviewedAt }));
}

/** Cards flagged as leeches, for the "needs attention" screen. */
export async function getLeeches(): Promise<SrsCard[]> {
  return db.cards.filter((c) => c.isLeech).toArray();
}

// ---------- progress ----------

export async function getProgress(): Promise<UnitProgress[]> {
  return db.progress.toArray();
}

export async function getCompletedUnitIds(): Promise<string[]> {
  return (await db.progress.toArray()).map((p) => p.unitId);
}

export async function completeUnit(unitId: string, score: number): Promise<void> {
  const unit = unitById.get(unitId);
  await db.transaction("rw", [db.progress, db.cards], async () => {
    const existing = await db.progress.get(unitId);
    await db.progress.put({
      unitId,
      completedAt: existing?.completedAt ?? Date.now(),
      score: Math.max(score, existing?.score ?? 0),
      synced: 0,
    });
    if (unit) {
      const ids = unit.wordIds;
      const have = new Set((await db.cards.bulkGet(ids)).filter(Boolean).map((c) => c!.wordId));
      const fresh = ids.filter((id) => !have.has(id)).map((id) => newCard(id));
      if (fresh.length) await db.cards.bulkPut(fresh);
    }
  });
}

/** Placement can unlock units without the learner completing them. */
export async function unlockUnits(unitIds: string[]): Promise<void> {
  await setMeta("placementUnlocked", unitIds);
}

export async function getPlacementUnlocked(): Promise<string[]> {
  return getMeta<string[]>("placementUnlocked", []);
}

// ---------- xp & streak ----------

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

export async function listLocalDecks() {
  return db.decks.toArray();
}

export async function putLocalDecks(decks: Awaited<ReturnType<typeof listLocalDecks>>) {
  await db.decks.clear();
  await db.decks.bulkPut(decks);
}

// ---------- stats ----------

export async function getStats(now = Date.now()) {
  const [cards, logs, progress, xp, streak] = await Promise.all([
    db.cards.toArray(),
    db.reviewLogs.toArray(),
    db.progress.toArray(),
    getXp(),
    getStreak(),
  ]);

  const known = cards.filter((c) => c.state === "review" && c.intervalDays >= 21).length;
  const rootsSeen = new Set(
    cards.map((c) => words.find((w) => w.id === c.wordId)?.rootId).filter(Boolean),
  ).size;

  return {
    counts: dueCounts(cards, now),
    totalReviews: logs.length,
    known,
    rootsSeen,
    unitsCompleted: progress.length,
    xp,
    streak,
  };
}
