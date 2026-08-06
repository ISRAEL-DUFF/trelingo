import { SunriseGame } from "../sunrise/SunriseGame";
import type { GameChrome } from "../sunrise/types";
import { LEVELS, LIGHT_PER_QUESTION, lightBefore } from "./levels";

/**
 * Day One — reading Genesis 1:1–5, one verse at a time.
 *
 * Everything mechanical lives in ../sunrise/SunriseGame; this file is the
 * Hebrew half of what makes it Day One rather than the Greek game.
 *
 * ITS TEXT COMES FROM THE GENESIS 1–11 TRACK, through ../corpus.ts, as the
 * Greek game's does from John. The teaching — every gloss, every `why`, the
 * order of the drills — is still hand-written here, and always will be.
 */
const CHROME: GameChrome = {
  gameId: "hebrew-day-one",
  language: "hebrew",
  direction: "rtl",
  scriptClass: "hebrew",
  hero: "יוֹם אֶחָד",
  title: "Day One",
  eyebrow: "Genesis 1 · verses 1–5",
  lede: "Read the opening of the Bible in Hebrew. Not translate it — read it. You will never be asked to name a tense, and nothing is taken from you for guessing wrong.",
  rebuildPrompt: "Rebuild the verse. Right to left.",
  rebuildHint: "start at the right →",
  finale: {
    eyebrow: "Genesis 1:1–5",
    lead: "You read that.",
    body: "Not one tense named, not one paradigm memorised. Every word above you now recognise on sight — which is what reading is.",
  },
};

export function DayOneScreen() {
  return (
    <SunriseGame
      chrome={CHROME}
      levels={LEVELS}
      lightPerQuestion={LIGHT_PER_QUESTION}
      lightBefore={lightBefore}
    />
  );
}
