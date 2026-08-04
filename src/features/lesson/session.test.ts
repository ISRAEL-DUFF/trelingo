import { describe, it, expect } from "vitest";
import {
  buildSession,
  reviewCount,
  budgetFor,
  reviewCapacity,
  wordsOf,
  wordsToSchedule,
  CONSOLIDATION,
} from "./session";
import { contentFor } from "@/content";
import { newCard, scheduleCard } from "@/srs/engine";
import { passagesOf, type Exercise } from "@/content/schema";
import type { LocalCard } from "@/db";

/**
 * What a lesson contains.
 *
 * Before this, every unit held only the words it introduced, so a word met in
 * Jonah 1 was drilled once and never again by any lesson — all recurrence lived
 * in a Review tab the learner had to seek out. These tests pin the behaviour
 * that fixes it, and the guards that stop it teaching something wrong: never
 * reviewing a word before the lesson has taught it, and never building a cloze
 * from a verse the learner has not read.
 */

const content = contentFor("jonah");
const unit = content.units[4]!; // mid-book, so there is history to review
const earlier = content.units.slice(0, 4);

const card = (wordId: string): LocalCard => ({
  courseId: "jonah",
  wordId,
  ease: 2.5,
  intervalDays: 3,
  repetitions: 2,
  lapses: 0,
  state: "review",
  dueAt: 1,
  lastReviewedAt: 0,
  isLeech: false,
});

/** Words taught by earlier units — the legitimate review pool. */
const earlierWordIds = earlier.flatMap((u) => u.wordIds);
const completed = new Set(earlier.map((u) => u.id));

/** The block a lesson appends after its own authored exercises. */
const appended = (session: ReturnType<typeof buildSession>) => session.slice(unit.exercises.length);
/** Only the review part: the consolidation grids hold the unit's OWN words. */
const isConsolidation = (id: string) => id.includes("-consolidate-");

describe("a lesson with nothing due", () => {
  const session = buildSession({ unit, content, due: [], completedUnitIds: completed });

  it("keeps the unit's own exercises first and unaltered", () => {
    expect(session.slice(0, unit.exercises.length)).toEqual(unit.exercises);
  });

  it("revisits nothing, because there is nothing to revisit", () => {
    expect(reviewCount(unit, session)).toBe(0);
  });

  it("still closes with the unit's own words, one more time", () => {
    // A new word otherwise gets one or two drills and is not seen again until
    // the SRS returns it a day later.
    const added = appended(session);
    expect(added.length).toBeGreaterThan(0);
    expect(added.every((e) => isConsolidation(e.id))).toBe(true);
    const own = new Set(unit.wordIds);
    for (const e of added) for (const id of wordsOf(e)) expect(own.has(id), id).toBe(true);
  });
});

