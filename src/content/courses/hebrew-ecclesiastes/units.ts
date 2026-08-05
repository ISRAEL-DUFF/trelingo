import type { ContentBundle } from "../../schema";
import { passages, sections, words } from "./generated";

/**
 * Ecclesiastes, whole, as a reading path.
 *
 *   Track    Ecclesiastes       — the book
 *     Section  Chapter 1–12     — how a book is actually read
 *       Unit     two verses     — a saying, or a movement of the argument
 *
 * Derived from the text's own order, as the other books are: a continuous text
 * supplies its own sequence, so there is no hand-authored unit list to drift
 * from the content.
 *
 * THE FIRST HEBREW TRACK THAT IS NOT A STORY. Jonah, Ruth and Esther are
 * narrative prose, where a unit is a scene and the plot carries the reader
 * forward. Qoheleth is wisdom poetry making an argument, and a two-verse unit
 * here is a saying or a turn in the reasoning rather than an event. The unit
 * titles reflect that: most of them are the line itself.
 *
 * IT IS HARDER THAN ITS LENGTH SUGGESTS. 2,999 running words over 562 lexemes
 * is 5.3 tokens per lexeme against Esther's 6.6 — a reader meets more words
 * once and never again, so the review queue carries less of the load. It is
 * also late Hebrew: כְּבָר, שֶׁ־ for אֲשֶׁר, and Persian loanwords like פַּרְדֵּס.
 *
 * WHERE THE VOCABULARY SITS. Chapter 1 introduces 98 of the 562 and chapter 2
 * another 87 — a third of the book in its first sixth, because chapter 2 is an
 * inventory of everything Qoheleth built. Chapter 8 introduces sixteen.
 */

const VERSES_PER_UNIT = 2;

/**
 * Titles, keyed by chapter then by position within it.
 *
 * Hand-written: a corpus can say which verses come next, not what they argue.
 * Anything unnamed falls back to its verse range, so a book can ship before
 * every unit has been named.
 */
const TITLES: Record<string, string[]> = {
  "1": ["The Words of Qoheleth", "Vapour of Vapours", "What Profit in All His Toil?", "A Generation Goes, a Generation Comes", "The Wind Returns on Its Circuits", "All Things Are Wearisome", "There Is Nothing New Under the Sun", "I Applied My Heart to Seek Out", "In Much Wisdom Is Much Vexation"],
  "2": ["I Will Test You With Pleasure", "What Does Laughter Accomplish?", "I Built Houses and Planted Vineyards", "Pools From Which to Water", "Servants, Herds and Silver", "Whatever My Eyes Desired", "Then I Looked on All My Works", "Wisdom Excels Folly as Light Excels Darkness", "One Fate Befalls Them Both", "So I Hated Life", "I Must Leave It to the Man After Me", "What Has a Man of All His Toil?", "There Is Nothing Better Than to Eat and Drink"],
  "3": ["To Everything There Is a Season", "A Time to Plant, a Time to Uproot", "A Time to Break Down and to Build", "A Time to Mourn and to Dance", "A Time to Embrace and to Refrain", "A Time to Keep and to Cast Away", "A Time to Love and to Hate", "He Has Made Everything Beautiful", "He Has Set Eternity in Their Heart", "That Which Is Has Already Been", "In the Place of Judgement, Wickedness"],
  "4": ["The Tears of the Oppressed", "Better Than Both Is He Who Has Not Been", "All Toil Comes of Rivalry", "Better a Handful With Quietness", "For Whom Am I Toiling?", "Two Are Better Than One", "A Threefold Cord", "Better a Poor and Wise Youth", "There Was No End to the People"],
  "5": ["Guard Your Steps When You Go", "Let Your Words Be Few", "Pay What You Have Vowed", "Do Not Let Your Mouth Bring Guilt", "Do Not Marvel at the Matter", "He Who Loves Silver Will Not Be Satisfied", "The Sleep of a Labourer Is Sweet", "Riches Kept to the Hurt of Their Owner", "As He Came, So Shall He Go", "This Is the Gift of God"],
  "6": ["A Man to Whom God Gives Riches", "A Stillbirth Is Better Than He", "All the Toil of Man Is for His Mouth", "What Advantage Has the Wise Over the Fool?", "Whatever Has Been, Its Name Was Given", "Who Knows What Is Good for Man?"],
  "7": ["A Good Name Is Better Than Fine Oil", "The House of Mourning", "Sorrow Is Better Than Laughter", "The Rebuke of the Wise", "As the Crackling of Thorns", "Better the End Than the Beginning", "Do Not Say the Former Days Were Better", "Wisdom Is a Shelter as Money Is", "Consider the Work of God", "In the Day of Prosperity, Be Joyful", "Do Not Be Righteous Overmuch", "Wisdom Strengthens the Wise", "Not a Righteous Man Who Does Not Sin", "I Turned My Heart to Know", "God Made Man Upright"],
  "8": ["Who Is Like the Wise Man?", "Keep the King's Command", "No Man Has Power Over the Wind", "The Wicked Buried and Forgotten", "Sentence Not Executed Speedily", "It Will Be Well With Those Who Fear God", "There Are Righteous Who Get What the Wicked Deserve", "I Commend Enjoyment", "No One Can Find Out the Work of God"],
  "9": ["The Righteous and the Wise Are in God's Hand", "One Fate for All", "A Living Dog Is Better Than a Dead Lion", "The Dead Know Nothing", "Go, Eat Your Bread With Joy", "Whatever Your Hand Finds to Do", "The Race Is Not to the Swift", "Time and Chance Happen to Them All", "This Wisdom I Have Also Seen"],
  "10": ["Dead Flies Spoil the Perfumer's Ointment", "A Fool's Heart at His Left", "If the Ruler's Anger Rises", "Folly Set in Great Dignity", "He Who Digs a Pit", "If the Iron Is Blunt", "The Words of a Wise Man's Mouth", "A Fool Multiplies Words", "Woe to You, O Land, Whose King Is a Child", "Through Sloth the Roof Sinks"],
  "11": ["Cast Your Bread Upon the Waters", "You Do Not Know the Way of the Wind", "Sow Your Seed in the Morning", "Light Is Sweet", "Rejoice, Young Man, in Your Youth"],
  "12": ["Remember Your Creator", "Before the Sun and the Light Are Darkened", "The Keepers of the House Tremble", "The Almond Tree Blossoms", "The Silver Cord Is Snapped", "The Dust Returns to the Earth", "The End of the Matter"],
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
  const id = `ecc${String(i + 1).padStart(3, "0")}`;
  const chapter = chapterOf(group[0]!.id);
  const positionInChapter = groups.filter((g) => chapterOf(g[0]!.id) === chapter).indexOf(group);

  // Words first met here. A word introduced in chapter 1 is not re-taught in
  // chapter 7 — it returns through the review queue instead, which is the
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
    requires: i === 0 ? null : `ecc${String(i).padStart(3, "0")}`,
    // Levels rise across the book so placement can grant early chapters.
    // Twelve chapters over five levels, so roughly two and a half each.
    placementLevel: Math.min(4, Math.floor((Number(chapter) - 1) / 2.5)),
    wordIds: fresh,
    passageIds: group.map((p) => p.id),
    passageId: group[group.length - 1]!.id,
    sectionId: `eccl-${chapter}`,
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
