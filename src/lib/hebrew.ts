/**
 * Hebrew text utilities.
 *
 * The central problem this module solves: niqqud (vowel points) are Unicode
 * combining marks. They occupy their own code points but belong to the consonant
 * that precedes them. Naive iteration over a pointed word therefore yields marks
 * as if they were letters, which misaligns any index-based logic — most
 * importantly the root highlighting that the whole product is built around.
 *
 * Everything downstream indexes by *letter cluster*, never by raw code point.
 */

/** A base consonant together with every combining mark attached to it. */
export type LetterCluster = {
  /** The full cluster as rendered, e.g. "בָּ" */
  text: string;
  /** The bare consonant with all marks stripped, e.g. "ב" */
  base: string;
  /** Combining marks attached to this consonant, in source order. */
  marks: string[];
};

const COMBINING_MARK = /\p{Mn}/u;

// Unicode blocks for Hebrew diacritics, split by pedagogic role. Written as
// explicit escapes: these characters are invisible on their own in source, and
// a literal range is impossible to review by eye.
const CANTILLATION = /[\u0591-\u05AF]/u; // te'amim — chanting marks
const REDUCED_VOWELS = /[\u05B0-\u05B3]/u; // sheva, hataf segol/patah/qamats
const FULL_VOWELS = /[\u05B4-\u05BB\u05C7]/u; // hiriq…qubuts, qamats qatan
const DAGESH = /[\u05BC]/u; // dagesh / mapiq
const METEG_RAFE = /[\u05BD\u05BF]/u;
const SHIN_SIN_DOT = /[\u05C1\u05C2]/u; // shin dot / sin dot

/**
 * Split a Hebrew string into letter clusters. This is the function that makes
 * root indices mean "letters" rather than "code points".
 */
export function toLetterClusters(word: string): LetterCluster[] {
  const clusters: LetterCluster[] = [];
  for (const ch of word) {
    const last = clusters[clusters.length - 1];
    if (COMBINING_MARK.test(ch) && last) {
      last.text += ch;
      last.marks.push(ch);
    } else {
      clusters.push({ text: ch, base: ch, marks: [] });
    }
  }
  return clusters;
}

/** Number of actual letters in a word, ignoring vowel points. */
export function letterCount(word: string): number {
  return toLetterClusters(word).length;
}

/** The consonantal skeleton — what the word looks like in an unpointed text. */
export function stripNiqqud(word: string): string {
  return word.replace(/\p{Mn}/gu, "");
}

/**
 * Niqqud fading, per spec §4 Phase 4: vowel points drop away in stages as a
 * card matures, so learners are weaned onto unpointed text rather than being
 * dropped into it.
 *
 * Stages are ordered by how recoverable each mark is from context:
 *   0 — everything (a beginner's pointed text)
 *   1 — drop cantillation
 *   2 — drop meteg / rafe (purely diacritic)
 *   3 — drop dagesh (affects pronunciation, not identification)
 *   4 — drop reduced vowels (sheva, hatafs)
 *   5 — drop full vowels, keep shin/sin dots (near-unpointed, still unambiguous)
 *   6 — bare consonants, as printed in a Torah scroll
 */
export const MAX_FADE_STAGE = 6;

export function fadeNiqqud(word: string, stage: number): string {
  const s = Math.max(0, Math.min(MAX_FADE_STAGE, Math.round(stage)));
  if (s === 0) return word;
  let out = "";
  for (const ch of word) {
    if (!COMBINING_MARK.test(ch)) {
      out += ch;
      continue;
    }
    if (s >= 1 && CANTILLATION.test(ch)) continue;
    if (s >= 2 && METEG_RAFE.test(ch)) continue;
    if (s >= 3 && DAGESH.test(ch)) continue;
    if (s >= 4 && REDUCED_VOWELS.test(ch)) continue;
    if (s >= 5 && FULL_VOWELS.test(ch)) continue;
    if (s >= 6 && SHIN_SIN_DOT.test(ch)) continue;
    out += ch;
  }
  return out;
}

/**
 * Map an SRS card's maturity onto a fade stage. Deliberately conservative:
 * points only start disappearing once a card is genuinely known, and the last
 * stage needs a long interval.
 */
export function fadeStageForInterval(intervalDays: number): number {
  if (intervalDays < 3) return 0;
  if (intervalDays < 7) return 1;
  if (intervalDays < 14) return 2;
  if (intervalDays < 30) return 3;
  if (intervalDays < 60) return 4;
  if (intervalDays < 120) return 5;
  return 6;
}

/** True if the cluster carries a real consonant (not punctuation or maqqef). */
export function isHebrewLetter(cluster: LetterCluster): boolean {
  return /[א-ת]/u.test(cluster.base);
}

/**
 * Validate that a word's declared root indices actually land on consonants.
 * Content that fails this renders a "root" that includes vowel points, which is
 * the exact bug class that shipped in the original prototype — so the content
 * test suite treats a failure here as fatal.
 */
export function validateRootIndices(
  word: string,
  rootIndices: readonly number[],
): { ok: true } | { ok: false; reason: string } {
  const clusters = toLetterClusters(word);
  for (const i of rootIndices) {
    const c = clusters[i];
    if (!c) {
      return { ok: false, reason: `index ${i} is out of range (word has ${clusters.length} letters)` };
    }
    if (!isHebrewLetter(c)) {
      return { ok: false, reason: `index ${i} ("${c.text}") is not a Hebrew consonant` };
    }
  }
  const unique = new Set(rootIndices);
  if (unique.size !== rootIndices.length) {
    return { ok: false, reason: "duplicate root indices" };
  }
  return { ok: true };
}

/** The bare root consonants a word's root indices select, e.g. ["ש","מ","ר"]. */
export function rootLettersOf(word: string, rootIndices: readonly number[]): string[] {
  const clusters = toLetterClusters(word);
  return rootIndices.map((i) => clusters[i]?.base ?? "");
}

/** Render a root id like "שׁמר" as the conventional dotted display "שׁ־מ־ר". */
export function formatRoot(letters: string): string {
  return toLetterClusters(letters)
    .map((c) => c.text)
    .join("־"); // maqqef
}

/**
 * Hebrew is read right-to-left. Wrapping a Hebrew string in an element with
 * dir="rtl" is enough — the bidi algorithm handles ordering. Never use
 * unicode-bidi: bidi-override here; it forces visual order and breaks any
 * mixed-direction content (e.g. a Hebrew word next to an English gloss).
 */
export const HEBREW_DIR_PROPS = { dir: "rtl" as const, lang: "he" as const };