describe("a lesson with review due", () => {
  const due = earlierWordIds.map(card);
  const session = buildSession({ unit, content, due, completedUnitIds: completed });
  const review = appended(session).filter((e) => !isConsolidation(e.id));

  it("keeps the unit's own exercises first and unaltered", () => {
    expect(session.slice(0, unit.exercises.length)).toEqual(unit.exercises);
  });

  it("appends review, so the learner never has to visit a separate tab", () => {
    expect(reviewCount(unit, session)).toBeGreaterThan(0);
  });

  it("includes all three kinds of review", () => {
    const kinds = new Set(review.map((e) => e.type));
    expect(kinds.has("match_pairs")).toBe(true);
    expect(kinds.has("cloze")).toBe(true);
    expect(kinds.has("mc_vocab")).toBe(true);
  });

  it("NEVER reviews a word this very lesson introduces", () => {
    // Testing a word before teaching it is worse than not reviewing at all.
    const introduced = new Set(unit.wordIds);
    for (const e of review) for (const id of wordsOf(e)) expect(introduced.has(id), id).toBe(false);
  });

  it("puts every consolidation grid AFTER every review exercise", () => {
    // The unit's own words may reappear only once the lesson has taught them,
    // and spacing them behind the review block keeps it from being massed
    // practice tacked onto the drills that just introduced them.
    const ids = appended(session).map((e) => isConsolidation(e.id));
    expect(ids).toEqual([...ids].sort((a, b) => Number(a) - Number(b)));
  });

  it("stays within the budget for its backlog", () => {
    const budget = budgetFor(earlierWordIds.length);
    const grids = review.filter((e) => e.type === "match_pairs");
    expect(grids.length).toBeLessThanOrEqual(budget.grids);
    for (const g of grids) {
      if (g.type === "match_pairs") expect(g.wordIds.length).toBeLessThanOrEqual(budget.gridSize);
    }
    expect(review.filter((e) => e.type === "cloze").length).toBeLessThanOrEqual(budget.clozeCount);
    expect(review.filter((e) => e.type === "mc_vocab").length).toBeLessThanOrEqual(budget.mcCount);
    expect(appended(session).filter((e) => isConsolidation(e.id)).length).toBeLessThanOrEqual(
      CONSOLIDATION.maxGrids,
    );
  });

  it("is deterministic — re-rendering does not reshuffle mid-lesson", () => {
    const again = buildSession({ unit, content, due, completedUnitIds: completed });
    expect(again.map((e) => e.id)).toEqual(session.map((e) => e.id));
  });
});

/**
 * The budget is what decides how much recurrence a learner actually gets.
 *
 * A fixed nine words per lesson could not keep up with a whole book: by Jonah's
 * last unit 208 cards were due and 9 were served, so a word came back about
 * twice across a 25-day track. Duolingo's own traces (Settles & Meeder 2016,
 * Table 1) show 2–5 sightings of one word inside a SINGLE session.
 */
describe("the review budget", () => {
  it("grows with the backlog", () => {
    const words = (b: ReturnType<typeof budgetFor>) => b.grids * b.gridSize + b.mcCount + b.clozeCount;
    const tiers = [5, 30, 80, 250].map(budgetFor);
    for (let i = 1; i < tiers.length; i++) {
      expect(words(tiers[i]!)).toBeGreaterThan(words(tiers[i - 1]!));
    }
  });

  it("buys extra words with grids rather than with length", () => {
    // Six mc_vocab drills review six words in six exercises; one grid reviews
    // six words in one. A lesson nobody finishes teaches nothing.
    const small = budgetFor(5);
    const large = budgetFor(250);
    const words = (b: ReturnType<typeof budgetFor>) => b.grids * b.gridSize + b.mcCount + b.clozeCount;
    const exercises = (b: ReturnType<typeof budgetFor>) => b.grids + b.mcCount + b.clozeCount;
    expect(words(large) / words(small)).toBeGreaterThan(2.5);
    expect(exercises(large) - exercises(small)).toBeLessThanOrEqual(6);
  });

  it("reports a capacity the path screen can put in a sentence", () => {
    // "Lessons revisit about N of these." N has to be the real number, or the
    // line is worse than no line at all.
    for (const backlog of [5, 30, 80, 250]) {
      const b = budgetFor(backlog);
      expect(reviewCapacity(backlog)).toBe(b.grids * b.gridSize + b.mcCount + b.clozeCount);
    }
    // And a whole book must outrun it, or the nudge would never appear.
    expect(reviewCapacity(200)).toBeLessThan(200 / 2);
  });

  it("never asks for a grid too big to be a matching game", () => {
    // The schema caps wordIds at 8; past six it stops being language recall.
    for (const n of [0, 5, 12, 13, 40, 41, 100, 101, 1000]) {
      expect(budgetFor(n).gridSize).toBeLessThanOrEqual(6);
      expect(budgetFor(n).gridSize).toBeGreaterThanOrEqual(3);
    }
  });
});

