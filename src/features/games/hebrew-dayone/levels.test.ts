import { describe, it, expect } from "vitest";
import {
  GRADED_QUESTIONS,
  LEVELS,
  LEVEL_SOURCES,
  LIGHT_PER_QUESTION,
  TOTAL_QUESTIONS,
} from "./levels";
import { passageOf, stripCantillation } from "../corpus";
import { gameById } from "../registry";
import { contentFor } from "@/content";

/**
 * Same discipline as the Greek bank: every `pick` is an index somebody typed,
 * and an index one off selects a real word and looks entirely plausible on
 * screen. It just marks the wrong one right.
 */

describe("every level", () => {
  it.each(LEVELS.map((l) => [l.ref, l] as const))("%s: has a verse, a teach card and drills", (_r, l) => {
    expect(l.verse.length).toBeGreaterThan(0);
    expect(l.title).toBeTruthy();
    expect(l.teach.he).toBeTruthy();
    expect(l.teach.en).toBeTruthy();
    expect(l.teach.line).toBeTruthy();
    expect(l.drills.length).toBeGreaterThan(0);
  });

  it.each(LEVELS.map((l) => [l.ref, l] as const))("%s: every word has a gloss", (_r, l) => {
    for (const [he, gloss] of l.verse) {
      expect(he.trim(), l.ref).toBeTruthy();
      expect(gloss.trim(), he).toBeTruthy();
    }
  });

  it.each(LEVELS.map((l) => [l.ref, l] as const))("%s: ends by rebuilding the verse", (_r, l) => {
    // The order drill is the payoff for the level and must come last, because
    // it is the only one that asks for the whole verse at once.
    expect(l.drills[l.drills.length - 1]!.t).toBe("order");
    expect(l.drills.filter((d) => d.t === "order")).toHaveLength(1);
  });

  it("covers Genesis 1:1–5 in order", () => {
    expect(LEVELS.map((l) => l.ref)).toEqual([
      "Genesis 1:1",
      "Genesis 1:2",
      "Genesis 1:3",
      "Genesis 1:4",
      "Genesis 1:5",
    ]);
  });
});

describe("choice drills", () => {
  const choices = LEVELS.flatMap((l) =>
    l.drills.filter((d) => d.t === "meaning" || d.t === "reverse" || d.t === "who" || d.t === "when"),
  ) as Extract<(typeof LEVELS)[number]["drills"][number], { ans: string; opts: string[] }>[];

  it("always include the answer among the options", () => {
    for (const d of choices) expect(d.opts, JSON.stringify(d)).toContain(d.ans);
  });

  it("never repeat an option", () => {
    for (const d of choices) {
      expect(new Set(d.opts).size, JSON.stringify(d)).toBe(d.opts.length);
    }
  });

  it("offer at least two ways to be wrong", () => {
    for (const d of choices) expect(d.opts.length, JSON.stringify(d)).toBeGreaterThanOrEqual(2);
  });

  it("explain the ones that teach a rule", () => {
    // meaning/reverse are recall and need no gloss; who/when exist to teach
    // something and are worthless without the line that says what.
    for (const l of LEVELS) {
      for (const d of l.drills) {
        if (d.t === "who" || d.t === "when") expect(d.why, `${l.ref} ${d.he}`).toBeTruthy();
      }
    }
  });

  it("never name a tense or a paradigm — the game's whole stance", () => {
    const banned = /\b(perfect|imperfect|qal|niphal|piel|hiphil|binyan|participle|jussive|waw-consecutive|3ms|3fs)\b/i;
    for (const l of LEVELS) {
      for (const d of l.drills) {
        const text = JSON.stringify(d);
        expect(banned.test(text), `${l.ref}: ${text.slice(0, 80)}`).toBe(false);
      }
      expect(banned.test(l.teach.line), l.ref).toBe(false);
    }
  });
});

describe("tapAll drills", () => {
  it("point at words the verse actually has", () => {
    for (const l of LEVELS) {
      for (const d of l.drills) {
        if (d.t !== "tapAll") continue;
        expect(d.pick.length, `${l.ref}: ${d.prompt}`).toBeGreaterThan(0);
        for (const i of d.pick) {
          expect(i, `${l.ref}: ${d.prompt} → index ${i}`).toBeGreaterThanOrEqual(0);
          expect(i, `${l.ref}: ${d.prompt} → index ${i}`).toBeLessThan(l.verse.length);
        }
        expect(new Set(d.pick).size, `${l.ref}: ${d.prompt} repeats an index`).toBe(d.pick.length);
      }
    }
  });

  it("select the words the prompt actually describes", () => {
    // Spot-checks against the glosses, so a re-ordered verse cannot silently
    // shift what gets marked correct.
    const gloss = (ref: string, i: number) =>
      LEVELS.find((l) => l.ref === ref)!.verse[i]![1];

    expect(gloss("Genesis 1:1", 4)).toBe("the heavens");
    expect(gloss("Genesis 1:1", 6)).toBe("the earth");
    expect(gloss("Genesis 1:2", 0)).toBe("and the earth");
    expect(gloss("Genesis 1:2", 13)).toBe("the waters");
    expect(gloss("Genesis 1:4", 9)).toBe("the light");
    expect(gloss("Genesis 1:4", 11)).toBe("the darkness");
    expect(gloss("Genesis 1:5", 7)).toBe("and there was");
    expect(gloss("Genesis 1:5", 9)).toBe("and there was");
  });

  it("always explain themselves", () => {
    for (const l of LEVELS) {
      for (const d of l.drills) {
        if (d.t === "tapAll") expect(d.why, `${l.ref}: ${d.prompt}`).toBeTruthy();
      }
    }
  });
});

