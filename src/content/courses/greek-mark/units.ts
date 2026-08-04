import type { ContentBundle } from "../../schema";
import { passages, sections, words } from "./generated";

/**
 * Mark, whole, as a reading path.
 *
 *   Track    Mark               — the whole gospel
 *     Section  Chapter 1–4      — how a book is actually read
 *       Unit     two verses     — a scene
 *
 * Derived from the text's own order, as Jonah and Ruth are: a continuous text
 * supplies its own sequence, so there is no hand-authored unit list to drift
 * from the content.
 *
 * SHIPPED IN TWO PASSES. Mark is 11,286 running words over 1,341 lemmas, of
 * which 1,158 had no gloss anywhere in this project — five times 1 John.
 * Chapters 1–4 were curated first and the remaining twelve followed, at the
 * same standard: every gloss and distractor hand-written, no auto-generation.
 * The importer's `--chapters` flag made the staging possible without forking
 * anything, and is still there for the next long book.
 *
 * Chapter 1 alone introduces 148 of the gospel's 755 taught words — the usual
 * front-loading, and by chapter 11 a chapter adds only twelve. The section
 * headers carry the counts rather than pretending the chapters cost the same.
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
    "The Beginning of the Gospel",
    "A Voice in the Wilderness",
    "John Baptises in the Jordan",
    "One Mightier Than I",
    "The Baptism of Jesus",
    "Forty Days in the Wilderness",
    "The Kingdom Is at Hand",
    "Follow Me",
    "James and John Leave the Boat",
    "He Taught as One With Authority",
    "An Unclean Spirit Cries Out",
    "His Fame Spread Everywhere",
    "Simon's Mother-in-Law",
    "The Whole City at the Door",
    "A Solitary Place to Pray",
    "Let Us Go On",
    "If You Will, You Can Make Me Clean",
    "He Could No Longer Enter a Town",
  ],
  "2": [
    "Home in Capernaum",
    "They Let Down the Pallet",
    "Your Sins Are Forgiven",
    "Rise, Take Up Your Bed",
    "Follow Me — and Levi Rose",
    "Eating With Tax Collectors",
    "Not the Healthy but the Sick",
    "Why Do Your Disciples Not Fast?",
    "New Wine in Old Wineskins",
    "Through the Grainfields",
    "What David Did",
    "Lord Even of the Sabbath",
  ],
  "3": [
    "A Man With a Withered Hand",
    "To Save Life or to Kill",
    "The Herodians Take Counsel",
    "A Great Multitude Followed",
    "The Unclean Spirits Fell Down",
    "He Appointed Twelve",
    "Sons of Thunder",
    "He Is Beside Himself",
    "Can Satan Cast Out Satan?",
    "Binding the Strong Man",
    "An Eternal Sin",
    "Who Are My Mother and My Brothers?",
  ],
  "4": [
    "He Taught Them in Parables",
    "A Sower Went Out to Sow",
    "Some Fell on Rocky Ground",
    "Other Seed Fell Into Good Soil",
    "To You Has Been Given the Secret",
    "The Sower Sows the Word",
    "Those Sown on Rocky Ground",
    "The Cares of the World",
    "A Lamp Under a Basket",
    "The Measure You Give",
    "The Seed Grows of Itself",
    "The Harvest Has Come",
    "Like a Grain of Mustard Seed",
    "He Spoke the Word to Them",
  ],
  "5": ["The Gerasene Demoniac", "Among the Tombs", "My Name Is Legion", "Into the Swine", "Go Home to Your Friends", "Jairus Falls at His Feet", "Who Touched My Garments?", "Talitha Koum"],
  "6": ["A Prophet Without Honour", "He Sent Them Out Two by Two", "Herod Heard of It", "The Daughter of Herodias", "The Head of John", "Come Away and Rest", "Sheep Without a Shepherd", "Five Loaves and Two Fish", "Twelve Baskets Full", "Walking on the Sea", "Take Heart, It Is I", "Gennesaret"],
  "7": ["Unwashed Hands", "The Tradition of the Elders", "Corban", "Nothing Outside Defiles", "Out of the Heart", "The Syrophoenician Woman", "Even the Dogs", "Ephphatha"],
  "8": ["Seven Loaves", "No Sign Will Be Given", "The Leaven of the Pharisees", "The Blind Man at Bethsaida", "Who Do You Say That I Am?", "The Son of Man Must Suffer", "Take Up His Cross", "Ashamed of Me"],
  "9": ["Transfigured Before Them", "This Is My Beloved Son", "Elijah Has Come", "A Spirit That Makes Him Mute", "I Believe, Help My Unbelief", "Betrayed Into Hands of Men", "Who Is the Greatest?", "Whoever Receives a Child", "Whoever Is Not Against Us", "If Your Hand Causes You to Stumble", "Salted With Fire"],
  "10": ["What Did Moses Command?", "What God Has Joined", "Let the Children Come", "Good Teacher, What Must I Do?", "Go, Sell What You Have", "The Eye of a Needle", "First Will Be Last", "A Third Time He Told Them", "Grant Us to Sit", "Whoever Would Be Great", "Bartimaeus by the Road"],
  "11": ["Two Disciples for a Colt", "Hosanna in the Highest", "The Fig Tree", "Cleansing the Temple", "The Withered Fig Tree", "Have Faith in God", "By What Authority?"],
  "12": ["A Man Planted a Vineyard", "The Stone the Builders Rejected", "Render to Caesar", "Whose Wife Will She Be?", "The God of the Living", "The Greatest Commandment", "Not Far From the Kingdom", "Whose Son Is the Christ?", "Beware of the Scribes", "The Widow's Two Coins"],
  "13": ["Not One Stone Upon Another", "The Beginning of Birth Pangs", "You Will Be Handed Over", "The Abomination of Desolation", "False Christs", "The Sun Will Be Darkened", "The Lesson of the Fig Tree", "No One Knows the Day", "Stay Awake"],
  "14": ["Two Days Before the Passover", "An Alabaster Flask", "Wherever the Gospel Is Preached", "Judas Goes to the Chief Priests", "A Man Carrying a Jar", "One of You Will Betray Me", "This Is My Body", "You Will All Fall Away", "Gethsemane", "Watch and Pray", "The Hour Has Come", "Judas Comes With a Crowd", "They All Left Him", "Before the Council", "Are You the Christ?", "Peter in the Courtyard", "The Rooster Crowed"],
  "15": ["Delivered to Pilate", "Are You the King of the Jews?", "Barabbas", "Crucify Him", "The Crown of Thorns", "Simon of Cyrene", "Golgotha", "They Divided His Garments", "He Saved Others", "Darkness Over the Land", "Eloi, Eloi", "The Curtain Torn", "The Women Looking On", "Joseph of Arimathea"],
  "16": ["Very Early on the First Day", "Who Will Roll Away the Stone?", "He Is Risen", "Go, Tell His Disciples", "He Appeared to Mary", "Two of Them Walking", "Go Into All the World", "Taken Up Into Heaven"],

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
  const id = `mk${String(i + 1).padStart(2, "0")}`;
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
    requires: i === 0 ? null : `mk${String(i).padStart(2, "0")}`,
    // Levels rise across the book so placement can grant early chapters.
    placementLevel: Math.min(4, Number(chapter) - 1),
    wordIds: fresh,
    // Every verse the unit covers, plus the one it ends on. Recording only the
    // milestone left half of Jonah unlocked by nothing and displayed nowhere.
    passageIds: group.map((p) => p.id),
    passageId: group[group.length - 1]!.id,
    sectionId: `mark-${chapter}`,
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
