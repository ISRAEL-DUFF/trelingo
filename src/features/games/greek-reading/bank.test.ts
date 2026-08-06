import { describe, it, expect } from "vitest";
import { DRILLS, ROUND_LENGTH, SHAPES, SLOT, drillById, questionsOf } from "./bank";
import { GAMES, gameById, gamesByLanguage } from "../registry";

/**
 * The bank is hand-authored, so every answer here is an index somebody typed.
 * An index one off points at a real token and looks completely fine on screen —
 * it just marks the wrong word right. These are the checks that catch that.
 */

describe("every drill", () => {
  it.each(DRILLS.map((d) => [d.name, d] as const))("%s: has enough items for a full round", (_n, d) => {
    expect(questionsOf(d).length).toBeGreaterThanOrEqual(ROUND_LENGTH);
  });

  it.each(DRILLS.map((d) => [d.name, d] as const))("%s: has a sane fluency window", (_n, d) => {
    // Under two seconds is not a window, it is a reflex test; over eight and
    // "read at speed" stops meaning anything.
    expect(d.window).toBeGreaterThanOrEqual(2000);
    expect(d.window).toBeLessThanOrEqual(8000);
  });

  it.each(DRILLS.map((d) => [d.name, d] as const))("%s: every item carries a feature tag", (_n, d) => {
    for (const item of d.items) {
      const prompts = "prompts" in item ? item.prompts : undefined;
      if (prompts?.length) {
        for (const p of prompts) expect(p.tag, JSON.stringify(item.tokens)).toBeTruthy();
      } else {
        expect("tag" in item && item.tag, JSON.stringify(item.tokens)).toBeTruthy();
      }
    }
  });

  it("ids are unique", () => {
    expect(new Set(DRILLS.map((d) => d.id)).size).toBe(DRILLS.length);
  });
});

describe("choice drills", () => {
  const choice = DRILLS.filter((d) => d.type === "choice");

  it("point their slot at the blank, and only one blank exists", () => {
    for (const d of choice) {
      for (const item of d.items as { tokens: string[]; slot: number }[]) {
        const blanks = item.tokens.filter((t) => t === SLOT).length;
        expect(blanks, item.tokens.join(" ")).toBe(1);
        expect(item.tokens[item.slot], item.tokens.join(" ")).toBe(SLOT);
      }
    }
  });

  it("have an answer inside the options, and no duplicate options", () => {
    for (const d of choice) {
      for (const item of d.items as { opts: string[]; a: number; tokens: string[] }[]) {
        expect(item.a, item.tokens.join(" ")).toBeGreaterThanOrEqual(0);
        expect(item.a, item.tokens.join(" ")).toBeLessThan(item.opts.length);
        expect(new Set(item.opts).size, item.tokens.join(" ")).toBe(item.opts.length);
      }
    }
  });

  it("keep options to four, because the keyboard only binds 1–4", () => {
    for (const d of choice) {
      for (const item of d.items as { opts: string[] }[]) {
        expect(item.opts.length).toBeLessThanOrEqual(4);
      }
    }
  });

  it("explain every answer", () => {
    for (const d of choice) {
      for (const item of d.items as { why: string; tokens: string[] }[]) {
        expect(item.why, item.tokens.join(" ")).toBeTruthy();
      }
    }
  });
});