/**
 * A word may be seen more than once in a lesson — but only when the backlog is
 * too thin to fill the budget with distinct words.
 *
 * This is what makes a SHORT track dense. With 200 cards due there are always
 * fresh words and nothing repeats; with a dozen due, the leftover slots go on a
 * second, harder look rather than being dropped.
 */
describe("repeat exposures", () => {
  const exposures = (session: ReturnType<typeof buildSession>) => {
    const n = new Map<string, number>();
    for (const e of appended(session).filter((x) => !isConsolidation(x.id))) {
      for (const id of wordsOf(e)) n.set(id, (n.get(id) ?? 0) + 1);
    }
    return n;
  };

  it("shows a word AGAIN when there are too few due to fill the lesson", () => {
    const due = earlierWordIds.slice(0, 4).map(card);
    const session = buildSession({ unit, content, due, completedUnitIds: completed });
    expect(Math.max(...exposures(session).values())).toBeGreaterThan(1);
  });

  it("spends the slots on fresh words first when the backlog is deep", () => {
    const due = earlierWordIds.map(card);
    const session = buildSession({ unit, content, due, completedUnitIds: completed });
    // Repeating a word while 90-odd others are overdue would be a waste of a slot.
    expect(Math.max(...exposures(session).values())).toBe(1);
  });

  it("escalates rather than repeating the same exercise", () => {
    const due = earlierWordIds.slice(0, 4).map(card);
    const session = buildSession({ unit, content, due, completedUnitIds: completed });
    const seen = new Map<string, string[]>();
    for (const e of appended(session).filter((x) => !isConsolidation(x.id))) {
      for (const id of wordsOf(e)) seen.set(id, [...(seen.get(id) ?? []), e.type]);
    }
    for (const [id, types] of seen) {
      // Grid, then single-word recall, then in-context — never the same twice.
      expect(new Set(types).size, `${id}: ${types.join(",")}`).toBe(types.length);
    }
  });

  it("never shows one word more than three times", () => {
    const due = [card(earlierWordIds[0]!), card(earlierWordIds[1]!), card(earlierWordIds[2]!)];
    const session = buildSession({ unit, content, due, completedUnitIds: completed });
    for (const [id, n] of exposures(session)) expect(n, id).toBeLessThanOrEqual(3);
  });
});

describe("cloze is built only from verses already read", () => {
  const due = earlierWordIds.map(card);

  it("draws every blank from a FINISHED passage", () => {
    const session = buildSession({ unit, content, due, completedUnitIds: completed });
    // EVERY verse of a finished unit, not just the milestone it ends on.
    const finished = new Set(content.units.filter((u) => completed.has(u.id)).flatMap(passagesOf));
    for (const e of session) {
      // An unread verse would make this reading comprehension, not review.
      if (e.type === "cloze") expect(finished.has(e.passageId), e.passageId).toBe(true);
    }
  });

  it("produces none when the learner has finished nothing", () => {
    const session = buildSession({ unit, content, due, completedUnitIds: new Set() });
    expect(session.filter((e) => e.type === "cloze")).toHaveLength(0);
  });

  it("blanks a token that really holds the word, with the answer among the choices", () => {
    const session = buildSession({ unit, content, due, completedUnitIds: completed });
    for (const e of session) {
      if (e.type !== "cloze") continue;
      const passage = content.passageById.get(e.passageId)!;
      const token = passage.tokens[e.tokenIndex];
      expect(token, `${e.passageId}[${e.tokenIndex}]`).toBeDefined();
      expect(token!.wordId).toBe(e.wordId);
      expect(token!.text).toBe(e.answer);
      expect(e.choices).toContain(e.answer);
      expect(new Set(e.choices).size).toBe(e.choices.length);
    }
  });

  it("offers only distractors the learner has already met", () => {
    // Drawing from the whole book leaves exactly one recognisable option — the
    // answer — so the question tests nothing. Observed in the browser on a
    // chapter-1 verse whose three distractors all came from chapters 3–4.
    const session = buildSession({ unit, content, due, completedUnitIds: completed });
    const seen = new Set(
      content.units.filter((u) => completed.has(u.id)).flatMap((u) => u.wordIds),
    );
    const seenTexts = new Set(
      content.words.filter((w) => seen.has(w.id)).map((w) => w.text),
    );
    for (const e of session) {
      if (e.type !== "cloze") continue;
      for (const c of e.choices) {
        if (c === e.answer) continue;
        expect(seenTexts.has(c), `${e.id}: "${c}" has not been taught yet`).toBe(true);
      }
    }
  });

  it("never offers a distractor from the answer's own family", () => {
    // Same-family words look alike, so the answer would be guessable by shape.
    const session = buildSession({ unit, content, due, completedUnitIds: completed });
    for (const e of session) {
      if (e.type !== "cloze") continue;
      const answer = content.wordById.get(e.wordId);
      if (!answer?.familyId) continue;
      const sameFamily = new Set(
        (content.wordsByFamily[answer.familyId] ?? []).map((w) => w.text).filter((t) => t !== e.answer),
      );
      for (const c of e.choices) expect(sameFamily.has(c), `${e.id}: ${c}`).toBe(false);
    }
  });
});

