import { contentFor } from "@/content";
import type { CourseId } from "@/content/course";
import type { Drill, Level, VerseWord } from "./sunrise/types";

/**
 * Build a game level from the corpus plus an authored overlay.
 *
 * WHAT THE CORPUS CAN AND CANNOT GIVE. It supplies the text — accented, from a
 * critical edition, in the right order — the token boundaries, the translation,
 * and roughly half the glosses. It cannot supply a single teaching line, a
 * single `why`, or the order the drills come in. Those are a designed sequence
 * with a stance, not facts about a text, and this file does not pretend
 * otherwise: everything pedagogical arrives in the overlay, hand-written.
 *
 * THE REAL WIN IS CORRECTNESS, NOT EFFORT, and it is worth being precise about
 * how much was actually won. Day One's Hebrew was typed by hand out of a
 * prototype and had never been checked. When Genesis 1–11 landed as a track it
 * finally could be, character by character: the hand-typed text turned out to
 * be RIGHT — every consonant, every vowel point, every shin and sin dot. What
 * it lacked was cantillation and meteg, in eight places.
 *
 * So the win here is not that a pile of errors got fixed. It is that the text
 * is now derived rather than trusted, there is one copy of it instead of two,
 * and the next game does not depend on whoever types it being that careful.
 *
 * WHY GLOSSES MUST BE OVERRIDABLE, measured rather than assumed. Passage-token
 * glosses in the bundles are CITATION glosses: John 1:1's ἦν is glossed "I am",
 * Jonah 1:1's וַיְהִי is "to be, to happen". Across the whole of Jonah, 49% of
 * passage tokens carry a multi-sense gloss and 33% an infinitive citation form;
 * across John, 34% multi-sense and 3,889 first-person forms. That is correct in
 * a lesson, where the learner is meeting a lemma and wants what a dictionary
 * would say. It is wrong in a game that shows a word and says what it means
 * RIGHT HERE — "I am" under ἦν is simply false.
 *
 * So `gloss` overrides by token index, and the overlay is expected to use it
 * heavily. Task #45 (coreGloss optional, divergence flag) is the real fix; this
 * is the narrow version of it that a game can carry today.
 */

/** A citation form taught bare, with the meaning that goes with it. */
export interface Lemma {
  text: string;
  gloss: string;
}

/**
 * A drill written against token INDICES rather than repeated strings.
 *
 * `lemma` replaces both the form shown AND its gloss, and exists for ONE case:
 * a drill that deliberately teaches a word bare where the verse has it
 * prefixed. Day One asks what חֹשֶׁךְ means before the verse's וְחֹשֶׁךְ, and
 * what מַיִם means before הַמָּיִם — because the very next drill teaches the
 * הַ, and meeting the noun first is the point.
 *
 * BOTH FIELDS, NEVER ONE. Overriding only the form leaves the answer keyed to
 * the token, so the screen shows חֹשֶׁךְ and marks "and darkness" correct —
 * grading the prefix the drill has not taught yet. That is exactly what a
 * byte-diff against the pre-conversion output caught, and why the two travel
 * together in one field rather than as two optional ones.
 *
 * Anything in `lemma` is hand-typed TEACHING copy, not text, and the corpus
 * guarantee does not extend to it.
 */
export type DrillSpec =
  /** Show the word at `token`, choose the English. */
  | { t: "meaning"; token: number; lemma?: Lemma; opts?: string[]; why?: string }
  /** Show the English of `token`, choose the word. */
  | { t: "reverse"; token: number; opts?: string[]; why?: string }
  | { t: "tapAll"; prompt: string; pick: number[]; why: string }
  | { t: "who"; token: number; lemma?: Lemma; prompt: string; ans: string; opts: string[]; why: string }
  | { t: "when"; token: number; lemma?: Lemma; prompt: string; ans: string; opts: string[]; why: string }
  | { t: "order" };

export interface LevelSource {
  courseId: CourseId;
  /**
   * Drop the cantillation marks from the displayed text.
   *
   * FOR BEGINNER GAMES ONLY, and opt-in so it is never a silent edit of the
   * source. The te'amim are the chant and the phrasing, and a Hebraist wants
   * them — but Day One is aimed at somebody meeting the alphabet, and a first
   * verse carrying both vowel points and accents is a wall of marks. The
   * tracks show the text whole; a game teaching letters may reasonably not.
   *
   * What comes off: U+0591–U+05AF (te'amim), U+05BD (meteg/silluq), U+05C0
   * (paseq), U+05C3 (sof pasuq). What NEVER comes off: U+05B0–U+05BC, the
   * vowel points and dagesh, U+05C7 qamats qatan, and above all U+05C1/U+05C2,
   * the shin and sin dots — those are letter identity, not decoration, and
   * stripping them merges שׂ with שׁ. That bug has been fixed twice in this
   * codebase and will not be reintroduced here.
   */
  strip?: "cantillation";
  /** e.g. "john-1-1" — must exist in that course's bundle. */
  passageId: string;
  title: string;
  teach: { he: string; en: string; line: string };
  /**
   * Contextual glosses, by token index. See the header — expect to write many.
   * Anything not overridden keeps the corpus gloss.
   */
  gloss?: Record<number, string>;
  drills: DrillSpec[];
}

