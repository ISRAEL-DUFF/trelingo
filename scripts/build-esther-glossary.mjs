#!/usr/bin/env node
/**
 * The human contribution to the Esther course.
 *
 * Same division of labour as Jonah and Ruth: the importer derives text, parses,
 * attestations and primitive-root highlights from OSHB and Strong's; everything
 * a learner READS is hand-written here.
 *
 *   gloss        a short teaching meaning for a beginner reading Esther. NOT a
 *                lexicon entry. Strong's is 19th-century paraphrase and its
 *                Persian-court vocabulary is especially bad out of context
 *                ("a rod of empire", "a relay of animals on a post-route").
 *   distractors  three plausible wrong answers, from the same semantic
 *                neighbourhood without being synonyms.
 *   root         ONLY where the safe primitive-root rule cannot reach it and
 *                the pairing is visible IN ESTHER ITSELF. Strong's "from HXXXX"
 *                chains stay refused — see import-oshb.mjs and
 *                jonah-spike-findings.md §3.
 *   familyGloss  authored, never inferred from the commonest member.
 *
 * WHY ESTHER, THIRD. Candidates were ranked on content tokens per lemma — the
 * measure of how hard a book's vocabulary works. Esther 6.0; Judges 7.6 for
 * three times the curation; Ecclesiastes 4.8 and not narrative at all; Genesis
 * 10.7 but 1,262 new glosses, which is Mark-scale. Esther was the best ratio
 * available at an affordable price, over 167 verses of continuous prose.
 *
 * WHAT IT COST. 464 distinct content lemmas, of which Jonah and Ruth already
 * gloss 164. Only 300 needed writing — but 53 of those are proper nouns: 42
 * people (including Haman's ten sons and fourteen court officials named once),
 * 7 places and 4 Babylonian month names. That is the price of the one book of
 * the Hebrew Bible set entirely outside the land.
 *
 * (The candidate survey counted 400 lemmas against the importer's 464. The
 * survey keyed OSHB lemmas directly; the importer resolves homograph suffixes
 * and compound `+` lemmas to Strong's keys first. The importer's number is the
 * one to trust — it is the vocabulary the course actually teaches.)
 *
 * REUSE IS MECHANICAL. Jonah's and Ruth's entries are merged in below rather
 * than retyped, so a correction to a shared word is made once. Where a reused
 * entry carried a note anchored in its own book — H8179 "the gate" explained
 * through Boaz, H8242 "sackcloth" through Jonah's cattle — Esther re-authors
 * it, because a note about Bethlehem in the middle of Susa reads as a bug.
 *
 * Usage:  node scripts/build-esther-glossary.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * [strongs, gloss, [three distractors], extras?]
 *
 * An entry here overrides the same lemma inherited from Jonah or Ruth.
 */
