import type { ContentBundle } from "../../schema";
import { passages, sections, words } from "./generated";

/**
 * Haggai, whole, as a reading path.
 *
 *   Track    Haggai             — the book
 *     Section  Chapter 1–2      — how a book is actually read
 *       Unit     two verses     — an oracle, or a step in one
 *
 * Derived from the text's own order, as every other book here is.
 *
 * THE EASIEST COMPLETE BOOK IN THE CANON, for a reader who has done Jonah,
 * Ruth, Esther and Ecclesiastes. Measured against the 1,047 lexemes those four
 * teach, Haggai already reads at 76% of its running words, and 32 more words
 * carry it past 95% — the point where a book is read with a lexicon rather than
 * decoded with one. Nothing else is close: Obadiah needs 58 and Malachi 71.
 *
 * Twenty units. It is the smallest whole-book track in the app, and it is
 * meant to be: after Ecclesiastes' 113 units, finishing an entire prophet in an
 * evening is the point.
 *
 * A NOTE ON THE DATES. Every oracle is stamped with a regnal year, month and
 * day of Darius I, which makes Haggai the most precisely dated book in the
 * Hebrew Bible — the first falls on 29 August 520 BC by the usual reckoning.
 * The unit titles keep those dates where the text gives them.
 */

const VERSES_PER_UNIT = 2;

/**
 * Titles, keyed by chapter then by position within it.
 *
 * Hand-written: a corpus can say which verses come next, not what they say.
 * Anything unnamed falls back to its verse range.
 */
const TITLES: Record<string, string[]> = {
  "1": [
    "In the Second Year of Darius",
    "Your Panelled Houses",
    "Consider Your Ways",
    "Bring Wood and Build the House",
    "You Looked for Much",
    "I Called for a Drought",
    "I Am With You, Says the LORD",
    "On the Twenty-Fourth Day",
  ],
  "2": [
    "In the Seventh Month",
    "Who Is Left That Saw This House?",
    "My Spirit Abides Among You",
    "I Will Fill This House With Glory",
    "The Latter Glory Shall Be Greater",
    "Ask the Priests for a Ruling",
    "So Is This People Before Me",
    "Consider From This Day",
    "Blight, Mildew and Hail",
    "Is the Seed Yet in the Barn?",
    "I Will Shake the Heavens",
    "I Will Make You as a Signet Ring",
  ],
};

const chapterOf = (passageId: string) => passageId.split("-")[1]!;

const known = new Set<string>();
const byId = new Map(words.map((w) => [w.id, w]));

/** Passages grouped into units of two, without crossing a chapter boundary. */
const groups: (typeof passages)[] = [];
for (const p of passages) {
  const last = groups[groups.length - 1];
  const sameChapter = last && chapterOf(last[0]!.id) === chapterOf(p.id);
  if (!last || !sameChapter || last.length >= VERSES_PER_UNIT) groups.push([p]);
  else last.push(p);
}

export { sections };

export const units: ContentBundle["units"] = groups.map((group, i) => {
  const id = `hag${String(i + 1).padStart(2, "0")}`;
  const chapter = chapterOf(group[0]!.id);
  const positionInChapter = groups.filter((g) => chapterOf(g[0]!.id) === chapter).indexOf(group);

  // Words first met here — a word introduced in chapter 1 is not re-taught in
  // chapter 2, it returns through the review queue.
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
    requires: i === 0 ? null : `hag${String(i).padStart(2, "0")}`,
    // Only two chapters, so the levels split the book rather than the chapters:
    // a five-level ladder over twenty units is four units a level.
    placementLevel: Math.min(4, Math.floor(i / 4)),
    wordIds: fresh,
    passageIds: group.map((p) => p.id),
    passageId: group[group.length - 1]!.id,
    sectionId: `hag-${chapter}`,
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