describe("the matching grid", () => {
  it("is skipped rather than shown with too few pairs", () => {
    const due = [card(earlierWordIds[0]!), card(earlierWordIds[1]!)];
    const session = buildSession({ unit, content, due, completedUnitIds: completed });
    // Two tiles a side is not a game.
    const grids = appended(session).filter((e) => e.type === "match_pairs" && !isConsolidation(e.id));
    expect(grids).toHaveLength(0);
  });

  it("holds only words that exist in this track", () => {
    const due = [...earlierWordIds.map(card), card("no-such-word")];
    const session = buildSession({ unit, content, due, completedUnitIds: completed });
    for (const e of session) {
      if (e.type !== "match_pairs") continue;
      for (const id of e.wordIds) expect(content.wordById.has(id), id).toBe(true);
    }
  });

  it("never puts the same word in a grid twice", () => {
    const due = earlierWordIds.map(card);
    const session = buildSession({ unit, content, due, completedUnitIds: completed });
    for (const e of session) {
      if (e.type !== "match_pairs") continue;
      expect(new Set(e.wordIds).size).toBe(e.wordIds.length);
    }
  });
});

/**
 * A lesson is a fixed list once begun.
 *
 * This is the project's recurring defect, seen twice now. The original
 * prototype re-filtered the review queue live behind a stable index, so
 * answering one card silently skipped the next. Mixing review into lessons
 * reintroduced it: the due list was read with `useLiveQuery`, so recording a
 * review rebuilt the session and swapped the exercise out from under the
 * learner — a second matching grid appeared mid-answer.
 *
 * The screen now snapshots once. These pin the property that makes that safe.
 * Note that a lesson may legitimately hold SEVERAL grids now; what must never
 * happen is two of them sharing an id, or the list changing under the learner.
 */
