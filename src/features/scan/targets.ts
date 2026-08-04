import type { CourseContent } from "@/content";
import { passagesOf, type Passage, type Unit } from "@/content/schema";
import { scriptOf } from "@/content/course";

/**
 * Scan-and-find: chase one root through a chapter, against the clock.
 *
 * Scanning is a real reading skill and no competitor trains it. Every other
 * exercise in this app stops the learner on a single word; this one asks them to
 * move over text they are NOT stopping to parse, which is what reading a page
 * rather than a flashcard actually feels like.
 *
 * WHY ROOTS, NOT WORDS. The prompt names a MEANING — "find where Jonah goes
 * down" — and the answers are forms that do not resemble each other: וַיֵּרֶד,
 * יָרַד, יָרַדְתִּי. A learner cannot solve that by matching a shape, which is the
 * failure mode that would make this a visual search puzzle instead of reading.
 * So a target must take at least two DISTINCT forms, folded (see below).
 *
 * FUNCTION WORDS ARE EXCLUDED TWICE OVER. Ranked by raw frequency the top
 * targets in Jonah 1 are אֶל "to, unto" and כִּי "because" — particles whose
 * glosses are not meanings a learner can hold in mind while scanning. Those
 * carry no `familyId` at all, so restricting targets to families dropped them
 * for free. Greek does not cooperate: αὐτός has a perfectly good stem αὐτ- and
 * came out the TOP target in three of 1 John's five chapters. So the rule
 * Hebrew got by accident is now stated explicitly, by part of speech.
 *
 * FOLD BEFORE COUNTING FORMS. Raw text made יְהוָה look like six different forms
 * in one chapter; the differences were cantillation. `fold` strips marks and
 * normalises final letters, so "distinct forms" means distinct morphology.
 */

/** One place in the text where the target appears. */
export interface ScanHit {
  passageId: string;
  tokenIndex: number;
  /** Surface form as printed, for the answer review. */
  text: string;
}

export interface ScanTarget {
  /** The family being chased. */
  familyId: string;
  /** Its letters, e.g. "ירד" — shown after the round, never before. */
  letters: string;
  /** The prompt, stated as a meaning: "to go down". */
  gloss: string;
  hits: ScanHit[];
  /** Distinct folded forms among the hits — how much shape-matching is defeated. */
  forms: number;
  /** How many verses the hits span. */
  verses: number;
}

/** A target below this is a lookup, not a search. */
const MIN_HITS = 2;
/** Below this the learner can match a shape instead of reading. */
const MIN_FORMS = 2;
/**
 * A target confined to one verse is not a scan.
 *
 * "Find both places THIS SENTENCE says god" is a reading-comprehension question
 * about a single verse; the exercise is supposed to be rapid movement across a
 * chapter you are not stopping to parse. Without this the Koine track offered
 * exactly one round — θε, twice inside John 1:1 — which looked like the feature
 * working and was the feature not working.
 */
const MIN_VERSES = 2;

/**
 * Targets available across a set of passages, best first.
 *
 * "Best" is most distinct forms, then most hits, then most verses spanned — in
 * that order, because form variety is what makes the round a reading exercise
 * and the rest is only size.
 */
export function scanTargets(content: CourseContent, passages: readonly Passage[]): ScanTarget[] {
  const fold = scriptOf().fold;
  const groups = new Map<string, { hits: ScanHit[]; forms: Set<string>; verses: Set<string> }>();

  for (const p of passages) {
    p.tokens.forEach((t, tokenIndex) => {
      if (!t.familyId) return;
      const g = groups.get(t.familyId) ?? { hits: [], forms: new Set(), verses: new Set() };
      g.hits.push({ passageId: p.id, tokenIndex, text: t.text });
      g.forms.add(fold(t.text));
      g.verses.add(p.id);
      groups.set(t.familyId, g);
    });
  }

  /**
   * Parts of speech that cannot be a scan prompt.
   *
   * Restricting targets to families excluded Hebrew's particles for free,
   * because the importer derives no root for them. Greek is different: αὐτός
   * has a perfectly good stem αὐτ-, and it came out as the TOP target in three
   * of 1 John's five chapters. "Find every place the text says 'he, she, it'"
   * is not a reading exercise, and its gloss is not a meaning a learner can
   * hold in mind while scanning. The rule the Hebrew side got by accident is
   * stated here on purpose.
   */
  const FUNCTION_POS = new Set(["pronoun", "particle", "conjunction", "preposition"]);
  const isContentful = (familyId: string) => {
    const members = content.wordsByFamily[familyId] ?? [];
    return members.length > 0 && members.some((w) => !FUNCTION_POS.has(w.partOfSpeech));
  };

  const out: ScanTarget[] = [];
  for (const [familyId, g] of groups) {
    if (!isContentful(familyId)) continue;
    if (g.hits.length < MIN_HITS || g.forms.size < MIN_FORMS || g.verses.size < MIN_VERSES) continue;
    const family = content.familyById.get(familyId);
    // A family with no gloss cannot be prompted by meaning, and prompting by
    // form is the one thing this exercise must never do.
    if (!family?.coreGloss) continue;
    out.push({
      familyId,
      letters: family.letters,
      gloss: family.coreGloss,
      hits: g.hits,
      forms: g.forms.size,
      verses: g.verses.size,
    });
  }

  return out.sort(
    (a, b) => b.forms - a.forms || b.hits.length - a.hits.length || b.verses - a.verses || a.familyId.localeCompare(b.familyId),
  );
}

/**
 * The passages a learner may be asked to scan.
 *
 * Only verses they have actually finished. Scanning unread text would be a
 * different exercise — and a worse one, since the whole point is moving quickly
 * over language you already know.
 *
 * Scoped to one section when the track has chapters, because "search a chapter"
 * is the unit a reader thinks in; a whole book would be a haystack.
 */
export function scanScope(
  content: CourseContent,
  completedUnitIds: ReadonlySet<string>,
  sectionId?: string,
): Passage[] {
  const inScope = (u: Unit) => completedUnitIds.has(u.id) && (!sectionId || u.sectionId === sectionId);
  const ids = new Set(content.units.filter(inScope).flatMap(passagesOf));
  // Text order, which is the order they will be displayed and searched in.
  return content.passages.filter((p) => ids.has(p.id));
}

/** Is there anything worth scanning here yet? */
export function canScan(content: CourseContent, completedUnitIds: ReadonlySet<string>, sectionId?: string): boolean {
  return scanTargets(content, scanScope(content, completedUnitIds, sectionId)).length > 0;
}

/**
 * Pick the round's target.
 *
 * Rotates by `round` through the available targets rather than always taking
 * the best one, so scanning the same chapter twice is not the same game. The
 * ordering still puts the richest targets first, so an early round is a good
 * one.
 */
export function pickTarget(targets: readonly ScanTarget[], round: number): ScanTarget | undefined {
  if (!targets.length) return undefined;
  return targets[round % targets.length];
}

/** Every token index in a passage that counts as a hit for this target. */
export function hitsIn(target: ScanTarget, passageId: string): Set<number> {
  return new Set(target.hits.filter((h) => h.passageId === passageId).map((h) => h.tokenIndex));
}
