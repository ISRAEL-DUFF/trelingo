/**
 * Ancient Greek script module (Koine and Attic).
 *
 * Three things differ from Hebrew, all verified against real MorphGNT data
 * during Spike A:
 *
 *  1. **Greek ships precomposed.** ἀ is a single code point (U+1F00), not alpha
 *     plus a breathing mark. `stripDiacritics("ἀρχῇ")` therefore returns the
 *     input unchanged unless the string is decomposed first — the marks are
 *     baked in. Every diacritic operation here does NFD → act → NFC.
 *  2. **Final sigma.** λόγος ends in ς (U+03C2) while its stem uses σ (U+03C3).
 *     They are the same letter in different positions, so `fold` maps ς onto σ
 *     or stem matching and search silently fail at word boundaries.
 *  3. **No fade progression.** Unpointed Hebrew is a real reading target;
 *     unaccented Greek is not. NT, LXX and Attic editions all print accents, and
 *     accents can be contrastive (τίς "who?" vs τις "someone"). Fading them
 *     would train a skill nobody needs and destroy information, so `stages` is
 *     0 — see greek-build-plan.md §4.5.
 *
 * Clustering itself needs no change: the letter-cluster model works on Greek
 * unaltered, which is what made the Hebrew work reusable.
 */
import { registerScript, type LetterCluster, type ScriptModule } from "./index";

const COMBINING_MARK = /\p{Mn}/u;

/**
 * A Greek letter, in either the basic block or Greek Extended (which holds the
 * precomposed accented forms). Written as a Unicode property test rather than a
 * hand-listed range so no accented form is accidentally excluded.
 */
const GREEK_LETTER = /\p{Script=Greek}/u;

const FINAL_SIGMA = "ς";
const SIGMA = "σ";

/** Greek stems are conventionally written with a hyphen: λυ-, πιστευ-. */
const HYPHEN = "-";

/**
 * Split a Greek word into letter clusters.
 *
 * Normalised to NFC first so indices are stable regardless of how the source
 * was encoded. Without this the same visible word could yield a different
 * letter count depending on whether it arrived composed or decomposed — and
 * every morpheme index would shift with it.
 */
export function toLetterClusters(word: string): LetterCluster[] {
  const clusters: LetterCluster[] = [];
  for (const ch of word.normalize("NFC")) {
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

/**
 * Remove every accent, breathing, iota subscript and diaeresis.
 *
 * Decomposition is required: in NFC the marks are part of the code point, so a
 * naive combining-mark filter is a silent no-op on ordinary Greek text.
 */
export function stripDiacritics(word: string): string {
  return word
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "")
    .normalize("NFC");
}

/**
 * Normalise for comparison, search and stem matching: diacritics removed, final
 * sigma folded onto sigma, lowercased.
 */
export function fold(word: string): string {
  return stripDiacritics(word).replace(new RegExp(FINAL_SIGMA, "g"), SIGMA).toLowerCase();
}

export function isGreekLetter(cluster: LetterCluster): boolean {
  return GREEK_LETTER.test(cluster.base) && /\p{L}/u.test(cluster.base);
}

export const greekScript: ScriptModule = {
  id: "greek",
  direction: "ltr",
  // BCP-47 for Ancient Greek (to 1453). Distinct from modern "el".
  lang: "grc",

  // Greek has no honest diacritic-fading progression — see the header note.
  stages: 0,
  fade: (word) => word,

  toLetterClusters,
  stripDiacritics,
  fold,
  isLetter: isGreekLetter,
  /*
   * A Greek stem is written contiguous with a trailing hyphen — πολ-, δικ-,
   * λυ-. Hebrew interposes a maqqef (שׁ־מ־ר) because a Semitic root is a
   * discontinuous pattern of consonants; a Greek stem is a literal substring,
   * so interposing anything misrepresents it.
   */
  joinLetters: (letters) =>
    toLetterClusters(letters)
      .map((c) => c.text)
      .join("") + HYPHEN,
};

registerScript(greekScript);