describe("the corpus is the source of the text", () => {
  it("takes every word from the Genesis track, cantillation aside", () => {
    // The whole point of Phase C. If these diverge, the game has started
    // carrying its own copy of Genesis 1 again.
    for (const source of LEVEL_SOURCES) {
      const passage = passageOf(source);
      const level = LEVELS.find((l) => l.ref === passage.reference)!;
      expect(level.verse.map((w) => w[0])).toEqual(
        passage.tokens.map((t) => stripCantillation(t.text)),
      );
    }
  });

  it("keeps the vowel points and both ש dots when it drops the chant marks", () => {
    /*
     * The one way this could go badly wrong. U+05C1 and U+05C2 are letter
     * identity — strip them and שׂ merges with שׁ, a bug already fixed twice in
     * this codebase. The escapes are explicit because the marks are invisible.
     */
    const heavens = LEVELS[0]!.verse[4]![0]; // הַשָּׁמַיִם
    expect(heavens).toContain("\u05C1"); // shin dot survived
    expect(heavens).toContain("\u05B7"); // patach survived
    expect(heavens).not.toContain("\u05BD"); // meteg gone
    // And nothing anywhere kept a te'am.
    for (const l of LEVELS) {
      for (const [text] of l.verse) {
        expect(/[\u0591-\u05AF\u05BD]/.test(text), text).toBe(false);
      }
    }
  });

  it("overrides the citation glosses, which is most of them", () => {
    // Measured: 42 of 52. Bundle glosses are what a dictionary says, not what
    // the word is doing here — וַיֹּאמֶר arrives as "to say".
    const raw = contentFor("genesis").passages.find((p) => p.id === "gen-1-3")!;
    expect(raw.tokens[0]!.gloss).toBe("to say");
    expect(LEVELS[2]!.verse[0]![1]).toBe("and he said");

    const overridden = LEVEL_SOURCES.reduce((n, s) => n + Object.keys(s.gloss ?? {}).length, 0);
    const words = LEVELS.reduce((n, l) => n + l.verse.length, 0);
    expect(words).toBe(52);
    expect(overridden).toBe(42);
  });

  it("gives a bare-lemma drill its own gloss, not the prefixed token's", () => {
    /*
     * 1:2 shows חֹשֶׁךְ though the verse reads וְחֹשֶׁךְ, because the drill two
     * places later is what teaches the prefix. Keying the answer to the token
     * would mark "and darkness" correct against a screen showing no vav —
     * grading a prefix the learner has not met. Caught by diffing the resolved
     * output against the hand-written original during the conversion.
     */
    const darkness = LEVELS[1]!.drills[0] as { he: string; ans: string };
    expect(darkness.he).toBe("חֹשֶׁךְ");
    expect(darkness.ans).toBe("darkness");
    const waters = LEVELS[1]!.drills[2] as { he: string; ans: string };
    expect(waters.he).toBe("מַיִם");
    expect(waters.ans).toBe("waters");
  });

  it("leaves no authoring fields in the resolved drills", () => {
    // `token` and `lemma` are inputs to the adapter. A leak shows up in every
    // equality check downstream and hid inside the conversion diff.
    for (const l of LEVELS) {
      for (const d of l.drills) {
        expect(Object.keys(d)).not.toContain("token");
        expect(Object.keys(d)).not.toContain("lemma");
      }
    }
  });
});

describe("repeated words", () => {
  it("exist, which is why the rebuild matches on the word and not on the index", () => {
    // Genesis 1:2 says עַל פְּנֵי twice, 1:4 names אֱלֹהִים and הָאוֹר twice,
    // 1:5 has וַיְהִי and יוֹם twice. Two bank buttons then carry identical
    // text, so a rebuild that checks the clicked index against the position
    // wanted accepts one and shakes the other with nothing on screen to tell
    // them apart. DayOneScreen compares the text instead; if these duplicates
    // ever disappear from the content, that comparison stops being load-bearing
    // and this test is the record of why it was there.
    const repeated = LEVELS.map((l) => {
      const seen = new Map<string, number>();
      for (const [he] of l.verse) seen.set(he, (seen.get(he) ?? 0) + 1);
      return [l.ref, [...seen].filter(([, n]) => n > 1).length] as const;
    });
    expect(Object.fromEntries(repeated)).toEqual({
      "Genesis 1:1": 0,
      "Genesis 1:2": 2,
      "Genesis 1:3": 1,
      "Genesis 1:4": 2,
      "Genesis 1:5": 2,
    });
  });
});

describe("the sky", () => {
  it("very nearly reaches dawn on a clean run, and never overshoots early", () => {
    // Only graded questions brighten it — a rebuild advances without scoring.
    // The run should end just short, with the finale closing the gap; if a
    // drill is added or removed the ramp has to move with it, or the sun comes
    // up mid-game or not at all.
    const reached = GRADED_QUESTIONS * LIGHT_PER_QUESTION;
    expect(reached).toBeGreaterThan(0.85);
    expect(reached).toBeLessThanOrEqual(1);
  });

  it("passes the risen threshold before the last verse ends", () => {
    // Past 0.72 the ground is bright enough that pale text would vanish, so the
    // ink flips. That must happen while the player is still reading, not on the
    // finale — otherwise the flip looks like a bug.
    expect(GRADED_QUESTIONS * LIGHT_PER_QUESTION).toBeGreaterThan(0.72);
  });

  it("does not count the rebuild drills, which never score", () => {
    expect(GRADED_QUESTIONS).toBe(TOTAL_QUESTIONS - LEVELS.length);
  });
});

describe("registry entry", () => {
  it("counts verses, not drills", () => {
    const g = gameById("hebrew-day-one")!;
    expect(g.count).toBe(LEVELS.length);
    expect(g.countUnit).toBe("verse");
    expect(g.language).toBe("hebrew");
  });
});
