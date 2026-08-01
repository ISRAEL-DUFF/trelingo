/**
 * Script-agnostic morphology helpers.
 *
 * These operate on letter indices supplied by content and validated against
 * whatever script the course uses. They contain no language-specific knowledge —
 * that all lives behind `ScriptModule`.
 */
import type { ScriptModule } from "./script";

export type IndexCheck = { ok: true } | { ok: false; reason: string };

/**
 * Validate that a word's declared morpheme indices actually land on letters.
 *
 * Content that fails this renders a "root" or "ending" that includes vowel
 * points — or nothing at all. That is precisely the bug class that shipped in
 * both prototypes (see greek-build-plan.md §7), so the content test suite treats
 * a failure here as fatal.
 */
export function validateLetterIndices(
  script: ScriptModule,
  word: string,
  indices: readonly number[],
): IndexCheck {
  const clusters = script.toLetterClusters(word);
  for (const i of indices) {
    const c = clusters[i];
    if (!c) {
      return { ok: false, reason: `index ${i} is out of range (word has ${clusters.length} letters)` };
    }
    if (!script.isLetter(c)) {
      return { ok: false, reason: `index ${i} ("${c.text}") is not a letter` };
    }
  }
  if (new Set(indices).size !== indices.length) {
    return { ok: false, reason: "duplicate indices" };
  }
  return { ok: true };
}

/** The bare letters a word's morpheme indices select, e.g. ["ש","מ","ר"]. */
export function lettersAt(
  script: ScriptModule,
  word: string,
  indices: readonly number[],
): string[] {
  const clusters = script.toLetterClusters(word);
  return indices.map((i) => clusters[i]?.base ?? "");
}

/** Number of actual letters in a word, ignoring diacritics. */
export function letterCount(script: ScriptModule, word: string): number {
  return script.toLetterClusters(word).length;
}
