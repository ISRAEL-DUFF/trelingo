import type { ContentBundle } from "../../schema";
import { passages, sections, words } from "./generated";

/**
 * Jonah, whole, as a reading path.
 *
 *   Track    Jonah              — the book
 *     Section  Chapter 1–4      — how a book is actually read
 *       Unit     two verses     — a scene
 *
 * The other tracks hand-author a unit list, because their passages are
 * scattered verses chosen for what they teach. This one is a continuous text,
 * so the path is derived from the text itself: verses in order, each unit
 * introducing exactly the words first met in its verses.
 *
 * WHY WHOLE-BOOK, MEASURED. Vocabulary compounds far harder inside a book than
 * between books (coverage-findings.md §4a). Finishing Jonah leaves a reader at
 * 52% of Ruth; finishing Genesis 6 leaves them at 90% of Genesis 7. Reading one
 * book to the end is the shape that pays.
 *
 * Chapter 1 carries 99 of the book's 245 lexemes — 40% of the whole book in its
 * first quarter. That wall is a property of every book, not a flaw in this one,
 * and it is why the section headers show new-word counts rather than pretending
 * chapters cost the same.
 */

const VERSES_PER_UNIT = 2;

/**
 * Scene titles, keyed by chapter then by position within it.
 *
 * Hand-written: a corpus can say which verses come next, not what happens in
 * them. Anything unnamed falls back to its verse range, so adding a book does
 * not require naming every scene before it can ship.
 */
const TITLES: Record<string, string[]> = {
  "1": [
    "The Word Comes to Jonah",
    "He Goes Down to Joppa",
    "The Storm",
    "Casting Lots",
    "I Am a Hebrew",
    "What Shall We Do?",
    "They Row Hard",
    "The Sea Grows Calm",
  ],
  "2": [
    "Out of the Fish's Belly",
    "Out of the Depths",
    "The Waters Closed In",
    "To the Roots of the Mountains",
    "Salvation Is the LORD's",
    "And It Vomited Him Out",
  ],
  "3": [
    "A Second Time",
    "Forty Days More",
    "Nineveh Believes",
    "The King's Decree",
    "God Relents",
  ],
  "4": [
    "Jonah Is Angry",
    "Better for Me to Die",
    "The Gourd",
    "The Worm and the East Wind",
    "Do You Do Well to Be Angry?",
    "And Also Much Cattle",
  ],
};

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
  const id = `jon${String(i + 1).padStart(2, "0")}`;
  const chapter = chapterOf(group[0]!.id);
  const positionInChapter = groups
    .filter((g) => chapterOf(g[0]!.id) === chapter)
    .indexOf(group);

  // Words first met here. A word introduced in chapter 1 is not re-taught in
  // chapter 3 — it returns through the review queue instead, which is the
  // repetition a continuous text gives for free.
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
    // Every unit ends in real text — that is the whole design.
    type: "reading" as const,
    requires: i === 0 ? null : `jon${String(i).padStart(2, "0")}`,
    // Levels rise across the book so placement can grant early chapters.
    placementLevel: Math.min(4, Number(chapter) - 1),
    wordIds: fresh,
    // Every verse the unit covers, plus which one it ends on. Recording only
    // the milestone left the other verse of each pair unlocked by nothing and
    // shown nowhere — half of Jonah, including both descent verses (1:3, 1:5).
    passageIds: group.map((p) => p.id),
    passageId: group[group.length - 1]!.id,
    sectionId: `jonah-${chapter}`,
    exercises: vocabDrills(id, fresh),
  };
});