const ENTRIES = [
  // -------------------------------------------------------------------------
  // The five people the book is about
  // -------------------------------------------------------------------------
  ["H4782", "Mordecai", ["Haman", "Hegai", "Hathach"], {
    notes: "Named 58 times — more than anyone else in the book. Introduced in 2:5 with four generations of ancestry, which is how the narrator marks him as the Jew of the exile rather than a courtier who happens to be Jewish.",
  }],
  ["H635", "Esther", ["Vashti", "Zeresh", "Abihail"], {
    notes: "A Persian court name, probably from the goddess Ishtar or from Persian stara, 'star'. Her Hebrew name, given once in 2:7, is הֲדַסָּה — Hadassah, 'myrtle'.",
  }],
  ["H2001", "Haman", ["Mordecai", "Memucan", "Hegai"], {}],
  ["H325", "Ahasuerus (Xerxes)", ["Nebuchadnezzar", "Jeconiah", "Cyrus"], {
    notes: "The Hebrew spelling of Persian Khshayarsha — the king Greek writers call Xerxes. He is on stage in almost every chapter and decides almost nothing.",
  }],
  ["H2060", "Vashti", ["Esther", "Zeresh", "Hadassah"], {}],

  // ---- the rest of the named cast ----
  ["H4099", "Hammedatha (Haman's father)", ["Abihail", "Jair", "Kish"], {}],
  ["H91", "an Agagite", ["a Benjamite", "a Jew", "a Persian"], {
    notes: "Haman's epithet. Agag was the Amalekite king Saul spared in 1 Samuel 15; Mordecai is a Benjamite descended from Kish, Saul's father. The two labels set an old quarrel running under the whole book.",
  }],
  ["H4462", "Memucan (a royal counsellor)", ["Carshena", "Admatha", "Marsena"], {}],
  ["H1896", "Hegai (keeper of the women)", ["Shaashgaz", "Hathach", "Harbonah"], {}],
  ["H2047", "Hathach (Esther's attendant)", ["Hegai", "Harbonah", "Bigthan"], {}],
  ["H2238", "Zeresh (Haman's wife)", ["Vashti", "Esther", "Abihail"], {}],
  ["H2726", "Harbonah (a eunuch)", ["Hathach", "Hegai", "Teresh"], {}],
  ["H904", "Bigthan (a doorkeeper)", ["Teresh", "Bigtha", "Zethar"], {}],
  ["H8657", "Teresh (a doorkeeper)", ["Bigthan", "Carcas", "Abagtha"], {}],
  ["H4104", "Mehuman (a eunuch of the king)", ["Biztha", "Harbona", "Zethar"], {}],
  ["H968", "Biztha (a eunuch of the king)", ["Mehuman", "Bigtha", "Carcas"], {}],
  ["H903", "Bigtha (a eunuch of the king)", ["Abagtha", "Biztha", "Zethar"], {}],
  ["H5", "Abagtha (a eunuch of the king)", ["Bigtha", "Mehuman", "Carcas"], {}],
  ["H2242", "Zethar (a eunuch of the king)", ["Carcas", "Biztha", "Bigtha"], {}],
  ["H3752", "Carcas (a eunuch of the king)", ["Zethar", "Abagtha", "Mehuman"], {}],
  ["H8190", "Shaashgaz (keeper of the concubines)", ["Hegai", "Hathach", "Harbonah"], {}],
  ["H3771", "Carshena (a Persian prince)", ["Shethar", "Admatha", "Meres"], {}],
  ["H8369", "Shethar (a Persian prince)", ["Carshena", "Marsena", "Memucan"], {}],
  ["H133", "Admatha (a Persian prince)", ["Meres", "Marsena", "Carshena"], {}],
  ["H4825", "Meres (a Persian prince)", ["Marsena", "Admatha", "Shethar"], {}],
  ["H4826", "Marsena (a Persian prince)", ["Meres", "Carshena", "Admatha"], {}],
  ["H32", "Abihail (Esther's father)", ["Hammedatha", "Jair", "Shimei"], {}],
  ["H2971", "Jair (Mordecai's father)", ["Shimei", "Kish", "Abihail"], {}],
  ["H8096", "Shimei (an ancestor of Mordecai)", ["Jair", "Kish", "Jeconiah"], {}],
  ["H7027", "Kish (an ancestor of Mordecai)", ["Shimei", "Jair", "Hammedatha"], {}],
  ["H3204", "Jeconiah (a king of Judah)", ["Nebuchadnezzar", "Ahasuerus", "Kish"], {}],
  ["H5019", "Nebuchadnezzar", ["Ahasuerus", "Jeconiah", "Xerxes"], {}],
  ["H1919", "Hadassah (Esther's Hebrew name)", ["Vashti", "Zeresh", "Abihail"], {}],

  // ---- the ten sons of Haman (9:7–9), a single roll-call ----
  ["H6577", "Parshandatha (a son of Haman)", ["Dalphon", "Aspatha", "Poratha"], {}],
  ["H1813", "Dalphon (a son of Haman)", ["Parshandatha", "Aspatha", "Adalia"], {}],
  ["H630", "Aspatha (a son of Haman)", ["Poratha", "Dalphon", "Aridatha"], {}],
  ["H6334", "Poratha (a son of Haman)", ["Adalia", "Aspatha", "Parmashta"], {}],
  ["H118", "Adalia (a son of Haman)", ["Aridatha", "Poratha", "Arisai"], {}],
  ["H743", "Aridatha (a son of Haman)", ["Parmashta", "Adalia", "Aridai"], {}],
  ["H6534", "Parmashta (a son of Haman)", ["Arisai", "Aridatha", "Vaizatha"], {}],
  ["H747", "Arisai (a son of Haman)", ["Aridai", "Parmashta", "Dalphon"], {}],
  ["H742", "Aridai (a son of Haman)", ["Vaizatha", "Arisai", "Aspatha"], {}],
  ["H2055", "Vaizatha (a son of Haman)", ["Aridai", "Parmashta", "Poratha"], {}],

  // -------------------------------------------------------------------------
  // Peoples and places
  // -------------------------------------------------------------------------
  ["H3064", "a Jew", ["a Persian", "a Mede", "an Amalekite"], {
    root: "יהד",
    familyGloss: "Judah, Jewish",
    notes: "The book's own word for its people — 58 times, more than in the whole rest of the Hebrew Bible. It names them by the province they came from, Judah, which is what an empire calls a people it has moved.",
  }],
  ["H3063", "Judah", ["Israel", "Benjamin", "Persia"], { root: "יהד", familyGloss: "Judah, Jewish" }],
  ["H3054", "to become a Jew", ["to renounce", "to emigrate", "to rebel"], {
    root: "יהד",
    notes: "8:17 only, and the only occurrence in the Hebrew Bible: מִתְיַהֲדִים, 'were becoming Jews', after the second decree. A verb coined from the noun.",
  }],
  ["H1145", "a Benjamite", ["an Ephraimite", "a Judahite", "a Levite"], {}],
  ["H7800", "Susa (the capital)", ["Babylon", "Jerusalem", "Persepolis"], {
    notes: "The Persian winter capital, in what is now south-western Iran. The book distinguishes שׁוּשַׁן הַבִּירָה, the fortified citadel where the court lives, from the city outside it.",
  }],
  ["H6539", "Persia", ["Media", "Babylon", "Egypt"], {}],
  ["H4074", "Media", ["Persia", "India", "Cush"], {}],
  ["H1912", "India", ["Cush", "Media", "Persia"], {}],
  ["H3568", "Cush (Ethiopia)", ["India", "Media", "Egypt"], {
    notes: "The empire is measured from הֹדּוּ to כּוּשׁ — India to Cush — which is to say, from one edge of the known world to the other.",
  }],
  ["H894", "Babylon", ["Persia", "Susa", "Jerusalem"], {}],
  ["H3389", "Jerusalem", ["Babylon", "Susa", "Bethlehem"], {}],
  ["H1473", "the exile, the exiles", ["the return", "the remnant", "the captors"], {}],
  ["H339", "a coastland, an island", ["a mountain", "a desert", "a river"], {}],
  ["H4082", "a province", ["a city", "a kingdom", "a village"], {
    notes: "The administrative unit of the empire; the book counts 127 of them. Every decree has to be written out for each one 'in its own script and its own language'.",
  }],
  ["H6521", "a country dweller, a villager", ["a citizen", "a soldier", "a merchant"], {
    root: "פרז",
    familyGloss: "open country, unwalled",
  }],
  ["H6519", "an unwalled town, open country", ["a citadel", "a province", "a palace"], { root: "פרז" }],

  // -------------------------------------------------------------------------
  // The court: rank, office and law
  // -------------------------------------------------------------------------
  ["H4428", "a king", ["a prince", "a servant", "a judge"], {
    root: "מלך",
    familyGloss: "king, to reign",
    notes: "The commonest noun in the book by a wide margin — 196 times in 167 verses. Ahasuerus is almost never named without it.",
  }],
  ["H4427", "to reign, to become king", ["to serve", "to rebel", "to depart"], { root: "מלך" }],
  ["H4436", "a queen", ["a princess", "a maidservant", "a concubine"], { root: "מלך" }],
  ["H4438", "royalty, kingship", ["exile", "servitude", "priesthood"], {
    root: "מלך",
    notes: "Used both abstractly ('royal power') and attributively — כֶּתֶר מַלְכוּת 'a royal crown', בֵּית הַמַּלְכוּת 'the royal house'.",
  }],
  ["H8269", "an official, a prince", ["a servant", "a merchant", "a soldier"], {}],
  ["H5631", "a eunuch, a court official", ["a soldier", "a scribe", "a merchant"], {
    notes: "In a Persian court the word covers a class of trusted palace servants; not every סָרִיס need have been castrated, though those set over the king's women were.",
  }],
  ["H323", "a satrap", ["a scribe", "a soldier", "a priest"], {
    notes: "A Persian loanword — the governor of a whole satrapy, above the פֶּחָה of a single district.",
  }],
  ["H6346", "a governor", ["a satrap", "a judge", "an elder"], {}],
  ["H6579", "a noble", ["a servant", "a soldier", "a scribe"], {}],
  ["H6496", "an overseer, an officer", ["a servant", "a witness", "a guest"], {}],
  ["H8282", "a noblewoman, a lady", ["a maidservant", "a queen", "a concubine"], {}],
  ["H1167", "a master, a husband", ["a servant", "a guest", "a son"], {}],
  ["H5650", "a servant", ["a master", "a guest", "a son"], {}],
  ["H8334", "to serve, to attend", ["to command", "to depart", "to refuse"], {}],
  ["H1881", "a law, a decree", ["a custom", "a rumour", "a request"], {
    notes: "A Persian loanword, and the book's own term — 20 times. Note the sting in 1:19 and 8:8: a דָּת of the Medes and Persians cannot be revoked, so the second decree does not cancel the first, it only arms its victims.",
  }],
  ["H3982", "a command, an edict", ["a request", "a rumour", "a promise"], {}],
  ["H6599", "a sentence, a decree", ["a plea", "a rumour", "a wage"], {}],
  ["H1779", "a case, a judgement", ["a wage", "a gift", "a witness"], {}],
  ["H1504", "to decree, to cut", ["to revoke", "to plead", "to delay"], {}],
  ["H4522", "forced labour, tribute", ["a wage", "a gift", "a ransom"], {}],
  ["H8323", "to rule, to be master", ["to serve", "to obey", "to flee"], {}],
  ["H7980", "to have power over", ["to submit to", "to plead with", "to flee from"], {
    notes: "9:1 turns on this verb twice in one verse: the day the enemies hoped to have power over the Jews was 'turned about' — the Jews had power over them.",
  }],
  ["H3533", "to subdue, to force", ["to release", "to honour", "to summon"], {}],
  ["H8633", "might, authority", ["weakness", "mercy", "delay"], {}],
  ["H1369", "might, strength", ["weakness", "wisdom", "wealth"], {}],
  ["H4932", "second in rank; a copy", ["first", "last", "an original"], {}],
  ["H2450", "wise, skilled", ["foolish", "young", "wealthy"], {}],
  ["H1875", "to seek, to inquire", ["to hide", "to refuse", "to answer"], {}],

  // ---- writing and sealing ----
  ["H3789", "to write", ["to read", "to erase", "to speak"], {
    root: "כתב",
    familyGloss: "to write; a writing",
  }],
  ["H3791", "a writing, an edict", ["a speech", "a rumour", "a seal"], { root: "כתב" }],
  ["H5612", "a document, a scroll", ["a seal", "a tablet", "a messenger"], {
    root: "ספר",
    familyGloss: "a document; to recount",
  }],
  ["H5608", "to recount, to tell", ["to conceal", "to forget", "to ask"], { root: "ספר" }],
  ["H6572", "a copy (of a decree)", ["an original", "a summary", "a seal"], {}],
  ["H107", "a letter, a dispatch", ["a rumour", "a speech", "a seal"], {}],
  ["H2856", "to seal", ["to open", "to tear", "to send"], {}],
  ["H2885", "a signet ring", ["a bracelet", "a crown", "a chain"], {
    notes: "The ring is the plot's hinge. The king gives it to Haman in 3:10 and to Mordecai in 8:2, and never once reads what is written with it.",
  }],
  ["H6575", "an exact account, a full statement", ["a rumour", "a summary", "a guess"], {}],
  ["H4557", "a number, a count", ["a name", "a share", "a measure"], {}],
  ["H2146", "a record, a memorial", ["a rumour", "a promise", "a wage"], { root: "זכר" }],
  ["H2143", "remembrance", ["forgetting", "a promise", "a report"], { root: "זכר" }],
  ["H8089", "a report, a rumour", ["a decree", "a silence", "a promise"], { root: "שׁמע" }],

  // ---- insignia and the throne room ----
  ["H8275", "a sceptre", ["a staff", "a sword", "a crown"], {
    notes: "Held out to admit someone who has come uninvited (4:11, 5:2, 8:4). Touching its tip is the gesture of accepting the reprieve.",
  }],
  ["H3804", "a crown, a turban", ["a robe", "a ring", "a sceptre"], {}],
  ["H5850", "a crown", ["a sceptre", "a robe", "a ring"], {}],
  ["H3366", "honour, splendour", ["shame", "poverty", "silence"], {}],
  ["H3519", "glory, honour", ["shame", "weakness", "poverty"], {}],
  ["H1420", "greatness", ["smallness", "poverty", "silence"], { root: "גדל" }],
  ["H8597", "splendour, beauty", ["plainness", "ruin", "silence"], {}],
  ["H1002", "a citadel, a fortress", ["a village", "a market", "a camp"], {}],
  ["H1055", "a palace, a pavilion", ["a tent", "a stable", "a gate"], {}],
  ["H1594", "a garden", ["a field", "a vineyard", "an orchard"], {}],
  ["H2691", "a court, an enclosure", ["a roof", "a gate", "a road"], {}],
  ["H6442", "inner", ["outer", "upper", "lower"], {}],
  ["H2435", "outer", ["inner", "upper", "hidden"], {}],
  ["H5982", "a pillar", ["a wall", "a roof", "a step"], {}],
  ["H4296", "a couch, a bed", ["a chair", "a table", "a chest"], {}],
  ["H5592", "a threshold, a doorway", ["a roof", "a window", "a wall"], {
    notes: "שֹׁמְרֵי הַסַּף, 'keepers of the threshold', is the title of the two doorkeepers who plot against the king in 2:21.",
  }],
  ["H6607", "an entrance, a doorway", ["a wall", "a roof", "a window"], {}],
  ["H7339", "an open square, a street", ["an alley", "a wall", "a field"], {}],

  // ---- the fabrics of 1:6 and 8:15 ----
  ["H3768", "cotton, fine cloth", ["wool", "leather", "sackcloth"], {}],
  ["H8336", "fine linen, alabaster", ["wool", "leather", "clay"], {}],
  ["H948", "fine white linen", ["coarse wool", "leather", "sackcloth"], {}],
  ["H2353", "white cloth", ["black cloth", "leather", "wool"], {}],
  ["H8504", "violet, blue", ["scarlet", "green", "yellow"], {}],
  ["H713", "purple", ["blue", "scarlet", "white"], {}],
  ["H923", "porphyry, costly stone", ["clay", "timber", "iron"], {}],
  ["H1858", "mother-of-pearl", ["clay", "iron", "glass"], {}],
  ["H5508", "dark stone (in a pavement)", ["timber", "clay", "glass"], {}],
  ["H7531", "a mosaic pavement", ["a carpet", "a roof", "a wall"], {}],
  ["H2256", "a cord", ["a chain", "a rod", "a nail"], {}],
  ["H1550", "a ring, a rod", ["a nail", "a hinge", "a bolt"], {}],
  ["H899", "a garment", ["a crown", "a ring", "a sandal"], {}],
  ["H3830", "clothing, a robe", ["a crown", "a ring", "a staff"], {
    root: "לבשׁ",
    familyGloss: "to clothe; clothing",
  }],
  ["H8509", "a robe, a mantle", ["a crown", "a belt", "a sandal"], {}],

  // -------------------------------------------------------------------------
  // Feasting, wine and time
  // -------------------------------------------------------------------------
  ["H4960", "a feast, a banquet", ["a fast", "a market", "an assembly"], {
    root: "שׁתה",
    familyGloss: "to drink; a feast",
    notes: "Literally 'a drinking'. Ten of them structure the book, from the king's 180-day feast in 1:3 to the feasting of Purim in 9:22 — and the one fast, in chapter 4, sits exactly in the middle.",
  }],
  ["H8360", "drinking", ["eating", "fasting", "sleeping"], { root: "שׁתה" }],
  ["H3196", "wine", ["water", "oil", "bread"], {}],
  ["H8248", "to give drink to", ["to feed", "to starve", "to pour out"], {}],
  ["H597", "to compel, to press", ["to permit", "to invite", "to refuse"], {
    notes: "1:8 only: the drinking was 'according to the law, no one compelling' — a decree that no one must be made to drink, in a book where everything else is compulsory.",
  }],
  ["H3245", "to found, to appoint", ["to abolish", "to delay", "to forget"], {}],
  ["H2320", "a month, a new moon", ["a year", "a week", "a season"], {}],
  ["H143", "Adar (the twelfth month)", ["Nisan", "Sivan", "Tebeth"], {
    notes: "February–March. The month the lot fell on, and so the month of Purim.",
  }],
  ["H2887", "Tebeth (the tenth month)", ["Adar", "Nisan", "Sivan"], {}],
  ["H5212", "Nisan (the first month)", ["Adar", "Tebeth", "Sivan"], {}],
  ["H5510", "Sivan (the third month)", ["Nisan", "Adar", "Tebeth"], {}],
  ["H2165", "an appointed time", ["a delay", "a season", "a moment"], {}],
  ["H1755", "a generation", ["a year", "a lifetime", "a moment"], {}],
  ["H8447", "a turn (in a sequence)", ["a delay", "a choice", "a share"], {
    notes: "2:12 — each young woman's תֹּר to go in to the king, after twelve months of ointments.",
  }],
  ["H4279", "tomorrow", ["yesterday", "today", "soon"], {}],
  ["H7093", "an end", ["a beginning", "a middle", "a turn"], {}],
  ["H2010", "a remission, a holiday", ["a levy", "a fast", "a curfew"], {
    notes: "2:18 only, and nowhere else in the Bible: at Esther's coronation the king grants the provinces a הֲנָחָה — a release, probably from taxes or from service.",
  }],

  // ---- numbers and measures ----
  ["H3967", "a hundred", ["a thousand", "ten", "a score"], {}],
  ["H505", "a thousand", ["a hundred", "ten thousand", "a score"], {}],
  ["H702", "four", ["five", "three", "seven"], {}],
  ["H2568", "five", ["four", "six", "seven"], {}],
  ["H6242", "twenty", ["thirty", "twelve", "ten"], {}],
  ["H7970", "thirty", ["twenty", "forty", "thirteen"], {}],
  ["H2572", "fifty", ["forty", "fifteen", "sixty"], {
    notes: "The height of Haman's gallows — fifty cubits, some twenty-five metres. The number is meant to be absurd.",
  }],
  ["H7657", "seventy", ["sixty", "seventeen", "eighty"], {}],
  ["H8084", "eighty", ["eighteen", "seventy", "ninety"], {}],
  ["H7637", "seventh", ["sixth", "third", "tenth"], {}],
  ["H7992", "third", ["second", "seventh", "tenth"], {}],
  ["H6224", "tenth", ["ninth", "third", "twelfth"], {}],
  ["H520", "a cubit", ["a span", "a talent", "a mile"], {}],
  ["H3603", "a talent (of silver)", ["a shekel", "a cubit", "a measure"], {}],
  ["H8254", "to weigh out", ["to count", "to borrow", "to hide"], {}],
  ["H7230", "abundance, greatness", ["scarcity", "silence", "smallness"], { root: "רבב" }],
  ["H3148", "besides, more", ["less", "instead", "except"], {}],
  ["H1767", "enough, sufficient", ["too little", "too much", "nothing"], {}],
  ["H905", "apart from, besides", ["together with", "instead of", "because of"], {}],
  ["H8432", "the midst", ["the edge", "the top", "the outside"], {}],
  ["H5227", "opposite, in front of", ["behind", "beside", "beneath"], {}],
  ["H1364", "high, tall", ["low", "wide", "deep"], {}],

  // ---- wealth ----
  ["H3701", "silver, money", ["gold", "bronze", "iron"], {}],
  ["H2091", "gold", ["silver", "bronze", "iron"], {}],
  ["H6239", "wealth, riches", ["poverty", "honour", "wisdom"], {}],
  ["H1595", "a treasury", ["a storehouse", "a market", "a stable"], {}],
  ["H4979", "a gift", ["a debt", "a wage", "a loan"], {}],
  ["H4864", "a portion, a gift given", ["a tax", "a debt", "a fine"], {}],
  ["H4490", "a portion, a share", ["a whole", "a debt", "a fine"], {}],
  ["H4916", "a sending (of gifts)", ["a receiving", "a levy", "a summons"], { root: "שׁלח" }],
  ["H7971", "to send", ["to receive", "to keep", "to hide"], { root: "שׁלח", familyGloss: "to send" }],
  ["H34", "poor, needy", ["wealthy", "noble", "wise"], {}],
  ["H7998", "plunder, spoil", ["a gift", "a wage", "a tribute"], {
    notes: "9:10, 15 and 16 each end by saying the Jews did NOT lay hands on the spoil — three times, which in Hebrew narrative means it matters. Saul's failure with Amalek in 1 Samuel 15 was exactly the opposite.",
  }],
  ["H961", "plunder, booty", ["a gift", "a wage", "a ransom"], {
    root: "בזז",
    familyGloss: "to plunder; plunder",
    notes: "Not to be confused with בָּזָה 'to despise', which has the same three letters on the page but a different final radical.",
  }],
  ["H962", "to plunder", ["to guard", "to restore", "to buy"], { root: "בזז" }],

  // -------------------------------------------------------------------------
  // Anger, enmity and the decree of destruction
  // -------------------------------------------------------------------------
  ["H2534", "rage, wrath", ["calm", "pity", "joy"], {}],
  ["H7107", "to be angry", ["to be calm", "to be glad", "to relent"], { root: "קצף", familyGloss: "anger" }],
  ["H7110", "wrath", ["favour", "calm", "pity"], { root: "קצף" }],
  ["H1197", "to burn, to consume", ["to quench", "to cool", "to kindle slowly"], {}],
  ["H8130", "to hate", ["to love", "to pity", "to forgive"], {}],
  ["H341", "an enemy", ["a friend", "a kinsman", "a guest"], {}],
  ["H6887", "to be hostile to, to oppress", ["to help", "to spare", "to greet"], {
    root: "צרר",
    familyGloss: "hostility, an adversary",
  }],
  ["H6862", "an adversary, a foe", ["an ally", "a servant", "a witness"], { root: "צרר" }],
  ["H959", "to despise", ["to honour", "to fear", "to obey"], { familyGloss: "to despise" }],
  ["H963", "contempt", ["honour", "pity", "praise"], { root: "בזה" }],
  ["H2026", "to kill", ["to spare", "to heal", "to bury"], { familyGloss: "to kill" }],
  ["H2027", "slaughter", ["rescue", "burial", "a wound"], { root: "הרג" }],
  ["H8045", "to destroy, to annihilate", ["to preserve", "to scatter", "to ransom"], {}],
  ["H12", "destruction", ["rescue", "exile", "ransom"], { root: "אבד", familyGloss: "to perish" }],
  ["H13", "destruction", ["deliverance", "captivity", "tribute"], {
    root: "אבד",
    notes: "Esther uses two nearly identical nouns for the same thing in 8:6 and 9:5 — אַבְדַן and אׇבְדָן. Both mean the ruin of a people.",
  }],
  ["H2719", "a sword", ["a shield", "a spear", "a bow"], {}],
  ["H4347", "a blow, slaughter", ["a wound", "a rescue", "a fall"], {}],
  ["H5358", "to take vengeance", ["to forgive", "to flee", "to bribe"], {}],
  ["H2000", "to throw into panic", ["to calm", "to gather", "to console"], {}],
  ["H5486", "to come to an end", ["to begin", "to endure", "to return"], {}],
  ["H6340", "to scatter", ["to gather", "to settle", "to hide"], {
    notes: "3:8, Haman's accusation: 'there is a certain people scattered and separated among the peoples' — the empire's own doing, described as if it were the people's fault.",
  }],
  ["H3240", "to leave alone, to let be", ["to seize", "to summon", "to drive out"], {
    notes: "The same accusation ends 'it is not worth the king's while to tolerate them' — לְהַנִּיחָם, to leave them be.",
  }],
  ["H4284", "a plot, a scheme", ["a promise", "a report", "a decree"], { root: "חשׁב", familyGloss: "to think, to plan" }],
  ["H8518", "to hang", ["to release", "to bury", "to bind"], {}],
  ["H6086", "a tree; wood; a gallows", ["stone", "iron", "cloth"], {
    notes: "Plain 'wood' or 'a tree'. In Esther it is always the pole Haman builds — the King James 'gallows' is an interpretation, not a translation.",
  }],
  ["H6332", "Pur (a lot)", ["a decree", "a wager", "an oath"], {
    notes: "A Persian loanword the narrator has to gloss for his own readers in 3:7 and 9:24: פּוּר הוּא הַגּוֹרָל, 'Pur, that is, the lot'. The feast is named after a foreign word for chance.",
  }],
  ["H5143", "injury, damage", ["profit", "honour", "delay"], {}],
  ["H1204", "to terrify", ["to comfort", "to summon", "to release"], {}],
  ["H6343", "dread, terror", ["courage", "calm", "joy"], {}],
  ["H2111", "to tremble", ["to stand firm", "to rest", "to rejoice"], {
    notes: "5:9 — Mordecai neither rose nor trembled before Haman. The refusal is physical, and it is what sets the gallows building.",
  }],
  ["H662", "to restrain oneself", ["to give way", "to shout", "to flee"], {}],
  ["H926", "to hurry; to be dismayed", ["to delay", "to rest", "to refuse"], {}],
  ["H943", "to be in confusion", ["to be settled", "to be glad", "to be silent"], {
    notes: "3:15 puts the two side by side: the king and Haman sat down to drink, and the city of Susa was in confusion.",
  }],
  ["H2342", "to writhe, to tremble", ["to rest", "to stand", "to rejoice"], {}],
  ["H6696", "to besiege, to press hard", ["to relieve", "to abandon", "to greet"], {}],
  ["H5753", "to do wrong, to go astray", ["to do right", "to return", "to obey"], {}],

  // -------------------------------------------------------------------------
  // Mourning and reprieve
  // -------------------------------------------------------------------------
  ["H7167", "to tear (clothes)", ["to mend", "to fold", "to wash"], {}],
  ["H4751", "bitter", ["sweet", "salty", "mild"], {}],
  ["H1065", "weeping", ["laughter", "silence", "singing"], { root: "בכה", familyGloss: "to weep" }],
  ["H4553", "wailing, lamentation", ["singing", "silence", "feasting"], {}],
  ["H2201", "an outcry, a cry", ["a whisper", "a song", "a silence"], { root: "זעק", familyGloss: "to cry out" }],
  ["H57", "mourning", ["rejoicing", "resting", "feasting"], { root: "אבל", familyGloss: "mourning" }],
  ["H60", "mourning", ["gladness", "anger", "silence"], { root: "אבל", familyGloss: "mourning" }],
  ["H3331", "to spread out (a bed)", ["to fold up", "to carry", "to burn"], {
    notes: "4:3 — many lay on sackcloth and ashes; the verb is the ordinary one for spreading bedding.",
  }],
  ["H6684", "to fast", ["to feast", "to drink", "to sleep"], { familyGloss: "to fast, a fast" }],
  ["H6685", "a fast", ["a feast", "a festival", "a meal"], { root: "צום", familyGloss: "to fast, a fast" }],
  ["H3015", "sorrow, grief", ["joy", "anger", "rest"], {}],
  ["H8342", "gladness", ["sorrow", "anger", "fear"], {}],
  ["H8056", "glad", ["sorrowful", "angry", "afraid"], { root: "שׂמח" }],
  ["H219", "light", ["darkness", "shadow", "heat"], {
    notes: "8:16: 'the Jews had light and gladness and joy and honour'. Read as brightness, not literal daylight.",
  }],
  ["H6670", "to cry aloud (for joy)", ["to weep", "to whisper", "to mourn"], {}],
  ["H2421", "to live", ["to die", "to sleep", "to flee"], {}],
  ["H4422", "to escape", ["to be caught", "to surrender", "to return"], {}],
  ["H7305", "relief, respite", ["distress", "delay", "confinement"], {}],
  ["H2020", "deliverance", ["destruction", "captivity", "exile"], {
    notes: "4:14, Mordecai's warning: relief and deliverance will arise for the Jews from another place — the nearest the book comes to naming God.",
  }],
  ["H5117", "to rest, to settle", ["to travel", "to labour", "to flee"], { familyGloss: "rest" }],
  ["H5118", "rest, quiet", ["labour", "war", "flight"], { root: "נוח" }],
  ["H7965", "peace, welfare", ["war", "grief", "danger"], {}],
  ["H2603", "to show favour, to plead for grace", ["to condemn", "to ignore", "to demand"], {}],
  ["H7521", "to be pleased with", ["to reject", "to ignore", "to fear"], { familyGloss: "favour, pleasure" }],
  ["H7522", "favour, pleasure", ["displeasure", "duty", "chance"], { root: "רצה", familyGloss: "favour, pleasure" }],
  ["H2895", "to be good, to go well", ["to be bad", "to fail", "to end"], { familyGloss: "good" }],
  ["H2896", "good", ["bad", "small", "new"], { root: "טוב", familyGloss: "good" }],
  ["H3787", "to be fitting, to succeed", ["to fail", "to refuse", "to delay"], {}],

  // -------------------------------------------------------------------------
  // Assembling, moving, running
  // -------------------------------------------------------------------------
  ["H6950", "to assemble", ["to scatter", "to depart", "to hide"], {}],
  ["H6908", "to gather", ["to scatter", "to release", "to send"], {}],
  ["H3664", "to gather, to collect", ["to disperse", "to spend", "to lose"], {}],
  ["H7323", "to run", ["to walk", "to stand", "to sit"], {}],
  ["H4116", "to hurry", ["to delay", "to rest", "to refuse"], {}],
  ["H1765", "to press, to hurry on", ["to delay", "to halt", "to release"], {
    notes: "The couriers go out 'hastened and pressed' by the king's word — 3:15 and 8:14, the same phrase for both decrees.",
  }],
  ["H7392", "to ride", ["to walk", "to drive", "to lead"], {}],
  ["H5483", "a horse", ["a mule", "a camel", "an ox"], {}],
  ["H7409", "swift royal steeds", ["oxen", "camels", "donkeys"], {}],
  ["H7424", "a mare of the royal stud", ["an ox", "a camel", "a donkey"], {}],
  ["H327", "of the royal stud", ["wild", "borrowed", "common"], {}],
  ["H5074", "to flee, to be driven away", ["to arrive", "to settle", "to return"], {
    notes: "6:1 — the king's sleep fled. Everything that follows hangs on an insomnia the narrator declines to explain.",
  }],
  ["H8142", "sleep", ["waking", "a dream", "rest"], {
    notes: "Written exactly like שָׁנָה 'to change' and שָׁנָה 'a year'. Three unrelated words, one spelling — context is the only guide.",
  }],
  ["H3867", "to join oneself to", ["to separate from", "to oppose", "to leave"], {}],
  ["H3447", "to hold out, to extend", ["to withdraw", "to hide", "to break"], {
    notes: "Only ever of the sceptre, and only in Esther — 4:11, 5:2, 8:4.",
  }],
  ["H6901", "to receive, to take upon oneself", ["to refuse", "to return", "to lose"], {
    notes: "9:23 and 9:27: the Jews 'took upon themselves' the keeping of Purim. The feast is instituted by the people, not commanded from above.",
  }],
  ["H3985", "to refuse", ["to consent", "to delay", "to ask"], {}],
  ["H3766", "to bow, to kneel", ["to stand", "to rise", "to turn"], {
    notes: "3:2 — everyone in the king's gate knelt to Haman, 'but Mordecai would not kneel and would not bow'. The book never says why.",
  }],
  ["H2645", "to cover", ["to uncover", "to open", "to strip"], {
    notes: "6:12 Haman goes home mourning 'with his head covered'; 7:8 the servants cover his face, which is what is done to a condemned man.",
  }],
  ["H7272", "a foot", ["a hand", "a head", "an eye"], {}],
  ["H6310", "a mouth; (with עַל) according to", ["an ear", "an eye", "a hand"], {}],
  ["H3956", "a tongue, a language", ["a script", "a voice", "an ear"], {
    notes: "Paired with כְּתָב throughout: every decree goes out to each province 'in its own script' and to each people 'in its own tongue'.",
  }],
  ["H2790", "to be silent, to hold one's peace", ["to shout", "to answer", "to plead"], {
    notes: "4:14, Mordecai to Esther: 'if you keep altogether silent at this time'. The same root elsewhere means to plough or to engrave; here it is silence.",
  }],
  ["H8138", "to be different, to change", ["to stay the same", "to repeat", "to end"], {
    notes: "3:8 says the Jews' laws are 'different' from every people's; 1:19 and 8:8 insist a Persian law cannot be changed. Same root, opposite directions.",
  }],
  ["H7737", "to be worth, to be equal", ["to be worthless", "to differ", "to exceed"], {
    notes: "The book's accountant's verb: 3:8 'no profit to the king', 5:13 'all this is worth nothing to me', 7:4 'the adversary is not worth the king's damage'.",
  }],
  ["H3559", "to be established, to be prepared", ["to be shaken", "to be delayed", "to be lost"], {}],
  ["H6264", "ready, prepared", ["unwilling", "absent", "late"], {
    root: "עתד",
    familyGloss: "ready, prepared",
    notes: "Both decrees end with the same instruction — that the people be עֲתִידִים, ready, for that day. 3:14 for the killing, 8:13 for the defence.",
  }],
  ["H6259", "ready, prepared", ["unready", "hidden", "unwilling"], { root: "עתד" }],
  ["H4390", "to fill, to be full", ["to empty", "to break", "to lose"], {}],
  ["H7918", "to subside, to abate", ["to rise", "to burn", "to spread"], {
    notes: "2:1 and 7:10, both of the king's rage — the two hinges where a woman's fate is decided by a temper cooling.",
  }],
  ["H1819", "to think, to imagine", ["to know", "to prove", "to forget"], {}],
  ["H7605", "the rest, the remainder", ["the whole", "the first", "the best"], {}],

  // -------------------------------------------------------------------------
  // Women of the court
  // -------------------------------------------------------------------------
  ["H1330", "a virgin, a young woman", ["a widow", "a queen", "a mother"], {}],
  ["H6370", "a concubine", ["a queen", "a widow", "a daughter"], {}],
  ["H7468", "a fellow woman, a companion", ["a rival", "a stranger", "a mistress"], {}],
  ["H1730", "an uncle", ["a brother", "a father-in-law", "a cousin"], {
    notes: "2:7 — Mordecai brought up Esther, his uncle's daughter. Later Greek and Latin versions make him her cousin, which is what דֹּד־ו בַּת amounts to.",
  }],
  ["H2945", "children, little ones", ["elders", "servants", "soldiers"], {}],
  ["H4758", "appearance, looks", ["a voice", "a name", "a rank"], {}],
  ["H3303", "beautiful", ["plain", "old", "wise"], { root: "יפה", familyGloss: "beautiful" }],
  ["H3308", "beauty", ["plainness", "strength", "wisdom"], { root: "יפה", familyGloss: "beautiful" }],
  ["H8389", "form, figure", ["a name", "a voice", "a rank"], {}],
  ["H8562", "a cosmetic treatment", ["a garment", "a jewel", "a meal"], {
    root: "מרק",
    familyGloss: "a cosmetic rubbing",
    notes: "Twelve months of them before a woman goes in to the king — six with oil of myrrh, six with spices (2:12). The book states the schedule without comment.",
  }],
  ["H4795", "a rubbing, an ointment", ["a garment", "a jewel", "a perfume jar"], { root: "מרק" }],
  ["H8081", "oil", ["wine", "water", "honey"], {}],
  ["H4753", "myrrh", ["wine", "oil", "salt"], {
    notes: "Written מֹר. Do not confuse it with מַר 'bitter' — same two letters, different word.",
  }],
  ["H1314", "spice, balsam", ["salt", "grain", "wine"], {}],
  ["H545", "guardianship, upbringing", ["neglect", "adoption", "service"], {
    root: "אמן",
    notes: "2:20 — Esther kept doing as Mordecai said, as when she was under his care. The root is the one behind 'to trust' and 'amen'.",
  }],
  ["H4687", "a command", ["a request", "a warning", "a custom"], {}],
  ["H432", "if (contrary to fact)", ["because", "unless", "although"], {}],
  ["H637", "also, indeed", ["never", "instead", "unless"], {}],
  ["H3602", "thus, so", ["otherwise", "never", "perhaps"], {}],
  ["H7350", "far, distant", ["near", "hidden", "high"], {}],
  ["H1246", "a request", ["an answer", "a decree", "a refusal"], { root: "בקשׁ" }],
  ["H7596", "a petition", ["a reply", "a decree", "a gift"], {
    notes: "Paired with בַּקָּשָׁה every time the king asks Esther what she wants — 5:6, 5:7, 5:8, 7:2, 7:3, 9:12. She takes three chapters to answer.",
  }],
  // -------------------------------------------------------------------------
  // Inherited entries whose Jonah or Ruth note is re-authored for Esther.
  //
  // The merge below drops any inherited note anchored in another book — a
  // reader in Susa should not be told about Boaz. These twelve matter here, so
  // rather than lose them they are re-pointed at this text. Glosses and
  // distractors are carried over unchanged; only the note is new.
  // -------------------------------------------------------------------------
  ["H1486", "lot (cast to decide)", ["stone", "gift", "share"], {
    notes: "3:7 casts one before Haman to fix the month, and 9:24 explains the foreign word with this native one: פּוּר הוּא הַגּוֹרָל. The feast is named after the lot, and no one in the book says who decided how it fell.",
  }],
  ["H8179", "a gate", ["a wall", "a tower", "a road"], {
    notes: "שַׁעַר הַמֶּלֶךְ, the king's gate, is where Mordecai sits in almost every chapter — the place where royal business is transacted and petitions heard, so sitting there is holding a post, not loitering.",
  }],
  ["H8242", "sackcloth", ["linen", "wool", "silk"], {
    notes: "Coarse cloth worn in mourning. Mordecai puts it on in 4:1 and walks into the city in it — and 4:2 notes that no one may enter the king's gate wearing it, which is the whole difficulty of the chapter in one clause.",
  }],
  ["H3820", "the heart", ["the soul", "the mind", "the eye"], {
    notes: "In Hebrew the seat of thought and will rather than feeling. 1:10 has the king's heart 'merry with wine' and 6:6 has Haman saying in his heart — deciding, not emoting.",
  }],
  ["H2015", "to overturn, to overthrow", ["to build", "to preserve", "to raise"], {
    notes: "The book's hinge word. 9:1: on the day the enemies hoped to master the Jews, וְנַהֲפוֹךְ הוּא — 'it was overturned'. 9:22 uses it again of the month turned from sorrow to gladness.",
  }],
  ["H2580", "favour, grace", ["mercy", "beauty", "honour"], {
    notes: "'To find favour in the eyes of' is the ordinary idiom for being well received. Esther finds it with Hegai, with everyone who sees her, and with the king — six times, and each one decides whether she lives.",
  }],
  ["H2428", "strength, worth", ["weakness", "wealth", "beauty"], {
    notes: "Wide: military force, wealth, or personal worth. In 1:3 it is the army of Persia and Media; in 8:11 it is the armed force of a province.",
  }],
  ["H3627", "vessel, article, gear", ["rope", "sail", "food"], {
    notes: "Very general: any made object. In 1:7 they are the gold drinking vessels, no two alike, at the king's feast.",
  }],
  ["H6485", "to visit, to attend to", ["to abandon", "to summon", "to punish"], {
    notes: "2:3 — let the king appoint officers in every province. The verb covers both appointing and calling to account, which is why the same word elsewhere means to punish.",
  }],
  ["H7138", "near, a close relative", ["distant", "absent", "unrelated"], {
    notes: "1:14 uses it of rank, not kinship: the seven princes 'near to him' are the ones who see the king's face and sit first in the kingdom.",
  }],
  ["H408", "do not (with a command)", ["not", "no", "never"], {
    notes: "Used with commands, where לֹא negates statements. 4:13, Mordecai to Esther: אַל־תְּדַמִּי — 'do not imagine you will escape in the king's house'.",
  }],
  ["H8198", "a maidservant, a handmaid", ["a mistress", "a stranger", "a bride"], {}],

  // Family heads inherited from Jonah and Ruth. Re-stated here only to author a
  // coreGloss, so no family in this book ships with one inferred from whichever
  // member happened to be commonest.
  ["H6", "to perish", ["to survive", "to hide", "to flee"], { familyGloss: "to perish" }],
  ["H1245", "to seek", ["to find", "to refuse", "to hide"], { familyGloss: "to seek, to request" }],
  ["H8057", "joy, gladness", ["sorrow", "anger", "fear"], { root: "שׂמח", familyGloss: "joy, to rejoice" }],
  ["H571", "truth, faithfulness", ["falsehood", "rumour", "silence"], {}],
];

