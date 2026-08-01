/**
 * Mock API handlers.
 *
 * These implement src/api/types.ts over real HTTP. Two properties matter:
 *
 *  1. The server derives SRS card state from the review-log stream using the
 *     *same* engine the client uses (spec §5.2). That is the actual contract —
 *     if a real backend reimplements it in another language, these handlers are
 *     the reference behaviour to match.
 *  2. Latency and failure are simulated, so the UI's loading and offline paths
 *     get exercised instead of always hitting an instant, always-ok server.
 */
import { HttpResponse, http, delay, type DefaultBodyType } from "msw";
import { API_BASE } from "@/api/client";
import { mockDb } from "./db";
import { mockConfig } from "./config";
import { deriveCard, type ReviewEvent } from "@/srs/engine";
import { units, words } from "@/content";
import type {
  ApiErrorBody,
  ApiUser,
  AssessmentResult,
  AudioManifestEntry,
  AuthResponse,
  CreateDeckRequest,
  Deck,
  GemLedgerResponse,
  LeagueResponse,
  LoginRequest,
  NotificationPrefs,
  OAuthRequest,
  PlacementQuestion,
  PushProgressRequest,
  PushReviewLogsRequest,
  PushReviewLogsResponse,
  PushSubscriptionRequest,
  SignupRequest,
  SpendGemsRequest,
  SubmitAssessmentRequest,
  SubmitPlacementRequest,
  SubmitPlacementResponse,
  SyncStateResponse,
  SyncedCard,
} from "@/api/types";

const url = (path: string) => `${API_BASE}${path}`;

/**
 * All responses go through these two helpers.
 *
 * MSW infers one ResponseBody type per handler, but every resolver here can
 * return either its success payload or an error body. Funnelling both through a
 * single `DefaultBodyType` return keeps that inference uniform; the concrete
 * type is re-asserted client-side in api/client.ts, which is the contract the
 * UI actually depends on.
 */
const json = <T,>(body: T, init?: ResponseInit) =>
  HttpResponse.json(body as DefaultBodyType, init);

const noContent = () =>
  HttpResponse.json(null as DefaultBodyType, { status: 204 });

function err(status: number, error: string, message: string) {
  return json<ApiErrorBody>({ error, message }, { status });
}

/** Simulated network conditions, driven by the in-app dev panel. */
async function simulateNetwork() {
  const { latencyMs, failureRate, offline } = mockConfig.get();
  // HttpResponse.error() emulates a *transport* failure, so fetch rejects and
  // the client raises NetworkError. Throwing here instead would surface as a
  // 500, and the UI would report "sync error" for what is a normal offline
  // state — exactly the distinction this app is built around.
  if (offline) return HttpResponse.error() as unknown as ReturnType<typeof json>;
  await delay(latencyMs);
  if (failureRate > 0 && Math.random() < failureRate) {
    return err(503, "service_unavailable", "Simulated server error (dev panel)");
  }
  return null;
}

