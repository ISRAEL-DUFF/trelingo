import type { ContentBundle } from "../../schema";
import { passages, sections, words } from "./generated";

/**
 * Obadiah, whole, as a reading path.
 *
 *   Track    Obadiah            — the book
 *     Section  Chapter 1        — the only one there is
 *       Unit     two verses     — a move in the oracle
 *
 * Derived from the text's own order, as every other book here is.
 *
 * THE SHORTEST BOOK IN THE HEBREW BIBLE. 21 verses, 292 running words, eleven
 * units. Chosen by the same coverage measurement that picked Haggai and
 * Malachi: 58 new words to read it at 95%, behind only those two.
 *
 * A SINGLE-CHAPTER TRACK, and the first one. The section strip will show one
 * chip rather than a row of them, which is correct but worth having looked at.
 *
 * ON CITATION. Obadiah has no chapters, so scholarly citation is bare — verse
 * 15, not 1:15. The corpus numbers it as chapter 1 and this pipeline follows,
 * so the app reads "Obadiah 1:15". That is a display convention rather than an
 * error, and it is the same one most printed Bibles use.
 */

const VERSES_PER_UNIT = 2;

/**
 * Titles by position. Only one chapter, so the key is trivially "1".
 *
 * Hand-written: a corpus can say which verses come next, not what they argue.
 */
const TITLES: Record<string, string[]> = {
  "1": [
    "The Vision of Obadiah",
    "Though You Soar Like the Eagle",
    "Thieves Would Leave Gleanings",
    "Your Allies Have Deceived You",
    "Your Mighty Men Dismayed",
    "The Day You Stood Aloof",
    "Do Not Enter the Gate of My People",
    "As You Have Done, So Shall It Be Done",
    "Jacob a Fire, Esau Stubble",
    "The Negev Shall Possess Esau",
    "The Kingdom Shall Be the LORD's",
  ],
};

const chapterOf = (passageId: string) => passageId.split("-")[1]!;

const known = new Set<string>();
const byId = new Map(words.map((w) => [w.id, w]));

/** Passages grouped into units of two. */
const groups: (typeof passages)[] = [];
for (const p of passages) {
  const last = groups[groups.length - 1];
  const sameChapter = last && chapterOf(last[0]!.id) === chapterOf(p.id);
  if (!last || !sameChapter || last.length >= VERSES_PER_UNIT) groups.push([p]);
  else last.push(p);
}

export { sections };

export const units: ContentBundle["units"] = groups.map((group, i) => {
  const id = `oba${String(i + 1).padStart(2, "0")}`;
  const chapter = chapterOf(group[0]!.id);
  const positionInChapter = groups.filter((g) => chapterOf(g[0]!.id) === chapter).indexOf(group);

  const fresh: string[] = [];
  for (const p of group) {
    for (const t of p.tokens) {
      if (t.wordId && !known.has(t.wordId) && byId.has(t.wordId)) {
        known.add(t.wordId);
        fresh.push(t.wordId);
      }
    }
  }

  const first = group[0]!.reference;
  const last = group[group.length - 1]!.reference;
  const range = first === last ? first : `${first}–${last.split(":")[1]}`;

  return {
    id,
    orderIndex: i,
    title: TITLES[chapter]?.[positionInChapter] ?? range,
    subtitle: range,
    type: "reading" as const,
    requires: i === 0 ? null : `oba${String(i).padStart(2, "0")}`,
    // One chapter, eleven units, five levels — a level roughly every two units.
    placementLevel: Math.min(4, Math.floor(i / 2)),
    wordIds: fresh,
    passageIds: group.map((p) => p.id),
    passageId: group[group.length - 1]!.id,
    sectionId: `obad-${chapter}`,
    exercises: vocabDrills(id, fresh),
  };
});

/** Recognition drill for every new word; production for every second one. */
function vocabDrills(unitId: string, wordIds: string[]): ContentBundle["units"][number]["exercises"] {
  const out: ContentBundle["units"][number]["exercises"] = [];
  wordIds.forEach((wordId, i) => {
    out.push({
      id: `${unitId}-mc-${wordId}`,
      type: "mc_vocab",
      wordId,
      direction: "recognition",
      prompt: "What does this word mean?",
    });
    if (i % 2 === 1) {
      out.push({
        id: `${unitId}-mcp-${wordId}`,
        type: "mc_vocab",
        wordId,
        direction: "production",
        prompt: "Which word means this?",
      });
    }
  });
  return out;
}
