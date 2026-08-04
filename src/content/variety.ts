/**
 * Varieties — a form of a language, and the middle level of the hierarchy.
 *
 *   Language   Hebrew, Greek
 *     Variety    Biblical Hebrew, Modern Hebrew / Koine Greek, Attic Greek   ← here
 *       Track      Shoresh, Jonah
 *         Unit       a lesson
 *
 * Everything grammatical lives here, because grammar is a property of the
 * variety rather than of the script. Biblical and Modern Hebrew share an
 * alphabet and a font and disagree about almost everything else — pointing,
 * vocabulary, which forms are alive. Koine and Attic share far more, but
 * nothing guarantees that, and pretending otherwise is how Attic ended up
 * inheriting decisions made for Koine.
 *
 * This level was missing until now, which put Koine and Attic at the same
 * level as Shoresh and Jonah. Those are not the same kind of thing: Koine is a
 * form of Greek, Jonah is a curriculum. Adding Modern Hebrew makes the error
 * obvious — it belongs beside Biblical Hebrew, not beside Jonah.
 *
 * A variety owns no content. Its tracks do.
 */
import { GREEK_PARSE_FIELDS, HEBREW_PARSE_FIELDS, type ParseFieldDef } from "./parse-fields";
import { getLanguage, type Language, type LanguageId } from "./language";

export type VarietyId = "biblical-hebrew" | "modern-hebrew" | "koine-greek" | "attic-greek";

export interface Variety {
  id: VarietyId;
  language: LanguageId;
  /** "Biblical Hebrew", "Koine Greek". */
  name: string;
  /** One line on what this form of the language is. */
  subtitle: string;

  /** Whether this variety has an honest diacritic-fading progression. */
  supportsFading: boolean;

  /** What this variety calls the morpheme it teaches: "root", "stem". */
  morphemeNoun: string;

  /** How this variety's diacritics are described to the learner. */
  diacriticsCopy: {
    /** Field label, e.g. "Vowel points (niqqud)". */
    label: string;
    always: string;
    fading: string;
    off: string;
  };

  /** Morphological fields this variety uses, with their legal values. */
  parseFields: ParseFieldDef[];
}

export const BIBLICAL_HEBREW: Variety = {
  id: "biblical-hebrew",
  language: "hebrew",
  name: "Biblical Hebrew",
  subtitle: "The Hebrew Bible",
  morphemeNoun: "root",
  supportsFading: true,
  parseFields: HEBREW_PARSE_FIELDS,
  diacriticsCopy: {
    label: "Vowel points (niqqud)",
    always: "Full pointing everywhere.",
    fading:
      "Points drop away in stages as each word's card matures, so you're weaned onto unpointed text.",
    off: "Consonants only, as in a Torah scroll.",
  },
};

export const KOINE_GREEK: Variety = {
  id: "koine-greek",
  language: "greek",
  name: "Koine Greek",
  subtitle: "New Testament · Septuagint",
  morphemeNoun: "stem",
  // Unaccented Greek is not a reading target — greek-build-plan.md §4.5.
  supportsFading: false,
  parseFields: GREEK_PARSE_FIELDS,
  diacriticsCopy: {
    label: "Accents and breathings",
    always: "Accents and breathings shown, as in every printed edition.",
    // Offered, but not as a learning ramp: accents can be contrastive
    // (τίς "who?" vs τις "someone").
    fading: "Not available for Greek — accents carry meaning and are never dropped.",
    off: "Bare letters, as in an inscription or an early manuscript.",
  },
};

export const ATTIC_GREEK: Variety = {
  id: "attic-greek",
  language: "greek",
  name: "Attic Greek",
  subtitle: "Classical Athens",
  // Attic agrees with Koine on all of this today. It is stated separately
  // rather than shared, because "the two Greek varieties happen to agree" is a
  // fact about the content, not a rule — Attic uses the dual and the optative
  // far more, and may yet need its own parse emphasis.
  morphemeNoun: "stem",
  supportsFading: false,
  parseFields: GREEK_PARSE_FIELDS,
  diacriticsCopy: KOINE_GREEK.diacriticsCopy,
};

export const varieties: Variety[] = [BIBLICAL_HEBREW, KOINE_GREEK, ATTIC_GREEK];
export const varietyById = new Map(varieties.map((v) => [v.id, v]));

export function getVariety(id: VarietyId): Variety {
  const v = varietyById.get(id);
  if (!v) throw new Error(`Unknown variety "${id}"`);
  return v;
}

export function languageOfVariety(variety: Variety): Language {
  return getLanguage(variety.language);
}

/** Varieties grouped under their language, in registration order. */
export function varietiesByLanguage(): { language: Language; varieties: Variety[] }[] {
  const out: { language: Language; varieties: Variety[] }[] = [];
  for (const v of varieties) {
    let bucket = out.find((b) => b.language.id === v.language);
    if (!bucket) {
      bucket = { language: getLanguage(v.language), varieties: [] };
      out.push(bucket);
    }
    bucket.varieties.push(v);
  }
  return out;
}
