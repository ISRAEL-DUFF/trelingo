/**
 * Script layer.
 *
 * Everything language-specific about *text* lives behind this interface: how a
 * word splits into letters, how diacritics are removed, how forms are folded for
 * comparison, and which direction it reads. Nothing outside `src/lib/script/`
 * should know that Hebrew or Greek exist.
 *
 * A `Course` names the script it uses (see `src/content/course.ts`); the rest of
 * the app resolves it through `scriptFor()` and never branches on language.
 */

export type ScriptId = "hebrew" | "greek" | "latin";

/** A base letter together with every combining mark attached to it. */
export interface LetterCluster {
  /** The full cluster as rendered, e.g. "בָּ" */
  text: string;
  /** The bare letter with all marks stripped, e.g. "ב" */
  base: string;
  /** Combining marks attached to this letter, in source order. */
  marks: string[];
}

export interface ScriptModule {
  id: ScriptId;
  direction: "ltr" | "rtl";
  /** BCP-47 tag for the `lang` attribute. */
  lang: string;

  /**
   * Split a word into letter clusters.
   *
   * This is the function every index-based feature depends on. Combining marks
   * must stay attached to their base letter, or root/stem indices silently
   * misalign — the bug class documented in greek-build-plan.md §7.
   */
  toLetterClusters(word: string): LetterCluster[];

  /** Strip all diacritics, leaving the bare consonantal/letter skeleton. */
  stripDiacritics(word: string): string;

  /** True if the cluster carries a real letter (not punctuation or a separator). */
  isLetter(cluster: LetterCluster): boolean;

  /**
   * Join bare letters for display as a morpheme, e.g. a Hebrew root "שׁמר"
   * rendered "שׁ־מ־ר" with maqqef. Greek and Latin would use a hyphen.
   */
  joinLetters(letters: string): string;

  /**
   * Normalise for comparison and search: diacritics removed plus any
   * script-specific equivalences (Greek folds final sigma onto sigma).
   */
  fold(word: string): string;

  /**
   * Progressive diacritic removal, used for "training wheels" modes.
   * `stages` is 0 when the script has no pedagogically honest progression.
   */
  stages: number;
  fade(word: string, stage: number): string;
}

const registry = new Map<ScriptId, ScriptModule>();

export function registerScript(mod: ScriptModule): void {
  registry.set(mod.id, mod);
}

export function scriptFor(id: ScriptId): ScriptModule {
  const mod = registry.get(id);
  if (!mod) throw new Error(`No script module registered for "${id}"`);
  return mod;
}

export function isScriptRegistered(id: ScriptId): boolean {
  return registry.has(id);
}

/**
 * Map an SRS card's maturity onto a fade stage, scaled to whatever number of
 * stages the script defines. Deliberately conservative: diacritics only start
 * disappearing once a card is genuinely known, and the last stage needs a long
 * interval. Returns 0 for scripts with no fade progression.
 */
export function fadeStageForInterval(intervalDays: number, stages: number): number {
  if (stages <= 0) return 0;
  // Thresholds are the Hebrew progression, preserved exactly; a script with
  // fewer stages compresses proportionally.
  const THRESHOLDS = [3, 7, 14, 30, 60, 120];
  let stage = 0;
  for (const t of THRESHOLDS) {
    if (intervalDays < t) break;
    stage++;
  }
  return Math.min(stage, stages);
}
