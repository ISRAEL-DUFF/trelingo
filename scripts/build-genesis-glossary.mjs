#!/usr/bin/env node
/**
 * The human contribution to the Genesis 1–11 course.
 *
 * THE PRIMEVAL HISTORY, and the first Hebrew track that is a SLICE of a book
 * rather than a whole one. Genesis entire needs 973 new glosses — more than
 * Luke, which was parked for exactly that reason. Chapters 1–11 need 285, close
 * to Esther's 300, and they stop at a real seam: the primeval history ends and
 * the Abraham cycle begins at 12:1. Mark set the precedent (1–4, then 5–16).
 *
 * ON THAT NUMBER. Counting distinct Strong's ids in the XML predicted 245. The
 * importer wanted 285, because it keys a token on its CONTENT lemma — the
 * segment that carries meaning once prefixes and suffixes are stripped — and a
 * word that only ever appears inflected can hide behind a different id in the
 * raw attribute. The forty it found that way were not marginal: קַיִן Cain,
 * עֵדֶן Eden, כְּנַעַן Canaan, חַטָּאת sin, the brooding רָחַף of 1:2, and
 * בָּלַל, the verb the whole Babel story puns on. Trust the importer's count
 * over a grep; this is the second track where the two have disagreed.
 *
 * WHAT THE SEVEN EARLIER TRACKS ALREADY PAID FOR. 577 of the 1,550 lemmas in
 * Genesis were already glossed, covering 80.7% of its running words. Narrative
 * Hebrew repeats itself, and Ruth and Jonah are narrative: וַיֹּאמֶר, וַיֵּלֶךְ,
 * אִישׁ, אֶרֶץ, בַּיִת all arrived years ago. What is left is the vocabulary
 * peculiar to these chapters, and it falls into four unmistakable groups.
 *
 *   THE COSMOLOGY (ch. 1–2). רָקִיעַ, מָאוֹר, מִין, תֹהוּ וָבֹהוּ, צֶלֶם,
 *   דְּמוּת. Half a dozen words carrying more theological weight per syllable
 *   than anything else in the app, and several with no clean English at all.
 *
 *   THE GARDEN AND THE CURSE (ch. 2–4). Trees, rivers, gems, the serpent,
 *   thorns and thistles, sweat, skins. Concrete nouns, mostly easy, and the
 *   place where Hebrew's love of assonance does the most work.
 *
 *   THE FLOOD (ch. 6–9). תֵּבָה, מַבּוּל, גֹּפֶר, the dimensions, the raven and
 *   the dove, the bow in the cloud.
 *
 *   THE NAMES (ch. 5, 10, 11). 117 of the 285 — over a third — are proper names
 *   and gentilics. The Table of Nations alone contributes about seventy. They
 *   are cheap to gloss and genuinely worth teaching: a reader who can see that
 *   a whole chapter is a list of peoples has learned something real about what
 *   Hebrew narrative does with genealogy.
 *
 * ON THE PUNS, AND WHAT THIS FILE REFUSES TO ASSERT. These chapters turn on
 * wordplay, and the notes point it out repeatedly — נֹחַ against נחם at 5:29,
 * חַוָּה against חַי at 3:20, פֶּלֶג against פָּלַג at 10:25, אָדָם against
 * אֲדָמָה at 2:7, עָרוּם against עֵירֹם across 2:25–3:1. Every one is a
 * deliberate literary effect and is described as such.
 *
 * NONE of them is encoded as a shared root. עָרוּם "crafty" and עֵירֹם "naked"
 * sound alike and are not related; asserting a family would paint a coloured
 * highlight over a claim no lexicon supports, which is the root fallacy
 * (trelingo-pedagogical-foundation.md §3.1) with better prose around it. A pun
 * belongs in a note, where a learner can weigh it. A root belongs in the data
 * only when it is a fact.
 *
 * Roots ARE supplied by hand where they are certain and where the learner meets
 * the family inside these eleven chapters — רמשׂ, שרץ, נוד/נוע. Everywhere else
 * the importer's safe rule decides, and words it cannot reach are taught plain.
 *
 * Usage:  node scripts/build-genesis-glossary.mjs
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
  // Chapter 1 — the cosmology
  // =========================================================================
  ["H8414", "formlessness, wasteland", ["order", "abundance", "a fortress"], {
    notes: "The first half of תֹהוּ וָבֹהוּ. Elsewhere it describes trackless desert and, in Isaiah, the emptiness of idols. 'Without form' is the old rendering; 'trackless waste' is closer to how the word behaves everywhere else.",
  }],
  ["H922", "emptiness, void", ["fullness", "a boundary", "a crowd"], {
    notes: "בֹּהוּ occurs three times in the whole Hebrew Bible and never without תֹהוּ beside it. It is not really an independent word — it is the rhyming second half of a pair, the way 'kilter' only exists in 'out of kilter'.",
  }],
  ["H7549", "an expanse, the firmament", ["a pillar", "an ocean", "a foundation"], {
    notes: "From a verb meaning to beat metal out thin. The sky as a hammered sheet holding back the upper waters — an ancient picture of the world, not a claim this course is asking anyone to hold. 'Firmament' came into English from the Latin firmamentum via the Greek στερέωμα, both of which chose the solidity.",
  }],
  ["H3974", "a light, a luminary", ["a shadow", "a lamp-stand", "a window"], {
    notes: "Not the word for light in verse 3 — that is אוֹר. This is the light-BEARER, the object in the sky. Genesis 1 pointedly avoids the ordinary names for sun and moon, calling them only the greater and the lesser מָאוֹר.",
  }],
  ["H914", "to divide, to separate", ["to join", "to gather", "to bind"], {
    notes: "The verb that structures the whole chapter: light from darkness, waters from waters, day from night. Five times in Genesis 1, and it is what creating consists of here — not making things from nothing so much as putting things in their places.",
  }],
  ["H4327", "a kind, a species", ["a colour", "a name", "a number"], {
    notes: "לְמִינוֹ, 'according to its kind', ten times in the chapter. The phrase is about ordered variety, each thing reproducing true to type.",
  }],
  ["H1877", "young grass, vegetation", ["a stone", "a stream", "an animal"], {}],
  ["H1876", "to sprout, to grow green", ["to wither", "to freeze", "to fall"], {}],
  ["H6212", "a plant, a herb", ["a tree", "a rock", "a bird"], {
    notes: "עֵשֶׂב is the smaller, seed-bearing growth as against עֵץ, a tree. Verse 29 gives both to humankind for food, and verse 30 gives the עֵשֶׂב alone to the animals.",
  }],
  ["H226", "a sign, a token", ["a secret", "a burden", "a wall"], {
    notes: "The lights are set in the sky לְאֹתֹת, for signs. The same word marks Cain in chapter 4 and the rainbow in chapter 9 — in each case something visible standing for something that has been said.",
  }],
  ["H4150", "an appointed time, a season", ["an accident", "a place", "a distance"], {
    notes: "מוֹעֵד is a time fixed by appointment, not a season of weather. It later becomes the standard word for the festivals, and for the tent of meeting — the place of the appointment.",
  }],
  ["H8317", "to swarm, to teem", ["to sleep", "to dry up", "to vanish"], { root: "שרץ", familyGloss: "swarming, teeming" }],
  ["H8318", "swarming creatures", ["cattle", "trees", "stars"], { root: "שרץ" }],
  ["H6509", "to be fruitful, to bear fruit", ["to wither", "to shrink", "to be barren"], {
    notes: "פְּרוּ וּרְבוּ, 'be fruitful and multiply' — said to the sea creatures in verse 22, to humankind in verse 28, and again to Noah after the flood. It is the one command that survives the deluge intact.",
  }],
  ["H7430", "to creep, to crawl", ["to fly", "to swim", "to leap"], { root: "רמשׂ", familyGloss: "creeping, crawling" }],
  ["H7431", "creeping things", ["cattle", "fish", "birds"], { root: "רמשׂ" }],
  ["H6754", "an image, a likeness", ["a shadow", "a name", "a copy in stone"], {
    notes: "בְּצַלְמֵנוּ, 'in our image'. Everywhere else in the Hebrew Bible צֶלֶם means a physical idol or statue — which is what makes its use here so striking, and why the sentence has been argued over for two thousand years.",
  }],
  ["H1823", "a likeness, a resemblance", ["a difference", "a shadow", "a portion"], {
    notes: "Paired with צֶלֶם in verse 26 and used alone at 5:1 and 5:3, where Adam fathers a son 'in his likeness, according to his image' — the same two words, now describing an ordinary human resemblance.",
  }],
  ["H5347", "female", ["male", "young", "firstborn"], {
    notes: "זָכָר וּנְקֵבָה, 'male and female'. These are the biological terms, used of the animals entering the ark as readily as of humankind — quite distinct from אִישׁ and אִשָּׁה, man and woman.",
  }],
  ["H402", "food", ["drink", "clothing", "shelter"], {}],
  ["H3418", "green, greenery", ["dryness", "ripeness", "bareness"], {}],
  ["H4475", "rule, dominion", ["servitude", "rebellion", "silence"], {}],
  ["H7243", "fourth", ["first", "seventh", "tenth"], {}],
  ["H2549", "fifth", ["second", "eighth", "ninth"], {}],

  ["H7363", "to hover, to brood", ["to sink", "to freeze", "to depart"], {
    notes: "מְרַחֶפֶת עַל־פְּנֵי הַמָּיִם. Three occurrences in the Hebrew Bible; the other describes an eagle over its nest. Whether the spirit here is brooding, hovering or sweeping is a real question, and 'brood' is the reading the eagle supports.",
  }],
  ["H6960", "to be gathered together", ["to be poured out", "to dry up", "to divide"], {}],
  ["H4723", "a gathering, a reservoir", ["a drought", "a channel", "a shore"], {
    notes: "וּלְמִקְוֵה הַמַּיִם קָרָא יַמִּים — the gathering of the waters he called Seas. The same noun later means 'hope', which is a different word travelling under the same spelling.",
  }],
  ["H5774", "to fly", ["to swim", "to crawl", "to burrow"], {}],
  ["H8577", "a sea creature, a great serpent", ["a fish", "a bird", "a lamb"], {
    notes: "הַתַּנִּינִם הַגְּדֹלִים, the great sea creatures — the only living things in the chapter God is said to have בָּרָא, created, apart from humankind. Elsewhere the word names the chaos-monster of the sea, which makes its quiet inclusion in a list of creatures pointed.",
  }],
  ["H7287", "to rule, to have dominion", ["to serve", "to flee", "to gather"], {}],

  // =========================================================================
  // Chapter 2 — the garden
  // =========================================================================
  ["H7880", "a shrub, a bush", ["a river", "a hill", "a road"], {}],
  ["H4305", "to rain, to send rain", ["to freeze", "to burn", "to darken"], {}],
  ["H108", "a mist, a stream from the ground", ["a fire", "a wind", "a drought"], {
    notes: "Twice in the Hebrew Bible and nobody is certain what it means. 'Mist' is the traditional guess; an underground spring welling up is the other, supported by an Akkadian cognate. The course glosses both possibilities because the text genuinely does not settle it.",
  }],
  ["H3335", "to form, to shape", ["to break", "to find", "to inherit"], {
    notes: "The potter's verb. God forms the human מִן־הָאֲדָמָה, from the ground — and the choice of verb is deliberate: this is craft, hands in clay, quite unlike the בָּרָא of chapter 1.",
  }],
  ["H5397", "breath", ["blood", "bone", "a voice"], {
    notes: "נִשְׁמַת חַיִּים, 'the breath of life', breathed into the nostrils. A different word from רוּחַ, the wind or spirit of 1:2, and used almost exclusively of human life.",
  }],
  ["H1588", "a garden", ["a desert", "a city", "a field"], {
    notes: "גַּן is an enclosed, planted place — the root idea is a fence. The Greek translators rendered it παράδεισος, a Persian loanword for a walled royal park, which is how English got 'paradise'.",
  }],
  ["H6926", "the east; the front", ["the west", "the depths", "the border"], {
    notes: "Hebrew orients by facing east, so the same word covers 'east' and 'in front'. That is why 'behind' and 'west' are also one word, and why the Mediterranean is simply 'the sea'.",
  }],
  ["H2341", "Havilah", ["Havvah", "Hebron", "Haran"], {}],
  ["H6376", "Pishon", ["Gihon", "Tigris", "Jordan"], {}],
  ["H1521", "Gihon", ["Pishon", "Euphrates", "Jabbok"], {}],
  ["H2313", "the Tigris", ["the Euphrates", "the Nile", "the Jordan"], {
    notes: "חִדֶּקֶל, from the Akkadian Idiqlat. Two of Eden's four rivers are real and identifiable — the Tigris and the Euphrates — and two have never been located.",
  }],
  ["H6578", "the Euphrates", ["the Tigris", "the Nile", "the Jordan"], {}],
  ["H804", "Asshur, Assyria", ["Aram", "Egypt", "Babylon"], {}],
  ["H916", "bdellium", ["gold", "salt", "cedar"], {
    notes: "A fragrant resin. It appears once more, describing the look of manna, and beyond that nobody knows much — including whether it is a gum or a gemstone.",
  }],
  ["H7718", "onyx, a precious stone", ["clay", "iron", "glass"], {}],
  ["H5828", "a helper", ["a rival", "a servant", "a stranger"], {
    notes: "עֵזֶר כְּנֶגְדּוֹ. The noun is used most often in the Hebrew Bible of God helping Israel, so it carries no suggestion of a lesser party; כְּנֶגְדּוֹ means 'corresponding to him', a counterpart facing him.",
  }],
  ["H8639", "a deep sleep", ["a light nap", "a fever", "a vision"], {
    notes: "תַּרְדֵּמָה is not ordinary sleep — it falls on Abram in chapter 15 and on Saul's camp in 1 Samuel, always a heavy, imposed unconsciousness.",
  }],
  ["H6763", "a rib; a side", ["a hand", "a shoulder", "a foot"], {
    notes: "Everywhere else in the Hebrew Bible צֵלָע means the side of a building, a hill, or the ark of the covenant. 'Rib' is a reading found only here, and 'side' is defensible.",
  }],
  ["H954", "to be ashamed", ["to be proud", "to be glad", "to be afraid"], {}],

  ["H5731", "Eden", ["Nod", "Havilah", "Shinar"], {
    notes: "גַּן־בְּעֵדֶן, a garden in Eden — Eden is the region, the garden is the part of it that is planted. The name may be connected to a word for delight, or to a Sumerian word for plain; both are guesses.",
  }],
  ["H2530", "to desire, to covet", ["to reject", "to fear", "to forget"], {
    notes: "The trees are נֶחְמָד לְמַרְאֶה, desirable to look at, at 2:9 — and the same verb describes the woman's view of the forbidden tree at 3:6. It is also the verb of the tenth commandment.",
  }],

  // =========================================================================
  // Chapter 3 — the serpent and the curse
  // =========================================================================
  ["H6175", "crafty, shrewd", ["honest", "clumsy", "loyal"], {
    notes: "The serpent is עָרוּם; the couple in the previous verse were עֲרוּמִּים, naked. The two words sound almost identical and are NOT related — this course does not link them in the data, because they are a deliberate pun and not a family. Hebrew narrative does this constantly and it is worth learning to hear.",
  }],
  ["H6491", "to open (the eyes)", ["to close", "to cover", "to blind"], {}],
  ["H8378", "a desire, a longing", ["a fear", "a duty", "a memory"], {}],
  ["H5903", "naked", ["clothed", "armed", "hidden"], {}],
  ["H5929", "a leaf", ["a root", "a branch", "a thorn"], {}],
  ["H2244", "to hide oneself", ["to appear", "to call out", "to approach"], {}],
  ["H5978", "with me, beside me", ["without me", "against me", "before me"], {}],
  ["H1512", "the belly", ["the back", "the head", "the tail"], {}],
  ["H342", "enmity, hostility", ["friendship", "indifference", "kinship"], {}],
  ["H7779", "to strike at, to bruise", ["to heal", "to lift", "to release"], {
    notes: "The same verb is used of both parties in 3:15 — he shall שׁוּף your head, and you shall שׁוּף his heel. Whatever it means, the text insists on using one word for both, and translations that vary it ('crush' … 'strike') lose the symmetry.",
  }],
  ["H6119", "a heel", ["a hand", "a knee", "an eye"], {}],
  ["H6093", "pain, toil", ["ease", "sleep", "reward"], {
    notes: "The woman's עִצָּבוֹן in verse 16 and the man's in verse 17 are the same word. Whatever else the passage does, it gives them a matched pair.",
  }],
  ["H8669", "a longing, an urge", ["a refusal", "a fear", "a promise"], {
    notes: "Three times in the Hebrew Bible: here, in 4:7 of sin crouching at the door, and once in the Song of Songs. Three very different contexts for one rare word, and its sense is argued over in every one.",
  }],
  ["H5668", "because of, for the sake of", ["in spite of", "instead of", "before"], {}],
  ["H6975", "a thorn", ["a flower", "a grain", "a vine"], {}],
  ["H1863", "a thistle", ["wheat", "a lily", "moss"], {}],
  ["H2188", "sweat", ["tears", "blood", "rain"], {}],
  ["H2332", "Eve", ["Adah", "Zillah", "Sarai"], {
    notes: "Named at 3:20 'because she was the mother of all חָי', all living. חַוָּה and חַי sound alike; the text supplies the connection itself, which is the only reason to draw it.",
  }],
  ["H2425", "to live", ["to die", "to sleep", "to leave"], {}],
  ["H121", "Adam", ["Enosh", "Seth", "Noah"], {
    notes: "Up to this point the text has said הָאָדָם, 'the human' — a common noun with the article. Here it starts working as a name. אָדָם and אֲדָמָה, ground, are the pun the narrative has been running since 2:7.",
  }],
  ["H3801", "a tunic, a garment", ["a crown", "a sandal", "a belt"], {}],
  ["H5785", "skin, hide", ["cloth", "fur", "bark"], {}],
  ["H3742", "a cherub", ["a shepherd", "a prophet", "a king"], {
    notes: "Not the plump infant of later European painting. Cherubim in the Hebrew Bible are guardian figures — composite winged creatures of the kind that flank thrones and doorways throughout the ancient Near East. Two of them stand over the ark.",
  }],
  ["H3858", "a flame", ["smoke", "a shadow", "a mist"], {}],

  ["H7919", "to give insight, to make wise", ["to confuse", "to hide", "to weaken"], {}],
  ["H2290", "a covering, a loincloth", ["a crown", "a sandal", "a blanket"], {}],
  ["H6089", "pain, hardship", ["comfort", "wealth", "rest"], {}],

  // =========================================================================
  // Chapter 4 — Cain and Abel
  // =========================================================================
  ["H2029", "to conceive, to become pregnant", ["to weep", "to travel", "to forget"], {}],
  ["H1893", "Abel", ["Cain", "Seth", "Enosh"], {
    notes: "The name is spelled exactly like הֶבֶל, 'breath, vapour' — the word Ecclesiastes repeats forty times. Whether the narrator intends that of a man who dies in the next paragraph is left entirely to the reader.",
  }],
  ["H1062", "the firstborn (of a flock)", ["the last", "the weakest", "the strays"], {}],
  ["H2459", "fat", ["bone", "wool", "milk"], {
    notes: "The fat portions were the part burned in later Israelite sacrifice, and giving them marks Abel's offering as the choice one. The text says this without comment and lets the offering speak.",
  }],
  ["H8159", "to look on with favour", ["to turn away", "to shout", "to forget"], {}],
  ["H7613", "elevation, acceptance", ["a fall", "a burden", "a debt"], {
    notes: "Verse 7 is among the hardest sentences in Genesis. The words are ordinary and the syntax will not settle; every translation you compare will differ, and the honest position is that its sense is uncertain.",
  }],
  ["H7257", "to crouch, to lie in wait", ["to stand", "to flee", "to sleep"], {
    notes: "חַטָּאת רֹבֵץ — sin crouching at the door like an animal. The participle is masculine while חַטָּאת is feminine, one of several reasons the verse resists a tidy reading.",
  }],
  ["H6817", "to cry out", ["to whisper", "to laugh", "to be silent"], {}],
  ["H6475", "to open (the mouth)", ["to shut", "to fill", "to break"], {}],
  ["H5128", "to wander, to totter", ["to settle", "to rest", "to return"], { root: "נוע", familyGloss: "wavering, wandering" }],
  ["H5110", "to wander, to be a fugitive", ["to dwell", "to arrive", "to rule"], {}],
  ["H5641", "to hide, to be hidden", ["to reveal", "to shine", "to announce"], {}],
  ["H7659", "sevenfold", ["twice", "tenfold", "a hundredfold"], {}],
  ["H5113", "Nod", ["Eden", "Havilah", "Shinar"], {
    notes: "'East of Eden, the land of Nod' — and נוֹד means wandering. The land of exile is named for the sentence passed on the man who goes there.",
  }],
  ["H2585", "Enoch", ["Enosh", "Irad", "Lamech"], {
    notes: "Two men of this name in these chapters: Cain's son here, and the seventh from Adam at 5:21, the one who 'walked with God, and was not'. Keeping the two apart is part of reading the parallel genealogies.",
  }],
  ["H5897", "Irad", ["Enoch", "Jared", "Mehujael"], {}],
  ["H4232", "Mehujael", ["Methushael", "Mahalalel", "Methuselah"], {}],
  ["H4967", "Methushael", ["Methuselah", "Mehujael", "Mahalalel"], {}],
  ["H3929", "Lamech", ["Enoch", "Jared", "Noah"], {
    notes: "Also two of them. Cain's Lamech boasts of killing a man for a wound; Seth's Lamech, at 5:28, fathers Noah and speaks of comfort. The two lines are set side by side and invite comparison.",
  }],
  ["H5711", "Adah", ["Zillah", "Eve", "Milcah"], {}],
  ["H6741", "Zillah", ["Adah", "Naamah", "Sarai"], {}],
  ["H2989", "Jabal", ["Jubal", "Tubal-cain", "Lamech"], {}],
  ["H3106", "Jubal", ["Jabal", "Tubal-cain", "Irad"], {}],
  ["H3658", "a lyre, a harp", ["a drum", "a trumpet", "a bell"], {}],
  ["H5748", "a pipe, a flute", ["a lyre", "a cymbal", "a horn"], {}],
  ["H8423", "Tubal-cain", ["Jabal", "Jubal", "Lamech"], {}],
  ["H3913", "to sharpen, to hammer", ["to blunt", "to melt", "to bury"], {}],
  ["H2794", "a craftsman, a smith", ["a farmer", "a shepherd", "a scribe"], {}],
  ["H8610", "to grasp, to handle", ["to drop", "to refuse", "to lose"], {}],
  ["H269", "a sister", ["a daughter", "a mother", "a widow"], {}],
  ["H238", "to give ear, to listen", ["to speak", "to shout", "to ignore"], {}],
  ["H6482", "a wound", ["a gift", "a scar healed", "a blessing"], {}],
  ["H2250", "a bruise, a welt", ["a garland", "a rope", "a shadow"], {}],
  ["H8352", "Seth", ["Enosh", "Cain", "Abel"], {}],
  ["H583", "Enosh", ["Seth", "Kenan", "Adam"], {
    notes: "אֱנוֹשׁ is also an ordinary noun meaning 'humankind', which makes the third generation's name another quiet echo of אָדָם.",
  }],

  ["H7014", "Cain", ["Abel", "Seth", "Enosh"], {
    notes: "Named at 4:1 with קָנִיתִי, 'I have gotten' — another sound-alike rather than a derivation. Genesis names almost everyone this way.",
  }],
  ["H2403", "sin; a sin offering", ["a reward", "a debt repaid", "a blessing"], {
    notes: "The word's first appearance in the Bible is 4:7, crouching at the door. It carries both the offence and the sacrifice that answers it — one noun for the wrong and its remedy.",
  }],
  ["H5178", "bronze, copper", ["silver", "iron", "clay"], {}],
  ["H5279", "Naamah", ["Adah", "Zillah", "Milcah"], {}],
  ["H565", "a word, an utterance", ["a silence", "a deed", "a song"], {}],

  // =========================================================================
  // Chapter 5 — the generations of Adam
  // =========================================================================
  ["H7018", "Kenan", ["Cainan", "Kenaz", "Enosh"], {}],
  ["H4111", "Mahalalel", ["Methushael", "Mehujael", "Methuselah"], {}],
  ["H3382", "Jared", ["Jered", "Irad", "Enoch"], {}],
  ["H4968", "Methuselah", ["Methushael", "Mahalalel", "Lamech"], {
    notes: "969 years, the longest life in the Hebrew Bible. The arithmetic of chapter 5 puts his death in the year of the flood.",
  }],
  ["H5146", "Noah", ["Lamech", "Shem", "Enoch"], {
    notes: "Named at 5:29 with an explanation: 'this one shall comfort us' — יְנַחֲמֵנוּ, from נחם. The name נֹחַ is actually from a different root meaning rest, so the text is offering a pun rather than an etymology. It does this with many names, and the pun is the point.",
  }],
  ["H8035", "Shem", ["Ham", "Japheth", "Canaan"], {
    notes: "Spelled identically to שֵׁם, 'name' — the same word that ends the Babel story, where the builders want to make themselves a שֵׁם. Two different Strong's entries, one spelling.",
  }],
  ["H2526", "Ham", ["Shem", "Japheth", "Canaan"], {}],
  ["H3315", "Japheth", ["Shem", "Ham", "Gomer"], {}],
  ["H8672", "nine", ["seven", "eight", "eleven"], {}],
  ["H8346", "sixty", ["fifty", "seventy", "eighty"], {}],
  ["H8673", "ninety", ["seventy", "eighty", "a hundred"], {}],

  // =========================================================================
  // Chapters 6–9 — the flood
  // =========================================================================
  ["H7231", "to become many, to multiply", ["to dwindle", "to scatter", "to hide"], {}],
  ["H2007", "they (feminine)", ["they (masculine)", "we", "you"], {}],
  ["H5303", "the Nephilim, giants", ["the elders", "the shepherds", "the exiles"], {
    notes: "Untranslated on purpose in many versions, because nobody is sure what it means. 'Giants' comes from the Greek γίγαντες; the Hebrew may be from a root meaning 'to fall'. Verse 4 is famously obscure and this course does not pretend otherwise.",
  }],
  ["H3336", "an inclination, a formed intent", ["an accident", "a habit", "a memory"], {
    notes: "From יָצַר, the potter's verb of 2:7 — what has been shaped, and so the bent of the mind. יֵצֶר לֵב, the inclination of the heart, becomes a central term in later Jewish thought about the two impulses in a person.",
  }],
  ["H7535", "only, altogether", ["sometimes", "never", "hardly"], {}],
  ["H8549", "blameless, whole", ["divided", "guilty", "young"], {
    notes: "The word for an unblemished sacrificial animal, applied to Noah. Not 'sinless' — complete, of a piece, nothing missing.",
  }],
  ["H8392", "the ark", ["a raft", "a house", "a chest of gold"], {
    notes: "תֵּבָה is used of exactly two objects in the Hebrew Bible: this vessel and the basket of reeds that carries the infant Moses. Both are containers that save a life through water, and the shared word is not an accident. It is NOT the same word as the ark of the covenant, which is אָרוֹן.",
  }],
  ["H1613", "gopher wood", ["cedar", "olive wood", "stone"], {
    notes: "One occurrence in the Hebrew Bible, and no one knows what tree it was. Cypress is the usual guess. 'Gopher' is not a translation — it is the Hebrew word left standing because there is nothing to put in its place.",
  }],
  ["H753", "length", ["width", "height", "depth"], {}],
  ["H7341", "width, breadth", ["length", "height", "weight"], {}],
  ["H6967", "height", ["depth", "length", "width"], {}],
  ["H8482", "lower, lowest", ["upper", "outer", "middle"], {}],
  ["H3999", "the flood, the deluge", ["a drought", "a fire", "a famine"], {
    notes: "מַבּוּל is reserved for this event. Outside Genesis 6–11 it appears once, in Psalm 29. Ordinary floods get other words entirely — this one has its own.",
  }],
  ["H1478", "to expire, to perish", ["to be born", "to recover", "to flee"], {}],
  ["H4599", "a spring, a fountain", ["a well dug by hand", "a cistern", "a marsh"], {}],
  ["H3351", "living things, that which exists", ["ruins", "possessions", "the dead"], {}],
  ["H5534", "to be stopped up, to be closed", ["to burst open", "to overflow", "to rise"], {}],
  ["H780", "Ararat", ["Shinar", "Havilah", "Lebanon"], {}],
  ["H2474", "a window", ["a door", "a roof", "a floor"], {}],
  ["H6158", "a raven", ["a dove", "an eagle", "a sparrow"], {}],
  ["H3123", "a dove", ["a raven", "a hawk", "a swallow"], {}],
  ["H2965", "freshly plucked", ["withered", "ancient", "poisonous"], {}],
  ["H3176", "to wait, to hope", ["to hurry", "to despair", "to forget"], {}],
  ["H4372", "a covering", ["a floor", "a window", "a doorpost"], {}],
  ["H7306", "to smell", ["to taste", "to hear", "to touch"], {}],
  ["H7381", "an odour, a scent", ["a sound", "a taste", "a colour"], {}],
  ["H5207", "soothing, pleasing", ["offensive", "bitter", "faint"], {
    notes: "רֵיחַ הַנִּיחֹחַ, 'a soothing aroma' — and the noun is built on the same root as Noah's name, נוח, rest. The phrase becomes standard sacrificial language throughout Leviticus.",
  }],
  ["H7120", "cold", ["heat", "damp", "wind"], {}],
  ["H7019", "summer", ["winter", "spring", "harvest-time rain"], {}],
  ["H2779", "winter, autumn", ["summer", "spring", "midday"], {}],
  ["H8210", "to pour out, to shed", ["to gather", "to seal", "to drink"], {}],
  ["H6051", "a cloud", ["the sun", "a star", "a wind"], {}],
  ["H7198", "a bow", ["a sword", "a shield", "a spear"], {
    notes: "The rainbow is simply קֶשֶׁת, a war-bow — the same word used of the weapon everywhere else. The sign in the cloud is a weapon hung up.",
  }],
  ["H6172", "nakedness, exposure", ["clothing", "wealth", "honour"], {}],
  ["H7926", "the shoulder", ["the knee", "the wrist", "the ankle"], {}],
  ["H322", "backwards", ["forwards", "sideways", "upwards"], {}],
  ["H3364", "to awake", ["to fall asleep", "to dream", "to stumble"], {}],

  ["H4229", "to blot out, to wipe away", ["to write", "to preserve", "to gather"], {
    notes: "אֶמְחֶה — 'I will blot out'. The verb is used of erasing writing and of wiping a dish clean. It is what the flood is called before it is called a flood.",
  }],
  ["H3722", "to cover, to coat", ["to strip", "to break", "to open"], {
    notes: "Its first occurrence is entirely practical: coat the ark with pitch, inside and out. The same verb becomes the standard word for atonement in Leviticus, and Yom Kippur is named from it.",
  }],
  ["H3724", "pitch, a covering", ["timber", "rope", "cloth"], {}],
  ["H6672", "an opening for light", ["a door", "a floor", "a keel"], {}],
  ["H7311", "to rise, to be lifted up", ["to sink", "to rest", "to break"], {}],
  ["H2717", "to be dry, to be waste", ["to be flooded", "to be green", "to be cold"], {}],
  ["H5930", "a burnt offering", ["a meal", "a gift of silver", "a vow"], {}],
  ["H2844", "dread, terror", ["courage", "kindness", "peace"], {}],
  ["H6049", "to bring clouds", ["to clear the sky", "to darken by night", "to freeze"], {}],
  ["H5310", "to be scattered, to be dispersed", ["to gather", "to settle", "to multiply"], {}],
  ["H6601", "to make wide, to enlarge", ["to narrow", "to close", "to lower"], {
    notes: "9:27 reads יַפְתְּ אֱלֹהִים לְיֶפֶת — 'may God enlarge Japheth'. The verb פָּתָה and the name יֶפֶת sound alike and are unrelated; the blessing is built on the echo.",
  }],
  ["H3667", "Canaan", ["Cush", "Mizraim", "Put"], {}],

  // =========================================================================
  // Chapter 10 — the table of nations
  // =========================================================================
  ["H1586", "Gomer", ["Magog", "Madai", "Javan"], {}],
  ["H4031", "Magog", ["Gomer", "Meshech", "Tubal"], {}],
  ["H3120", "Javan (Greece)", ["Gomer", "Tiras", "Elishah"], {
    notes: "יָוָן is Ionia, and so the standard Hebrew name for Greece — the same word Daniel uses of the Greek empire. The Table of Nations is a map of the known world as it looked from Israel.",
  }],
  ["H8422", "Tubal", ["Meshech", "Tiras", "Magog"], {}],
  ["H4902", "Meshech", ["Tubal", "Magog", "Gomer"], {}],
  ["H8494", "Tiras", ["Tubal", "Javan", "Madai"], {}],
  ["H813", "Ashkenaz", ["Riphath", "Togarmah", "Elishah"], {}],
  ["H8425", "Togarmah", ["Ashkenaz", "Elishah", "Dodanim"], {}],
  ["H473", "Elishah", ["Tarshish", "Kittim", "Dodanim"], {}],
  ["H3794", "Kittim (Cyprus)", ["Elishah", "Tarshish", "Dodanim"], {}],
  ["H1721", "Dodanim", ["Kittim", "Elishah", "Tarshish"], {}],
  ["H6316", "Put", ["Cush", "Canaan", "Mizraim"], {}],
  ["H5434", "Seba", ["Sheba", "Havilah", "Sabtah"], {}],
  ["H5454", "Sabtah", ["Sabteca", "Seba", "Raamah"], {}],
  ["H7484", "Raamah", ["Sheba", "Dedan", "Sabtah"], {}],
  ["H5455", "Sabteca", ["Sabtah", "Seba", "Raamah"], {}],
  ["H7614", "Sheba", ["Seba", "Dedan", "Havilah"], {}],
  ["H5248", "Nimrod", ["Cush", "Asshur", "Peleg"], {
    notes: "'A mighty hunter before the LORD', and the founder of Babel, Erech and Accad — the great Mesopotamian cities. Four verses of narrative dropped into the middle of a genealogy, which is itself a signal that something is being said.",
  }],
  ["H8152", "Shinar (Babylonia)", ["Ararat", "Assyria", "Havilah"], {
    notes: "The plain where Babel is built in chapter 11 and the region Nimrod's kingdom begins in. Shinar is southern Mesopotamia — Sumer and Akkad.",
  }],
  ["H751", "Erech", ["Accad", "Calneh", "Babel"], {}],
  ["H390", "Accad", ["Erech", "Calneh", "Resen"], {}],
  ["H7344", "Rehoboth", ["Calah", "Resen", "Nineveh"], {}],
  ["H3625", "Calah", ["Resen", "Rehoboth", "Erech"], {}],
  ["H7449", "Resen", ["Calah", "Rehoboth", "Accad"], {}],
  ["H6047", "the Anamim", ["the Ludim", "the Lehabim", "the Naphtuhim"], {}],
  ["H3853", "the Lehabim", ["the Anamim", "the Naphtuhim", "the Casluhim"], {}],
  ["H5320", "the Naphtuhim", ["the Lehabim", "the Casluhim", "the Ludim"], {}],
  ["H3695", "the Casluhim", ["the Naphtuhim", "the Caphtorim", "the Anamim"], {}],
  ["H3866", "the Ludim", ["the Anamim", "the Lehabim", "the Casluhim"], {}],
  ["H6625", "the Pathrusim", ["the Casluhim", "the Caphtorim", "the Ludim"], {}],
  ["H3732", "the Caphtorim", ["the Pathrusim", "the Casluhim", "the Naphtuhim"], {}],
  ["H6721", "Sidon", ["Tyre", "Gaza", "Gerar"], {}],
  ["H2845", "Heth", ["Canaan", "Sidon", "Jebus"], {}],
  ["H1060", "the firstborn", ["the youngest", "the middle son", "the heir by adoption"], {}],
  ["H2983", "the Jebusite", ["the Amorite", "the Hivite", "the Girgashite"], {}],
  ["H567", "the Amorite", ["the Jebusite", "the Hivite", "the Arkite"], {}],
  ["H1622", "the Girgashite", ["the Hivite", "the Arkite", "the Sinite"], {}],
  ["H2340", "the Hivite", ["the Arkite", "the Sinite", "the Amorite"], {}],
  ["H6208", "the Arkite", ["the Sinite", "the Arvadite", "the Hivite"], {}],
  ["H5513", "the Sinite", ["the Arkite", "the Arvadite", "the Zemarite"], {}],
  ["H721", "the Arvadite", ["the Zemarite", "the Hamathite", "the Sinite"], {}],
  ["H6786", "the Zemarite", ["the Arvadite", "the Hamathite", "the Arkite"], {}],
  ["H2577", "the Hamathite", ["the Zemarite", "the Arvadite", "the Sinite"], {}],
  ["H1642", "Gerar", ["Gaza", "Sodom", "Admah"], {}],
  ["H5804", "Gaza", ["Gerar", "Sidon", "Zeboiim"], {}],
  ["H5467", "Sodom", ["Gomorrah", "Admah", "Zeboiim"], {}],
  ["H6017", "Gomorrah", ["Sodom", "Admah", "Zeboiim"], {}],
  ["H126", "Admah", ["Zeboiim", "Sodom", "Lasha"], {}],
  ["H6636", "Zeboiim", ["Admah", "Gomorrah", "Lasha"], {}],
  ["H3962", "Lasha", ["Admah", "Zeboiim", "Gerar"], {}],
  ["H5677", "Eber", ["Peleg", "Joktan", "Shelah"], {
    notes: "עֵבֶר, from whom the word עִבְרִי — Hebrew — is usually derived. The genealogy is quietly explaining where the reader's own name comes from.",
  }],
  ["H775", "Arpachshad", ["Asshur", "Elam", "Aram"], {}],
  ["H3865", "Lud", ["Elam", "Asshur", "Aram"], {}],
  ["H758", "Aram", ["Asshur", "Elam", "Lud"], {}],
  ["H5780", "Uz", ["Hul", "Gether", "Mash"], {}],
  ["H2343", "Hul", ["Uz", "Gether", "Mash"], {}],
  ["H1666", "Gether", ["Hul", "Mash", "Uz"], {}],
  ["H4851", "Mash", ["Gether", "Hul", "Uz"], {}],
  ["H7974", "Shelah", ["Eber", "Peleg", "Reu"], {}],
  ["H6389", "Peleg", ["Joktan", "Reu", "Serug"], {}],
  ["H6385", "to divide, to be split", ["to gather", "to build", "to inherit"], {
    notes: "'In his days the earth was נִפְלְגָה' — divided — and the son is called פֶּלֶג. The narrator makes the wordplay explicit here rather than leaving it to be noticed, which is unusual and worth pausing on.",
  }],
  ["H3355", "Joktan", ["Peleg", "Eber", "Almodad"], {}],
  ["H486", "Almodad", ["Sheleph", "Hazarmaveth", "Jerah"], {}],
  ["H8026", "Sheleph", ["Almodad", "Jerah", "Hadoram"], {}],
  ["H2700", "Hazarmaveth", ["Almodad", "Jerah", "Uzal"], {}],
  ["H3392", "Jerah", ["Hadoram", "Uzal", "Diklah"], {}],
  ["H187", "Uzal", ["Diklah", "Obal", "Abimael"], {}],
  ["H1853", "Diklah", ["Uzal", "Obal", "Sheba"], {}],
  ["H5745", "Obal", ["Abimael", "Diklah", "Uzal"], {}],
  ["H39", "Abimael", ["Obal", "Sheba", "Ophir"], {}],
  ["H211", "Ophir", ["Havilah", "Jobab", "Sheba"], {}],
  ["H3103", "Jobab", ["Ophir", "Havilah", "Obal"], {}],
  ["H4186", "a dwelling place", ["a journey", "a ruin", "a market"], {}],
  ["H4852", "Mesha", ["Sephar", "Ophir", "Havilah"], {}],
  ["H5611", "Sephar", ["Mesha", "Ophir", "Shinar"], {}],

  ["H6718", "hunting, game", ["farming", "fishing", "herding"], {
    notes: "גִּבֹּר־צַיִד לִפְנֵי יְהוָה, 'a mighty hunter before the LORD' — said of Nimrod, and it has been read as praise and as accusation for as long as anyone has been reading it.",
  }],
  ["H7384", "Riphath", ["Ashkenaz", "Togarmah", "Elishah"], {}],
  ["H1719", "Dedan", ["Sheba", "Raamah", "Seba"], {}],
  ["H3641", "Calneh", ["Accad", "Erech", "Resen"], {}],
  ["H5867", "Elam", ["Asshur", "Lud", "Aram"], {}],
  ["H1913", "Hadoram", ["Jerah", "Uzal", "Sheleph"], {}],

  // =========================================================================
  // Chapter 11 — Babel, and the line to Abram
  // =========================================================================
  ["H1237", "a plain, a valley", ["a mountain", "a coast", "a forest"], {}],
  ["H3843", "a brick", ["a stone", "a beam", "a tile"], {
    notes: "Verse 3 explains the technology to a reader who builds in stone: 'brick for stone, and bitumen for mortar'. Mesopotamia has no building stone, so the aside is a real observation about somewhere else.",
  }],
  ["H8313", "to burn, to fire", ["to soak", "to freeze", "to bury"], { root: "שרף", familyGloss: "burning" }],
  ["H8316", "a burning", ["a flood", "a carving", "a washing"], { root: "שרף" }],
  ["H2564", "bitumen, tar", ["clay", "lime", "sand"], {}],
  ["H4026", "a tower", ["a wall", "a gate", "a well"], {}],
  ["H2161", "to plan, to purpose", ["to forget", "to abandon", "to fear"], {}],
  ["H7466", "Reu", ["Serug", "Peleg", "Nahor"], {}],
  ["H8286", "Serug", ["Reu", "Nahor", "Terah"], {}],
  ["H5152", "Nahor", ["Terah", "Haran", "Serug"], {}],
  ["H8646", "Terah", ["Nahor", "Haran", "Abram"], {}],
  ["H87", "Abram", ["Nahor", "Haran", "Lot"], {
    notes: "Abram for the whole of these eleven chapters — he is not renamed Abraham until 17:5. The track ends exactly where his story begins.",
  }],
  ["H2039", "Haran", ["Nahor", "Terah", "Lot"], {
    notes: "Two different words in English transliteration: Abram's brother הָרָן, and the city חָרָן where Terah settles. They are spelled differently in Hebrew and only English blurs them.",
  }],
  ["H3876", "Lot", ["Nahor", "Haran", "Terah"], {}],
  ["H8297", "Sarai", ["Milcah", "Iscah", "Eve"], {}],
  ["H4435", "Milcah", ["Sarai", "Iscah", "Adah"], {}],
  ["H3252", "Iscah", ["Milcah", "Sarai", "Zillah"], {}],
  ["H6135", "barren", ["fruitful", "young", "widowed"], {
    notes: "וַתְּהִי שָׂרַי עֲקָרָה — 'and Sarai was barren'. The last thing the primeval history says before the call of Abram, and the problem the rest of Genesis is about.",
  }],
  ["H2056", "a child", ["a servant", "a parent", "a stranger"], {}],
  ["H3835", "to make bricks", ["to quarry stone", "to fell timber", "to dig a well"], {
    notes: "נִלְבְּנָה לְבֵנִים — 'let us brick bricks'. Verb and noun are the same three letters, and the sentence sounds in Hebrew like the repetitive work it describes.",
  }],
  ["H2563", "mortar, clay", ["stone", "iron", "straw"], {}],
  ["H1101", "to confuse, to mix", ["to clarify", "to separate", "to build"], {
    notes: "נָבְלָה שָׁם שְׂפָתָם — 'let us confuse their language' — and the city is called בָּבֶל. Babel is the Akkadian bāb-ili, 'gate of god'; the narrator hears בלל instead. It is a pun at the expense of Babylon's own name for itself, and the whole story turns on it.",
  }],
  ["H6327", "to scatter, to be dispersed", ["to gather", "to settle", "to build"], {
    notes: "The builders say 'lest we be scattered', and the chapter ends with exactly that. פּוּץ frames the story at both ends.",
  }],
  ["H218", "Ur", ["Haran", "Babel", "Erech"], {}],
  ["H2771", "Haran (the city)", ["Ur", "Babel", "Shinar"], {
    notes: "חָרָן the city, spelled with a het, is not הָרָן Abram's brother, spelled with a he. English writes both 'Haran'; Hebrew never confuses them.",
  }],
  ["H3778", "a Chaldean", ["an Egyptian", "an Amorite", "a Hittite"], {}],
];

// ---------------------------------------------------------------------------

/** Everything the seven earlier Hebrew books already gloss. */
function inherited() {
  const merged = new Map();
  for (const file of [
    "jonah-glossary.json",
    "ruth-glossary.json",
    "esther-glossary.json",
    "ecclesiastes-glossary.json",
    "haggai-glossary.json",
    "malachi-glossary.json",
    "obadiah-glossary.json",
  ]) {
    const { words = [] } = JSON.parse(readFileSync(resolve(HERE, file), "utf8"));
    for (const w of words) merged.set(String(w.lemma), { ...w });
  }
  return merged;
}

