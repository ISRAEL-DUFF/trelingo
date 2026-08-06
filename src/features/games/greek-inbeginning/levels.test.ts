import { describe, it, expect } from "vitest";
import {
  GRADED_QUESTIONS,
  LEVELS,
  LEVEL_SOURCES,
  LIGHT_PER_QUESTION,
  TOTAL_QUESTIONS,
  lightBefore,
} from "./levels";
import { corpusDistractors, passageOf } from "../corpus";
import { gameById } from "../registry";
import { contentFor } from "@/content";

describe("every level", () => {
  it.each(LEVELS.map((l) => [l.ref, l] as const))("%s: has a verse, a teach card and drills", (_r, l) => {
    expect(l.verse.length).toBeGreaterThan(0);
    expect(l.title).toBeTruthy();
    expect(l.teach.he).toBeTruthy();
    expect(l.teach.en).toBeTruthy();
    expect(l.teach.line).toBeTruthy();
    expect(l.drills.length).toBeGreaterThan(0);
  });

  it("covers John 1:1–5 in order", () => {
    expect(LEVELS.map((l) => l.ref)).toEqual([
      "John 1:1",
      "John 1:2",
      "John 1:3",
      "John 1:4",
      "John 1:5",
    ]);
  });

  it("ends by rebuilding the verse", () => {
    for (const l of LEVELS) {
      expect(l.drills[l.drills.length - 1]!.t, l.ref).toBe("order");
      expect(l.drills.filter((d) => d.t === "order"), l.ref).toHaveLength(1);
    }
  });

  it.each(LEVELS.map((l) => [l.ref, l] as const))("%s: every word has a gloss", (_r, l) => {
    for (const [text, gloss] of l.verse) {
      expect(text.trim(), l.ref).toBeTruthy();
      expect(gloss.trim(), text).toBeTruthy();
    }
  });
});

describe("the corpus is the source of the text", () => {
  it("takes every word from the John bundle, in the bundle's order", () => {
    // The point of building on the corpus: the Greek is SBLGNT's, accents and
    // all, not something anyone typed. If these ever diverge, the game has
    // started carrying its own text and the guarantee is gone.
    for (const source of LEVEL_SOURCES) {
      const passage = passageOf(source);
      const level = LEVELS.find((l) => l.ref === passage.reference)!;
      expect(level.verse.map((w) => w[0])).toEqual(passage.tokens.map((t) => t.text));
    }
  });

  it("points every drill at a token the passage actually has", () => {
    for (const source of LEVEL_SOURCES) {
      const n = passageOf(source).tokens.length;
      for (const d of source.drills) {
        if (d.t === "order") continue;
        if (d.t === "tapAll") {
          expect(d.pick.length, d.prompt).toBeGreaterThan(0);
          for (const i of d.pick) {
            expect(i, `${source.passageId} ${d.prompt} → ${i}`).toBeGreaterThanOrEqual(0);
            expect(i, `${source.passageId} ${d.prompt} → ${i}`).toBeLessThan(n);
          }
          expect(new Set(d.pick).size, `${d.prompt} repeats an index`).toBe(d.pick.length);
          continue;
        }
        expect(d.token, source.passageId).toBeGreaterThanOrEqual(0);
        expect(d.token, source.passageId).toBeLessThan(n);
      }
    }
  });

  it("overrides no gloss it does not need to", () => {
    // A pointless override is a maintenance trap: it pins a gloss that would
    // otherwise track the corpus, and nothing would ever tell you.
    for (const source of LEVEL_SOURCES) {
      const tokens = passageOf(source).tokens;
      for (const [i, gloss] of Object.entries(source.gloss ?? {})) {
        expect(gloss, `${source.passageId} token ${i}`).not.toBe(tokens[Number(i)]!.gloss);
      }
    }
  });

  it("overrides the citation glosses the corpus cannot help with", () => {
    // The measurement that justified the whole adapter. ἦν arrives as "I am"
    // and ἐγένετο as "I become, I happen" — a first-person citation form under
    // a third-person verb. If these ever stop needing an override, task #45 has
    // landed and this file should be simplified, not left as is.
    const raw = contentFor("john").passages.find((p) => p.id === "john-1-1")!;
    expect(raw.tokens[2]!.gloss).toBe("I am");
    expect(LEVELS[0]!.verse[2]![1]).toBe("was");
  });

  it("reuses corpus distractors only where the gloss is still the lemma's", () => {
    // Word.distractors are wrong answers to "what does this LEMMA mean?". Once
    // a gloss is overridden they answer a different question, so the adapter
    // must refuse them. This proves the refusal rather than assuming it.
    const john = contentFor("john");
    const withGloss = john.words.find((w) => w.distractors.length >= 3)!;
    expect(corpusDistractors("john", withGloss.id, withGloss.gloss)).not.toBeNull();
    expect(corpusDistractors("john", withGloss.id, "something else entirely")).toBeNull();
    expect(corpusDistractors("john", null, "anything")).toBeNull();
  });
});

