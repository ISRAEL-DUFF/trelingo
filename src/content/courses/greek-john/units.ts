import type { ContentBundle } from "../../schema";
import { passages, sections, words } from "./generated";

/**
 * John, whole, as a reading path.
 *
 *   Track    John               — the whole gospel
 *     Section  Chapter 1–21     — how a book is actually read
 *       Unit     two verses     — a scene
 *
 * Derived from the text's own order, as Jonah and Ruth are: a continuous text
 * supplies its own sequence, so there is no hand-authored unit list to drift
 * from the content.
 *
 * THE CHEAPEST BOOK SO FAR, BECAUSE THREE CAME BEFORE IT. John is 15,438
 * running words — more than Mark — over just 999 lemmas. That is 15.5 tokens
 * per lemma, the highest ratio of any book measured, and it is why John has
 * always been the gospel beginners are pointed at: it says a very great deal
 * with a very small vocabulary.
 *
 * Only 341 of those lemmas needed writing. Mark, 1 John and the Gospels track
 * already gloss 658 of them, so the whole book fitted in a single curation pass
 * where Mark needed two. Corpus work compounds.
 *
 * Chapter 1 introduces 159 new words and chapter 17 introduces two — the
 * farewell discourse is almost entirely vocabulary the reader already has.
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
  "1": ["In the Beginning Was the Word", "All Things Were Made", "The Light Shines in the Darkness", "There Was a Man Sent From God", "He Came to His Own", "The Word Became Flesh", "Grace and Truth", "Who Are You?", "The Voice in the Wilderness", "Behold, the Lamb of God", "The Spirit Descending", "What Are You Seeking?", "You Shall Be Called Cephas", "Follow Me", "Can Anything Good Come From Nazareth?", "Under the Fig Tree", "You Will See Greater Things"],
  "2": ["A Wedding at Cana", "They Have No Wine", "Six Stone Jars", "You Have Kept the Good Wine", "The First of His Signs", "Zeal for Your House", "Destroy This Temple", "He Knew What Was in Man"],
  "3": ["A Man of the Pharisees", "Unless One Is Born Again", "The Wind Blows Where It Wishes", "As Moses Lifted Up the Serpent", "For God So Loved the World", "The Light Has Come", "He Must Increase", "The Father Loves the Son"],
  "4": ["A Woman of Samaria", "Living Water", "The Well Is Deep", "Go, Call Your Husband", "In Spirit and Truth", "I Who Speak to You Am He", "My Food Is to Do His Will", "The Fields Are White", "Many Samaritans Believed", "A Prophet Has No Honour", "Your Son Lives"],
  "5": ["The Pool of Bethesda", "Do You Want to Be Healed?", "It Is the Sabbath", "My Father Is Working", "The Son Does Nothing of Himself", "An Hour Is Coming", "The Witness of John", "The Scriptures Bear Witness"],
  "6": ["Five Barley Loaves", "Twelve Baskets", "Walking on the Sea", "Work for the Food That Endures", "I Am the Bread of Life", "The Bread From Heaven", "The Jews Grumbled", "Unless You Eat", "A Hard Saying", "To Whom Shall We Go?"],
  "7": ["The Feast of Booths", "My Time Has Not Yet Come", "How Does This Man Know Letters?", "Judge With Right Judgement", "Is Not This the Man?", "You Will Seek Me", "Rivers of Living Water", "Division Among the People", "Never Has a Man Spoken"],
  "8": ["I Am the Light of the World", "Where I Am Going", "The Truth Will Set You Free", "Slaves of Sin", "Your Father Abraham", "Before Abraham Was, I Am"],
  "9": ["A Man Blind From Birth", "He Made Clay", "Go Wash in Siloam", "How Were Your Eyes Opened?", "Put Out of the Synagogue", "Now I See", "For Judgement I Came"],
  "10": ["The Door of the Sheep", "I Am the Good Shepherd", "Other Sheep I Have", "No One Snatches Them", "The Feast of Dedication", "I and the Father Are One", "Beyond the Jordan"],
  "11": ["Lazarus Is Ill", "Let Us Go to Judea", "Our Friend Has Fallen Asleep", "Martha Meets Him", "I Am the Resurrection", "Jesus Wept", "Take Away the Stone", "Lazarus, Come Out", "The Council Plots", "One Man Should Die"],
  "12": ["A Pound of Costly Nard", "The Poor You Always Have", "Hosanna! Blessed Is He", "Some Greeks Came", "Unless a Grain of Wheat Falls", "A Voice From Heaven", "Walk While You Have the Light", "They Loved the Glory of Man"],
  "13": ["He Loved Them to the End", "He Began to Wash Their Feet", "You Also Ought to Wash", "One of You Will Betray Me", "The Morsel", "A New Commandment", "Will You Lay Down Your Life?"],
  "14": ["In My Father's House", "I Am the Way", "Show Us the Father", "Greater Works Than These", "Another Helper", "Peace I Leave With You"],
  "15": ["I Am the True Vine", "Abide in Me", "Greater Love Has No One", "I Have Called You Friends", "The World Hates You", "The Spirit of Truth"],
  "16": ["It Is to Your Advantage", "He Will Convict the World", "A Little While", "Sorrow Turned to Joy", "Ask and You Will Receive", "I Have Overcome the World"],
  "17": ["Father, the Hour Has Come", "I Have Manifested Your Name", "Keep Them in Your Name", "Sanctify Them in the Truth", "That They May All Be One"],
  "18": ["Across the Kidron", "Whom Do You Seek?", "Put Your Sword Away", "First to Annas", "Peter at the Fire", "The High Priest Questions Him", "I Am Not", "My Kingdom Is Not of This World", "What Is Truth?"],
  "19": ["A Crown of Thorns", "Behold the Man", "We Have No King but Caesar", "The Place of a Skull", "They Divided His Garments", "Behold Your Mother", "It Is Finished", "They Pierced His Side", "Joseph and Nicodemus"],
  "20": ["The Stone Taken Away", "The Linen Cloths", "Mary Stood Weeping", "Rabboni!", "Peace Be With You", "Unless I See", "My Lord and My God", "That You May Believe"],
  "21": ["I Am Going Fishing", "Cast the Net on the Right", "It Is the Lord", "A Charcoal Fire", "Do You Love Me?", "Feed My Sheep", "Follow Me", "The World Could Not Contain"],
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
  const id = `jn${String(i + 1).padStart(2, "0")}`;
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
    requires: i === 0 ? null : `jn${String(i).padStart(2, "0")}`,
    // Levels rise across the book so placement can grant early chapters.
    placementLevel: Math.min(4, Number(chapter) - 1),
    wordIds: fresh,
    // Every verse the unit covers, plus the one it ends on. Recording only the
    // milestone left half of Jonah unlocked by nothing and displayed nowhere.
    passageIds: group.map((p) => p.id),
    passageId: group[group.length - 1]!.id,
    sectionId: `john-${chapter}`,
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
