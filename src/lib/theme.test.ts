import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  applyTheme,
  getStoredThemePref,
  isThemePref,
  resolveTheme,
  systemTheme,
  watchSystemTheme,
} from "./theme";

/** jsdom's matchMedia is a stub, so drive it explicitly. */
function mockSystem(prefersLight: boolean) {
  const listeners = new Set<() => void>();
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("light") ? prefersLight : !prefersLight,
      media: query,
      addEventListener: (_: string, l: () => void) => listeners.add(l),
      removeEventListener: (_: string, l: () => void) => listeners.delete(l),
    })),
  );
  return { fire: () => listeners.forEach((l) => l()), listenerCount: () => listeners.size };
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  document.head.innerHTML = '<meta name="theme-color" content="#000000" />';
  vi.unstubAllGlobals();
});

describe("default", () => {
  it("is dark", () => {
    expect(DEFAULT_THEME).toBe("dark");
  });

  it("falls back to dark when nothing is stored", () => {
    expect(getStoredThemePref()).toBe("dark");
  });

  it("falls back to dark on a corrupt stored value", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "chartreuse");
    expect(getStoredThemePref()).toBe("dark");
  });
});

describe("isThemePref", () => {
  it("accepts only the three known values", () => {
    expect(["dark", "light", "system"].every(isThemePref)).toBe(true);
    for (const bad of ["", "Dark", null, undefined, 0, {}]) expect(isThemePref(bad)).toBe(false);
  });
});

describe("resolveTheme", () => {
  it("passes explicit choices through untouched", () => {
    mockSystem(true); // OS says light…
    expect(resolveTheme("dark")).toBe("dark"); // …but the user said dark.
    expect(resolveTheme("light")).toBe("light");
  });

  it("follows the OS only for 'system'", () => {
    mockSystem(true);
    expect(resolveTheme("system")).toBe("light");
    mockSystem(false);
    expect(resolveTheme("system")).toBe("dark");
  });

  it("defaults to dark when the OS expresses no preference", () => {
    vi.stubGlobal("matchMedia", undefined);
    expect(systemTheme()).toBe("dark");
  });
});

describe("applyTheme", () => {
  it("sets data-theme to a resolved value, never to 'system'", () => {
    mockSystem(true);
    applyTheme("system");
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("persists the preference, not the resolved value", () => {
    mockSystem(false);
    applyTheme("system");
    // Storing "dark" here would silently pin the user off the OS.
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("system");
  });

  it("keeps the browser chrome colour in step", () => {
    const meta = () => document.querySelector('meta[name="theme-color"]')!.getAttribute("content");
    applyTheme("light");
    expect(meta()).toBe("#1b2a4a");
    applyTheme("dark");
    expect(meta()).toBe("#12172a");
  });

  it("returns the resolved theme", () => {
    expect(applyTheme("light")).toBe("light");
  });

  it("is idempotent", () => {
    applyTheme("light");
    applyTheme("light");
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("only animates an actual change", () => {
    applyTheme("dark");
    document.documentElement.classList.remove("theme-transition");
    applyTheme("dark", { animate: true }); // same theme — no transition class
    expect(document.documentElement.classList.contains("theme-transition")).toBe(false);
    applyTheme("light", { animate: true });
    expect(document.documentElement.classList.contains("theme-transition")).toBe(true);
  });

  it("still applies the theme when storage is unavailable", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceeded");
    });
    expect(() => applyTheme("light")).not.toThrow();
    expect(document.documentElement.dataset.theme).toBe("light");
    spy.mockRestore();
  });
});

describe("watchSystemTheme", () => {
  it("reports OS changes and unsubscribes cleanly", () => {
    const sys = mockSystem(false);
    const seen: string[] = [];
    const stop = watchSystemTheme((t) => seen.push(t));
    expect(sys.listenerCount()).toBe(1);
    sys.fire();
    expect(seen).toEqual(["dark"]);
    stop();
    expect(sys.listenerCount()).toBe(0);
  });

  it("is a no-op where matchMedia is unavailable", () => {
    vi.stubGlobal("matchMedia", undefined);
    expect(() => watchSystemTheme(() => {})()).not.toThrow();
  });
});