describe("choice drills", () => {
  const choices = LEVELS.flatMap((l) =>
    l.drills.filter((d) => d.t === "meaning" || d.t === "reverse" || d.t === "who" || d.t === "when"),
  ) as Extract<(typeof LEVELS)[number]["drills"][number], { ans: string; opts: string[] }>[];

  it("always include the answer among the options", () => {
    for (const d of choices) expect(d.opts, JSON.stringify(d)).toContain(d.ans);
  });

  it("offers only forms the player has actually seen in these five verses", () => {
    /*
     * A reverse drill asks "which word is this?" — so every option should be a
     * word from the passage, in the shape the passage has it. Offering a
     * citation form the learner has never met makes the wrong answers
     * distinguishable for the wrong reason, and it is how ζωή slipped in where
     * the text says ζωὴ: Greek flattens a final acute to a grave before another
     * word, and the two are different strings.
     */
    const attested = new Set(LEVELS.flatMap((l) => l.verse.map((w) => w[0])));
    for (const l of LEVELS) {
      for (const d of l.drills) {
        if (d.t !== "reverse") continue;
        expect(attested.has(d.ans), `${l.ref} answer ${d.ans}`).toBe(true);
        for (const o of d.opts) expect(attested.has(o), `${l.ref} option ${o}`).toBe(true);
      }
    }
  });

  it("never repeat an option", () => {
    for (const d of choices) expect(new Set(d.opts).size, JSON.stringify(d)).toBe(d.opts.length);
  });

  it("offer at least two ways to be wrong", () => {
    for (const d of choices) expect(d.opts.length, JSON.stringify(d)).toBeGreaterThanOrEqual(2);
  });

  it("keep options to four, because the layout pairs them", () => {
    for (const d of choices) expect(d.opts.length, JSON.stringify(d)).toBeLessThanOrEqual(4);
  });

  it("explain the ones that teach a rule", () => {
    for (const l of LEVELS) {
      for (const d of l.drills) {
        if (d.t === "who" || d.t === "when") expect(d.why, `${l.ref} ${d.he}`).toBeTruthy();
      }
    }
  });

  it("always explain a tapAll", () => {
    for (const l of LEVELS) {
      for (const d of l.drills) {
        if (d.t === "tapAll") expect(d.why, `${l.ref}: ${d.prompt}`).toBeTruthy();
      }
    }
  });
});

describe("the stance", () => {
  it("never names a case, a tense or a paradigm — the game's whole point", () => {
    /*
     * Day One's guard, in Greek. Its banned list is Hebrew's (qal, perfect,
     * 3ms); this one is Greek's, and it has to include the CASE names, because
     * that is where the temptation lives. "Which one is nominative?" is a
     * perfectly good question and it is not the question this game asks. The
     * article drill in 1:1 teaches exactly that distinction and does it by
     * saying which word the sentence is about.
     */
    const banned =
      /\b(aorist|imperfect|perfect|pluperfect|indicative|subjunctive|optative|imperative|participle|infinitive|nominative|genitive|dative|accusative|vocative|declension|conjugation|middle voice|passive voice|deponent|enclitic|proclitic)\b/i;
    for (const l of LEVELS) {
      for (const d of l.drills) {
        const text = JSON.stringify(d);
        expect(banned.test(text), `${l.ref}: ${text.slice(0, 90)}`).toBe(false);
      }
      expect(banned.test(l.teach.line), l.ref).toBe(false);
      expect(banned.test(l.title), l.ref).toBe(false);
    }
  });

  it("writes its Greek in Greek letters", () => {
    /*
     * A Latin "n" inside φαίνει is invisible in review and renders in the wrong
     * face. This caught exactly that in the teach line for 1:5 while it was
     * being written.
     */
    const latin = /[A-Za-z]/;
    for (const l of LEVELS) {
      expect(latin.test(l.teach.he), `${l.ref} teach.he: ${l.teach.he}`).toBe(false);
      for (const [text] of l.verse) {
        expect(latin.test(text), `${l.ref}: ${text}`).toBe(false);
      }
      for (const d of l.drills) {
        if (d.t === "reverse") {
          expect(latin.test(d.ans), `${l.ref} answer: ${d.ans}`).toBe(false);
          for (const o of d.opts) expect(latin.test(o), `${l.ref} option: ${o}`).toBe(false);
        }
      }
    }
  });
});

describe("the sky", () => {
  it("very nearly reaches dawn on a clean run, and never overshoots early", () => {
    const reached = GRADED_QUESTIONS * LIGHT_PER_QUESTION;
    expect(reached).toBeGreaterThan(0.85);
    expect(reached).toBeLessThanOrEqual(1);
  });

  it("passes the risen threshold before the last verse ends", () => {
    expect(GRADED_QUESTIONS * LIGHT_PER_QUESTION).toBeGreaterThan(0.72);
    expect(lightBefore(LEVELS.length - 1)).toBeGreaterThan(0.72);
  });

  it("does not count the rebuild drills, which never score", () => {
    expect(GRADED_QUESTIONS).toBe(TOTAL_QUESTIONS - LEVELS.length);
  });

  it("resumes exactly where a clean run would have been", () => {
    let running = 0;
    for (let i = 0; i < LEVELS.length; i++) {
      expect(lightBefore(i)).toBeCloseTo(Math.min(1, running), 10);
      running += LEVELS[i]!.drills.filter((d) => d.t !== "order").length * LIGHT_PER_QUESTION;
    }
  });
});

describe("registry entry", () => {
  it("counts verses and declares its source honestly", () => {
    const g = gameById("greek-in-beginning")!;
    expect(g.count).toBe(LEVELS.length);
    expect(g.countUnit).toBe("verse");
    expect(g.language).toBe("greek");
    // The first game whose text is drawn from a track rather than typed.
    expect(g.source).toBe("corpus");
  });
});