/**
 * Distractors for a token, taken from the corpus, or null if they cannot be.
 *
 * `Word.distractors` are wrong answers to "what does this LEMMA mean?". The
 * moment the overlay overrides a gloss, they are wrong answers to a different
 * question — offering "I seize, I overtake" as the right answer's neighbours
 * when the right answer is now "overcame it" produces a drill where more than
 * one option is defensible. So they are reused only where the displayed gloss
 * is still the lemma gloss, and the overlay writes its own everywhere else.
 *
 * corpus.test.ts enforces this rather than trusting anyone to remember it.
 */
export function corpusDistractors(
  courseId: CourseId,
  wordId: string | null,
  shownGloss: string,
): string[] | null {
  if (!wordId) return null;
  const word = contentFor(courseId).words.find((w) => w.id === wordId);
  if (!word) return null;
  if (word.gloss !== shownGloss) return null;
  return word.distractors.length >= 3 ? word.distractors.slice(0, 3) : null;
}

/**
 * Remove cantillation, keeping every vowel point and both ש dots.
 *
 * The ranges are spelled out rather than written as "\p{Mn} minus a few",
 * because the marks are invisible in source and a class that looked right
 * would be impossible to review.
 */
const CANTILLATION = /[\u0591-\u05AF\u05BD\u05C0\u05C3]/g;

export function stripCantillation(text: string): string {
  return text.normalize("NFD").replace(CANTILLATION, "").normalize("NFC");
}

/** The passage a source points at, with a readable error when it is missing. */
export function passageOf(source: LevelSource) {
  const passage = contentFor(source.courseId).passages.find((p) => p.id === source.passageId);
  if (!passage) {
    throw new Error(`no passage "${source.passageId}" in course "${source.courseId}"`);
  }
  return passage;
}

/** Resolve one authored source against the corpus. */
export function buildLevel(source: LevelSource): Level {
  const passage = passageOf(source);
  const glossAt = (i: number): string => source.gloss?.[i] ?? passage.tokens[i]?.gloss ?? "";
  const show = (text: string) => (source.strip === "cantillation" ? stripCantillation(text) : text);

  const verse: VerseWord[] = passage.tokens.map((t, i) => [show(t.text), glossAt(i)] as const);

  const drills: Drill[] = source.drills.map((d) => {
    if (d.t === "order" || d.t === "tapAll") return d;

    const token = passage.tokens[d.token];
    if (!token) throw new Error(`${source.passageId}: no token ${d.token}`);
    // A bare-lemma drill answers for the lemma, not for the token it sits on.
    const lemma = "lemma" in d ? d.lemma : undefined;
    const shown = lemma?.gloss ?? glossAt(d.token);
    const face = lemma?.text ?? show(token.text);

    if (d.t === "meaning") {
      const opts = d.opts ?? withAnswer(corpusDistractors(source.courseId, token.wordId, shown), shown);
      if (!opts) throw new Error(`${source.passageId} token ${d.token}: needs written options`);
      return { t: "meaning", he: face, ans: shown, opts, ...(d.why ? { why: d.why } : {}) };
    }
    if (d.t === "reverse") {
      const opts = d.opts;
      if (!opts) throw new Error(`${source.passageId} token ${d.token}: reverse needs options`);
      return { t: "reverse", en: shown, ans: show(token.text), opts, ...(d.why ? { why: d.why } : {}) };
    }
    // `token` and `lemma` are authoring inputs and must not survive into the
    // resolved drill — the engine has no use for them and a leaked field shows
    // up in every snapshot and equality check downstream.
    const { token: _t, lemma: _l, ...rest } = d;
    return { ...rest, he: face };
  });

  return { ref: passage.reference, title: source.title, teach: source.teach, verse, drills };
}

/** The answer belongs among its distractors, and the engine shuffles. */
function withAnswer(distractors: string[] | null, answer: string): string[] | null {
  return distractors ? [answer, ...distractors] : null;
}

export const buildLevels = (sources: LevelSource[]): Level[] => sources.map(buildLevel);
