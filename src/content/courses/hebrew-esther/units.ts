import type { ContentBundle } from "../../schema";
import { passages, sections, words } from "./generated";

/**
 * Esther, whole, as a reading path.
 *
 *   Track    Esther             — the book
 *     Section  Chapter 1–10     — how a book is actually read
 *       Unit     two verses     — a scene
 *
 * Derived from the text's own order, as Jonah and Ruth are: a continuous book
 * supplies its own sequence, so there is no hand-authored unit list to drift
 * from the content.
 *
 * WHY ESTHER THIRD. It has the best repetition ratio of any affordable
 * candidate — 3,057 running words over 464 lexemes, about 6.6 tokens per
 * lexeme — across 167 verses of continuous narrative prose. A reader who has
 * finished Jonah and Ruth already knows 164 of those lexemes, so the book
 * opens at roughly a third known and climbs from there.
 *
 * Chapter 1 carries 155 of the 464 lexemes — a third of the book in its first
 * eighth, because that is where the Persian court furniture is described. By
 * chapter 7 a whole scene costs twelve new words. The section headers show the
 * counts rather than pretending the chapters are the same size.
 *
 * 43 of the lexemes are hapax legomena — words that occur once in the whole
 * Hebrew Bible. That is high for a book this length, and most of them are
 * Persian: the fabrics of the king's garden party, the pavement under it, and
 * fourteen court officials who are named once and never mentioned again.
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
    "From India to Ethiopia",
    "A Feast of a Hundred and Eighty Days",
    "White, Green and Blue Hangings",
    "Drinking According to the Law",
    "Vashti Made a Feast for the Women",
    "Bring the Queen Before the King",
    "Vashti Refused to Come",
    "The King Asked the Wise Men",
    "Not the King Only, but All the Princes",
    "Let Her Royal Estate Be Given to Another",
    "Every Man Bearing Rule in His House",
  ],
  "2": [
    "The King Remembered Vashti",
    "Let Fair Young Virgins Be Sought",
    "A Certain Jew in Shushan",
    "He Had Brought Up Hadassah",
    "Esther Was Taken to the King's House",
    "She Pleased Hegai",
    "Esther Had Not Made Known Her People",
    "Twelve Months of Purifications",
    "Whatsoever She Desired Was Given Her",
    "The King Loved Esther Above All",
    "He Made a Feast for All His Princes",
    "Bigthan and Teresh Sought to Lay Hands",
  ],
  "3": [
    "The King Promoted Haman",
    "But Mordecai Bowed Not",
    "Why Transgressest Thou the King's Commandment?",
    "Haman Was Full of Wrath",
    "They Cast Pur, That Is, the Lot",
    "A Certain People Scattered Abroad",
    "The King Took the Ring From His Hand",
    "Letters Sent by Posts",
  ],
  "4": [
    "Mordecai Rent His Clothes",
    "Great Mourning Among the Jews",
    "Esther Sent Raiment to Clothe Him",
    "She Called for Hathach",
    "The Copy of the Writing",
    "All the King's Servants Know",
    "Think Not That Thou Shalt Escape",
    "Who Knoweth Whether Thou Art Come",
    "Go, Gather All the Jews",
  ],
  "5": [
    "She Stood in the Inner Court",
    "The King Held Out the Golden Sceptre",
    "What Is Thy Request?",
    "Let the King Come to the Banquet",
    "Even to the Half of the Kingdom",
    "Haman Went Forth Joyful",
    "Let a Gallows Be Made",
  ],
  "6": [
    "That Night the King Could Not Sleep",
    "It Was Found Written",
    "What Honour Hath Been Done to Mordecai?",
    "Who Is in the Court?",
    "Whom Would the King Delight to Honour?",
    "Do Even So to Mordecai the Jew",
    "Haman Hasted to His House Mourning",
  ],
  "7": [
    "So the King and Haman Came to Banquet",
    "We Are Sold, I and My People",
    "Who Is He, and Where Is He?",
    "The Adversary and Enemy Is This Wicked Haman",
    "Hang Him Thereon",
  ],
  "8": [
    "The King Gave the House of Haman",
    "She Fell Down at His Feet",
    "Let It Be Written to Reverse the Letters",
    "Write Ye Also for the Jews",
    "The Jews Were Granted to Stand for Their Life",
    "The Posts Rode Upon Swift Steeds",
    "Mordecai Went Out in Royal Apparel",
    "Light and Gladness and Joy and Honour",
    "Many Became Jews",
  ],
  "9": [
    "It Was Turned to the Contrary",
    "The Fear of Mordecai Fell Upon Them",
    "Mordecai Waxed Greater and Greater",
    "They Smote All Their Enemies",
    "The Ten Sons of Haman",
    "But on the Spoil They Laid Not Their Hand",
    "The Number Was Brought to the King",
    "What Is Thy Petition Further?",
    "Let Haman's Ten Sons Be Hanged",
    "The Jews Assembled on the Fourteenth Day",
    "They Rested and Made It a Day of Feasting",
    "The Jews of the Villages",
    "Mordecai Wrote These Things",
    "The Month Turned From Sorrow to Gladness",
    "Sending Portions to One Another",
    "Therefore They Called These Days Purim",
  ],
  "10": ["The King Laid a Tribute", "Mordecai the Jew Was Next Unto the King"],
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
  const id = `est${String(i + 1).padStart(2, "0")}`;
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
    requires: i === 0 ? null : `est${String(i).padStart(2, "0")}`,
    // Levels rise across the book so placement can grant early chapters. Ten
    // chapters over five levels, so a level is a pair of chapters.
    placementLevel: Math.min(4, Math.ceil(Number(chapter) / 2) - 1),
    wordIds: fresh,
    // Every verse the unit covers, plus the one it ends on. Recording only the
    // milestone left half of Jonah unlocked by nothing and displayed nowhere.
    passageIds: group.map((p) => p.id),
    passageId: group[group.length - 1]!.id,
    sectionId: `esth-${chapter}`,
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