describe("a session, once built, is stable", () => {
  const due = earlierWordIds.map(card);

  it("is the same list for the same inputs, however often it is built", () => {
    const a = buildSession({ unit, content, due, completedUnitIds: completed });
    const b = buildSession({ unit, content, due, completedUnitIds: completed });
    const c = buildSession({ unit, content, due, completedUnitIds: completed });
    expect(b).toEqual(a);
    expect(c).toEqual(a);
  });

  it("gives every exercise a unique id, so React cannot reuse state across two", () => {
    const session = buildSession({ unit, content, due, completedUnitIds: completed });
    const ids = session.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("changes shape when the due list changes — which is why it must be snapshotted", () => {
    // Not a flaw: the builder is a pure function of its input. The screen is
    // responsible for holding that input still for the duration of a lesson.
    const fewer = due.slice(0, 3);
    const a = buildSession({ unit, content, due, completedUnitIds: completed });
    const b = buildSession({ unit, content, due: fewer, completedUnitIds: completed });
    expect(b.length).toBeLessThan(a.length);
  });
});

/**
 * Repeated sightings must not be scored as spaced practice.
 *
 * This is the price of letting a word recur inside one lesson, and it is paid
 * in the SRS rather than in the UI: two "Good" answers minutes apart would walk
 * the interval as though two days had passed.
 */
describe("what a repeated answer writes to the SRS", () => {
  const grid: Exercise = { id: "g", type: "match_pairs", prompt: "", wordIds: ["a", "b", "c"] };
  const drill: Exercise = { id: "d", type: "mc_vocab", prompt: "", wordId: "a", direction: "recognition" };

  it("schedules every word in a grid, not just one", () => {
    expect(wordsToSchedule(grid, true, new Set())).toEqual(["a", "b", "c"]);
  });

  it("will not advance a word twice in the same lesson", () => {
    expect(wordsToSchedule(drill, true, new Set(["a"]))).toEqual([]);
  });

  it("still records a word that is got WRONG the second time", () => {
    // Recognised in a grid, then missed in its own verse: that word is not known,
    // and losing the lapse would be losing the most informative answer in the lesson.
    expect(wordsToSchedule(drill, false, new Set(["a"]))).toEqual(["a"]);
  });

  it("advances only the words of a grid that are still unseen", () => {
    expect(wordsToSchedule(grid, true, new Set(["b"]))).toEqual(["a", "c"]);
  });

  it("ignores exercises that carry no vocabulary", () => {
    const parsing = { id: "p", type: "parsing", prompt: "", passageId: "x", tokenIndex: 0, field: "person", choices: ["1", "2"], answer: "1" };
    expect(wordsToSchedule(parsing as never, true, new Set())).toEqual([]);
    expect(wordsToSchedule(undefined, true, new Set())).toEqual([]);
  });

  it("is what stops the interval inflating — shown against the real scheduler", () => {
    const now = Date.now();
    let guarded = newCard("a");
    let unguarded = newCard("a");
    const seen = new Set<string>();
    // Three sightings of one word inside a single lesson, all correct.
    for (const e of [grid, drill, drill]) {
      for (const id of wordsToSchedule(e, true, seen)) {
        seen.add(id);
        if (id === "a") guarded = scheduleCard(guarded, 2, now);
      }
      // What the old code did: one write per sighting.
      unguarded = scheduleCard(unguarded, 2, now);
    }
    expect(guarded.intervalDays).toBe(1); // one day, as one day's practice should be
    expect(unguarded.intervalDays).toBeGreaterThan(guarded.intervalDays);
  });
});

/** Every registered track must survive this, not just the one it was built on. */
describe("every track builds a lesson", () => {
  for (const courseId of ["shoresh", "jonah", "koine-gospels"] as const) {
    it(`${courseId} appends review and consolidation without repeating an id`, () => {
      const c = contentFor(courseId);
      const u = c.units[c.units.length - 1]!;
      const before = c.units.slice(0, -1);
      const session = buildSession({
        unit: u,
        content: c,
        due: before.flatMap((x) => x.wordIds).map((wordId) => ({ ...card(wordId), courseId })),
        completedUnitIds: new Set(before.map((x) => x.id)),
      });
      expect(session.length).toBeGreaterThan(u.exercises.length);
      expect(new Set(session.map((e) => e.id)).size).toBe(session.length);
      const introduced = new Set(u.wordIds);
      for (const e of session.slice(u.exercises.length)) {
        if (e.id.includes("-consolidate-")) continue;
        for (const id of wordsOf(e)) expect(introduced.has(id), `${courseId}: ${id}`).toBe(false);
      }
    });
  }
});
