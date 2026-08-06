import type { LanguageId } from "@/content/language";

/**
 * The shape a "sunrise" game runs on — one verse at a time, night to dawn.
 *
 * Extracted from Day One when the Greek game arrived, unchanged. Both games
 * feed the same engine; only the content and the script differ.
 *
 * THE STANCE IS PART OF THE TYPE, or as close as a type can get. There is a
 * `who` drill and a `when` drill and no `parse` drill, because the games ask
 * what a form MEANS and never what it is CALLED. A learner is asked "who was?"
 * and answers "she was" — not "3fs perfect", not "aorist indicative". Adding a
 * drill that names a paradigm would need a new variant here, and the
 * banned-terms tests in each game's levels.test.ts exist to make that a
 * deliberate act rather than a slip.
 */

/** One word of the verse, with the gloss shown when it is tapped. */
export type VerseWord = readonly [text: string, gloss: string];

export type Drill =
  /** Script shown, choose the English. */
  | { t: "meaning"; he: string; ans: string; opts: string[]; why?: string }
  /** English shown, choose the script. */
  | { t: "reverse"; en: string; ans: string; opts: string[]; why?: string }
  /** Tap every word in the verse that matches the prompt. */
  | { t: "tapAll"; prompt: string; pick: number[]; why: string }
  /** Person, asked as "who", never as a parsing code. */
  | { t: "who"; he: string; prompt: string; ans: string; opts: string[]; why: string }
  /** Happened, or wanted — aspect without the word "aspect". */
  | { t: "when"; he: string; prompt: string; ans: string; opts: string[]; why: string }
  /** Rebuild the whole verse. */
  | { t: "order" };

export interface Level {
  ref: string;
  title: string;
  teach: { he: string; en: string; line: string };
  verse: VerseWord[];
  drills: Drill[];
}

/**
 * Everything the engine needs that is not a level.
 *
 * `direction` is not cosmetic. The rebuild drill tells the player which way to
 * work, and "right to left" is simply false for Greek — a Greek game that
 * inherited Day One's instruction would be teaching the wrong thing in the one
 * drill whose whole subject is word order.
 */
export interface GameChrome {
  gameId: string;
  language: LanguageId;
  direction: "rtl" | "ltr";
  /** Class carrying the script font, e.g. "greek" — see global.css. */
  scriptClass: string;
  /** The game's own name, in its script. */
  hero: string;
  title: string;
  eyebrow: string;
  lede: string;
  /** "Rebuild the verse. Right to left." */
  rebuildPrompt: string;
  /** The hint in the empty rebuild line, e.g. "start at the right →". */
  rebuildHint: string;
  finale: { lead: string; body: string; eyebrow: string };
}
