import type { CourseContent } from "@/content";
import { passagesOf, type Exercise, type Unit } from "@/content/schema";
import type { LocalCard } from "@/db";

/**
 * What a lesson actually contains.
 *
 * A unit's authored exercises teach the words it introduces. On their own that
 * is the whole problem: a word met in Jonah 1 was drilled once and never again
 * by any lesson, because every unit contains only `fresh` words. All recurrence
 * lived in a separate Review tab that a learner had to choose to open, so
 * anyone who only pressed "Learn" met each word exactly once.
 *
 * This mixes the SRS queue back into the lesson, which is where the learner
 * already is. Same engine, same schedule — just delivered rather than awaited.
 *
 * A lesson is built in three blocks:
 *
 *   1. TEACHING      the unit's own authored exercises, untouched and first.
 *   2. REVIEW        due words from earlier units, in ascending difficulty.
 *   3. CONSOLIDATION a matching grid over the words this unit just taught.
 *
 * and review itself escalates:
 *
 *   match_pairs  fast form-to-meaning binding. Isolated cards, so good for
 *                recognition speed and weak for transfer. Cheapest per word —
 *                one exercise serves up to six.
 *   mc_vocab     the existing recognition drill, one word at a time.
 *   cloze        a word removed from a verse the learner has ALREADY FINISHED.
 *                The only one that tests the word where it lives, and the one
 *                trelingo-pedagogical-foundation.md §6.2 actually asks for.
 *
 * Cloze material is free and grows as the learner reads: a book re-uses its own
 * vocabulary heavily (coverage-findings.md §4a), so every finished chapter turns
 * into review material for the next.
 *
 * HOW MUCH RECURRENCE. Measured; see recurrence-findings.md. Benchmarked against
 * Duolingo's published learning traces (Settles & Meeder, ACL 2016, Table 1),
 * where one word is seen 2–5 times inside a single session and around twenty
 * times in a month. A fixed budget of nine words per lesson could not approach
 * that: by Jonah's last unit 208 cards were due and 9 were served, so a word came
 * back roughly twice in a 25-day track. Hence `budgetFor`, which grows with the
 * backlog, and the repeat pass, which spends leftover slots on a second harder
 * look rather than shrinking the lesson. Neither changes the schedule — only how
 * much of it a lesson delivers.
 */

export interface SessionInput {
  unit: Unit;
  content: CourseContent;
  /** Cards due now, most overdue first. */
  due: LocalCard[];
  /** Units the learner has finished — the source of cloze passages. */
  completedUnitIds: Set<string>;
  /** Stable across re-renders so exercise ids do not churn. */
  seed?: string;
}

/** How much review one lesson carries. */
export interface ReviewBudget {
  /** Matching grids. Each one serves `gridSize` words in a single exercise. */
  grids: number;
  /** Words per grid. Below 3 it is trivial; above 6 it becomes a memory test. */
  gridSize: number;
  /** Single-word recognition drills. */
  mcCount: number;
  /** Fill-the-blank from a finished verse. */
  clozeCount: number;
}

/**
 * The budget for a given backlog.
 *
 * Deliberately buys extra words with GRIDS rather than with length. A grid is
 * one exercise that reviews six words; six mc_vocab drills review six words in
 * six exercises. So the top tier serves nearly three times as many words as the
 * old fixed budget while adding only five exercises to the lesson.
 *
 * The tiers are backlog thresholds, not a formula, because the point is to keep
 * a lesson finishable: past a certain depth the queue cannot be cleared inside
 * lessons at all and the Review tab has to carry it (see the deep-backlog nudge
 * on the path screen).
 */
export function budgetFor(backlog: number): ReviewBudget {
  if (backlog <= 12) return { grids: 1, gridSize: 4, mcCount: 3, clozeCount: 2 };
  if (backlog <= 40) return { grids: 2, gridSize: 5, mcCount: 3, clozeCount: 2 };
  if (backlog <= 100) return { grids: 3, gridSize: 6, mcCount: 4, clozeCount: 3 };
  return { grids: 4, gridSize: 6, mcCount: 4, clozeCount: 3 };
}

/** Words the unit's own closing grid holds, and the most grids it may use. */
export const CONSOLIDATION = { gridSize: 6, maxGrids: 2 } as const;

/**
 * How many due words a single lesson can absorb at this backlog.
 *
 * The path screen uses it to say so plainly. On a whole book the queue outruns
 * lessons no matter how the budget is tuned — 128 due against 31 absorbed by
 * Jonah's last unit — and a learner who is told that will open Review, whereas
 * one shown a bare number will not.
 */
export function reviewCapacity(backlog: number): number {
  const b = budgetFor(backlog);
  return b.grids * b.gridSize + b.mcCount + b.clozeCount;
}

/**
 * Deterministic pick, seeded by the unit, so re-rendering a lesson does not
 * reshuffle it under the learner mid-session.
 */
function seededPick<T>(items: readonly T[], n: number, seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rand = () => {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    return h / 0x7fffffff;
  };
  const pool = [...items];
  const out: T[] = [];
  while (out.length < n && pool.length) out.push(...pool.splice(Math.floor(rand() * pool.length), 1));
  return out;
}

