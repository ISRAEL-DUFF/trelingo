/**
 * The mock server's database.
 *
 * This is deliberately NOT the app's Dexie store — it stands in for Postgres and
 * lives on the other side of the network boundary. Keeping them separate is what
 * makes the sync flow testable: you can wipe local data and watch it come back
 * from "the server", or review on one "device" and pull it down on another.
 *
 * Persisted to localStorage so a page reload doesn't feel like a server reboot.
 */
import type {
  AssessmentResult,
  Deck,
  GemTransaction,
  NotificationPrefs,
  PronunciationVariant,
  ReviewLogEntry,
  StreakState,
  UnitProgress,
} from "@/api/types";

export interface MockUser {
  id: string;
  email: string;
  password: string;
  displayName: string;
  createdAt: string;
  timezone: string;
  pronunciationPref: PronunciationVariant;
  niqqudPref: "always" | "fading" | "off";
  placementLevel: number | null;
}

export interface MockUserData {
  reviewLogs: ReviewLogEntry[];
  progress: UnitProgress[];
  streak: StreakState;
  xp: number;
  gems: GemTransaction[];
  decks: Deck[];
  assessments: AssessmentResult[];
  pushSubscriptions: { endpoint: string; deviceId: string }[];
  notificationPrefs: NotificationPrefs;
}

export interface MockDb {
  users: MockUser[];
  /** accessToken -> userId */
  sessions: Record<string, string>;
  /** refreshToken -> userId */
  refreshTokens: Record<string, string>;
  data: Record<string, MockUserData>;
  cohort: { userId: string; displayName: string; xpThisWeek: number }[];
  cohortEndsAt: number;
}

const STORAGE_KEY = "shoresh.mockdb.v1";

export function emptyUserData(): MockUserData {
  return {
    reviewLogs: [],
    progress: [],
    streak: { current: 0, longest: 0, freezesAvailable: 2, lastActiveDate: "" },
    xp: 0,
    gems: [],
    decks: [],
    assessments: [],
    pushSubscriptions: [],
    notificationPrefs: {
      enabled: false,
      quietHoursStart: 22,
      quietHoursEnd: 8,
      streakReminders: true,
    },
  };
}

/** Names for the fake league cohort. Deliberately mundane and non-competitive. */
const COHORT_NAMES = [
  "Aviva", "Noam", "Tal", "Yonatan", "Shira", "Eitan", "Maya", "Ori",
  "Dafna", "Boaz", "Liora", "Amit", "Rina", "Gilad", "Tamar", "Ezra",
  "Hodaya", "Nadav", "Yael", "Asher",
];

function seedCohort() {
  // Deterministic so the standings don't reshuffle on every reload.
  let seed = 1337;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  return COHORT_NAMES.map((displayName, i) => ({
    userId: `cohort-${i}`,
    displayName,
    xpThisWeek: Math.floor(rand() * 900) + 40,
  }));
}

function nextSunday(): number {
  const d = new Date();
  d.setHours(23, 59, 59, 0);
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
  return d.getTime();
}

function freshDb(): MockDb {
  return {
    users: [],
    sessions: {},
    refreshTokens: {},
    data: {},
    cohort: seedCohort(),
    cohortEndsAt: nextSunday(),
  };
}

let db: MockDb = load();

function load(): MockDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...freshDb(), ...(JSON.parse(raw) as MockDb) };
  } catch {
    // Corrupt mock state should never wedge the app — start clean.
  }
  return freshDb();
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Quota exceeded: the mock server "forgets". Acceptable for a mock.
  }
}

export const mockDb = {
  get raw(): MockDb {
    return db;
  },
  save: persist,
  reset() {
    db = freshDb();
    persist();
  },

  findUserByEmail(email: string) {
    return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },
  findUserById(id: string) {
    return db.users.find((u) => u.id === id);
  },
  addUser(user: MockUser) {
    db.users.push(user);
    db.data[user.id] = emptyUserData();
    persist();
  },
  userData(userId: string): MockUserData {
    db.data[userId] ??= emptyUserData();
    return db.data[userId]!;
  },

  createSession(userId: string) {
    const accessToken = `mock-access-${crypto.randomUUID()}`;
    const refreshToken = `mock-refresh-${crypto.randomUUID()}`;
    db.sessions[accessToken] = userId;
    db.refreshTokens[refreshToken] = userId;
    persist();
    return { accessToken, refreshToken };
  },
  userIdForToken(token: string | null): string | null {
    if (!token) return null;
    return db.sessions[token] ?? null;
  },
  userIdForRefresh(token: string): string | null {
    return db.refreshTokens[token] ?? null;
  },
  revokeSession(token: string) {
    delete db.sessions[token];
    persist();
  },
};