/** Notes anchored in another book's story — dropped rather than re-pointed. */
const FOREIGN_NOTE =
  /Ruth|Jonah|Naomi|Boaz|Nineveh|Moab|Bethlehem|Orpah|Esther|Mordecai|Haman|Vashti|Susa|Shushan|Persia|Qoheleth|Ecclesiastes|Haggai|Zerubbabel|Malachi|Obadiah|Edom|Esau|Teman|Sepharad|the fish|the storm/i;

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
    "Hand-written glosses, distractors, roots and teaching notes for Genesis 1-11. " +
    "Generated by build-genesis-glossary.mjs — edit that, not this. Entries shared " +
    "with the seven earlier Hebrew tracks are inherited at build time; narrative " +
    "Hebrew repeats itself, so Ruth and Jonah had already paid for 80.7% of this " +
    "book's running words. Glosses are short TEACHING meanings, not lexicon " +
    "entries. Genesis 1-11 turns on wordplay, and the notes describe the puns " +
    "without encoding any of them as shared roots. A Hebraist should read all of it.",
  words,
};

const path = resolve(HERE, "genesis-glossary.json");
writeFileSync(path, `${JSON.stringify(out, null, 1)}\n`);
console.log(`wrote ${path}`);
console.log(`  ${words.length} entries — ${authored.length} written for Genesis 1-11, ${reused} inherited`);
console.log(`  ${words.filter((w) => w.notes).length} teaching notes · ${stripped} inherited notes dropped`);
