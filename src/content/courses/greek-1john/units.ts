import type { ContentBundle } from "../../schema";
import { passages, sections, words } from "./generated";

/**
 * 1 John, whole, as a reading path.
 *
 *   Track    1 John             — the letter
 *     Section  Chapter 1–5      — how a text is actually read
 *       Unit     two verses     — a movement of the argument
 *
 * Derived from the text's own order, as Jonah and Ruth are: a continuous text
 * supplies its own sequence, so there is no hand-authored unit list to drift
 * from the content.
 *
 * WHY 1 JOHN FIRST IN GREEK. Measured against every other candidate: 2,137
 * running words over 233 lemmas — 9.2 tokens per lemma — and only 38% of its
 * vocabulary occurs once, against Jude's 74% and Mark's 48%. It repeats itself
 * relentlessly, which is the within-book compounding coverage-findings.md §4a
 * says pays, and it is a fifth the size of Mark.
 *
 * The chapters are uneven in a way the section headers show rather than hide:
 * chapter 2 introduces 62 new lexemes and chapter 5 only 14, because by the end
 * the letter is re-saying what it already said.
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
    "That Which Was From the Beginning",
    "Our Fellowship Is With the Father",
    "God Is Light",
    "If We Walk in the Light",
    "If We Confess Our Sins",
  ],
  "2": [
    "An Advocate With the Father",
    "Whoever Keeps His Word",
    "The Darkness Is Passing Away",
    "I Write to You, Little Children",
    "Fathers and Young Men",
    "Do Not Love the World",
    "The World Is Passing Away",
    "It Is the Last Hour",
    "You Have an Anointing",
    "Who Is the Liar?",
    "Let It Abide in You",
    "The Anointing Teaches You",
    "Abide in Him",
    "Everyone Who Practises Righteousness",
  ],
  "3": [
    "See What Love the Father Has Given",
    "Everyone Who Has This Hope",
    "Sin Is Lawlessness",
    "Whoever Abides in Him",
    "The Children of God",
    "Love One Another",
    "Not as Cain",
    "We Have Passed From Death to Life",
    "Laying Down Our Lives",
    "Let Us Love in Deed and Truth",
    "Whenever Our Heart Condemns Us",
    "Confidence Before God",
  ],
  "4": [
    "Test the Spirits",
    "Every Spirit That Confesses",
    "You Are From God",
    "Love Is From God",
    "God Sent His Only Son",
    "If We Love One Another",
    "God Abides in Us",
    "God Is Love",
    "Confidence for the Day of Judgement",
    "Perfect Love Casts Out Fear",
    "We Love Because He First Loved",
  ],
  "5": [
    "Everyone Who Believes",
    "This Is the Love of God",
    "Whatever Is Born of God",
    "The Spirit, the Water and the Blood",
    "The Testimony of God",
    "Whoever Has the Son Has Life",
    "That You May Know",
    "Confidence in Asking",
    "Sin Leading to Death",
    "We Know That We Are of God",
    "Keep Yourselves From Idols",
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
  const id = `1jn${String(i + 1).padStart(2, "0")}`;
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
    requires: i === 0 ? null : `1jn${String(i).padStart(2, "0")}`,
    // Levels rise across the book so placement can grant early chapters.
    placementLevel: Math.min(4, Number(chapter) - 1),
    wordIds: fresh,
    // Every verse the unit covers, plus the one it ends on. Recording only the
    // milestone left half of Jonah unlocked by nothing and displayed nowhere.
    passageIds: group.map((p) => p.id),
    passageId: group[group.length - 1]!.id,
    sectionId: `1john-${chapter}`,
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
