import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

/**
 * Every `var(--token)` in the app must resolve to a token global.css defines.
 *
 * An undefined custom property is invalid at computed-value time: the browser
 * silently drops the declaration and the element renders with no colour at all.
 * Nothing throws, nothing logs, and a screenshot of a mostly-correct screen
 * looks fine. This was nearly shipped when `--root` was renamed to `--morpheme`
 * and six inline styles in .tsx files kept pointing at the old name.
 */

const SRC = resolve(__dirname, "..");
const CSS = readFileSync(resolve(SRC, "styles/global.css"), "utf8");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.(tsx?|css)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [full] : [];
  });
}

/** Tokens set from JS at runtime rather than declared in the stylesheet. */
const RUNTIME_TOKENS = new Set(["--script-font", "--accent"]);

const defined = new Set([...CSS.matchAll(/^\s*(--[\w-]+)\s*:/gm)].map((m) => m[1]!));

/** Selectors of every rule whose body references `token` (or its -wash pair). */
function rulesUsing(token: string): string[] {
  return [...CSS.matchAll(/([^{}]+)\{([^}]*)\}/g)]
    .filter(([, , body]) => new RegExp(`var\\(${token}[)-]`).test(body!))
    .map(([, selector]) => selector!.trim().split("\n").pop()!.trim());
}

describe("design tokens", () => {
  const used = new Map<string, string[]>();
  for (const file of walk(SRC)) {
    for (const m of readFileSync(file, "utf8").matchAll(/var\(\s*(--[\w-]+)/g)) {
      const rel = file.slice(SRC.length + 1);
      used.set(m[1]!, [...(used.get(m[1]!) ?? []), rel]);
    }
  }

  it("finds tokens to check", () => {
    expect(used.size).toBeGreaterThan(10);
    expect(defined.size).toBeGreaterThan(10);
  });

  it("defines every token referenced anywhere in src", () => {
    const missing = [...used]
      .filter(([token]) => !defined.has(token) && !RUNTIME_TOKENS.has(token))
      .map(([token, files]) => `${token} — used in ${[...new Set(files)].join(", ")}`);
    expect(missing).toEqual([]);
  });

  /*
   * --morpheme once doubled as the error colour: it was .banner--error,
   * .choice--wrong and .btn--danger as well as the morpheme highlight, so a
   * correctly highlighted Greek ending was painted in the app's "you got it
   * wrong" red. --danger now carries that meaning. They share a value today and
   * must stay separable, so this pins --morpheme to its two legitimate uses.
   */
  it("reserves --morpheme for morphology alone", () => {
    expect(rulesUsing("--morpheme").sort()).toEqual([".script__letter--highlight", ".tag--family"]);
  });

  it("keeps --morpheme out of inline styles entirely", () => {
    const offenders = walk(SRC)
      .filter((f) => f.endsWith(".tsx"))
      .filter((f) => /var\(--morpheme/.test(readFileSync(f, "utf8")))
      .map((f) => f.slice(SRC.length + 1));
    expect(offenders).toEqual([]);
  });

  it("declares all three reds in every palette, so themes cannot drift", () => {
    // Each palette (light and dark) must declare all of them, or one theme
    // silently loses a colour and falls back to inherited text.
    const count = (t: string) => [...CSS.matchAll(new RegExp(`^\\s*${t}\\s*:`, "gm"))].length;
    const palettes = count("--morpheme");
    expect(palettes).toBeGreaterThanOrEqual(2);
    for (const t of ["--danger", "--attention", "--morpheme-wash", "--danger-wash", "--attention-wash"]) {
      expect(count(t), t).toBe(palettes);
    }
  });

  /*
   * Three reds with one value each. They are identical today, which is exactly
   * why they need pinning: nothing visual will complain if a due-count badge
   * drifts onto the error token, and the next person to change one red would
   * change all three.
   */
  it("keeps --danger to states that mean the learner got something wrong", () => {
    expect(rulesUsing("--danger").sort()).toEqual([
      ".banner--error",
      ".btn--danger",
      ".chip--wrong",
      ".choice--wrong",
    ]);
  });

  it("keeps --attention to states that mean work is waiting", () => {
    expect(rulesUsing("--attention").sort()).toEqual([".bottomnav__badge"]);
  });

  it("sets the runtime-only tokens from applyCourse", () => {
    const course = readFileSync(resolve(SRC, "content/course.ts"), "utf8");
    for (const t of RUNTIME_TOKENS) expect(course, t).toContain(`setProperty("${t}"`);
  });
});
