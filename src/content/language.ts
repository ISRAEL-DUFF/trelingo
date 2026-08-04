/**
 * Languages — the top level of the content hierarchy.
 *
 *   Language   Hebrew, Greek, later Latin
 *     Variety    Biblical Hebrew, Modern Hebrew / Koine Greek, Attic Greek
 *       Track      Shoresh, Jonah
 *         Unit       a lesson
 *
 * A LANGUAGE owns only what is true of the writing system: which script, which
 * font. Nothing about grammar or teaching lives here, because Biblical and
 * Modern Hebrew share an alphabet and very little else.
 *
 * Everything grammatical belongs to the VARIETY (see variety.ts), and a
 * curriculum belongs to the TRACK (see course.ts).
 *
 * The middle level was missing until now, which put Koine and Attic — varieties
 * — at the same level as Shoresh and Jonah, which are tracks inside a single
 * variety. Adding Modern Hebrew is what makes that error obvious: it belongs
 * beside Biblical Hebrew, not beside Jonah.
 */
import { scriptFor, type ScriptId, type ScriptModule } from "@/lib/script";
import "@/lib/script/hebrew"; // registers the Hebrew script module
import "@/lib/script/greek"; // registers the Greek script module

export type LanguageId = "hebrew" | "greek" | "latin";

export interface Language {
  id: LanguageId;
  /** "Hebrew", "Greek". */
  name: string;

  /** Which script module supplies clustering, folding and direction. */
  script: ScriptId;
  fontStack: string;
}

export const HEBREW: Language = {
  id: "hebrew",
  name: "Hebrew",
  script: "hebrew",
  fontStack: "'Frank Ruhl Libre', 'Times New Roman', serif",
};

export const GREEK: Language = {
  id: "greek",
  name: "Greek",
  // Gentium Plus has full polytonic coverage. Frank Ruhl Libre has no Greek
  // glyphs at all — measured, not assumed (greek-build-plan.md §3.5).
  script: "greek",
  fontStack: "'Gentium Plus', 'New Athena Unicode', 'Times New Roman', serif",
};

export const languages: Language[] = [HEBREW, GREEK];
export const languageById = new Map(languages.map((l) => [l.id, l]));

export function getLanguage(id: LanguageId): Language {
  const l = languageById.get(id);
  if (!l) throw new Error(`Unknown language "${id}"`);
  return l;
}

export function scriptOfLanguage(language: Language): ScriptModule {
  return scriptFor(language.script);
}
