import { describe, it, expect } from "vitest";
import { contentFor } from "@/content";
import { courses } from "@/content/course";
import {
  MIN_TAUGHT,
  TARGET_FLOOR,
  isTaught,
  pick,
  scorePassage,
  unstudiedTracks,
} from "./select";

/** Every word a course teaches — a learner who has finished that whole track. */
const allWordsOf = (courseId: Parameters<typeof contentFor>[0]) =>
  new Set(contentFor(courseId).words.map((w) => w.id));

describe("the premise: ids are stable across tracks", () => {
  it("lets a word learned in one book count in another", () => {
    /*
     * The entire game rests on this. Hebrew ids are Strong's keys and Greek ids
     * are lemma slugs, so the same word carries the same id in every track that
     * teaches it. If this ever stops being true, Cold Read cannot exist and
     * this test is where that gets discovered.
     */
    const jonah = allWordsOf("jonah");
    const genesis = allWordsOf("genesis");
    const shared = [...jonah].filter((id) => genesis.has(id));
    expect(shared.length).toBeGreaterThan(100);
    expect(shared).toContain("h413"); // אֶל, to
    expect(shared).toContain("h3068"); // יהוה

    const mark = allWordsOf("mark");
    const john = allWordsOf("john");
    expect([...mark].filter((id) => john.has(id)).length).toBeGreaterThan(400);
  });

  it("keeps Hebrew and Greek ids in shapes that cannot collide", () => {
    for (const id of allWordsOf("jonah")) expect(id).toMatch(/^h\d+$/);
    for (const id of allWordsOf("john")) expect(id).not.toMatch(/^h\d+$/);
  });
});

describe("scoring", () => {
  const genesis = contentFor("genesis");
  const verse = genesis.passages.find((p) => p.id === "gen-1-1")!;

  it("scores over taught tokens only, never the whole verse", () => {
    const known = new Set(verse.tokens.filter(isTaught).map((t) => t.wordId!));
    const s = scorePassage("genesis", verse, known)!;
    expect(s.coverage).toBe(1);
    expect(s.hits).toBe(s.taught.length);
  });

  it("counts untaught tokens separately and never against the learner", () => {
    /*
     * Untaught tokens are 40% of a Greek verse. If they were ever folded into
     * the denominator, every Greek score would cap near 60% and the game would
     * be broken for half the app.
     */
    const john = contentFor("john");
    const j11 = john.passages.find((p) => p.id === "john-1-1")!;
    const known = new Set(j11.tokens.filter(isTaught).map((t) => t.wordId!));
    const s = scorePassage("john", j11, known)!;
    expect(s.coverage).toBe(1);
    expect(s.untaught).toBeGreaterThan(0);
    expect(s.taught.length + s.untaught).toBe(j11.tokens.length);
  });

  it("refuses a verse too short to be an achievement", () => {
    const short = { ...verse, tokens: verse.tokens.slice(0, MIN_TAUGHT - 1) };
    expect(scorePassage("genesis", short, new Set())).toBeNull();
  });

  it("gives zero to a learner who knows nothing, without throwing", () => {
    const s = scorePassage("genesis", verse, new Set())!;
    expect(s.hits).toBe(0);
    expect(s.coverage).toBe(0);
  });
});

describe("picking a verse", () => {
  it("prefers the most known words, not the highest percentage", () => {
    /*
     * The feel of the game. "You read 14 of 16" is a moment; "you read 6 of 6"
     * is not. Coverage gates entry and breaks ties, nothing more.
     */
    const known = allWordsOf("genesis");
    const choice = pick(["genesis"], known, new Set())!;
    const all = contentFor("genesis")
      .passages.map((p) => scorePassage("genesis", p, known))
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .filter((s) => s.coverage >= TARGET_FLOOR);
    const mostHits = Math.max(...all.map((s) => s.hits));
    expect(choice.best.hits).toBe(mostHits);
    expect(choice.clearedFloor).toBe(true);
  });

  it("is deterministic for the same learner", () => {
    const known = allWordsOf("genesis");
    const a = pick(["genesis"], known, new Set())!;
    const b = pick(["genesis"], known, new Set())!;
    expect(a.best.passage.id).toBe(b.best.passage.id);
  });

  it("never offers a verse already seen", () => {
    const known = allWordsOf("genesis");
    const first = pick(["genesis"], known, new Set())!;
    const second = pick(["genesis"], known, new Set([first.best.passage.id]))!;
    expect(second.best.passage.id).not.toBe(first.best.passage.id);
  });

  it("returns the best available rather than nothing when the floor is missed", () => {
    // A learner who knows almost nothing still gets a verse — with
    // clearedFloor false, which is what softens the wording on screen.
    const barely = new Set([...allWordsOf("genesis")].slice(0, 5));
    const choice = pick(["genesis"], barely, new Set());
    expect(choice).not.toBeNull();
    expect(choice!.clearedFloor).toBe(false);
    expect(choice!.best.coverage).toBeLessThan(TARGET_FLOOR);
  });

  it("returns null only when there is genuinely nothing left", () => {
    const known = allWordsOf("genesis");
    const everything = new Set(contentFor("genesis").passages.map((p) => p.id));
    expect(pick(["genesis"], known, everything)).toBeNull();
    expect(pick([], known, new Set())).toBeNull();
  });

  it("reaches across tracks, which is the whole point", () => {
    /*
     * A learner who finished Jonah is offered a verse from a book they have
     * never opened, scored on the words Jonah taught them.
     */
    const fromJonah = allWordsOf("jonah");
    const choice = pick(["genesis", "ruth", "esther"], fromJonah, new Set());
    expect(choice).not.toBeNull();
    expect(["genesis", "ruth", "esther"]).toContain(choice!.best.courseId);
    expect(choice!.best.hits).toBeGreaterThan(0);
  });
});

describe("candidate tracks", () => {
  it("offers only books with no completed unit, in the right language", () => {
    const open = unstudiedTracks("hebrew", new Set(["jonah"]));
    expect(open).not.toContain("jonah");
    expect(open).toContain("genesis");
    // Never another language: a Hebrew learner is not handed John.
    for (const id of open) {
      expect(courses.find((c) => c.id === id)!.language).toBe("hebrew");
    }
  });

  it("returns nothing once every track is open, so the caller can widen", () => {
    const all = new Set(courses.filter((c) => c.language === "hebrew").map((c) => c.id));
    expect(unstudiedTracks("hebrew", all)).toEqual([]);
  });
});