// ---------------------------------------------------------------------------

/** Jonah's and Ruth's entries, inherited wholesale; Jonah wins a collision. */
function inherited() {
  const merged = new Map();
  for (const file of ["ruth-glossary.json", "jonah-glossary.json"]) {
    const { words = [] } = JSON.parse(readFileSync(resolve(HERE, file), "utf8"));
    for (const w of words) merged.set(String(w.lemma), { ...w, _from: file.split("-")[0] });
  }
  return merged;
}

/**
 * Notes anchored in another book's story. Kept out rather than re-pointed,
 * because a note about Boaz shown while reading Esther is worse than no note.
 * Where the word matters here, Esther re-authors the note above.
 */
const FOREIGN_NOTE = /Ruth|Jonah|Naomi|Boaz|Nineveh|Moab|Bethlehem|Orpah|the fish|the storm/i;

const seen = new Map();
const authored = ENTRIES.filter(([, , , x = {}]) => !x._drop).map(
  ([lemma, gloss, distractors, extras = {}]) => {
    if (seen.has(lemma)) throw new Error(`duplicate lemma ${lemma}: "${seen.get(lemma)}" and "${gloss}"`);
    seen.set(lemma, gloss);
    if (distractors.length !== 3) throw new Error(`${lemma} has ${distractors.length} distractors, want 3`);
    if (distractors.includes(gloss)) throw new Error(`${lemma} lists its own gloss as a distractor`);
    if (new Set(distractors).size !== 3) throw new Error(`${lemma} has a repeated distractor`);
    return { lemma, gloss, distractors, ...extras };
  },
);

const words = [];
let reused = 0;
let stripped = 0;
for (const [lemma, w] of inherited()) {
  if (seen.has(lemma)) continue; // Esther's own entry wins
  const { _from, ...entry } = w;
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
    "Hand-written glosses, distractors, roots and teaching notes for Esther. " +
    "Generated by build-esther-glossary.mjs — edit that, not this. Entries shared " +
    "with Jonah and Ruth are inherited from their glossaries at build time, so a " +
    "shared word is corrected in one place. Glosses are short TEACHING meanings " +
    "for a beginner reading Esther, not lexicon entries, and they flatten real " +
    "semantic range. Roots are supplied only where the pairing is visible in " +
    "Esther itself; Strong's derivation chains are refused. A Hebraist should " +
    "read all of it.",
  words,
};

const path = resolve(HERE, "esther-glossary.json");
writeFileSync(path, `${JSON.stringify(out, null, 1)}\n`);
console.log(`wrote ${path}`);
console.log(`  ${words.length} entries — ${authored.length} written for Esther, ${reused} inherited`);
console.log(`  ${words.filter((w) => w.root).length} hand-supplied roots · ${words.filter((w) => w.notes).length} teaching notes`);
console.log(`  ${stripped} inherited notes dropped as anchored in another book`);
