import { SunriseGame } from "../sunrise/SunriseGame";
import type { GameChrome } from "../sunrise/types";
import { LEVELS, LIGHT_PER_QUESTION, lightBefore } from "./levels";

/**
 * In the Beginning — reading John 1:1–5, one verse at a time.
 *
 * The Greek counterpart to Day One, on the same engine. What differs is the
 * content, the direction, and one line of copy that would otherwise be a lie:
 * the rebuild drill tells Hebrew players to work right to left, and Greek does
 * not. Getting that wrong in the one drill whose whole subject is word order
 * would be worse than getting it wrong anywhere else.
 *
 * THE FINALE IS NOT DAY ONE'S REWORDED. Day One ends on "not one tense named",
 * because the thing a Hebrew learner has been spared is paradigm tables. A
 * Greek learner has been spared something more specific — the case grid — and
 * has instead been taught to read the endings for what they do. The closing
 * line says that.
 */
const CHROME: GameChrome = {
  gameId: "greek-in-beginning",
  language: "greek",
  direction: "ltr",
  scriptClass: "greek",
  hero: "ἐν ἀρχῇ",
  title: "In the Beginning",
  eyebrow: "John 1 · verses 1–5",
  lede: "Read the opening of John in Greek. Not translate it — read it. You will never be asked to name a case or a tense, and nothing is taken from you for guessing wrong.",
  rebuildPrompt: "Rebuild the verse. Left to right.",
  rebuildHint: "start at the left →",
  finale: {
    eyebrow: "John 1:1–5",
    lead: "You read that.",
    body: "Not one case named, not one table memorised. You read the endings for what they were doing — which is what reading Greek is.",
  },
};

export function InBeginningScreen() {
  return (
    <SunriseGame
      chrome={CHROME}
      levels={LEVELS}
      lightPerQuestion={LIGHT_PER_QUESTION}
      lightBefore={lightBefore}
    />
  );
}
