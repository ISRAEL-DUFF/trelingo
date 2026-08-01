/**
 * Exercise grading.
 *
 * Spec §4 Phase 8 is explicit about free-text: start with fuzzy matching and
 * keyword presence against an answer key, "avoid over-promising ML grading", and
 * "flag low-confidence grades for the user to self-assess rather than silently
 * mis-grading". That shape is implemented here — grading returns a *confidence*
 * alongside the verdict, and the UI hands ambiguous cases back to the learner.
 */
import type { Parse } from "@/content/schema";

export type Verdict = "correct" | "incorrect" | "uncertain";

export interface GradeResult {
  verdict: Verdict;
  /** 0–1. Below the uncertainty threshold the learner self-assesses. */
  confidence: number;
  /** Per-field correctness for multi-part answers. */
  fields?: Record<string, boolean>;
  explanation?: string;
}

/** Simple choice grading — unambiguous by construction. */
export function gradeChoice(selected: string, answer: string): GradeResult {
  return {
    verdict: selected === answer ? "correct" : "incorrect",
    confidence: 1,
  };
}

/**
 * Parsing exercises are graded per field, not all-or-nothing — getting person
 * right but gender wrong is different from knowing nothing, and the feedback
 * should say so.
 */
export function gradeParse(
  submitted: Partial<Parse>,
  answer: Parse,
  fields: readonly (keyof Parse)[],
): GradeResult {
  const results: Record<string, boolean> = {};
  let correct = 0;
  for (const f of fields) {
    const ok = submitted[f] === answer[f];
    results[f] = ok;
    if (ok) correct++;
  }
  const ratio = fields.length ? correct / fields.length : 0;
  return {
    verdict: ratio === 1 ? "correct" : "incorrect",
    confidence: 1,
    fields: results,
    explanation:
      ratio === 1
        ? undefined
        : `${correct} of ${fields.length} fields correct.`,
  };
}

// ---------- Free-text translation ----------

const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "am",
  "of", "to", "and", "in", "on", "at", "it", "that", "this", "shall", "will",
]);

export function normalise(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[^\p{L}\p{N}\s]/gu, " ") // punctuation → space
    .replace(/\s+/g, " ")
    .trim();
}

function contentWords(s: string): string[] {
  return normalise(s)
    .split(" ")
    .filter((w) => w && !STOPWORDS.has(w));
}

/** Levenshtein distance, used only for short single-token comparisons. */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(
        prev[j]! + 1,
        curr[j - 1]! + 1,
        prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = curr;
  }
  return prev[b.length]!;
}

/** True when two words differ only by a typo or an inflectional ending. */
function looselyEqual(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a))) return true;
  const tolerance = Math.max(a.length, b.length) >= 6 ? 2 : 1;
  return editDistance(a, b) <= tolerance;
}

/**
 * Grade a free-text translation against an answer key.
 *
 * Deliberately conservative: it will say "uncertain" rather than mark a
 * defensible answer wrong. The cost of a false "incorrect" (a learner losing
 * trust in the app) is much higher than the cost of asking them to self-check.
 */
export function gradeTranslation(
  submitted: string,
  acceptable: readonly string[],
  keywords: readonly string[] = [],
): GradeResult {
  const input = normalise(submitted);
  if (!input) {
    return { verdict: "incorrect", confidence: 1, explanation: "No answer given." };
  }

  // 1. Exact match against any accepted phrasing.
  if (acceptable.some((a) => normalise(a) === input)) {
    return { verdict: "correct", confidence: 1 };
  }

  // 2. Content-word overlap with the closest accepted answer.
  const inputWords = contentWords(submitted);
  let best = 0;
  for (const a of acceptable) {
    const target = contentWords(a);
    if (!target.length) continue;
    const matched = target.filter((t) => inputWords.some((w) => looselyEqual(w, t))).length;
    // Penalise answers that add a lot of unrelated words.
    const extra = Math.max(0, inputWords.length - target.length);
    const score = (matched / target.length) * (1 - Math.min(0.4, extra * 0.1));
    best = Math.max(best, score);
  }

  // 3. Required keywords: missing one is a strong signal, but not proof —
  //    a learner may have used a legitimate synonym we did not anticipate.
  const missingKeyword = keywords.find(
    (k) => !inputWords.some((w) => looselyEqual(w, normalise(k))),
  );

  if (best >= 0.85 && !missingKeyword) {
    return { verdict: "correct", confidence: best };
  }
  if (best >= 0.55) {
    return {
      verdict: "uncertain",
      confidence: best,
      explanation: missingKeyword
        ? `This looks close, but we did not spot “${missingKeyword}”.`
        : "This looks close to the expected answer.",
    };
  }
  if (best >= 0.3) {
    return {
      verdict: "uncertain",
      confidence: best,
      explanation: "We could not confidently grade this one.",
    };
  }
  return { verdict: "incorrect", confidence: 1 - best };
}

/** Grade a set of binyan→gloss matches. */
export function gradeMatching(
  pairs: Record<string, string>,
  expected: Record<string, string>,
): GradeResult {
  const keys = Object.keys(expected);
  const fields: Record<string, boolean> = {};
  let correct = 0;
  for (const k of keys) {
    const ok = pairs[k] === expected[k];
    fields[k] = ok;
    if (ok) correct++;
  }
  return {
    verdict: correct === keys.length ? "correct" : "incorrect",
    confidence: 1,
    fields,
    explanation: correct === keys.length ? undefined : `${correct} of ${keys.length} matched.`,
  };
}
