import type { ContentBundle } from "../../schema";
import { passages, sections, words } from "./generated";

/**
 * Ruth, whole, as a reading path.
 *
 *   Track    Ruth               — the book
 *     Section  Chapter 1–4      — how a book is actually read
 *       Unit     two verses     — a scene
 *
 * Derived from the text's own order, as Jonah is: a continuous book supplies
 * its own sequence, so there is no hand-authored unit list to drift from the
 * content.
 *
 * WHY RUTH SECOND. Vocabulary compounds inside a book far harder than between
 * books (coverage-findings.md §4a). Finishing Jonah leaves a reader at 52% of
 * Ruth — enough that Ruth is a step up rather than a fresh start, and not so
 * much that it is a re-read. Ruth is also the easiest continuous Hebrew in the
 * canon: 85 verses of narrative prose, more than half of it dialogue.
 *
 * Chapter 1 carries 123 of the book's 310 lexemes — 40% in the first quarter,
 * the same front-loading every book has. The section headers show new-word
 * counts rather than pretending the chapters cost the same.
 */

const VERSES_PER_UNIT = 2;

/**
 * Scene titles, keyed by chapter then by position within it.
 *
 * Hand-written: a corpus can say which verses come next, not what happens in
 * them. Anything unnamed falls back to its verse range, so a book can ship
 * before every scene has been named.
 */
const TITLES: Record<string, string[]> = {
  "1": [
    "A Famine in Bethlehem",
    "Naomi Is Left Alone",
    "She Hears the LORD Has Given Bread",
    "Go, Return Each of You",
    "Have I Yet Sons?",
    "Orpah Kisses, Ruth Clings",
    "Whither Thou Goest",
    "The Two of Them Went On",
    "Is This Naomi?",
    "Call Me Mara",
    "At the Barley Harvest",
  ],
  "2": [
    "A Mighty Man of Valour",
    "Let Me Go and Glean",
    "Her Chance Chanced",
    "The LORD Be With You",
    "Whose Damsel Is This?",
    "Go Not to Glean in Another Field",
    "Why Have I Found Favour?",
    "It Hath Been Told Me",
    "A Full Reward From the LORD",
    "Come Hither and Eat",
    "Let Her Glean Among the Sheaves",
    "An Ephah of Barley",
  ],
  "3": [
    "Shall I Not Seek Rest for Thee?",
    "Wash Thyself and Go Down",
    "All That Thou Sayest I Will Do",
    "At Midnight the Man Was Startled",
    "Spread Thy Skirt Over Thy Handmaid",
    "A Virtuous Woman",
    "There Is a Nearer Kinsman",
    "Lie Down Until the Morning",
    "Six Measures of Barley",
  ],
  "4": [
    "Ho, Such a One! Turn Aside",
    "Naomi Selleth the Parcel of Land",
    "I Cannot Redeem It",
    "The Drawing Off of the Shoe",
    "Ye Are Witnesses This Day",
    "Like Rachel and Like Leah",
    "The LORD Gave Her Conception",
    "A Son Is Born to Naomi",
    "These Are the Generations",
    "Hezron, Ram, Amminadab",
    "Salmon Begat Boaz, and Boaz Obed",
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
  const id = `rut${String(i + 1).padStart(2, "0")}`;
  const chapter = chapterOf(group[0]!.id);
  const positionInChapter = groups.filter((g) => chapterOf(g[0]!.id) === chapter).indexOf(group);

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
    requires: i === 0 ? null : `rut${String(i).padStart(2, "0")}`,
    // Levels rise across the book so placement can grant early chapters.
    placementLevel: Math.min(4, Number(chapter) - 1),
    wordIds: fresh,
    // Every verse the unit covers, plus the one it ends on. Recording only the
    // milestone left half of Jonah unlocked by nothing and displayed nowhere.
    passageIds: group.map((p) => p.id),
    passageId: group[group.length - 1]!.id,
    sectionId: `ruth-${chapter}`,
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