describe("token drills", () => {
  const token = DRILLS.filter((d) => d.type === "token");

  it("point every answer at a token that exists", () => {
    for (const d of token) {
      for (const item of d.items as { tokens: string[]; a?: number[]; prompts?: { a: number[]; ask: string }[] }[]) {
        const answers = item.prompts ? item.prompts.map((p) => p.a) : [item.a ?? []];
        for (const set of answers) {
          expect(set.length, item.tokens.join(" ")).toBeGreaterThan(0);
          for (const i of set) {
            expect(i, `${item.tokens.join(" ")} → index ${i}`).toBeGreaterThanOrEqual(0);
            expect(i, `${item.tokens.join(" ")} → index ${i}`).toBeLessThan(item.tokens.length);
          }
        }
      }
    }
  });

  it("never mark the same token as two different roles in one sentence", () => {
    for (const d of token) {
      for (const item of d.items as { tokens: string[]; prompts?: { a: number[] }[] }[]) {
        if (!item.prompts) continue;
        const seen = new Set<number>();
        for (const p of item.prompts) {
          for (const i of p.a) {
            expect(seen.has(i), `${item.tokens.join(" ")} — token ${i} answers two prompts`).toBe(false);
            seen.add(i);
          }
        }
      }
    }
  });

  it("mark contiguous spans, so a phrase is tapped as a phrase", () => {
    for (const d of token) {
      for (const item of d.items as { tokens: string[]; a?: number[]; prompts?: { a: number[] }[] }[]) {
        const answers = item.prompts ? item.prompts.map((p) => p.a) : [item.a ?? []];
        for (const set of answers) {
          const sorted = [...set].sort((x, y) => x - y);
          for (let k = 1; k < sorted.length; k++) {
            expect(sorted[k]! - sorted[k - 1]!, item.tokens.join(" ")).toBe(1);
          }
        }
      }
    }
  });

  it("never put a blank in a tappable sentence", () => {
    for (const d of token) {
      for (const item of d.items) {
        expect(item.tokens).not.toContain(SLOT);
      }
    }
  });
});

describe("aspect drill", () => {
  const aspect = drillById("aspect")!;

  it("marks a verb that exists and answers with a known shape", () => {
    const keys = new Set(SHAPES.map((s) => s.key));
    for (const item of aspect.items as { tokens: string[]; mark: number; a: string }[]) {
      expect(item.mark).toBeGreaterThanOrEqual(0);
      expect(item.mark).toBeLessThan(item.tokens.length);
      expect(keys.has(item.a as never), `${item.tokens.join(" ")} → ${item.a}`).toBe(true);
    }
  });

  it("teaches all three shapes, not just the easy two", () => {
    const used = new Set((aspect.items as { a: string }[]).map((i) => i.a));
    expect(used.size).toBe(SHAPES.length);
  });

  it("keeps the minimal pair that makes the point", () => {
    // ἔβαλλεν / ἔβαλεν differ by one λ and by aspect. If either is edited away,
    // the drill loses its sharpest item.
    const forms = (aspect.items as { tokens: string[]; a: string }[]).map((i) => [i.tokens[0], i.a]);
    expect(forms).toContainEqual(["ἔβαλλεν", "ongoing"]);
    expect(forms).toContainEqual(["ἔβαλεν", "bounded"]);
  });
});

describe("questionsOf", () => {
  it("counts a prompt per ask, not a question per sentence", () => {
    const roles = drillById("roles")!;
    const asks = roles.items.reduce((n, i) => n + (("prompts" in i && i.prompts?.length) || 1), 0);
    expect(questionsOf(roles).length).toBe(asks);
    // Eight sentences carrying more than eight questions is the whole reason
    // the drill can fill a ten-question round.
    expect(questionsOf(roles).length).toBeGreaterThan(roles.items.length);
  });
});

describe("registry", () => {
  it("has unique ids and resolvable paths", () => {
    expect(new Set(GAMES.map((g) => g.id)).size).toBe(GAMES.length);
    for (const g of GAMES) {
      expect(g.path).toBe(`/games/${g.id}`);
      expect(gameById(g.id)).toBe(g);
    }
  });

  it("reports the drill count the game actually has", () => {
    const drills = gameById("greek-reading-drills")!;
    expect(drills.count).toBe(DRILLS.length);
    expect(drills.countUnit).toBe("drill");
  });

  it("groups by language, in app order, dropping empty languages", () => {
    const groups = gamesByLanguage();
    expect(groups.map((g) => g.language)).toEqual(["hebrew", "greek"]);
    expect(groups.every((g) => g.games.length > 0)).toBe(true);
  });
});
