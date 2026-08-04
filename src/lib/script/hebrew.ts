/**
 * Hebrew script module.
 *
 * The central problem this solves: niqqud (vowel points) are Unicode combining
 * marks. They occupy their own code points but belong to the consonant that
 * precedes them. Naive iteration over a pointed word therefore yields marks as
 * if they were letters, which misaligns any index-based logic — most importantly
 * the root highlighting the whole product is built around.
 *
 * Everything downstream indexes by *letter cluster*, never by raw code point.
 */
import { registerScript, type LetterCluster, type ScriptModule } from "./index";

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

/** Final (sofit) forms and the letters they are positional variants of. */
const FINAL_FORMS: Record<string, string> = {
  "\u05DA": "\u05DB", // ך → כ
  "\u05DD": "\u05DE", // ם → מ
  "\u05DF": "\u05E0", // ן → נ
  "\u05E3": "\u05E4", // ף → פ
  "\u05E5": "\u05E6", // ץ → צ
};

const MAQQEF = "\u05BE"; // ־

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

/** True if the cluster carries a real consonant (not punctuation or maqqef). */
export function isHebrewLetter(cluster: LetterCluster): boolean {
  return /[\u05D0-\u05EA]/u.test(cluster.base);
}

export const hebrewScript: ScriptModule = {
  id: "hebrew",
  // Hebrew is read right-to-left. Setting `dir="rtl"` is enough — the bidi
  // algorithm handles ordering. Never use `unicode-bidi: bidi-override`; it
  // forces visual order and corrupts mixed-direction content, such as a Hebrew
  // word sitting next to an English gloss.
  direction: "rtl",
  lang: "he",
  stages: MAX_FADE_STAGE,

  toLetterClusters,
  stripDiacritics: stripNiqqud,
  // Diacritic removal PLUS the five final forms.
  //
  // The note here used to claim Hebrew had no positional-form equivalences.
  // It has exactly five: כ/ך, מ/ם, נ/ן, פ/ף, צ/ץ are the same consonants,
  // written differently at the end of a word. This is the direct analogue of
  // Greek's ς/σ, which the Greek module has always folded.
  //
  // It matters because a root is a set of consonants irrespective of position:
  // קוּם ends in ם but its root is ק־ו־מ, and without folding the two never
  // compare equal. Surfaced by the Jonah content, where seven verbs ending in
  // a final form failed the highlight-agrees-with-family check.
  fold: (word) => stripNiqqud(word).replace(/[ךםןףץ]/g, (c) => FINAL_FORMS[c]!),
  isLetter: isHebrewLetter,
  fade: fadeNiqqud,
  joinLetters: (letters) =>
    toLetterClusters(letters)
      .map((c) => c.text)
      .join(MAQQEF),
};

registerScript(hebrewScript);
