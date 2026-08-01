/**
 * The API client — the single place the app talks to a server.
 *
 * Everything goes through real `fetch` against real URLs. In this phase those
 * URLs are answered by MSW's service worker (see src/mocks), which means the
 * request/response cycle, headers, status codes, retries and token refresh are
 * all genuinely exercised. Pointing at a real backend is a matter of changing
 * VITE_API_BASE_URL and deleting the mock registration in main.tsx — no call
 * site changes.
 */
import {
  ApiError,
  NetworkError,
  type ApiErrorBody,
  type AudioManifestResponse,
  type AuthResponse,
  type CreateDeckRequest,
  type Deck,
  type GemLedgerResponse,
  type LeagueResponse,
  type LoginRequest,
  type NotificationPrefs,
  type OAuthRequest,
  type PlacementTestResponse,
  type PronunciationVariant,
  type PushProgressRequest,
  type PushReviewLogsRequest,
  type PushReviewLogsResponse,
  type PushSubscriptionRequest,
  type SignupRequest,
  type SpendGemsRequest,
  type SubmitAssessmentRequest,
  type SubmitPlacementRequest,
  type SubmitPlacementResponse,
  type SyncStateResponse,
  type ApiUser,
  type AssessmentResult,
} from "./types";

export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

const ACCESS_TOKEN_KEY = "shoresh.accessToken";
const REFRESH_TOKEN_KEY = "shoresh.refreshToken";

export const tokenStore = {
  get access() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  get refresh() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  set(access: string, refresh: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /** Skip the Authorization header (login/signup). */
  anonymous?: boolean;
  signal?: AbortSignal;
  /** Internal: prevents infinite refresh recursion. */
  _isRetry?: boolean;
}

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Refresh the access token. Concurrent 401s share one refresh rather than
 * stampeding the endpoint — a real problem the moment sync and a UI fetch race.
 */
async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  const refresh = tokenStore.refresh;
  if (!refresh) return false;

  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refresh }),
      });
      if (!res.ok) {
        tokenStore.clear();
        return false;
      }
      const data = (await res.json()) as AuthResponse;
      tokenStore.set(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, anonymous = false, signal, _isRetry = false } = opts;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (!anonymous && tokenStore.access) headers["Authorization"] = `Bearer ${tokenStore.access}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (e) {
    // Offline is a normal state for this app, not an exception. Callers catch
    // NetworkError and fall back to local data rather than showing an error.
    if ((e as Error)?.name === "AbortError") throw e;
    throw new NetworkError();
  }

  if (res.status === 401 && !anonymous && !_isRetry) {
    if (await refreshAccessToken()) {
      return request<T>(path, { ...opts, _isRetry: true });
    }
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const payload = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    throw new ApiError(
      res.status,
      (payload as ApiErrorBody) ?? { error: "unknown", message: res.statusText },
    );
  }

  return payload as T;
}

export const api = {
  // --- auth ---
  signup: (body: SignupRequest) =>
    request<AuthResponse>("/auth/signup", { method: "POST", body, anonymous: true }),
  login: (body: LoginRequest) =>
    request<AuthResponse>("/auth/login", { method: "POST", body, anonymous: true }),
  oauth: (body: OAuthRequest) =>
    request<AuthResponse>("/auth/oauth", { method: "POST", body, anonymous: true }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  me: () => request<ApiUser>("/me"),
  updateMe: (body: Partial<Pick<ApiUser, "displayName" | "niqqudPref" | "pronunciationPref">>) =>
    request<ApiUser>("/me", { method: "PATCH", body }),
  exportData: () => request<unknown>("/me/export"),
  deleteAccount: () => request<void>("/me", { method: "DELETE" }),

  // --- sync ---
  pushReviewLogs: (body: PushReviewLogsRequest) =>
    request<PushReviewLogsResponse>("/sync/review-logs", { method: "POST", body }),
  getSyncState: (since?: string) =>
    request<SyncStateResponse>(`/sync/state${since ? `?since=${encodeURIComponent(since)}` : ""}`),
  pushProgress: (body: PushProgressRequest) =>
    request<void>("/sync/progress", { method: "POST", body }),

  // --- audio ---
  getAudioManifest: (variant: PronunciationVariant) =>
    request<AudioManifestResponse>(`/audio/manifest?variant=${variant}`),

  // --- gamification ---
  getLeague: () => request<LeagueResponse>("/leagues/current"),
  getGems: () => request<GemLedgerResponse>("/gems"),
  spendGems: (body: SpendGemsRequest) =>
    request<GemLedgerResponse>("/gems/spend", { method: "POST", body }),
  useStreakFreeze: () => request<GemLedgerResponse>("/streak/freeze", { method: "POST" }),

  // --- placement & decks ---
  getPlacementTest: () => request<PlacementTestResponse>("/placement/test"),
  submitPlacement: (body: SubmitPlacementRequest) =>
    request<SubmitPlacementResponse>("/placement/submit", { method: "POST", body }),
  listDecks: () => request<Deck[]>("/decks"),
  createDeck: (body: CreateDeckRequest) => request<Deck>("/decks", { method: "POST", body }),
  deleteDeck: (id: string) => request<void>(`/decks/${id}`, { method: "DELETE" }),

  // --- assessment ---
  submitAssessment: (body: SubmitAssessmentRequest) =>
    request<AssessmentResult>("/assessments", { method: "POST", body }),
  listAssessments: () => request<AssessmentResult[]>("/assessments"),

  // --- notifications ---
  subscribePush: (body: PushSubscriptionRequest) =>
    request<void>("/notifications/subscribe", { method: "POST", body }),
  updateNotificationPrefs: (body: NotificationPrefs) =>
    request<NotificationPrefs>("/notifications/prefs", { method: "PATCH", body }),
};

export type Api = typeof api;
