/**
 * Theme resolution.
 *
 * The user picks one of three preferences; CSS only ever sees two themes. This
 * module is the single place "system" is resolved into a concrete palette, so
 * the stylesheet stays free of `prefers-color-scheme` branches and there is one
 * obvious answer to "why is the app this colour right now".
 *
 * Dark is the default: it applies from `:root` in CSS, so it is already correct
 * before this module (or any JavaScript) runs.
 */

export type ThemePref = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";

export const DEFAULT_THEME: ThemePref = "dark";

/**
 * Mirrored into localStorage purely so the boot script in index.html can apply
 * the theme synchronously. Settings themselves live in IndexedDB, which is
 * async and would flash the wrong palette on every cold start.
 */
export const THEME_STORAGE_KEY = "shoresh.theme";

const CHROME_COLOR: Record<ResolvedTheme, string> = {
  dark: "#12172a",
  light: "#1b2a4a",
};

export function isThemePref(v: unknown): v is ThemePref {
  return v === "dark" || v === "light" || v === "system";
}

export function systemTheme(): ResolvedTheme {
  return typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function resolveTheme(pref: ThemePref): ResolvedTheme {
  return pref === "system" ? systemTheme() : pref;
}

export function getStoredThemePref(): ThemePref {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePref(raw) ? raw : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

/**
 * Apply a preference to the document. Safe to call repeatedly.
 *
 * `animate` is off during boot — transitioning from nothing to the initial
 * theme just looks like a flicker.
 */
export function applyTheme(pref: ThemePref, opts: { animate?: boolean } = {}): ResolvedTheme {
  const resolved = resolveTheme(pref);
  const root = document.documentElement;

  if (opts.animate && root.dataset.theme !== resolved) {
    root.classList.add("theme-transition");
    window.setTimeout(() => root.classList.remove("theme-transition"), 300);
  }

  root.dataset.theme = resolved;

  // Keep the browser/OS chrome in step with the app, or the status bar on
  // mobile ends up a different colour from the header directly beneath it.
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", CHROME_COLOR[resolved]);

  try {
    localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    // Private mode: the theme still applies for this session.
  }

  return resolved;
}

/**
 * Follow the OS while the preference is "system". Returns an unsubscribe fn.
 */
export function watchSystemTheme(onChange: (t: ResolvedTheme) => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia("(prefers-color-scheme: light)");
  const handler = () => onChange(systemTheme());
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}

export const THEME_LABELS: Record<ThemePref, string> = {
  dark: "Dark",
  light: "Light",
  system: "System",
};