/** Split a list into chunks of at most `size`, dropping a final runt below `min`. */
function chunk<T>(items: readonly T[], size: number, min: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  while (out.length && out[out.length - 1]!.length < min) out.pop();
  return out;
}

/**
 * Build the exercise list for one unit: what it teaches, what it revisits, then
 * what it just taught, once more.
 *
 * Review comes AFTER the new material rather than before, so a learner opening
 * a lesson sees the thing they came for first. Everything appended is skipped
 * silently when there is nothing due — a first lesson has no history to review.
 */
export function buildSession({
  unit,
  content,
  due,
  completedUnitIds,
  seed = unit.id,
}: SessionInput): Exercise[] {
  const teaching = unit.exercises;

  // Never review a word this very lesson is introducing — it would be tested
  // before it has been taught. (The consolidation grid at the end is the one
  // place the unit's own words reappear, and it sits after every teaching
  // exercise, so nothing is tested early.)
  const introduced = new Set(unit.wordIds);
  const reviewable = due
    .filter((c) => !introduced.has(c.wordId))
    .filter((c) => content.wordById.has(c.wordId));

  const out: Exercise[] = [...teaching];
  const budget = budgetFor(reviewable.length);

  /** How many times each word has been served in THIS lesson. */
  const served = new Map<string, number>();
  const count = (id: string) => served.get(id) ?? 0;
  const take = (id: string) => served.set(id, count(id) + 1);

  /**
   * Words for one block: unserved first, then — only once those run out —
   * words already served, for a second and harder look.
   *
   * This is what makes a short track dense. With 200 cards due there are always
   * enough fresh words and no word repeats; with 12 due, the leftover slots go
   * on repeats rather than being dropped, which is the difference between a
   * review word being seen once per lesson and three times.
   */
  const pickFor = (n: number, blockSeed: string, eligible: (wordId: string) => boolean = () => true) => {
    const chosen: string[] = [];
    for (let depth = 0; chosen.length < n && depth < 3; depth++) {
      const pool = reviewable
        .map((c) => c.wordId)
        .filter((id) => count(id) === depth && !chosen.includes(id) && eligible(id));
      if (!pool.length) continue;
      // Depth 0 keeps the queue's own order — most overdue first. Deeper passes
      // are shuffled so a repeat is not always the same handful of words.
      const wanted = n - chosen.length;
      chosen.push(...(depth === 0 ? pool.slice(0, wanted) : seededPick(pool, wanted, `${blockSeed}-${depth}`)));
    }
    return chosen;
  };

  /** Grids, and the one-word-at-a-time drills they get interleaved with. */
  const grids: Exercise[] = [];
  const singles: Exercise[] = [];

  // --- 1. matching grids ---
  // Marked served only once a word lands in a grid that survives chunking —
  // a trailing runt below three is dropped, and a word that was never shown
  // must stay available to the blocks below.
  for (const words of chunk(pickFor(budget.grids * budget.gridSize, `${seed}-match`), budget.gridSize, 3)) {
    for (const id of words) take(id);
    grids.push({
      id: `${unit.id}-rev-match-${grids.length}`,
      type: "match_pairs",
      prompt: "Match each word to its meaning.",
      wordIds: words,
    });
  }

  // --- 2. plain recognition ---
  for (const wordId of pickFor(budget.mcCount, `${seed}-mc`)) {
    take(wordId);
    singles.push({
      id: `${unit.id}-rev-mc-${wordId}`,
      type: "mc_vocab",
      wordId,
      direction: "recognition",
      prompt: "Seen before — what does this mean?",
    });
  }

  // --- 3. cloze from verses already finished ---
  const finishedUnits = content.units.filter((u) => completedUnitIds.has(u.id));
  // Every verse of a finished unit, not just its milestone — a two-verse unit
  // used to offer only half its own text as cloze material.
  const finishedPassageIds = new Set(finishedUnits.flatMap(passagesOf));
  /** Vocabulary the learner has actually been taught, for honest distractors. */
  const seenWordIds = new Set(finishedUnits.flatMap((u) => u.wordIds));

  /**
   * The first finished verse holding this word, if there is one.
   *
   * Memoised: it is asked once per candidate per depth pass, and a deep backlog
   * means several hundred candidates over a whole book's passages.
   */
  const verseCache = new Map<string, { passageId: string; tokenIndex: number; text: string } | null>();
  const inFinishedVerse = (wordId: string) => {
    if (verseCache.has(wordId)) return verseCache.get(wordId)!;
    let hit: { passageId: string; tokenIndex: number; text: string } | null = null;
    for (const p of content.passages) {
      if (!finishedPassageIds.has(p.id)) continue;
      const i = p.tokens.findIndex((t) => t.wordId === wordId);
      if (i >= 0) {
        hit = { passageId: p.id, tokenIndex: i, text: p.tokens[i]!.text };
        break;
      }
    }
    verseCache.set(wordId, hit);
    return hit;
  };

  for (const wordId of pickFor(budget.clozeCount, `${seed}-cloze`, (id) => !!inFinishedVerse(id))) {
    take(wordId);
    const found = inFinishedVerse(wordId)!;

    // Distractors must be words the learner has ALREADY MET.
    //
    // Drawing them from the whole book makes the exercise guessable: on a verse
    // from chapter 1, three options from chapters 3–4 leave exactly one word the
    // learner recognises, and it is the answer. Restricting to seen vocabulary
    // means every option is plausible and the question actually discriminates.
    //
    // Same-family words are still excluded, so it cannot be solved by shape.
    const answerWord = content.wordById.get(wordId);
    const eligible = (pool: typeof content.words) =>
      pool
        .filter(
          (w) =>
            w.id !== wordId &&
            w.text !== found.text &&
            !(w.familyId && answerWord?.familyId && w.familyId === answerWord.familyId),
        )
        .map((w) => w.text);

    const seenWords = content.words.filter((w) => seenWordIds.has(w.id));
    // Fall back to the whole book only if too little has been read to fill three.
    const fromSeen = eligible(seenWords);
    const others = fromSeen.length >= 3 ? fromSeen : eligible(content.words);
    const choices = [found.text, ...seededPick([...new Set(others)], 3, `${seed}-cloze-${wordId}`)];

    singles.push({
      id: `${unit.id}-rev-cloze-${wordId}`,
      type: "cloze",
      prompt: "Which word belongs in the blank?",
      passageId: found.passageId,
      tokenIndex: found.tokenIndex,
      wordId,
      choices,
      answer: found.text,
    });
  }

  // Spread the grids through the review block rather than stacking them.
  //
  // A deep backlog buys four grids, and four in a row is the same screen four
  // times. Spreading them costs nothing and keeps the escalation intact: a word
  // only ever gets a second look when the backlog is too thin to fill even one
  // extra grid, and a single grid always lands first.
  const gap = Math.max(1, Math.ceil((singles.length + 1) / Math.max(1, grids.length)));
  for (let i = 0, g = 0, s = 0; g < grids.length || s < singles.length; i++) {
    if (g < grids.length && i % (gap + 1) === 0) out.push(grids[g++]!);
    else if (s < singles.length) out.push(singles[s++]!);
    else out.push(grids[g++]!);
  }

  // --- 4. consolidate what this unit just taught ---
  //
  // A new word gets one or two authored drills and is then not seen again until
  // the SRS brings it back a day later. Closing the lesson with the unit's own
  // words costs one or two exercises and is the cheapest exposure in the whole
  // session. It sits after the review block rather than immediately after the
  // teaching exercises, so it is spaced practice rather than massed.
  const ownWords = unit.wordIds.filter((id) => content.wordById.has(id));
  chunk(
    seededPick(ownWords, CONSOLIDATION.maxGrids * CONSOLIDATION.gridSize, `${seed}-own`),
    CONSOLIDATION.gridSize,
    3,
  ).forEach((words, i) => {
    out.push({
      id: `${unit.id}-consolidate-${i}`,
      type: "match_pairs",
      prompt: "One more time — match each word to its meaning.",
      wordIds: words,
    });
  });

  return out;
}

