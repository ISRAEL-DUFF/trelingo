#!/usr/bin/env node
/**
 * The human contribution to the Malachi course.
 *
 * SECOND EASIEST BOOK IN THE CANON, on the same measurement that chose Haggai:
 * against the 1,047 lexemes the four earlier Hebrew tracks teach, Malachi
 * already reads at 77% of its running words and 71 more carry it past 95%.
 * Only Haggai (32) and Obadiah (58) are cheaper.
 *
 * ORDER MATTERS HERE, AS IT DID FOR MATTHEW. Written on its own, Malachi needs
 * 113 new glosses. Written after Haggai it needs 101, because the two share a
 * dozen words — both are post-exilic, both are preoccupied with the temple and
 * its priesthood, and both use the messenger vocabulary that gives Malachi his
 * name. So this glossary inherits Haggai's, and Haggai was done first for that
 * reason.
 *
 * WHAT THE VOCABULARY IS ABOUT. Three registers, and a reader who has done
 * Ecclesiastes will have none of them. The cult: מִנְחָה offerings, the
 * מִזְבֵּחַ altar, blind and lame animals, tithes and the storehouse. The
 * covenant: בְּרִית six times, בָּגַד "to deal treacherously" five, and the
 * marriage language of chapter 2. And the assaying imagery of chapter 3 —
 * refiner's fire, fuller's soap, silver strained clear.
 *
 * A NOTE ON CHAPTERS. Malachi has THREE chapters in the Hebrew, not four:
 * 3:19–24 is the English 4:1–6. The WLC and JPS 1917 both use the Hebrew
 * numbering, so they align without adjustment — but a reader coming from an
 * English Bible will find the last six verses one chapter earlier than expected.
 *
 * Usage:  node scripts/build-malachi-glossary.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * [strongs, gloss, [three distractors], extras?]
 *
 * An entry here overrides the same lemma inherited from an earlier book.
 */