function authUserId(request: Request): string | null {
  const header = request.headers.get("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  return mockDb.userIdForToken(token);
}

function toApiUser(id: string): ApiUser | null {
  const u = mockDb.findUserById(id);
  if (!u) return null;
  const { password: _password, ...rest } = u;
  return rest;
}

function authResponse(userId: string): AuthResponse {
  const { accessToken, refreshToken } = mockDb.createSession(userId);
  return { user: toApiUser(userId)!, accessToken, refreshToken, expiresIn: 900 };
}

/**
 * Cards, derived from the log stream. The heart of the sync contract.
 *
 * Partitioned by course: word ids are unique only within a course, so deriving
 * across all of them would merge Attic λόγος with Koine λόγος.
 */
function deriveCards(userId: string, courseId: string): SyncedCard[] {
  const logs = mockDb.userData(userId).reviewLogs.filter((l) => l.courseId === courseId);
  const events: ReviewEvent[] = logs.map((l) => ({
    wordId: l.wordId,
    rating: l.rating,
    reviewedAt: l.reviewedAt,
  }));
  const wordIds = [...new Set(logs.map((l) => l.wordId))];
  return wordIds.map((wordId) => {
    const c = deriveCard(wordId, events);
    return {
      wordId: c.wordId,
      ease: c.ease,
      intervalDays: c.intervalDays,
      repetitions: c.repetitions,
      lapses: c.lapses,
      state: c.state,
      dueAt: c.dueAt,
      lastReviewedAt: c.lastReviewedAt,
      isLeech: c.isLeech,
    };
  });
}

function gemBalance(userId: string): number {
  return mockDb.userData(userId).gems.reduce((sum, t) => sum + t.amount, 0);
}

// Placement questions are drawn from real content so the test actually measures
// the thing the path teaches.
function buildPlacementQuestions(): PlacementQuestion[] {
  const picks = ["bara", "shamar", "mishmeret", "vayomer", "echsar", "dibber", "higdil", "shofet"];
  return picks.flatMap((id, i) => {
    const w = words.find((x) => x.id === id);
    if (!w) return [];
    return [
      {
        id: `pq-${i}`,
        level: Math.floor(i / 2),
        prompt: "What does this word mean?",
        text: w.text,
        choices: [w.gloss, ...w.distractors.slice(0, 3)].sort(),
        answer: w.gloss,
      },
    ];
  });
}

export const handlers = [
  // ---------- auth ----------
  http.post(url("/auth/signup"), async ({ request }) => {
    const failed = await simulateNetwork();
    if (failed) return failed;
    const body = (await request.json()) as SignupRequest;
    if (!body.email?.includes("@")) return err(400, "invalid_email", "That doesn't look like an email address.");
    if ((body.password?.length ?? 0) < 8)
      return err(400, "weak_password", "Password must be at least 8 characters.");
    if (mockDb.findUserByEmail(body.email))
      return err(409, "email_taken", "An account with that email already exists.");

    const id = crypto.randomUUID();
    mockDb.addUser({
      id,
      email: body.email,
      password: body.password,
      displayName: body.displayName || body.email.split("@")[0]!,
      createdAt: new Date().toISOString(),
      timezone: body.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      pronunciationPref: "sephardic",
      diacriticsPref: "fading",
      placementLevel: null,
    });
    return json(authResponse(id), { status: 201 });
  }),

  http.post(url("/auth/login"), async ({ request }) => {
    const failed = await simulateNetwork();
    if (failed) return failed;
    const body = (await request.json()) as LoginRequest;
    const user = mockDb.findUserByEmail(body.email);
    if (!user || user.password !== body.password)
      return err(401, "invalid_credentials", "Email or password is incorrect.");
    return json(authResponse(user.id));
  }),

  // Stands in for the Google/Apple redirect dance, which has no meaningful
  // client-side equivalent to mock. Creates or reuses a provider-specific account.
  http.post(url("/auth/oauth"), async ({ request }) => {
    const failed = await simulateNetwork();
    if (failed) return failed;
    const { provider } = (await request.json()) as OAuthRequest;
    const email = `demo@${provider}.example`;
    let user = mockDb.findUserByEmail(email);
    if (!user) {
      const id = crypto.randomUUID();
      mockDb.addUser({
        id,
        email,
        password: crypto.randomUUID(),
        displayName: provider === "google" ? "Google User" : "Apple User",
        createdAt: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        pronunciationPref: "sephardic",
        diacriticsPref: "fading",
        placementLevel: null,
      });
      user = mockDb.findUserByEmail(email)!;
    }
    return json(authResponse(user.id));
  }),

  http.post(url("/auth/refresh"), async ({ request }) => {
    const { refreshToken } = (await request.json()) as { refreshToken: string };
    const userId = mockDb.userIdForRefresh(refreshToken);
    if (!userId) return err(401, "invalid_refresh", "Refresh token is not valid.");
    return json(authResponse(userId));
  }),

  http.post(url("/auth/logout"), async ({ request }) => {
    const header = request.headers.get("Authorization");
    if (header?.startsWith("Bearer ")) mockDb.revokeSession(header.slice(7));
    return noContent();
  }),

  // ---------- me ----------
  http.get(url("/me"), async ({ request }) => {
    const failed = await simulateNetwork();
    if (failed) return failed;
    const id = authUserId(request);
    if (!id) return err(401, "unauthorized", "Sign in to continue.");
    return json(toApiUser(id));
  }),

  http.patch(url("/me"), async ({ request }) => {
    const failed = await simulateNetwork();
    if (failed) return failed;
    const id = authUserId(request);
    if (!id) return err(401, "unauthorized", "Sign in to continue.");
    const patch = (await request.json()) as Partial<ApiUser>;
    const user = mockDb.findUserById(id)!;
    Object.assign(user, {
      displayName: patch.displayName ?? user.displayName,
      diacriticsPref: patch.diacriticsPref ?? user.diacriticsPref,
      pronunciationPref: patch.pronunciationPref ?? user.pronunciationPref,
    });
    mockDb.save();
    return json(toApiUser(id));
  }),

  http.get(url("/me/export"), async ({ request }) => {
    const id = authUserId(request);
    if (!id) return err(401, "unauthorized", "Sign in to continue.");
    return json({
      user: toApiUser(id),
      ...mockDb.userData(id),
      exportedAt: new Date().toISOString(),
    });
  }),

  http.delete(url("/me"), async ({ request }) => {
    const id = authUserId(request);
    if (!id) return err(401, "unauthorized", "Sign in to continue.");
    const db = mockDb.raw;
    db.users = db.users.filter((u) => u.id !== id);
    delete db.data[id];
    mockDb.save();
    return noContent();
  }),

  // ---------- sync ----------
  http.post(url("/sync/review-logs"), async ({ request }) => {
    const failed = await simulateNetwork();
    if (failed) return failed;
    const id = authUserId(request);
    if (!id) return err(401, "unauthorized", "Sign in to continue.");

    const { entries } = (await request.json()) as PushReviewLogsRequest;
    const data = mockDb.userData(id);
    const known = new Set(data.reviewLogs.map((l) => l.id));

    // Idempotent: re-pushing an id is accepted but not double-counted, which is
    // what makes client retry-on-failure safe.
    for (const e of entries) {
      if (!known.has(e.id)) {
        data.reviewLogs.push(e);
        known.add(e.id);
      }
    }
    data.reviewLogs.sort((a, b) => a.reviewedAt - b.reviewedAt);
    mockDb.save();

    return json<PushReviewLogsResponse>({
      acceptedIds: entries.map((e) => e.id),
      cursor: String(Date.now()),
    });
  }),

  http.get(url("/sync/state"), async ({ request }) => {
    const failed = await simulateNetwork();
    if (failed) return failed;
    const id = authUserId(request);
    if (!id) return err(401, "unauthorized", "Sign in to continue.");

    const courseId = new URL(request.url).searchParams.get("courseId") ?? "hebrew-biblical";
    const data = mockDb.userData(id);
    return json<SyncStateResponse>({
      cards: deriveCards(id, courseId),
      progress: data.progress.filter((p) => p.courseId === courseId),
      streak: data.streak,
      gems: gemBalance(id),
      xp: data.xp,
      cursor: String(Date.now()),
      serverTime: Date.now(),
    });
  }),

  http.post(url("/sync/progress"), async ({ request }) => {
    const failed = await simulateNetwork();
    if (failed) return failed;
    const id = authUserId(request);
    if (!id) return err(401, "unauthorized", "Sign in to continue.");

    const body = (await request.json()) as PushProgressRequest;
    const data = mockDb.userData(id);
    const byUnit = new Map(data.progress.map((p) => [`${p.courseId}:${p.unitId}`, p]));
    const alreadyDone = new Set(data.progress.map((p) => `${p.courseId}:${p.unitId}`));
    for (const p of body.progress) {
      const key = `${p.courseId}:${p.unitId}`;
      const existing = byUnit.get(key);
      // Keep the best score rather than letting a later replay lower it.
      if (!existing || p.score > existing.score) byUnit.set(key, p);
    }
    data.progress = [...byUnit.values()];

    // Gems are minted server-side only, on genuinely new unit completions, so a
    // client replaying an old payload cannot farm currency.
    const newlyCompleted = body.progress.filter((p) => !alreadyDone.has(`${p.courseId}:${p.unitId}`));
    for (const p of newlyCompleted) {
      data.gems.push({
        id: crypto.randomUUID(),
        amount: 25,
        reason: `Completed ${p.unitId}`,
        createdAt: Date.now(),
      });
    }
    data.streak = body.streak;
    data.xp = Math.max(data.xp, body.xp);
    mockDb.save();
    return noContent();
  }),

  // ---------- audio ----------
  // Returns per-word URLs so the real R2/CDN swap is exercised. The URLs point
  // back at this mock, which answers with a tiny silent clip; the client's audio
  // layer falls back to speech synthesis for actual sound (see lib/audio.ts).
  http.get(url("/audio/manifest"), async ({ request }) => {
    const failed = await simulateNetwork();
    if (failed) return failed;
    const variant = (new URL(request.url).searchParams.get("variant") ??
      "sephardic") as AudioManifestEntry["variant"];
    return json({
      entries: words.map<AudioManifestEntry>((w) => ({
        wordId: w.id,
        variant,
        url: url(`/audio/clip/${w.id}.${variant}.mp3`),
        synthetic: true,
        durationMs: null,
      })),
    });
  }),

  http.get(url("/audio/clip/:file"), async () => {
    // A valid, silent MP3 frame. Real enough that <audio> accepts it.
    const silent = Uint8Array.from([0xff, 0xfb, 0x90, 0x44, 0x00, 0x00, 0x00, 0x00]);
    return new HttpResponse(silent, {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=31536000" },
    });
  }),

  // ---------- gamification ----------
  http.get(url("/leagues/current"), async ({ request }) => {
    const failed = await simulateNetwork();
    if (failed) return failed;
    const id = authUserId(request);
    if (!id) return err(401, "unauthorized", "Sign in to continue.");

    const db = mockDb.raw;
    const me = mockDb.findUserById(id)!;
    const members = [
      ...db.cohort.map((c) => ({ ...c, isCurrentUser: false })),
      {
        userId: id,
        displayName: me.displayName,
        xpThisWeek: mockDb.userData(id).xp,
        isCurrentUser: true,
      },
    ].sort((a, b) => b.xpThisWeek - a.xpThisWeek);

    return json<LeagueResponse>({
      cohortId: "cohort-aleph",
      tier: "Aleph",
      endsAt: db.cohortEndsAt,
      members,
    });
  }),

  http.get(url("/gems"), async ({ request }) => {
    const id = authUserId(request);
    if (!id) return err(401, "unauthorized", "Sign in to continue.");
    const data = mockDb.userData(id);
    return json<GemLedgerResponse>({
      balance: gemBalance(id),
      transactions: [...data.gems].sort((a, b) => b.createdAt - a.createdAt),
    });
  }),

  http.post(url("/gems/spend"), async ({ request }) => {
    const failed = await simulateNetwork();
    if (failed) return failed;
    const id = authUserId(request);
    if (!id) return err(401, "unauthorized", "Sign in to continue.");
    const body = (await request.json()) as SpendGemsRequest;
    if (gemBalance(id) < body.amount)
      return err(402, "insufficient_gems", "Not enough gems for that.");
    const data = mockDb.userData(id);
    data.gems.push({
      id: crypto.randomUUID(),
      amount: -Math.abs(body.amount),
      reason: body.reason,
      createdAt: Date.now(),
    });
    mockDb.save();
    return json<GemLedgerResponse>({
      balance: gemBalance(id),
      transactions: [...data.gems].sort((a, b) => b.createdAt - a.createdAt),
    });
  }),

  // Freeze consumption is server-authoritative (spec §4 Phase 6) — the client
  // cannot mint freezes by editing local state.
  http.post(url("/streak/freeze"), async ({ request }) => {
    const failed = await simulateNetwork();
    if (failed) return failed;
    const id = authUserId(request);
    if (!id) return err(401, "unauthorized", "Sign in to continue.");
    const data = mockDb.userData(id);
    const COST = 50;
    if (gemBalance(id) < COST) return err(402, "insufficient_gems", "A streak freeze costs 50 gems.");
    data.gems.push({
      id: crypto.randomUUID(),
      amount: -COST,
      reason: "Streak freeze",
      createdAt: Date.now(),
    });
    data.streak.freezesAvailable += 1;
    mockDb.save();
    return json<GemLedgerResponse>({
      balance: gemBalance(id),
      transactions: [...data.gems].sort((a, b) => b.createdAt - a.createdAt),
    });
  }),

  // ---------- placement ----------
  http.get(url("/placement/test"), async () => {
    const failed = await simulateNetwork();
    if (failed) return failed;
    return json({ questions: buildPlacementQuestions() });
  }),

  http.post(url("/placement/submit"), async ({ request }) => {
    const failed = await simulateNetwork();
    if (failed) return failed;
    const id = authUserId(request);
    if (!id) return err(401, "unauthorized", "Sign in to continue.");

    const { answers } = (await request.json()) as SubmitPlacementRequest;
    const questions = buildPlacementQuestions();
    const byId = new Map(questions.map((q) => [q.id, q]));
    const correct = answers.filter((a) => byId.get(a.questionId)?.answer === a.answer).length;

    // Score bands map onto unit placement levels.
    const ratio = questions.length ? correct / questions.length : 0;
    const levelAssigned = ratio >= 0.9 ? 4 : ratio >= 0.7 ? 3 : ratio >= 0.5 ? 2 : ratio >= 0.3 ? 1 : 0;
    const unlockedUnitIds = units.filter((u) => u.placementLevel <= levelAssigned).map((u) => u.id);

    const user = mockDb.findUserById(id)!;
    user.placementLevel = levelAssigned;
    mockDb.save();

    return json<SubmitPlacementResponse>({
      levelAssigned,
      unlockedUnitIds,
      correct,
      total: questions.length,
    });
  }),

  // ---------- decks ----------
  http.get(url("/decks"), async ({ request }) => {
    const id = authUserId(request);
    if (!id) return err(401, "unauthorized", "Sign in to continue.");
    return json(mockDb.userData(id).decks);
  }),

  http.post(url("/decks"), async ({ request }) => {
    const failed = await simulateNetwork();
    if (failed) return failed;
    const id = authUserId(request);
    if (!id) return err(401, "unauthorized", "Sign in to continue.");
    const body = (await request.json()) as CreateDeckRequest;
    if (!body.name?.trim()) return err(400, "invalid_name", "Give the deck a name.");
    if (!body.wordIds?.length) return err(400, "empty_deck", "Pick at least one word.");
    const deck: Deck = {
      id: crypto.randomUUID(),
      name: body.name.trim(),
      wordIds: body.wordIds,
      createdAt: Date.now(),
    };
    mockDb.userData(id).decks.push(deck);
    mockDb.save();
    return json(deck, { status: 201 });
  }),

  http.delete(url("/decks/:id"), async ({ request, params }) => {
    const userId = authUserId(request);
    if (!userId) return err(401, "unauthorized", "Sign in to continue.");
    const data = mockDb.userData(userId);
    data.decks = data.decks.filter((d) => d.id !== params.id);
    mockDb.save();
    return noContent();
  }),

  // ---------- assessment ----------
  http.post(url("/assessments"), async ({ request }) => {
    const failed = await simulateNetwork();
    if (failed) return failed;
    const id = authUserId(request);
    if (!id) return err(401, "unauthorized", "Sign in to continue.");
    const body = (await request.json()) as SubmitAssessmentRequest;
    const minutes = body.elapsedMs / 60000;
    const result: AssessmentResult = {
      id: crypto.randomUUID(),
      kind: body.kind,
      passageId: body.passageId,
      wordsPerMinute: minutes > 0 ? Math.round(body.wordCount / minutes) : null,
      accuracy: body.total ? body.correct / body.total : 0,
      createdAt: Date.now(),
    };
    mockDb.userData(id).assessments.push(result);
    mockDb.save();
    return json(result, { status: 201 });
  }),

  http.get(url("/assessments"), async ({ request }) => {
    const id = authUserId(request);
    if (!id) return err(401, "unauthorized", "Sign in to continue.");
    return json(
      [...mockDb.userData(id).assessments].sort((a, b) => b.createdAt - a.createdAt),
    );
  }),

  // ---------- notifications ----------
  http.post(url("/notifications/subscribe"), async ({ request }) => {
    const id = authUserId(request);
    if (!id) return err(401, "unauthorized", "Sign in to continue.");
    const body = (await request.json()) as PushSubscriptionRequest;
    const data = mockDb.userData(id);
    if (!data.pushSubscriptions.some((s) => s.endpoint === body.endpoint)) {
      data.pushSubscriptions.push({ endpoint: body.endpoint, deviceId: body.deviceId });
    }
    mockDb.save();
    return noContent();
  }),

  http.patch(url("/notifications/prefs"), async ({ request }) => {
    const id = authUserId(request);
    if (!id) return err(401, "unauthorized", "Sign in to continue.");
    const body = (await request.json()) as NotificationPrefs;
    mockDb.userData(id).notificationPrefs = body;
    mockDb.save();
    return json(body);
  }),
];
