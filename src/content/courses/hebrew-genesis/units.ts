import type { ContentBundle } from "../../schema";
import { passages, sections, words } from "./generated";

/**
 * Genesis 1–11, the primeval history, as a reading path.
 *
 *   Track    Genesis 1–11       — the primeval history
 *     Section  Chapter 1–11     — how a book is actually read
 *       Unit     two verses     — a scene, or a step in a genealogy
 *
 * Derived from the text's own order, as every other book is.
 *
 * THE FIRST TRACK THAT IS PART OF A BOOK. Genesis entire needs 973 new glosses,
 * more than Luke, which was parked for that reason. These eleven chapters need
 * 285 and stop at a real seam — the primeval history ends and the Abraham cycle
 * begins at 12:1, and 11:30 leaves Sarai barren, which is the problem the rest
 * of Genesis exists to answer. Mark shipped the same way, 1–4 before 5–16.
 *
 * WHERE THE VOCABULARY SITS, and it is unlike any other Hebrew track. Chapter 1
 * introduces 96 new words and chapter 2 another 87 — creation and the garden
 * carry a third of the book's vocabulary between them, because the cosmology
 * has terms that occur nowhere else. Then it collapses: chapter 7, the flood
 * itself, introduces nineteen. And chapter 10 spikes back to 94, which is
 * entirely the Table of Nations — seventy-odd proper names in a single list.
 *
 * That shape matters for a learner. Chapters 1–4 are the hardest reading in the
 * track and also the most famous, so the placement levels rise slowly; a reader
 * who gets through the garden has met most of what the flood will ask of them.
 *
 * THE GENEALOGIES ARE NOT SKIPPED, and their units are titled by whoever they
 * name. Chapter 5 and chapter 11 are formulaic almost to the word, which makes
 * them the easiest continuous Hebrew in the app once the formula is learned —
 * the same six phrases, thirty times over. That is worth reading precisely
 * because it is repetitive.
 */

const VERSES_PER_UNIT = 2;

/**
 * Titles, keyed by chapter then by position within it.
 *
 * Hand-written: a corpus can say which verses come next, not what happens in
 * them. Anything unnamed falls back to its verse range, so a chapter can ship
 * before every unit has been named.
 *
 * EACH ENTRY IS PINNED TO A VERSE PAIR, and the pairing is checked by
 * units.test.ts rather than by eye. Obadiah shipped with three titles a verse
 * out and the count check passed, because the list was the right LENGTH — the
 * misalignment only surfaced by reading the rendered path in a browser.
 */