const ENTRIES = [
  // =========================================================================
  // The book's frame
  // =========================================================================
  ["H4401", "Malachi", ["Haggai", "Zechariah", "Zerubbabel"], {
    notes: "The name means 'my messenger', and 3:1 says 'behold, I send my מַלְאָךְ' — the same word. Whether Malachi is a name at all or a title borrowed from that verse is an old and unsettled question.",
  }],
  ["H4853", "an oracle, a burden", ["a blessing", "a song", "a letter"], {
    notes: "The technical heading of several prophetic books. It is literally 'a load', and the two senses are hard to separate: what the prophet carries and what he must set down.",
  }],
  ["H136", "the Lord", ["a servant", "a prophet", "a king"], {
    notes: "אֲדֹנָי, used as a divine title. Distinct from the four-letter name, and traditionally read aloud in its place.",
  }],
  ["H3290", "Jacob", ["Esau", "Isaac", "Levi"], {}],
  ["H6215", "Esau", ["Jacob", "Edom", "Levi"], {}],
  ["H123", "Edom", ["Egypt", "Moab", "Judah"], {
    notes: "1:2–4 identifies Esau with Edom, the nation, and the book opens by contrasting its ruin with Jacob's survival. Obadiah is an entire book on the same subject.",
  }],
  ["H3878", "Levi", ["Judah", "Jacob", "Aaron"], {
    notes: "Chapter 2 addresses the priests as heirs of a בְּרִית with Levi. The tribe stands for the priesthood throughout.",
  }],
  ["H4872", "Moses", ["Elijah", "Aaron", "Joshua"], {}],
  ["H2722", "Horeb", ["Sinai", "Zion", "Carmel"], {}],
  ["H452", "Elijah", ["Moses", "Elisha", "Malachi"], {
    notes: "The last words of the book, and so of the prophets in the Christian ordering: 'behold, I will send you Elijah the prophet'. The Matthew track teaches Ἠλίας, where the promise is taken up.",
  }],

  // =========================================================================
  // The cult — offerings, altar, priesthood
  // =========================================================================
  ["H4503", "an offering, a gift", ["a debt", "a wage", "a theft"], {
    notes: "The grain offering specifically, but used broadly for any gift brought to God — and in this book, for the defective ones. Seven occurrences, all disputed between prophet and priest.",
  }],
  ["H4196", "an altar", ["a table", "a temple", "a gate"], {}],
  ["H7979", "a table", ["an altar", "a bench", "a chest"], {
    notes: "1:7 and 1:12 call the altar the LORD's table, which is what makes the charge of serving polluted food on it land as an insult rather than a technicality.",
  }],
  ["H2282", "a festival", ["a fast", "a market", "a working day"], {}],
  ["H6569", "dung, offal", ["incense", "grain", "oil"], {
    notes: "2:3, and it is meant to shock: the dung of the festival sacrifices spread on the priests' own faces. The image is of being made ritually filthy by the very offerings they mishandled.",
  }],
  ["H6999", "to burn incense, to make smoke", ["to extinguish", "to pour out", "to bury"], {}],
  ["H5787", "blind", ["sighted", "lame", "whole"], {}],
  ["H6455", "lame", ["blind", "sound", "swift"], {
    notes: "1:8 — offering the blind and the lame. The test the prophet proposes is social rather than legal: try giving it to your governor.",
  }],
  ["H2145", "a male", ["a female", "a firstborn", "a young animal"], {}],
  ["H5739", "a flock, a herd", ["a field", "a stall", "a shepherd"], {}],
  ["H1497", "to tear away, to seize", ["to give", "to restore", "to buy"], {}],
  ["H5230", "to deal deceitfully", ["to deal honestly", "to pay in full", "to give freely"], {}],
  ["H4972", "what a weariness!", ["what a delight", "how easy", "how brief"], {
    notes: "1:13, and the word occurs nowhere else. The priests say of the whole business הִנֵּה מַתְּלָאָה — 'what a nuisance' — and snort at it.",
  }],
  ["H2600", "for nothing, in vain", ["at great cost", "for a wage", "on credit"], {}],
  ["H5108", "produce, fruit", ["a seed", "a famine", "a tool"], {}],
  ["H4643", "a tithe, a tenth", ["a whole", "a wage", "a loan"], {}],
  ["H8641", "a contribution, an offering", ["a purchase", "a tax", "a debt"], {}],
  ["H6906", "to rob, to defraud", ["to repay", "to give", "to lend"], {
    notes: "3:8, twice in one verse, and the verb is rare enough that its sense is argued over — 'will a man rob God?' Some read it as 'defraud'.",
  }],
  ["H214", "a storehouse, a treasury", ["a market", "a field", "an altar"], {}],
  ["H6605", "to open", ["to shut", "to seal", "to guard"], {
    notes: "3:10 — 'if I will not open you the windows of heaven'. The same verb opens the storehouse and the sky in one sentence.",
  }],
  ["H2964", "food, prey", ["hunger", "a wage", "a gift"], {}],

  // Family heads inherited from earlier books, re-stated only to author a
  // coreGloss, so no family here ships with one inferred from whichever member
  // happened to be commonest.
  ["H400", "food", ["drink", "clothing", "a wage"], { root: "אכל", familyGloss: "to eat, food" }],
  ["H398", "to eat", ["to fast", "to drink", "to serve"], { root: "אכל", familyGloss: "to eat, food" }],
  ["H2146", "a record, a memorial", ["a rumour", "a promise", "a wage"], { root: "זכר", familyGloss: "to remember" }],
  ["H2142", "to remember", ["to forget", "to record", "to promise"], { root: "זכר", familyGloss: "to remember" }],

  // =========================================================================
  // Covenant, marriage, treachery
  // =========================================================================
  ["H1285", "a covenant", ["a quarrel", "a gift", "a debt"], {
    notes: "Six times, and the spine of the book: a covenant with Levi, the covenant of the fathers, the covenant of marriage, and the messenger of the covenant. Cut rather than made, in Hebrew — the idiom is 'to cut a covenant'.",
  }],
  ["H898", "to act treacherously, to betray", ["to keep faith", "to forgive", "to obey"], {
    notes: "Five times in chapter 2, and the charge the whole chapter turns on — treachery against a brother, against the covenant, and against 'the wife of your youth'.",
  }],
  ["H5271", "youth", ["old age", "childhood", "middle age"], {
    notes: "אֵשֶׁת נְעוּרֶיךָ, 'the wife of your youth' — 2:14–15, the passage usually quoted as the Bible's sharpest word against divorce.",
  }],
  ["H2278", "a companion, a wife", ["a stranger", "a servant", "a rival"], {}],
  ["H1166", "to marry, to be master of", ["to divorce", "to serve", "to inherit"], {}],
  ["H5236", "foreign, a foreign god", ["native", "familiar", "ancestral"], {}],
  ["H8441", "an abomination", ["a delight", "a duty", "a custom"], {}],
  ["H168", "a tent", ["a house", "a gate", "a field"], {}],
  ["H603", "groaning, crying", ["laughter", "silence", "singing"], {}],
  ["H5749", "to bear witness, to testify", ["to conceal", "to deny", "to forget"], {}],
  ["H5003", "to commit adultery", ["to keep faith", "to marry", "to divorce"], {}],
  ["H8267", "a lie, falsehood", ["truth", "an oath", "a promise"], {}],
  ["H3784", "to practise sorcery", ["to pray", "to prophesy", "to bless"], {}],
  ["H7916", "a hired worker", ["an owner", "a slave", "a guest"], {}],
  ["H490", "a widow", ["a bride", "an orphan", "a stranger"], {}],
  ["H3490", "an orphan", ["a widow", "an heir", "a firstborn"], {
    notes: "3:5 lists the hired worker, the widow, the orphan and the resident foreigner — the four standard categories of the legally defenceless, and the prophet puts oppressing them beside sorcery and adultery.",
  }],
  ["H1616", "a resident foreigner, a sojourner", ["a citizen", "a traveller", "an enemy"], {}],
  ["H5186", "to turn aside, to stretch out", ["to hold straight", "to stand fast", "to gather"], {}],

  // =========================================================================
  // Blessing, curse, wickedness
  // =========================================================================
  ["H779", "to curse", ["to bless", "to praise", "to spare"], {}],
  ["H3994", "a curse", ["a blessing", "a promise", "a gift"], {}],
  ["H1293", "a blessing", ["a curse", "a debt", "a burden"], {}],
  ["H2194", "to be indignant, to denounce", ["to favour", "to pardon", "to ignore"], {}],
  ["H7564", "wickedness", ["righteousness", "innocence", "mercy"], {}],
  ["H6666", "righteousness", ["wickedness", "folly", "poverty"], {}],
  ["H5766", "injustice, wrong", ["justice", "kindness", "truth"], {}],
  ["H5771", "iniquity, guilt", ["innocence", "merit", "pardon"], {}],
  ["H3782", "to stumble", ["to stand", "to run", "to climb"], {}],
  ["H2086", "arrogant, presumptuous", ["humble", "gentle", "fearful"], {}],
  ["H1215", "unjust gain", ["a fair wage", "a loss", "a gift"], {}],
  ["H4172", "fear, reverence", ["contempt", "affection", "indifference"], {}],
  ["H346", "where?", ["when?", "why?", "how?"], {}],
  ["H1351", "to defile, to pollute", ["to cleanse", "to consecrate", "to honour"], {
    notes: "Not to be confused with גָּאַל 'to redeem', which the Ruth track teaches and which is spelled the same. Different roots, opposite worlds.",
  }],
  ["H2891", "to be clean, to purify", ["to defile", "to break", "to hide"], {}],
  ["H2706", "a statute, a decree", ["a rumour", "a request", "a custom"], {}],
  ["H4931", "a charge, a duty kept", ["a holiday", "a debt", "a wage"], {}],
  ["H2865", "to be shattered, to be dismayed", ["to be steadied", "to be glad", "to be strong"], {}],
  ["H4334", "level ground, uprightness", ["a slope", "a pit", "a mountain"], {}],

  // =========================================================================
  // The refiner, the day, the ending
  // =========================================================================
  ["H2655", "delighting in, pleased with", ["displeased", "indifferent", "reluctant"], {}],
  ["H784", "fire", ["water", "wind", "earth"], {}],
  ["H6884", "to refine, to smelt", ["to corrode", "to bury", "to break"], {
    notes: "3:2–3 — he sits as a refiner and purifier of silver. The metallurgist's craft is that he sits and watches, because silver is judged done by eye at exactly the right moment.",
  }],
  ["H1287", "lye, fuller's soap", ["oil", "perfume", "wine"], {}],
  ["H3526", "to wash, to full cloth", ["to soil", "to tear", "to dye"], {}],
  ["H2212", "to refine, to strain", ["to muddy", "to dilute", "to discard"], {}],
  ["H974", "to test, to assay", ["to trust blindly", "to reject", "to ignore"], {
    notes: "3:10 — 'put me to the test in this'. The verb belongs to metal assaying, and it is the only place in the Hebrew Bible where God invites it.",
  }],
  ["H6149", "to be pleasant, agreeable", ["to be bitter", "to be harsh", "to be rejected"], {}],
  ["H6931", "former, ancient", ["future", "recent", "present"], {}],
  ["H2550", "to spare, to have compassion", ["to destroy", "to condemn", "to abandon"], {}],
  ["H7181", "to pay attention, to listen", ["to ignore", "to interrupt", "to forget"], {}],
  ["H833", "to call blessed", ["to curse", "to pity", "to envy"], {}],
  ["H6941", "in mourning garb, gloomily", ["cheerfully", "boldly", "quietly"], {}],
  ["H587", "we", ["you", "they", "I"], {}],
  ["H8574", "an oven, a furnace", ["a hearth", "a lamp", "a forge"], {}],
  ["H7179", "stubble, straw", ["grain", "green wood", "stone"], {}],
  ["H3857", "to set ablaze, to consume", ["to quench", "to cool", "to shelter"], {}],
  ["H8328", "a root", ["a branch", "a leaf", "a fruit"], {}],
  ["H6057", "a branch", ["a root", "a trunk", "a seed"], {
    notes: "3:19 — the day leaves them neither root nor branch. The pair is a merism: nothing at either end, so nothing at all.",
  }],
  ["H6335", "to leap, to frisk", ["to stand still", "to limp", "to sleep"], {}],
  ["H5695", "a calf", ["an ox", "a lamb", "a goat"], {}],
  ["H4770", "a stall", ["a field", "a yoke", "a market"], {
    notes: "3:20 — you shall go out leaping like calves from the stall. An animal let out after confinement, which is the book's one image of unmixed joy.",
  }],
  ["H6072", "to tread down, to crush", ["to lift up", "to spare", "to gather"], {}],

  // =========================================================================
  // Land and desolation
  // =========================================================================
  ["H1366", "a border, a territory", ["a centre", "a road", "a city"], {}],
  ["H4057", "wilderness, pasture", ["a city", "a garden", "a marsh"], {}],
  ["H8077", "desolation", ["prosperity", "a harvest", "a city"], {}],
  ["H2723", "a ruin, waste places", ["a building", "a field", "a garden"], {}],
  ["H8568", "a jackal", ["a lion", "an eagle", "a sheep"], {}],
  ["H7567", "to beat down, to shatter", ["to rebuild", "to protect", "to raise"], {}],
  ["H2040", "to tear down", ["to build", "to repair", "to establish"], {}],
  ["H4217", "the east, sunrise", ["the west", "the north", "the south"], {}],
  ["H3996", "the entrance, the setting", ["the exit", "the summit", "the centre"], {
    notes: "1:11 — 'from the rising of the sun to its מָבוֹא', that is, to its going in. East to west, meaning everywhere.",
  }],
  ["H7921", "to make childless, to cause miscarriage", ["to make fruitful", "to bless", "to preserve"], {}],
];

