/**
 * Delta sync (spec §5.2).
 *
 * Push unsynced review events, then pull whatever the server has derived.
 * Because card state is derived from an append-only log on both sides, two
 * devices that review the same word offline converge instead of clobbering each
 * other — there is no "which copy wins" decision to get wrong.
 *
 * Triggered on app foreground and `visibilitychange` rather than the Background
 * Sync API, which iOS Safari does not implement (spec §2.1).
 */
import { api, tokenStore } from "@/api/client";
import { NetworkError, ApiError, type ReviewLogEntry } from "@/api/types";
import { db, getMeta, setMeta } from "@/db";
import { DEFAULT_COURSE_ID } from "@/content/course";
import { adoptServerCards, getProgress, getStreak, getXp, setStreak } from "@/db/repo";

export type SyncStatus = "idle" | "syncing" | "offline" | "error" | "unauthenticated";

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: number | null;
  pendingCount: number;
  error: string | null;
}

let state: SyncState = { status: "idle", lastSyncedAt: null, pendingCount: 0, error: null };
const listeners = new Set<(s: SyncState) => void>();

function emit(patch: Partial<SyncState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l(state));
}

export const syncState = {
  get: () => state,
  subscribe(l: (s: SyncState) => void) {
    listeners.add(l);
    l(state);
    return () => {
      listeners.delete(l);
    };
  },
};

export async function countPending(): Promise<number> {
  return db.reviewLogs.where("synced").equals(0).count();
}

let inFlight: Promise<void> | null = null;

/**
 * Run one sync cycle. Concurrent calls share the in-flight promise — foreground
 * events and manual taps can otherwise stack up several pushes of the same data.
 */
export async function sync(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = runSync().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function runSync(): Promise<void> {
  if (!tokenStore.access) {
    emit({ status: "unauthenticated", pendingCount: await countPending() });
    return;
  }

  emit({ status: "syncing", error: null });

  try {
    // 1. Push unsynced review events.
    const pending = await db.reviewLogs.where("synced").equals(0).toArray();
    if (pending.length) {
      const entries: ReviewLogEntry[] = pending.map(({ synced: _synced, ...e }) => e);
      const res = await api.pushReviewLogs({ entries });
      const accepted = new Set(res.acceptedIds);
      await db.transaction("rw", db.reviewLogs, async () => {
        for (const log of pending) {
          if (accepted.has(log.id)) await db.reviewLogs.update(log.id, { synced: 1 });
        }
      });
      await setMeta("syncCursor", res.cursor);
    }

    // 2. Push progress, streak and XP.
    const [progress, streak, xp] = await Promise.all([getProgress(), getStreak(), getXp()]);
    const unsyncedProgress = progress.filter((p) => (p as { synced?: 0 | 1 }).synced === 0);
    if (unsyncedProgress.length) {
      await api.pushProgress({
        courseId: DEFAULT_COURSE_ID,
        progress: unsyncedProgress.map(({ unitId, completedAt, score }) => ({
          courseId: DEFAULT_COURSE_ID,
          unitId,
          completedAt,
          score,
        })),
        // Global across courses (D2).
        streak,
        xp,
      });
      await db.transaction("rw", db.unitProgress, async () => {
        for (const p of unsyncedProgress)
          await db.unitProgress.update([DEFAULT_COURSE_ID, p.unitId], { synced: 1 });
      });
    }

    // 3. Pull server state.
    const cursor = await getMeta<string | undefined>("syncCursor", undefined);
    const server = await api.getSyncState(DEFAULT_COURSE_ID, cursor);

    // Server-authoritative fields: streak freezes and progress it knows about
    // that this device does not (i.e. earned on another device).
    await setStreak(server.streak);
    // XP is a monotonic total; take whichever side is ahead so a restored
    // device recovers it and an offline session never loses ground.
    if (server.xp > (await getXp())) await setMeta("xp", server.xp);
    const localUnits = new Set((await getProgress()).map((p) => p.unitId));
    const incoming = server.progress.filter((p) => !localUnits.has(p.unitId));
    if (incoming.length) {
      await db.unitProgress.bulkPut(
        incoming.map((p) => ({ ...p, courseId: DEFAULT_COURSE_ID, synced: 1 as const })),
      );
    }

    // Adopt the server's derived cards, replaying any not-yet-pushed local
    // events on top. Rebuilding purely from the local log would be wrong here:
    // a reinstalled or second device has no local log, and would end up with no
    // SRS state at all despite the server holding the full history.
    await adoptServerCards(server.cards);

    await setMeta("syncCursor", server.cursor);
    emit({
      status: "idle",
      lastSyncedAt: Date.now(),
      pendingCount: await countPending(),
      error: null,
    });
  } catch (e) {
    if (e instanceof NetworkError) {
      // Expected and unremarkable — this app is designed to run offline.
      emit({ status: "offline", pendingCount: await countPending() });
      return;
    }
    if (e instanceof ApiError && e.status === 401) {
      emit({ status: "unauthenticated", pendingCount: await countPending() });
      return;
    }
    emit({
      status: "error",
      error: e instanceof Error ? e.message : String(e),
      pendingCount: await countPending(),
    });
  }
}

let started = false;
let intervalId: number | undefined;

/**
 * Wire up sync triggers. Deliberately not the Background Sync API: it is absent
 * on iOS Safari, so foreground + visibility is the only behaviour that is
 * actually uniform across the platforms this ships to.
 */
export function startSyncTriggers(): () => void {
  if (started) return () => {};
  started = true;

  const onVisible = () => {
    if (document.visibilityState === "visible") void sync();
  };
  const onOnline = () => void sync();

  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("online", onOnline);
  window.addEventListener("focus", onOnline);
  intervalId = window.setInterval(() => void sync(), 5 * 60 * 1000);

  void sync();

  return () => {
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("online", onOnline);
    window.removeEventListener("focus", onOnline);
    if (intervalId) window.clearInterval(intervalId);
    started = false;
  };
}
