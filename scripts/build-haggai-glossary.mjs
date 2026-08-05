#!/usr/bin/env node
/**
 * The human contribution to the Haggai course.
 *
 * THE EASIEST COMPLETE BOOK IN THE HEBREW BIBLE — for a reader who has done
 * Jonah, Ruth, Esther and Ecclesiastes. Measured against the 1,047 lexemes
 * those four teach, Haggai already reads at 76% of its running words, and just
 * 32 more words carry it past 95% — the threshold where a book becomes
 * readable with a lexicon rather than decoded with one. Nothing else in the
 * canon is close: Obadiah needs 58, Malachi 71, and the next tier over 130.
 *
 * It costs 61 glosses in total. Ecclesiastes cost 285.
 *
 * WHY IT IS SO CHEAP. Two chapters of dated prose — Haggai is the most
 * precisely dated book in the Bible, every oracle stamped with a regnal year,
 * month and day — and the vocabulary is the ordinary vocabulary of harvest,
 * building and administration that the narrative books already taught. The 61
 * new words are mostly the specifics: the produce that failed, the tools of the
 * temple site, and six proper names.
 *
 * ONE THING TO WATCH. יְהוָה צְבָאוֹת, "the LORD of hosts", occurs fourteen
 * times in 38 verses — the single densest phrase in the book, and צָבָא is by
 * some distance the commonest word a reader will not already know.
 *
 * Usage:  node scripts/build-haggai-glossary.mjs
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
  // The formula that runs the book
  // =========================================================================
  ["H6635", "an army, a host", ["a family", "a village", "a flock"], {
    notes: "Almost always in יְהוָה צְבָאוֹת, 'the LORD of hosts' — fourteen times in 38 verses. The hosts are armies, whether Israel's, the nations', or heaven's; the title asserts command over all three, which is the whole argument of a book addressed to people rebuilding on a ruin.",
  }],
  ["H5002", "an utterance, an oracle", ["a question", "a rumour", "a request"], {
    notes: "A technical word of prophecy, nearly always in נְאֻם־יְהוָה, 'says the LORD' — but more precisely 'the utterance of the LORD'. It marks the words on either side of it as quoted rather than reported.",
  }],
  ["H5030", "a prophet", ["a priest", "a king", "a scribe"], {}],
  ["H3548", "a priest", ["a prophet", "a king", "a servant"], {}],
  ["H8451", "instruction, law", ["a story", "a song", "a rumour"], {
    notes: "2:11 — 'ask now the priests for תּוֹרָה'. Here it is a specific ruling on a point of ceremonial law, not the Pentateuch: the priests are being asked for a legal opinion, and they give one.",
  }],

  // =========================================================================
  // The people, and the date
  // =========================================================================
  ["H2292", "Haggai", ["Zechariah", "Malachi", "Zerubbabel"], {
    notes: "The name means something like 'festal', from חַג 'a feast'. He and Zechariah prophesy in the same year, and the book of Ezra names them both as the reason the temple work restarted.",
  }],
  ["H2216", "Zerubbabel", ["Joshua", "Shealtiel", "Jehozadak"], {
    notes: "Governor of Judah and a grandson of the exiled king Jehoiachin — the Ἰεχονίας of Matthew's genealogy, which the Matthew track teaches. The book ends by calling him God's signet ring.",
  }],
  ["H7597", "Shealtiel (Zerubbabel's father)", ["Jehozadak", "Joshua", "Darius"], {}],
  ["H3091", "Joshua (the high priest)", ["Zerubbabel", "Shealtiel", "Haggai"], {}],
  ["H3087", "Jehozadak (Joshua's father)", ["Shealtiel", "Zerubbabel", "Darius"], {}],
  ["H1867", "Darius (king of Persia)", ["Ahasuerus", "Cyrus", "Nebuchadnezzar"], {
    notes: "Darius I. Every oracle in the book is dated by his regnal year, month and day — Haggai is the most precisely dated book in the Hebrew Bible, and the dates are checkable against Persian records.",
  }],
  ["H4714", "Egypt", ["Babylon", "Persia", "Assyria"], {}],
  ["H1471", "a nation, the nations", ["a family", "a city", "a tribe"], {}],
  ["H7611", "a remnant, what is left", ["the whole", "the firstborn", "the majority"], {
    notes: "'The remnant of the people' is who Haggai is addressing: those who came back, as against the many who did not.",
  }],
  ["H8345", "sixth", ["seventh", "fifth", "ninth"], {}],
  ["H8671", "ninth", ["eighth", "tenth", "sixth"], {}],

  // =========================================================================
  // Chapter 1 — the ruined house and the failed harvest
  // =========================================================================
  ["H2720", "waste, in ruins", ["rebuilt", "inhabited", "finished"], {}],
  ["H5603", "to panel, to roof over", ["to demolish", "to strip bare", "to leave open"], {
    notes: "1:4 — 'is it a time for you to dwell in your panelled houses, while this house lies waste?' The word is about finished interior woodwork: the contrast is between comfort and a building site.",
  }],
  ["H3513", "to be heavy; to be honoured", ["to be light", "to be despised", "to be empty"], {
    notes: "1:8 — 'that I may take pleasure in it and be glorified'. The root's literal sense is weight, and honour in Hebrew is heaviness.",
  }],
  ["H7654", "satisfaction, one's fill", ["hunger", "a shortage", "a taste"], {}],
  ["H7937", "to drink one's fill, to be drunk", ["to thirst", "to fast", "to pour out"], {}],
  ["H2527", "heat, warmth", ["cold", "damp", "shade"], {}],
  ["H6872", "a bag, a bundle", ["a jar", "a basket", "a cart"], {}],
  ["H5344", "to pierce, to bore through", ["to seal", "to mend", "to weave"], {
    notes: "1:6 — wages put into a bag with holes in it. The two words together are the book's picture of an economy that does not hold.",
  }],
  ["H7936", "to hire, to earn wages", ["to give freely", "to steal", "to inherit"], {}],
  ["H5301", "to blow away, to puff at", ["to gather in", "to preserve", "to shelter"], {}],
  ["H3282", "because, on account of", ["although", "unless", "instead of"], {}],
  ["H2919", "dew", ["rain", "frost", "hail"], {}],
  ["H2981", "produce, yield", ["a seed", "a famine", "a debt"], {}],
  ["H2721", "drought", ["a flood", "a harvest", "a storm"], {}],
  ["H1715", "grain", ["wine", "oil", "fruit"], {
    notes: "Grain, wine and oil — דָּגָן, תִּירוֹשׁ, יִצְהָר — are the standard triad of the land's produce, and Haggai lists all three as having failed.",
  }],
  ["H8492", "new wine", ["grain", "oil", "water"], {}],
  ["H3323", "fresh oil", ["grain", "wine", "honey"], {}],
  ["H3018", "toil, and what it earns", ["rest", "a gift", "an inheritance"], {}],
  ["H5782", "to rouse, to stir up", ["to lull", "to silence", "to restrain"], {
    notes: "1:14 — the LORD stirred up the spirit of Zerubbabel, of Joshua and of all the remnant, and they came and did the work. The book's turning point is a change of will, not of circumstances.",
  }],
  ["H4400", "a message, a commission", ["a rumour", "a question", "a refusal"], {
    notes: "1:13 calls Haggai the LORD's מַלְאָךְ delivering his מַלְאֲכוּת — messenger and message from one root. The noun occurs nowhere else in the Bible.",
  }],

  // =========================================================================
  // Chapter 2 — the greater glory, the ruling on holiness, the signet
  // =========================================================================
  ["H2388", "to be strong, to take courage", ["to weaken", "to despair", "to yield"], {
    notes: "2:4 — 'be strong, Zerubbabel; be strong, Joshua; be strong, all the people of the land, and work'. Three imperatives and then the reason.",
  }],
  ["H3644", "like, as", ["unlike", "instead of", "because of"], {}],
  ["H7493", "to shake, to make tremble", ["to steady", "to settle", "to calm"], {}],
  ["H2724", "dry land, a waste", ["the sea", "a marsh", "a forest"], {}],
  ["H2532", "desire, what is precious", ["contempt", "a burden", "a refusal"], {
    notes: "2:7, and one of the famously ambiguous phrases in the prophets: חֶמְדַּת כָּל־הַגּוֹיִם, either 'the desire of all nations' or 'the treasures of all nations'. The verb is singular and the noun plural, which is what starts the argument.",
  }],
  ["H2005", "behold, if", ["never", "perhaps", "unless"], {}],
  ["H5138", "stew, boiled food", ["bread", "wine", "raw meat"], {}],
  ["H3978", "food", ["drink", "clothing", "shelter"], {}],
  ["H6942", "to be holy, to consecrate", ["to defile", "to discard", "to sell"], {
    notes: "2:12–13 is a ruling with a sting: holiness does not spread by contact, but uncleanness does. The priests answer both questions correctly and the prophet applies it to them.",
  }],
  ["H2930", "to be unclean, to defile", ["to purify", "to consecrate", "to wash"], {}],
  ["H3342", "a wine vat", ["a threshing floor", "a granary", "a cistern"], {}],
  ["H2834", "to draw off, to strip", ["to fill", "to cover", "to seal"], {}],
  ["H6333", "a winepress", ["a wine vat", "an olive press", "a mill"], {}],
  ["H7711", "blight", ["a good harvest", "rain", "shade"], {}],
  ["H3420", "mildew, blight-yellow", ["ripeness", "green shoots", "dew"], {}],
  ["H1259", "hail", ["dew", "snow", "rain"], {}],
  ["H4035", "a granary, a store", ["a field", "a market", "a mill"], {}],
  ["H1612", "a vine", ["a fig tree", "an olive", "a pomegranate"], {}],
  ["H8384", "a fig tree", ["a vine", "an olive", "a pomegranate"], {}],
  ["H7416", "a pomegranate", ["a fig", "an olive", "a grape"], {}],
  ["H2132", "an olive tree", ["a vine", "a fig tree", "a palm"], {
    notes: "2:19 lists vine, fig, pomegranate and olive — the four crops that mark a settled and prosperous land, and the promise is that from this day they will bear.",
  }],
  ["H4467", "a kingdom", ["a village", "a household", "a tribe"], {}],
  ["H2392", "strength", ["weakness", "beauty", "wealth"], {}],
  ["H4818", "a chariot", ["a horse", "a ship", "a cart"], {}],
  ["H2368", "a signet ring", ["a crown", "a staff", "a sword"], {
    notes: "The last word of the book: 'I will make you as a signet ring, for I have chosen you'. A signet is a man's authority in portable form, and Jeremiah had said of Zerubbabel's grandfather that even if he were a signet on God's right hand he would be torn off. Haggai reverses it.",
  }],
];

// ---------------------------------------------------------------------------

/** Everything the four earlier Hebrew books already gloss. */
function inherited() {
  const merged = new Map();
  for (const file of [
    "jonah-glossary.json",
    "ruth-glossary.json",
    "esther-glossary.json",
    "ecclesiastes-glossary.json",
  ]) {
    const { words = [] } = JSON.parse(readFileSync(resolve(HERE, file), "utf8"));
    for (const w of words) merged.set(String(w.lemma), { ...w });
  }
  return merged;
}

/** Notes anchored in another book's story — dropped rather than re-pointed. */
const FOREIGN_NOTE =
  /Ruth|Jonah|Naomi|Boaz|Nineveh|Moab|Bethlehem|Orpah|Esther|Mordecai|Haman|Vashti|Susa|Shushan|Persia|Qoheleth|Ecclesiastes|the fish|the storm/i;

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
    "Hand-written glosses, distractors, roots and teaching notes for Haggai. " +
    "Generated by build-haggai-glossary.mjs — edit that, not this. Entries shared " +
    "with Jonah, Ruth, Esther and Ecclesiastes are inherited at build time. Glosses " +
    "are short TEACHING meanings, not lexicon entries. A Hebraist should read all of it.",
  words,
};

const path = resolve(HERE, "haggai-glossary.json");
writeFileSync(path, `${JSON.stringify(out, null, 1)}\n`);
console.log(`wrote ${path}`);
console.log(`  ${words.length} entries — ${authored.length} written for Haggai, ${reused} inherited`);
console.log(`  ${words.filter((w) => w.notes).length} teaching notes · ${stripped} inherited notes dropped`);