// ---------------------------------------------------------------------------

/** Everything the five earlier Hebrew books already gloss — Haggai included. */
function inherited() {
  const merged = new Map();
  for (const file of [
    "jonah-glossary.json",
    "ruth-glossary.json",
    "esther-glossary.json",
    "ecclesiastes-glossary.json",
    "haggai-glossary.json",
  ]) {
    const { words = [] } = JSON.parse(readFileSync(resolve(HERE, file), "utf8"));
    for (const w of words) merged.set(String(w.lemma), { ...w });
  }
  return merged;
}

/** Notes anchored in another book's story — dropped rather than re-pointed. */
const FOREIGN_NOTE =
  /Ruth|Jonah|Naomi|Boaz|Nineveh|Moab|Bethlehem|Orpah|Esther|Mordecai|Haman|Vashti|Susa|Shushan|Persia|Qoheleth|Ecclesiastes|Haggai|Zerubbabel|the fish|the storm/i;

const seen = new Map();
const authored = ENTRIES.map(([lemma, gloss, distractors, extras = {}]) => {
  if (seen.has(lemma)) throw new Error(`duplicate lemma ${lemma}: "${seen.get(lemma)}" and "${gloss}"`);
  seen.set(lemma, gloss);
  if (distractors.length !== 3) throw new Error(`${lemma} has ${distractors.length} distractors, want 3`);
  if (distractors.includes(gloss)) throw new Error(`${lemma} lists its own gloss as a distractor`);
  if (new Set(distractors).size !== 3) throw new Error(`${lemma} has a repeated distractor`);
  return { lemma, gloss, distractors, ...extras };
});

const words = [];
let reused = 0;
let stripped = 0;
for (const [lemma, w] of inherited()) {
  if (seen.has(lemma)) continue;
  const entry = { ...w };
  if (entry.notes && FOREIGN_NOTE.test(entry.notes)) {
    delete entry.notes;
    stripped++;
  }
  words.push(entry);
  reused++;
}
words.push(...authored);

const out = {
  _readme:
    "Hand-written glosses, distractors, roots and teaching notes for Malachi. " +
    "Generated by build-malachi-glossary.mjs — edit that, not this. Entries shared " +
    "with Jonah, Ruth, Esther, Ecclesiastes and Haggai are inherited at build time; " +
    "Haggai was curated first because the two post-exilic books share a dozen words. " +
    "Glosses are short TEACHING meanings, not lexicon entries. A Hebraist should " +
    "read all of it.",
  words,
};

const path = resolve(HERE, "malachi-glossary.json");
writeFileSync(path, `${JSON.stringify(out, null, 1)}\n`);
console.log(`wrote ${path}`);
console.log(`  ${words.length} entries — ${authored.length} written for Malachi, ${reused} inherited`);
console.log(`  ${words.filter((w) => w.notes).length} teaching notes · ${stripped} inherited notes dropped`);
