import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Regression guard for the verse word-order bug.
 *
 * `.passage` once carried BOTH `direction: rtl` and `flex-direction: row-reverse`.
 * Under `dir="rtl"` a flex row already runs right-to-left, so reversing it a
 * second time cancelled out and rendered Genesis 1:1 left-to-right — the verse
 * read backwards, and it survived a screenshot review because RTL text is hard
 * to eyeball.
 *
 * Word order must come from the `dir` attribute alone, which the course supplies
 * (content/course.ts → textProps). That is also what lets the same component
 * render Hebrew RTL and Greek LTR.
 *
 * jsdom does no layout, so this asserts against the stylesheet source. It is a
 * blunt test, but it targets exactly the mistake that was made twice.
 */
// Vitest transforms this module, so `import.meta.url` is not a file: URL here.
const css = readFileSync(resolve(process.cwd(), "src/styles/global.css"), "utf8");

/** The body of a single CSS rule, comments stripped. */
function ruleBody(selector: string): string {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const re = new RegExp(`(^|\\})\\s*${selector.replace(".", "\\.")}\\s*\\{([^}]*)\\}`, "m");
  const m = withoutComments.match(re);
  if (!m) throw new Error(`No CSS rule found for "${selector}"`);
  return m[2]!;
}

describe(".passage layout", () => {
  const body = ruleBody(".passage");

  it("does not hardcode a direction — that comes from the course", () => {
    expect(body).not.toMatch(/[^-]direction\s*:/);
  });

  it("does not reverse the flex row (it would double-reverse under dir=rtl)", () => {
    expect(body).not.toMatch(/flex-direction\s*:\s*row-reverse/);
    expect(body).not.toMatch(/flex-direction\s*:\s*column-reverse/);
  });

  it("still lays tokens out as a wrapping row", () => {
    expect(body).toMatch(/display\s*:\s*flex/);
    expect(body).toMatch(/flex-wrap\s*:\s*wrap/);
  });
});

describe(".script text rendering", () => {
  const body = ruleBody(".script");

  it("isolates bidi rather than overriding it", () => {
    // `bidi-override` forces visual order and corrupts mixed-direction content,
    // such as a Hebrew word beside an English gloss.
    expect(body).toMatch(/unicode-bidi\s*:\s*isolate/);
    expect(body).not.toMatch(/bidi-override/);
  });

  it("does not hardcode a direction — Greek and Latin read left to right", () => {
    // An author rule here would beat the `dir` attribute ScriptWord sets from
    // the course, silently forcing Greek into RTL.
    expect(body).not.toMatch(/[^-]direction\s*:/);
  });

  it("takes its font from the course rather than hardcoding the Hebrew face", () => {
    expect(body).toMatch(/--script-font/);
  });
});

/*
 * .tag--family renders family ids — Hebrew roots, Greek stems — so it needs the
 * same two guarantees as .script. It had neither: it pinned the Hebrew face,
 * which has no Greek glyphs, and forced direction: rtl. Verified in the running
 * app on the Attic course before this was fixed.
 */
describe(".tag--family renders whatever script the course uses", () => {
  const body = ruleBody(".tag--family");

  it("takes its font from the course", () => {
    expect(body).toMatch(/--script-font/);
    expect(body).not.toMatch(/Frank Ruhl/);
  });

  it("does not hardcode a direction", () => {
    expect(body).not.toMatch(/[^-]direction\s*:/);
  });
});