const TITLES: Record<string, string[]> = {
  // 1:1–2, 3–4, 5–6, …, 31
  "1": [
    "In the Beginning",
    "Let There Be Light",
    "Day One, and an Expanse",
    "The Waters Divided",
    "Dry Land, and Seas",
    "Let the Earth Bring Forth",
    "Lights for Signs and Seasons",
    "The Greater and the Lesser Light",
    "Set in the Expanse to Rule",
    "Let the Waters Swarm",
    "The Great Sea Creatures",
    "Living Creatures After Their Kind",
    "Let Us Make Humankind",
    "Male and Female He Created Them",
    "Every Seed-Bearing Plant",
    "And Behold, It Was Very Good",
  ],
  "2": [
    "The Seventh Day",
    "These Are the Generations",
    "No Shrub of the Field Yet",
    "Dust, and the Breath of Life",
    "The Tree of Life in the Midst",
    "Pishon, and the Gold of Havilah",
    "Gihon, Tigris and Euphrates",
    "To Work It and to Keep It",
    "It Is Not Good for the Man to Be Alone",
    "The Man Names the Animals",
    "A Deep Sleep, and a Rib",
    "Bone of My Bones",
    "Naked, and Not Ashamed",
  ],
  "3": [
    "Now the Serpent Was Crafty",
    "You Shall Not Surely Die",
    "The Tree Was Desirable",
    "They Knew They Were Naked",
    "Where Are You?",
    "The Woman You Gave Me",
    "Cursed Above All Cattle",
    "Enmity Between Your Seed and Hers",
    "Thorns and Thistles",
    "By the Sweat of Your Face",
    "Garments of Skin",
    "The Cherubim and the Flaming Sword",
  ],
  "4": [
    "Cain and Abel",
    "Each Brings an Offering",
    "Why Has Your Face Fallen?",
    "Sin Crouching at the Door",
    "Am I My Brother's Keeper?",
    "A Fugitive and a Wanderer",
    "My Punishment Is Greater Than I Can Bear",
    "The Mark, and the Land of Nod",
    "The Line of Cain",
    "Adah and Zillah",
    "The Lyre, the Pipe, and Bronze",
    "The Song of Lamech",
    "Seth, and Then Enosh",
  ],
  "5": [
    "The Book of the Generations of Adam",
    "In His Own Likeness",
    "Adam Died; Seth Fathered Enosh",
    "The Days of Seth",
    "Enosh Fathered Kenan",
    "Kenan Fathered Mahalalel",
    "The Days of Kenan",
    "Mahalalel Fathered Jared",
    "Jared Fathered Enoch",
    "The Days of Jared",
    "Enoch Walked With God",
    "And He Was Not, For God Took Him",
    "Methuselah Fathered Lamech",
    "Nine Hundred Sixty-Nine Years",
    "This One Shall Comfort Us",
    "Shem, Ham and Japheth",
  ],
  "6": [
    "The Sons of God and the Daughters of Men",
    "The Nephilim in Those Days",
    "The LORD Regretted",
    "But Noah Found Favour",
    "Noah Was Blameless in His Generation",
    "The Earth Was Corrupt",
    "Make an Ark of Gopher Wood",
    "Three Hundred Cubits",
    "I Will Establish My Covenant",
    "Two of Every Living Thing",
    "Noah Did All God Commanded",
  ],
  "7": [
    "Come Into the Ark",
    "In Seven Days I Will Send Rain",
    "Noah Was Six Hundred Years Old",
    "They Went In Because of the Waters",
    "Two by Two",
    "The Fountains of the Great Deep",
    "On That Very Day",
    "And the LORD Shut Him In",
    "The Waters Bore Up the Ark",
    "The Mountains Covered",
    "All Flesh Perished",
    "Only Noah Remained",
  ],
  "8": [
    "God Remembered Noah",
    "The Ark Rested on Ararat",
    "Noah Opened the Window",
    "The Raven, and Then the Dove",
    "The Dove Found No Resting Place",
    "An Olive Leaf, Freshly Plucked",
    "The Face of the Ground Was Dry",
    "Go Out of the Ark",
    "Bring Out Every Living Thing",
    "Noah Built an Altar",
    "Seedtime and Harvest Shall Not Cease",
  ],
  "9": [
    "Be Fruitful and Fill the Earth",
    "But Not the Blood",
    "Whoever Sheds Human Blood",
    "And God Spoke to Noah",
    "I Establish My Covenant With You",
    "Never Again a Flood",
    "My Bow in the Cloud",
    "I Will Remember My Covenant",
    "The Sons of Noah Went Out",
    "Noah Planted a Vineyard",
    "Ham Saw His Father's Nakedness",
    "They Walked Backward",
    "Cursed Be Canaan",
    "May God Enlarge Japheth",
    "Noah Died",
  ],
  "10": [
    "The Sons of Japheth",
    "Gomer, and the Sons of Javan",
    "The Coastland Peoples; the Sons of Ham",
    "Cush Fathered Nimrod",
    "A Mighty Hunter Before the LORD",
    "Nineveh and Calah",
    "The Descendants of Mizraim",
    "Canaan Fathered Sidon",
    "The Families of the Canaanite Spread",
    "The Border of the Canaanite",
    "The Sons of Shem",
    "Arpachshad, Shelah, Eber",
    "In His Days the Earth Was Divided",
    "The Sons of Joktan",
    "From Mesha Toward Sephar",
    "These Are the Families of the Sons of Noah",
  ],
  "11": [
    "One Language, and a Plain in Shinar",
    "Let Us Build a Tower, and Make a Name",
    "The LORD Came Down to See",
    "Let Us Confuse Their Language",
    "Babel, and the Generations of Shem",
    "Arpachshad Fathered Shelah",
    "Shelah Fathered Eber",
    "Eber Fathered Peleg",
    "Peleg Fathered Reu",
    "Reu Fathered Serug",
    "Serug Fathered Nahor",
    "Nahor Fathered Terah",
    "Terah Fathered Abram",
    "Haran Died in Ur of the Chaldeans",
    "And Sarai Was Barren",
    "They Went Out to Go to Canaan",
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
  const id = `gen${String(i + 1).padStart(3, "0")}`;
  const chapter = chapterOf(group[0]!.id);
  const positionInChapter = groups.filter((g) => chapterOf(g[0]!.id) === chapter).indexOf(group);

  // Words first met here. A word introduced in chapter 1 is not re-taught in
  // chapter 9 — it returns through the review queue instead, which is the
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
    requires: i === 0 ? null : `gen${String(i).padStart(3, "0")}`,
    // Levels rise across the track so placement can grant early chapters.
    // Eleven chapters over five levels, so roughly two and a half each.
    placementLevel: Math.min(4, Math.floor((Number(chapter) - 1) / 2.5)),
    wordIds: fresh,
    passageIds: group.map((p) => p.id),
    passageId: group[group.length - 1]!.id,
    sectionId: `gen-${chapter}`,
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
