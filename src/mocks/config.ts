/**
 * Runtime knobs for the mock server, driven by the in-app dev panel.
 *
 * The point of these is to make the *unhappy* paths reachable by hand. A mock
 * that always answers instantly and always succeeds hides exactly the bugs that
 * matter when a real backend arrives: spinners that never appear, retries that
 * never fire, and offline states nobody ever saw.
 */
export interface MockConfig {
  /** Artificial round-trip delay, ms. */
  latencyMs: number;
  /** Probability (0–1) that a mutating request returns 503. */
  failureRate: number;
  /** Hard offline: requests reject as if there were no network. */
  offline: boolean;
}

const STORAGE_KEY = "shoresh.mockconfig.v1";

const DEFAULTS: MockConfig = { latencyMs: 250, failureRate: 0, offline: false };

let current: MockConfig = (() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as MockConfig) };
  } catch {
    /* fall through to defaults */
  }
  return { ...DEFAULTS };
})();

type Listener = (c: MockConfig) => void;
const listeners = new Set<Listener>();

export const mockConfig = {
  get: () => current,
  set(patch: Partial<MockConfig>) {
    current = { ...current, ...patch };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
      /* non-fatal */
    }
    listeners.forEach((l) => l(current));
  },
  reset() {
    mockConfig.set(DEFAULTS);
  },
  subscribe(l: Listener) {
    listeners.add(l);
    // Returns void, not Set.delete's boolean — React effect cleanups must be void.
    return () => {
      listeners.delete(l);
    };
  },
};
