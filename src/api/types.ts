/**
 * API contract.
 *
 * This file is the seam between the frontend and whatever backend eventually
 * gets built. It is deliberately the ONLY description of the wire format:
 * the mock server implements these types, the client consumes them, and
 * swapping in a real API means making the real API satisfy this file — nothing
 * in the UI layer should need to change.
 *
 * When the backend lands, this file is the thing to move into a shared package
 * (spec §2, `packages/shared-types`).
 */
import type { Rating } from "@/srs/engine";

// ---------- Auth ----------

export interface ApiUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: string; // ISO
  timezone: string;
  pronunciationPref: PronunciationVariant;
  niqqudPref: "always" | "fading" | "off";
  placementLevel: number | null;
}

export type PronunciationVariant = "sephardic" | "ashkenazi" | "modern_israeli";

export interface AuthResponse {
  user: ApiUser;
  /** Short-lived. Sent as `Authorization: Bearer <token>`. */
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest extends LoginRequest {
  displayName: string;
  timezone: string;
}

export interface OAuthRequest {
  provider: "google" | "apple";
}

// ---------- Sync (spec §5.2) ----------
//
// SRS state is NEVER pushed as a mutable object. Clients push immutable review
// events; the server derives card state from the full event stream. This is
// what makes offline multi-device work without last-write-wins data loss.

export interface ReviewLogEntry {
  /** Client-generated UUID. Makes the push idempotent under retry. */
  id: string;
  /** Which course this review belongs to. Word ids are unique per course only. */
  courseId: string;
  wordId: string;
  rating: Rating;
  reviewedAt: number; // epoch ms
  /** Which device produced this, for debugging conflicts. */
  deviceId: string;
}

export interface PushReviewLogsRequest {
  entries: ReviewLogEntry[];
}

export interface PushReviewLogsResponse {
  /** Ids the server accepted (already-seen ids are reported here too). */
  acceptedIds: string[];
  /** Cursor to pass to the next GET /sync/state call. */
  cursor: string;
}

export interface SyncedCard {
  wordId: string;
  ease: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  state: "new" | "learning" | "review" | "lapsed";
  dueAt: number;
  lastReviewedAt: number | null;
  isLeech: boolean;
}

export interface SyncStateResponse {
  cards: SyncedCard[];
  progress: UnitProgress[];
  streak: StreakState;
  gems: number;
  xp: number;
  cursor: string;
  serverTime: number;
}

export interface UnitProgress {
  courseId: string;
  unitId: string;
  completedAt: number;
  score: number;
}

export interface StreakState {
  current: number;
  longest: number;
  freezesAvailable: number;
  lastActiveDate: string; // YYYY-MM-DD, local to the user
}

export interface PushProgressRequest {
  courseId: string;
  progress: UnitProgress[];
  /** Streak and XP are global across courses (decision D2). */
  streak: StreakState;
  xp: number;
}

// ---------- Audio (spec §4 Phase 5) ----------

export interface AudioManifestEntry {
  wordId: string;
  variant: PronunciationVariant;
  url: string;
  /** True when this is machine-generated and awaiting a real recording. */
  synthetic: boolean;
  durationMs: number | null;
}

export interface AudioManifestResponse {
  entries: AudioManifestEntry[];
}

// ---------- Gamification (spec §4 Phase 6) ----------

export interface LeagueMember {
  userId: string;
  displayName: string;
  xpThisWeek: number;
  isCurrentUser: boolean;
}

export interface LeagueResponse {
  cohortId: string;
  /** e.g. "Aleph" — small named cohorts, not one global leaderboard. */
  tier: string;
  endsAt: number;
  members: LeagueMember[];
}

export interface GemTransaction {
  id: string;
  amount: number; // signed
  reason: string;
  createdAt: number;
}

export interface GemLedgerResponse {
  balance: number;
  transactions: GemTransaction[];
}

export interface SpendGemsRequest {
  amount: number;
  reason: string;
}

// ---------- Placement & decks (spec §4 Phase 7) ----------

export interface PlacementQuestion {
  id: string;
  level: number;
  prompt: string;
  text: string;
  choices: string[];
  answer: string;
}

export interface PlacementTestResponse {
  questions: PlacementQuestion[];
}

export interface SubmitPlacementRequest {
  answers: { questionId: string; answer: string }[];
}

export interface SubmitPlacementResponse {
  levelAssigned: number;
  unlockedUnitIds: string[];
  correct: number;
  total: number;
}

export interface Deck {
  id: string;
  name: string;
  wordIds: string[];
  createdAt: number;
}

export interface CreateDeckRequest {
  name: string;
  wordIds: string[];
}

// ---------- Assessment (spec §4 Phase 8) ----------

export interface AssessmentResult {
  id: string;
  kind: "fluency" | "translation";
  passageId: string | null;
  wordsPerMinute: number | null;
  accuracy: number;
  createdAt: number;
}

export interface SubmitAssessmentRequest {
  kind: "fluency" | "translation";
  passageId: string | null;
  elapsedMs: number;
  wordCount: number;
  correct: number;
  total: number;
}

// ---------- Notifications (spec §4 Phase 3) ----------

export interface PushSubscriptionRequest {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  deviceId: string;
}

export interface NotificationPrefs {
  enabled: boolean;
  quietHoursStart: number; // 0-23 local
  quietHoursEnd: number;
  streakReminders: boolean;
}

// ---------- Errors ----------

export interface ApiErrorBody {
  error: string;
  message: string;
  details?: unknown;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: ApiErrorBody,
  ) {
    super(body.message);
    this.name = "ApiError";
  }
}

/** Thrown when the request never reached a server (offline, DNS, abort). */
export class NetworkError extends Error {
  constructor(message = "Network unavailable") {
    super(message);
    this.name = "NetworkError";
  }
}
