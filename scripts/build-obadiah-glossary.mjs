#!/usr/bin/env node
/**
 * The human contribution to the Obadiah course.
 *
 * THE SHORTEST BOOK IN THE HEBREW BIBLE — one chapter, 21 verses, 285 content
 * words. Third book chosen by the coverage measurement that picked Haggai and
 * Malachi: a reader of the four earlier tracks needs 58 more words to read it
 * at 95%, behind only Haggai's 32 and Malachi's 71.
 *
 * MALACHI PAID FOR PART OF IT. Obadiah is entirely about Edom, and Malachi
 * opens by contrasting Jacob with Esau and naming Edom outright — so עֵשָׂו,
 * אֱדוֹם, the vocabulary of ruin and the covenant language all arrived with the
 * previous track. 61 glosses were left, against the 72 it would have needed
 * before Malachi.
 *
 * WHAT THE 61 ARE. Three clusters. The eagle's nest and the clefts of the rock,
 * which is the book's picture of Edom's false security. The vocabulary of
 * plunder — thieves, grape-gatherers, gleanings, hidden treasures — in a
 * sustained argument that says a robber leaves something behind and Edom will
 * not. And a run of place names in the last three verses, as the territory is
 * parcelled out.
 *
 * A NOTE ON CITATION. Obadiah has no chapters, so its verses are cited bare —
 * "Obadiah 15", not "Obadiah 1:15". The corpus and this pipeline both number it
 * as chapter 1, which is the ordinary convention for a one-chapter book, and
 * the references read "Obadiah 1:15". That is a display decision worth
 * revisiting, not a data error.
 *
 * Usage:  node scripts/build-obadiah-glossary.mjs
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
  // The heading
  // =========================================================================
  ["H5662", "Obadiah", ["Malachi", "Haggai", "Jonah"], {
    notes: "The name means 'servant of the LORD', and it belongs to about a dozen other people in the Hebrew Bible. Nothing else is known about this one — no father, no date, no place.",
  }],
  ["H2377", "a vision", ["a dream", "a law", "a song"], {
    notes: "The book's first word: חֲזוֹן עֹבַדְיָהוּ, 'the vision of Obadiah'. A technical term for prophetic revelation, and the heading of Isaiah and Nahum too.",
  }],
  ["H3069", "the LORD (with Adonai pointing)", ["a servant", "a prophet", "an angel"], {
    notes: "The same four consonants as the divine name, pointed differently. Where the text already reads אֲדֹנָי next to it, the vowels of אֱלֹהִים are used instead so the reader does not say 'Adonai Adonai'. OSHB keys it separately, which is why the frequency counts here differ slightly from the usual published totals.",
  }],
  ["H8052", "a report, news", ["a rumour denied", "a silence", "a command"], {}],
  ["H6735", "an envoy, a messenger", ["a king", "a soldier", "a merchant"], {}],

  // =========================================================================
  // The rock, the nest, the pride
  // =========================================================================
  ["H2087", "arrogance, presumption", ["humility", "fear", "modesty"], {
    notes: "Verse 3: 'the pride of your heart has deceived you'. The word is about presuming beyond one's place, which is the whole indictment.",
  }],
  ["H5377", "to deceive, to delude", ["to warn", "to guide", "to reassure"], {}],
  ["H7931", "to dwell, to settle", ["to depart", "to wander", "to visit"], {}],
  ["H2288", "a cleft, a crevice", ["a plain", "a summit", "a valley floor"], {}],
  ["H5553", "a crag, a rock", ["sand", "a marsh", "clay"], {
    notes: "בְּחַגְוֵי־סֶּלַע, 'in the clefts of the rock'. Edom's cities were cut into sandstone cliffs — Petra is the famous one — and the phrase is both literal geography and the image of a security that will not hold.",
  }],
  ["H7675", "a seat, a dwelling", ["a journey", "a ruin", "a tent"], {}],
  ["H1361", "to be high, to be haughty", ["to be low", "to be humble", "to sink"], {}],
  ["H5404", "an eagle, a vulture", ["a dove", "a sparrow", "a raven"], {}],
  ["H7064", "a nest", ["a den", "a stable", "a burrow"], {
    notes: "Verse 4: 'though you set your nest among the stars'. Jeremiah says almost the same of Edom, and the two oracles share several lines — which of them is quoting is an old question.",
  }],

  // =========================================================================
  // Thieves, grape-gatherers, and what they leave behind
  // =========================================================================
  ["H1590", "a thief", ["a guard", "an owner", "a merchant"], { root: "גנב", familyGloss: "to steal" }],
  ["H1589", "to steal", ["to give", "to guard", "to buy"], { root: "גנב" }],
  ["H7703", "to devastate, to ruin", ["to rebuild", "to protect", "to enrich"], {}],
  ["H1820", "to be destroyed, to be silenced", ["to flourish", "to speak", "to endure"], {}],
  ["H1219", "to gather grapes; to cut off", ["to plant", "to prune", "to water"], {}],
  ["H5955", "gleanings", ["the whole harvest", "the first fruits", "the seed"], {
    notes: "Verse 5 is an argument from ordinary experience: thieves take what they want and stop; grape-gatherers leave gleanings behind. Something always survives a robbery — and that is precisely what will not happen here.",
  }],
  ["H2664", "to search out, to ransack", ["to overlook", "to hide", "to guard"], {}],
  ["H1158", "to search out, to lay bare", ["to conceal", "to protect", "to ignore"], {}],
  ["H4710", "a hidden thing, a treasure", ["an open field", "a debt", "a ruin"], {}],
  ["H4204", "a snare, a trap", ["a shelter", "a gift", "a road"], {}],
  ["H8394", "understanding, discernment", ["folly", "ignorance", "strength"], {
    notes: "Verse 7 — 'there is no discernment in him'. Edom had a reputation for wisdom, which Jeremiah also mentions, so losing it is a sharper loss than it sounds.",
  }],

  // =========================================================================
  // Teman, slaughter, and the day of the brother
  // =========================================================================
  ["H8487", "Teman", ["Bozrah", "Sela", "Zion"], {
    notes: "A region of Edom, used here as a name for the whole. Job's friend Eliphaz is a Temanite, which is part of Edom's reputation for wisdom.",
  }],
  ["H4616", "so that, on account of", ["although", "unless", "before"], {}],
  ["H6993", "slaughter", ["rescue", "a wound", "a burial"], {}],
  ["H955", "shame", ["honour", "pride", "glory"], {}],
  ["H7617", "to take captive", ["to release", "to ransom", "to shelter"], {}],
  ["H2114", "a stranger, an outsider", ["a kinsman", "a neighbour", "a citizen"], {}],
  ["H3032", "to cast lots", ["to choose", "to refuse", "to inherit"], {
    notes: "Verse 11: 'they cast lots for Jerusalem, and you were as one of them'. The charge against Edom is not that it attacked but that it stood by and then joined in.",
  }],
  ["H343", "calamity, disaster", ["prosperity", "rescue", "peace"], {
    notes: "Three times in verses 13–14, hammering: 'in the day of their אֵיד'. The book's central accusation is about conduct on a single day.",
  }],
  ["H5235", "misfortune, a strange thing", ["a blessing", "a routine day", "a gift"], {}],
  ["H6563", "a crossroads, a fork", ["a dead end", "a gate", "a bridge"], {}],
  ["H6412", "a fugitive, one who escapes", ["a captor", "a citizen", "a soldier"], { root: "פלט", familyGloss: "escape, deliverance" }],
  ["H6413", "an escaped remnant, deliverance", ["destruction", "captivity", "a siege"], { root: "פלט" }],
  ["H8300", "a survivor", ["a casualty", "a captor", "a stranger"], {}],

  // =========================================================================
  // The day of the LORD, and the reversal
  // =========================================================================
  ["H1576", "a recompense, what one deserves", ["a gift", "a wage", "a loan"], {
    notes: "Verse 15 is the book's hinge: 'as you have done, it shall be done to you; your גְּמוּל shall return upon your own head'. Everything before it is charge and everything after it is reversal.",
  }],
  ["H8548", "continually, without ceasing", ["once", "rarely", "never"], {}],
  ["H3886", "to swallow, to gulp", ["to spit out", "to sip", "to refuse"], {}],
  ["H6726", "Zion", ["Teman", "Samaria", "Sepharad"], {}],
  ["H3423", "to possess, to dispossess", ["to surrender", "to lend", "to abandon"], {
    notes: "Four times in the closing verses, and it works both ways: to take possession of, and to drive out the previous holder. The parcelling out of Edom's land is described with the same verb used of Israel taking Canaan.",
  }],
  ["H4180", "a possession", ["a loss", "a debt", "a loan"], {}],
  ["H3130", "Joseph", ["Benjamin", "Ephraim", "Judah"], {}],
  ["H3852", "a flame", ["smoke", "ash", "embers"], {}],
  ["H1814", "to burn, to set alight", ["to quench", "to smoulder", "to cool"], {
    notes: "Verse 18: Jacob shall be a fire and Joseph a flame, and Esau stubble. Malachi ends with the same image of stubble burning, one book later in the canon.",
  }],
  ["H3467", "to save, to deliver", ["to condemn", "to abandon", "to accuse"], {}],
  ["H4410", "kingship, a kingdom", ["exile", "servitude", "a province"], {
    notes: "The last word of the book: וְהָיְתָה לַיהוָה הַמְּלוּכָה — 'and the kingdom shall be the LORD's'.",
  }],

  // =========================================================================
  // The land parcelled out (19–20)
  // =========================================================================
  ["H5045", "the Negev, the south", ["the north", "the coast", "the hills"], {}],
  ["H8219", "the Shephelah, the lowland", ["the highlands", "the desert", "the coast"], {}],
  ["H6430", "a Philistine", ["a Canaanite", "an Edomite", "a Moabite"], {}],
  ["H669", "Ephraim", ["Benjamin", "Judah", "Gilead"], {}],
  ["H8111", "Samaria", ["Jerusalem", "Bethel", "Shechem"], {}],
  ["H1144", "Benjamin", ["Ephraim", "Judah", "Manasseh"], {}],
  ["H1568", "Gilead", ["Samaria", "the Negev", "the Shephelah"], {}],
  ["H1546", "exile, the exiles", ["the homeland", "the return", "the captors"], {}],
  ["H2426", "a force, an army", ["a village", "a family", "a flock"], {}],
  ["H3669", "a Canaanite; a trader", ["an Israelite", "an Edomite", "a Philistine"], {}],
  ["H6886", "Zarephath", ["Sepharad", "Samaria", "Teman"], {}],
  ["H5614", "Sepharad", ["Zarephath", "Teman", "Gilead"], {
    notes: "Nobody is certain where this is — Sardis in Asia Minor is the usual guess. Later Jewish tradition identified it with Spain, which is why Sephardi Jews are so called.",
  }],
];

// ---------------------------------------------------------------------------

/** Everything the six earlier Hebrew books already gloss. */
function inherited() {
  const merged = new Map();
  for (const file of [
    "jonah-glossary.json",
    "ruth-glossary.json",
    "esther-glossary.json",
    "ecclesiastes-glossary.json",
    "haggai-glossary.json",
    "malachi-glossary.json",
  ]) {
    const { words = [] } = JSON.parse(readFileSync(resolve(HERE, file), "utf8"));
    for (const w of words) merged.set(String(w.lemma), { ...w });
  }
  return merged;
}

/** Notes anchored in another book's story — dropped rather than re-pointed. */
const FOREIGN_NOTE =
  /Ruth|Jonah|Naomi|Boaz|Nineveh|Moab|Bethlehem|Orpah|Esther|Mordecai|Haman|Vashti|Susa|Shushan|Persia|Qoheleth|Ecclesiastes|Haggai|Zerubbabel|Malachi|the fish|the storm/i;

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
    "Hand-written glosses, distractors, roots and teaching notes for Obadiah. " +
    "Generated by build-obadiah-glossary.mjs — edit that, not this. Entries shared " +
    "with the six earlier Hebrew tracks are inherited at build time; Malachi in " +
    "particular had already taught the Esau and Edom vocabulary this whole book is " +
    "about. Glosses are short TEACHING meanings, not lexicon entries. A Hebraist " +
    "should read all of it.",
  words,
};

const path = resolve(HERE, "obadiah-glossary.json");
writeFileSync(path, `${JSON.stringify(out, null, 1)}\n`);
console.log(`wrote ${path}`);
console.log(`  ${words.length} entries — ${authored.length} written for Obadiah, ${reused} inherited`);
console.log(`  ${words.filter((w) => w.notes).length} teaching notes · ${stripped} inherited notes dropped`);
