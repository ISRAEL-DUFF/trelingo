import type { ContentBundle } from "../../schema";
import { passages, sections, words } from "./generated";

/**
 * Malachi, whole, as a reading path.
 *
 *   Track    Malachi            — the book
 *     Section  Chapter 1–3      — how a book is actually read
 *       Unit     two verses     — a move in the argument
 *
 * Derived from the text's own order, as every other book here is.
 *
 * SECOND EASIEST BOOK IN THE CANON, on the measurement that chose Haggai: a
 * reader of Jonah, Ruth, Esther and Ecclesiastes already reads 77% of its
 * running words, and 71 more carry it past 95%.
 *
 * THREE CHAPTERS, NOT FOUR. The Hebrew runs to 3:24; what English Bibles print
 * as chapter 4 is 3:19–24 here. The WLC and JPS 1917 both use the Hebrew
 * numbering, so they align — but a reader coming from an English Bible will
 * find the last six verses one chapter earlier than expected.
 *
 * THE SHAPE OF THE BOOK is a quarrel. Six times the prophet states a charge,
 * the people answer back with a question — "wherein have we...?" — and he
 * replies. The unit titles keep that rhythm where the two verses fall together.
 */

const VERSES_PER_UNIT = 2;

/**
 * Titles, keyed by chapter then by position within it.
 *
 * Hand-written: a corpus can say which verses come next, not what they argue.
 * Anything unnamed falls back to its verse range.
 */
const TITLES: Record<string, string[]> = {
  "1": [
    "I Have Loved You, Says the LORD",
    "I Hated Esau",
    "They May Build, but I Will Throw Down",
    "A Son Honours His Father",
    "You Offer Polluted Bread",
    "Offer It to Your Governor",
    "Who Would Shut the Doors for Nothing?",
  ],
  "2": [
    "This Commandment Is for You, Priests",
    "I Will Spread Dung on Your Faces",
    "My Covenant Was With Him",
    "The Priest's Lips Should Guard Knowledge",
    "You Have Turned Aside From the Way",
    "Have We Not All One Father?",
    "Judah Has Married a Foreign God",
    "You Cover the Altar With Tears",
    "The Wife of Your Youth",
  ],
  "3": [
    "Behold, I Send My Messenger",
    "Who Can Endure the Day of His Coming?",
    "He Will Sit as a Refiner of Silver",
    "I Will Draw Near to Judgement",
    "I the LORD Do Not Change",
    "Will a Man Rob God?",
    "Bring the Whole Tithe Into the Storehouse",
    "All Nations Shall Call You Blessed",
    "It Is Vain to Serve God",
    "A Book of Remembrance Was Written",
    "The Day Comes, Burning as a Furnace",
    "Remember the Law of Moses",
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
  const id = `mal${String(i + 1).padStart(2, "0")}`;
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
    requires: i === 0 ? null : `mal${String(i).padStart(2, "0")}`,
    // Three chapters over five levels, so the ladder follows the units rather
    // than the chapters: 28 units, a level roughly every six.
    placementLevel: Math.min(4, Math.floor(i / 6)),
    wordIds: fresh,
    passageIds: group.map((p) => p.id),
    passageId: group[group.length - 1]!.id,
    sectionId: `mal-${chapter}`,
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
