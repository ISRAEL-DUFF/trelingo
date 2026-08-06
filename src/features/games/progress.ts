import { useEffect, useState } from "react";
import { getMeta, setMeta } from "@/db";

/**
 * How far a player has got in a game, remembered between visits.
 *
 * SEPARATE FROM THE SRS, AND STAYING THAT WAY. Games write no review events and
 * move no card's due date — the gallery says so on the card, and this file does
 * not change it. What it fixes is narrower and more obvious: finishing Day One
 * and coming back the next day to find yourself at verse one again.
 *
 * STORED IN THE `meta` TABLE, one row per game, which buys two things for free.
 * It needs no Dexie migration, because `meta` is untyped key/value and already
 * holds `games:greek-reading:best`. And it rides local export/import without
 * any change to the exporter, because backup.ts exports the WHOLE meta table
 * rather than a list of fields it knows about (see its `metaToRecord` header —
 * this is exactly the "next thing stored here" that comment anticipated).
 *
 * Import DOES need a rule, though, and backup.ts has one. Its default is "local
 * wins if present", which would let a device sitting on verse 2 discard a
 * finished run restored from a backup. Progress is monotonic, so it merges by
 * max/or instead. The rule lives there; the shape lives here.
 *
 * MONOTONIC BY CONSTRUCTION. `furthest` only ever moves up and `completed` only
 * ever turns on, so replaying an old backup, or importing the same file twice,
 * cannot walk a player backwards. `runs` counts finishes rather than starts,
 * because a start is not evidence of anything.
 */
export interface GameProgress {
  /** Levels finished. 3 means levels 0–2 are done and level 3 is next. */
  furthest: number;
  /** Has reached the end at least once. Never goes back to false. */
  completed: boolean;
  /** When it was first finished, ms since epoch. */
  completedAt?: number;
  /** How many times it has been played to the end. */
  runs: number;
}

export const NO_PROGRESS: GameProgress = { furthest: 0, completed: false, runs: 0 };

export const progressKey = (gameId: string) => `games:${gameId}:progress`;

export async function readProgress(gameId: string): Promise<GameProgress> {
  const stored = await getMeta<GameProgress | null>(progressKey(gameId), null);
  return stored ? { ...NO_PROGRESS, ...stored } : { ...NO_PROGRESS };
}

/**
 * Record that a level was finished.
 *
 * Takes the level's INDEX and stores index + 1, so "finished level 0" reads as
 * "1 level done" rather than as no progress at all. Replaying an early level
 * after finishing a later one does not walk `furthest` back.
 */
export async function recordLevel(gameId: string, levelIndex: number): Promise<GameProgress> {
  const current = await readProgress(gameId);
  const next: GameProgress = { ...current, furthest: Math.max(current.furthest, levelIndex + 1) };
  await setMeta(progressKey(gameId), next);
  return next;
}

/** Record a finished run. `completedAt` keeps the FIRST finish, not the latest. */
export async function recordFinish(gameId: string, levels: number): Promise<GameProgress> {
  const current = await readProgress(gameId);
  const next: GameProgress = {
    furthest: Math.max(current.furthest, levels),
    completed: true,
    completedAt: current.completedAt ?? Date.now(),
    runs: current.runs + 1,
  };
  await setMeta(progressKey(gameId), next);
  return next;
}

/** Start over from the beginning, keeping the record that it was finished. */
export async function resetProgress(gameId: string): Promise<GameProgress> {
  const current = await readProgress(gameId);
  const next: GameProgress = { ...current, furthest: 0 };
  await setMeta(progressKey(gameId), next);
  return next;
}

/**
 * Read progress for the gallery.
 *
 * `null` while loading rather than NO_PROGRESS, so a tile does not flash "not
 * started" at somebody who has finished the game.
 */
export function useGameProgress(gameId: string): GameProgress | null {
  const [progress, setProgress] = useState<GameProgress | null>(null);
  useEffect(() => {
    let live = true;
    void readProgress(gameId).then((p) => {
      if (live) setProgress(p);
    });
    return () => {
      live = false;
    };
  }, [gameId]);
  return progress;
}