/** Every word an exercise puts in front of the learner. */
export function wordsOf(e: Exercise): string[] {
  if (e.type === "match_pairs") return e.wordIds;
  return "wordId" in e ? [e.wordId] : [];
}

/**
 * Which words an answer may write to the SRS.
 *
 * A word can now be met more than once in a lesson — in a grid, again as a
 * harder drill, and the unit's own words again in the closing consolidation
 * grid. Only the FIRST correct sighting may advance the card. Two "Good"
 * ratings minutes apart would walk the interval 1d → 3d as though two days had
 * passed: massed practice scored as spaced, inflating the schedule for exactly
 * the words a learner drills hardest.
 *
 * Getting it WRONG still counts every time. A lapse is real information, and
 * failing the second, harder look is the case most worth catching — a word
 * recognised in a grid and then missed in its own verse is not known.
 *
 * `alreadyScheduled` is per lesson, and the caller is responsible for clearing
 * it between units.
 */
export function wordsToSchedule(
  exercise: Exercise | undefined,
  correct: boolean,
  alreadyScheduled: ReadonlySet<string>,
): string[] {
  if (!exercise) return [];
  // A grid reviews every word in it. Recording only one would let the rest
  // vanish, and the queue would keep re-offering words the learner has just
  // demonstrated.
  return wordsOf(exercise).filter((id) => !correct || !alreadyScheduled.has(id));
}

/**
 * How many DISTINCT earlier words a built session revisits.
 *
 * Counts words rather than exercises, because one matching grid revisits six of
 * them, and because the consolidation grid at the end is not a revisit at all —
 * those words were taught minutes ago in this same lesson.
 */
export function reviewCount(unit: Unit, session: Exercise[]): number {
  const introduced = new Set(unit.wordIds);
  const revisited = new Set<string>();
  for (const e of session.slice(unit.exercises.length)) {
    for (const id of wordsOf(e)) if (!introduced.has(id)) revisited.add(id);
  }
  return revisited.size;
}
