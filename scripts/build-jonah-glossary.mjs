#!/usr/bin/env node
/**
 * Emits scripts/jonah-glossary.json — the curation layer for Jonah 1.
 *
 * Written as a table rather than hand-keyed JSON because 99 entries of literal
 * JSON is a transcription-error machine. The judgement is in the table; this
 * only reshapes it.
 *
 * Columns: strongs, gloss, distractors, then optional overrides.
 *   root:  a hand-supplied root, for words the importer's safe rule cannot
 *          reach. ONLY where the connection is uncontroversial — a noun beside
 *          its own verb (זֶבַח/זָבַח), not a speculative etymology.
 *   text:  headword override where Strong's citation form is not the standard
 *          one.
 *   pos:   part of speech, where the OSHB tag on the sampled token misleads.
 *
 * Deliberately NOT given roots, though Strong's offers them
 * (jonah-spike-findings.md §3):
 *   פָּנִים  "face"  ← פנה "to turn"   — a claim, not a fact
 *   עִיר    "city"  ← עור "to awake"  — folk etymology
 *   אֵת     obj.    ← אות "sign"      — simply wrong
 * These are kept as divergence examples instead.
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

// strongs | gloss | distractors | extras
const W = [
  ["H413", "to, unto", ["from", "with", "under"], { text: "אֶל", pos: "preposition" }],
  ["H3068", "the LORD (YHWH)", ["God", "king", "Israel"], {
    pos: "noun",
    notes: "The divine name. Hebrew manuscripts point it with the vowels of אֲדֹנָי “Lord”, which is what is read aloud; JPS renders it “the LORD” in small capitals.",
  }],
  ["H3220", "sea", ["river", "sky", "desert"]],
  ["H559", "to say", ["to hear", "to write", "to ask"]],
  ["H3588", "because, that, for", ["but", "or", "unless"]],
  ["H5921", "on, upon, against", ["under", "inside", "before"]],
  ["H376", "man", ["woman", "child", "servant"]],
  ["H1419", "great, large", ["small", "holy", "distant"], { root: "גדל", familyGloss: "great, to grow" }],
  ["H853", "(marks the direct object)", ["and", "to", "from"], {
    pos: "particle",
    notes: "Untranslatable: it marks a definite direct object rather than meaning anything itself. Strong's derives it from אוֹת “sign”, which is not correct — see the family note.",
  }],
  ["H3124", "Jonah", ["Amittai", "Nineveh", "Tarshish"], { pos: "noun" }],
  ["H4100", "what?", ["who?", "where?", "when?"], { pos: "particle" }],
  ["H6440", "face, presence", ["hand", "voice", "name"], {
    pos: "noun",
    notes: "Plural in form, singular in sense. Strong's files it under פנה “to turn”; that is an etymological guess, so no root is highlighted here.",
  }],
  ["H2904", "to hurl", ["to lift", "to hide", "to bind"], { familyGloss: "to hurl" }],
  ["H430", "God; gods", ["king", "lord", "spirit"], {
    pos: "noun",
    notes: "Plural in form. Used of the God of Israel with singular verbs, and of other gods with plural ones — Jonah 1:5 has the sailors crying to their own אֱלֹהִים.",
  }],
  ["H6213", "to do, to make", ["to say", "to give", "to see"]],
  ["H6965", "to arise, to stand up", ["to sit", "to sleep", "to fall"]],
  ["H7121", "to call, to proclaim", ["to listen", "to run", "to send"]],
  ["H7451", "evil, calamity", ["good", "peace", "joy"], { root: "רעע", familyGloss: "evil, to be bad" }],
  ["H8659", "Tarshish", ["Nineveh", "Joppa", "Jerusalem"], { pos: "noun" }],
  ["H3381", "to go down", ["to go up", "to enter", "to remain"], {
    notes: "Jonah goes down repeatedly in this chapter — down to Joppa, down into the ship, down into its hold — and in 2:6 down to the roots of the mountains.",
  }],
  ["H591", "ship", ["house", "city", "cart"]],
  ["H935", "to come, to go in", ["to leave", "to stand", "to fear"]],
  ["H3372", "to fear", ["to love", "to trust", "to forget"], { familyGloss: "fear, to revere" }],
  ["H5307", "to fall", ["to rise", "to fly", "to run"]],
  ["H1486", "lot (cast to decide)", ["stone", "gift", "share"], {
    notes: "Literally a pebble, from the practice of casting stones to decide a matter — Jonah 1:7.",
  }],
  ["H3045", "to know", ["to forget", "to seek", "to believe"]],
  ["H2063", "this (feminine)", ["that", "these", "which"], { pos: "pronoun" }],
  ["H2088", "this (masculine)", ["that", "those", "who"], { pos: "pronoun" }],
  ["H3373", "fearing, reverent", ["fearless", "faithful", "wicked"], {
    pos: "adjective", root: "ירא",
    notes: "An adjective, not the verb. Jonah 1:9: “I am a Hebrew, and I fear (יָרֵא) the LORD” — same consonants as H3372, different word class.",
  }],
  ["H1961", "to be, to happen", ["to do", "to go", "to see"]],
  ["H3212", "to go, to walk", ["to stop", "to sit", "to return"]],
  ["H1272", "to flee", ["to chase", "to hide", "to wait"]],
  ["H5414", "to give", ["to take", "to sell", "to keep"]],
  ["H5591", "storm, tempest", ["calm", "breeze", "current"], {
    root: "סער", familyGloss: "storm, to rage",
    familyNotes: "The noun סַעַר and the verb סָעַר both appear in Jonah 1 — the sea storms, and there is a storm.",
  }],
  ["H834", "who, which, that", ["and", "but", "because"], { pos: "particle" }],
  ["H7290", "to sleep soundly", ["to wake", "to dream", "to rest"]],
  ["H3808", "not", ["yes", "also", "again"], { pos: "particle" }],
  ["H6", "to perish", ["to grow", "to find", "to build"]],
  ["H4310", "who?", ["what?", "where?", "why?"], { pos: "particle" }],
  ["H5046", "to tell, to declare", ["to hide", "to ask", "to hear"]],
  ["H4994", "please, pray (entreaty)", ["not", "again", "indeed"], { pos: "particle" }],
  ["H859", "you (masc. sing.)", ["I", "he", "we"], { pos: "pronoun" }],
  ["H589", "I", ["you", "he", "they"], { pos: "pronoun" }],
  ["H3004", "dry land", ["deep water", "island", "shore"], { root: "יבשׁ", familyGloss: "dry, to be dry" }],
  ["H8367", "to be calm, to grow quiet", ["to roar", "to rise", "to break"]],
  ["H1980", "to walk, to go", ["to stand", "to fall", "to speak"], {
    notes: "Overlaps with יָלַךְ (H3212); the two share a paradigm between them, הָלַךְ supplying some forms and יָלַךְ others.",
  }],
  ["H5590", "to storm, to rage", ["to calm", "to freeze", "to shine"], { root: "סער" }],
  ["H5375", "to lift, to carry", ["to drop", "to push", "to hide"]],
  ["H408", "do not (with a command)", ["not", "no", "never"], {
    pos: "particle",
    notes: "Used with commands, where לֹא negates statements. Jonah 1:14: “let us not perish”.",
  }],
  ["H1697", "word, thing, matter", ["silence", "deed", "place"], {
    root: "דבר", familyGloss: "word, to speak",
    familyNotes: "One of the clearest root families in Hebrew: דָּבָר a word, דִּבֶּר to speak, מִדְבָּר wilderness (disputed).",
  }],
  ["H1121", "son", ["daughter", "father", "brother"]],
  ["H573", "Amittai", ["Jonah", "Nineveh", "Joppa"], { pos: "noun" }],
  ["H5210", "Nineveh", ["Tarshish", "Joppa", "Jerusalem"], { pos: "noun" }],
  ["H5892", "city", ["village", "field", "gate"], {
    notes: "Strong's derives it from עוּר “to awake”, glossing a city as “a place guarded by waking”. That is folk etymology, so no root is marked.",
  }],
  ["H5927", "to go up", ["to go down", "to sit", "to send"]],
  ["H3305", "Joppa", ["Tarshish", "Nineveh", "Sidon"], { pos: "noun" }],
  ["H4672", "to find", ["to lose", "to seek", "to hide"]],
  ["H7939", "fare, wages", ["debt", "gift", "toll"], { root: "שׂכר", familyGloss: "wages, to hire" }],
  ["H5973", "with", ["without", "from", "toward"], { pos: "preposition" }],
  ["H7307", "wind, breath, spirit", ["fire", "water", "cloud"], {
    root: "רוח", familyGloss: "wind, breath, spirit",
    familyNotes: "One word covers wind, breath and spirit. Jonah 1:4 has the LORD hurling a great רוּחַ onto the sea — wind, plainly, but the same word carries the other senses elsewhere.",
  }],
  ["H2803", "to think, to reckon", ["to forget", "to speak", "to build"]],
  ["H7665", "to break", ["to mend", "to lift", "to carry"]],
  ["H4419", "sailor, mariner", ["captain", "merchant", "fisherman"], {
    notes: "Related to מֶלַח “salt” — a salt-water man. Not marked as a root here, since the connection is a plausible guess rather than a paradigm.",
  }],
  ["H2199", "to cry out", ["to whisper", "to laugh", "to listen"]],
  ["H3627", "vessel, article, gear", ["rope", "sail", "food"], {
    notes: "Very general: any made object. In Jonah 1:5 it is the ship's cargo and tackle, thrown overboard.",
  }],
  ["H7043", "to be light; to lighten", ["to be heavy", "to darken", "to fill"], {
    notes: "In Jonah 1:5 the sailors lighten the ship by throwing the cargo out.",
  }],
  ["H3411", "hinder part, recesses", ["deck", "prow", "mast"], { root: "ירכ" }],
  ["H5600", "ship, decked vessel", ["raft", "anchor", "oar"], {
    notes: "Occurs only here in the Hebrew Bible. Jonah is asleep in its יַרְכְּתֵי — its innermost part.",
  }],
  ["H7901", "to lie down", ["to stand", "to run", "to sit"]],
  ["H7126", "to draw near", ["to depart", "to fall", "to look"]],
  ["H7227", "great, many, chief", ["few", "small", "weak"], { root: "רבב", familyGloss: "many, to be much" }],
  ["H2259", "sailor; (with רַב) captain", ["merchant", "priest", "soldier"], {
    root: "חבל",
    notes: "רַב הַחֹבֵל in Jonah 1:6 is “the chief of the sailors” — the captain.",
  }],
  ["H194", "perhaps", ["surely", "never", "always"], { pos: "adverb" }],
  ["H6245", "to give thought", ["to sleep", "to sail", "to eat"], {
    notes: "Rare and uncertain. Jonah 1:6: “perhaps God will give thought to us”.",
  }],
  ["H7453", "companion, fellow", ["enemy", "stranger", "master"]],
  ["H4399", "work, occupation, business", ["rest", "journey", "wealth"]],
  ["H370", "from where?", ["where to?", "when?", "how?"], { pos: "particle" }],
  ["H776", "land, earth", ["sea", "sky", "city"]],
  ["H335", "where?", ["what?", "who?", "why?"], { pos: "particle" }],
  ["H5971", "people", ["king", "land", "army"]],
  ["H5680", "Hebrew", ["Egyptian", "Assyrian", "Philistine"], { pos: "noun" }],
  ["H595", "I", ["you", "we", "he"], {
    pos: "pronoun",
    notes: "A longer, weightier alternative to אֲנִי. Jonah uses it in 1:9 to answer who he is.",
  }],
  ["H8064", "heavens, sky", ["earth", "sea", "dust"], {
    notes: "Dual in form, like several natural pairs in Hebrew.",
  }],
  ["H1931", "he, that", ["she", "I", "they"], { pos: "pronoun" }],
  ["H7945", "on account of, because of", ["with", "before", "after"], { pos: "particle" }],
  ["H2864", "to row (literally, to dig)", ["to sail", "to swim", "to anchor"], {
    notes: "Jonah 1:13: the men “dug” to bring the ship back to land — Hebrew for rowing hard against a sea.",
  }],
  ["H3201", "to be able", ["to refuse", "to try", "to fail"]],
  ["H577", "we beseech you!", ["behold", "surely", "no"], { pos: "particle" }],
  ["H5315", "soul, life, person", ["body", "mind", "grave"], {
    root: "נפשׁ", familyGloss: "life, breath",
    familyNotes: "Not “soul” in the later philosophical sense: נֶפֶשׁ is the living, breathing self. Jonah 1:14 asks not to perish for this man's נֶפֶשׁ — his life.",
  }],
  ["H1818", "blood", ["water", "wine", "dust"], {
    notes: "דָּם נָקִי “innocent blood” in Jonah 1:14 is a fixed legal phrase for unpunished killing.",
  }],
  ["H5355", "innocent, clean", ["guilty", "wicked", "foolish"], { root: "נקה", familyGloss: "clean, to be innocent" }],
  ["H2654", "to delight in, to please", ["to hate", "to fear", "to forget"]],
  ["H5975", "to stand", ["to sit", "to run", "to fall"]],
  ["H2197", "raging, fury", ["calm", "silence", "mercy"], { pos: "noun", root: "זעפ", familyGloss: "rage" }],
  ["H2076", "to sacrifice", ["to build", "to pray", "to sing"], {
    familyGloss: "sacrifice",
    familyNotes: "Verb and noun together in Jonah 1:16: וַיִּזְבְּחוּ זֶבַח — “they sacrificed a sacrifice”. Hebrew does this often, and it is not redundancy but emphasis.",
  }],
  ["H2077", "sacrifice", ["offering", "feast", "altar"], { root: "זבח" }],
  ["H5087", "to vow", ["to swear", "to bless", "to beg"], {
    familyGloss: "vow",
    familyNotes: "The same pairing as זבח, in the same verse: וַיִּדְּרוּ נְדָרִים — “they vowed vows”.",
  }],
  ["H5088", "vow", ["oath", "gift", "debt"], { root: "נדר" }],

  // ---- chapter 2: Jonah's psalm from the fish -----------------------------
  // Poetry, not narrative. The vocabulary is watery, archaic and largely
  // confined to this chapter — it is the least reusable Hebrew in the book.
  ["H5704", "as far as, until", ["from", "beside", "without"], { pos: "preposition" }],
  ["H1709", "fish", ["bird", "beast", "serpent"], { root: "דג", familyGloss: "fish" }],
  ["H1710", "fish (feminine)", ["bird", "flock", "herd"], {
    root: "דג",
    notes: "The same word as דָּג in a feminine form. Jonah 2:2 uses the masculine, 2:1 the feminine, for the same creature.",
  }],
  ["H3117", "day", ["night", "year", "hour"], { pos: "noun" }],
  ["H3915", "night", ["day", "dawn", "noon"], { pos: "noun" }],
  ["H7969", "three", ["two", "four", "seven"], { pos: "adjective" }],
  ["H6419", "to pray", ["to curse", "to boast", "to sleep"], { familyGloss: "to pray, intercede" }],
  ["H4578", "innards, belly", ["mouth", "hand", "back"], {
    pos: "noun",
    notes: "Plural in form. Used for the seat of feeling as well as the physical gut — Jonah prays from the מֵעֵי of the fish.",
  }],
  ["H6869", "distress, trouble", ["ease", "wealth", "joy"], { pos: "noun" }],
  ["H6030", "to answer", ["to ask", "to ignore", "to shout"], { familyGloss: "to answer" }],
  ["H990", "belly, womb", ["head", "shoulder", "foot"], { pos: "noun" }],
  ["H7585", "Sheol, the grave", ["heaven", "temple", "wilderness"], {
    pos: "noun",
    notes: "The realm of the dead. Not 'hell' in the later sense — Sheol is where everyone goes, without moral sorting.",
  }],
  ["H7768", "to cry for help", ["to whisper", "to sing", "to laugh"], { familyGloss: "to cry out" }],
  ["H6963", "voice, sound", ["silence", "word", "name"], { pos: "noun" }],
  ["H8085", "to hear, to listen", ["to see", "to speak", "to forget"], { familyGloss: "to hear" }],
  ["H7993", "to throw, to cast", ["to catch", "to lift", "to hold"], { familyGloss: "to throw" }],
  ["H4688", "the deep, a deep place", ["shore", "shallows", "riverbank"], { pos: "noun" }],
  ["H3824", "heart, inner self", ["hand", "eye", "voice"], {
    pos: "noun",
    notes: "In Hebrew the heart is where thinking and deciding happen, not primarily feeling.",
  }],
  ["H5104", "river, stream", ["desert", "mountain", "well"], { pos: "noun" }],
  ["H3605", "all, every, whole", ["some", "none", "few"], { pos: "noun" }],
  ["H4867", "breaker, wave", ["calm", "shore", "current"], { pos: "noun" }],
  ["H1530", "wave, billow", ["stone", "sand", "foam"], { pos: "noun" }],
  ["H1644", "to drive out, to expel", ["to gather", "to welcome", "to hide"], { familyGloss: "to drive out" }],
  ["H5048", "before, in front of", ["behind", "beneath", "within"], { pos: "preposition" }],
  ["H5869", "eye", ["ear", "hand", "mouth"], {
    pos: "noun",
    notes: "Also means a spring of water — the same word, from the shape of the opening.",
  }],
  ["H389", "surely, yet", ["never", "perhaps", "also"], { pos: "particle" }],
  ["H3254", "to add, to do again", ["to stop", "to lessen", "to begin"], { familyGloss: "to add" }],
  ["H5027", "to look, to gaze", ["to turn away", "to close", "to hide"], { familyGloss: "to look" }],
  ["H1964", "temple, palace", ["house", "tent", "gate"], {
    pos: "noun",
    notes: "One word for both, because a temple is a god's palace.",
  }],
  ["H6944", "holiness, a holy place", ["profane", "common", "ruin"], { pos: "noun" }],
  ["H661", "to encompass, to surround", ["to release", "to open", "to flee"], { familyGloss: "to surround" }],
  ["H4325", "water", ["fire", "dust", "wind"], {
    pos: "noun",
    notes: "Dual in form, like שָׁמַיִם — Hebrew treats water as inherently plural.",
  }],
  ["H8415", "the deep, the abyss", ["shore", "sky", "hill"], { pos: "noun" }],
  ["H5437", "to surround, to encircle", ["to abandon", "to divide", "to open"], { familyGloss: "to surround" }],
  ["H5488", "reeds, seaweed", ["stone", "sand", "coral"], {
    pos: "noun",
    notes: "The same word as in יַם־סוּף, the Sea of Reeds.",
  }],
  ["H2280", "to bind, to wrap", ["to loosen", "to tear", "to lift"], { familyGloss: "to bind" }],
  ["H7095", "base, extremity", ["summit", "middle", "edge"], { pos: "noun" }],
  ["H2022", "mountain", ["valley", "plain", "sea"], { pos: "noun" }],
  ["H1280", "bar, bolt", ["door", "key", "gate"], {
    pos: "noun",
    notes: "Jonah 2:7: the earth's bars closed behind him — the underworld imagined as a barred gate.",
  }],
  ["H1157", "behind, about", ["before", "within", "above"], { pos: "preposition" }],
  ["H5769", "forever, long duration", ["a moment", "yesterday", "tomorrow"], {
    pos: "noun",
    notes: "Not 'eternity' in the abstract; it means a horizon so distant it cannot be seen past.",
  }],
  ["H7845", "the pit", ["the height", "the road", "the field"], { pos: "noun" }],
  ["H5848", "to grow faint", ["to strengthen", "to wake", "to rise"], { familyGloss: "to faint" }],
  ["H2142", "to remember", ["to forget", "to invent", "to doubt"], { familyGloss: "to remember" }],
  ["H8605", "prayer", ["curse", "song", "oath"], { pos: "noun" }],
  ["H8104", "to keep, to guard", ["to abandon", "to destroy", "to lose"], { familyGloss: "to guard, keep" }],
  ["H1892", "vanity, a vapour", ["substance", "truth", "treasure"], {
    pos: "noun",
    notes: "Literally a breath or vapour. The keyword of Ecclesiastes, used here of worthless idols.",
  }],
  ["H7723", "falsehood, emptiness", ["truth", "wisdom", "wealth"], { pos: "noun" }],
  ["H5800", "to forsake, to abandon", ["to keep", "to seek", "to hold"], { familyGloss: "to forsake" }],
  ["H2617", "steadfast love, mercy", ["cruelty", "anger", "silence"], {
    pos: "noun",
    notes: "Hard to translate: covenant loyalty and kindness together. Often rendered lovingkindness or steadfast love.",
  }],
  ["H8426", "thanksgiving", ["complaint", "request", "warning"], { pos: "noun" }],
  ["H3444", "salvation, deliverance", ["ruin", "capture", "exile"], {
    pos: "noun",
    notes: "The noun behind the name Joshua, and behind Jesus.",
  }],
  ["H6958", "to vomit", ["to swallow", "to chew", "to drink"], { familyGloss: "to vomit" }],
  ["H1104", "to swallow up", ["to spit out", "to chew", "to refuse"], { familyGloss: "to swallow" }],

  // ---- chapter 3: Nineveh repents ----------------------------------------
  ["H8145", "second", ["first", "third", "last"], { pos: "adjective" }],
  ["H7150", "proclamation, message", ["question", "secret", "song"], { pos: "noun" }],
  ["H4109", "a journey, a walk", ["a rest", "a house", "a border"], { pos: "noun" }],
  ["H1870", "way, road", ["wall", "field", "river"], {
    pos: "noun",
    notes: "Also a way of living — 'their evil way' in Jonah 3:10 is conduct, not a road.",
  }],
  ["H2490", "to begin", ["to finish", "to pause", "to repeat"], { familyGloss: "to begin" }],
  ["H259", "one", ["two", "many", "none"], { pos: "adjective" }],
  ["H5750", "still, yet, again", ["never", "already", "seldom"], { pos: "adverb" }],
  ["H705", "forty", ["four", "fourteen", "four hundred"], { pos: "adjective" }],
  ["H2015", "to overturn, to overthrow", ["to build", "to preserve", "to raise"], {
    familyGloss: "to overturn",
    notes: "Jonah's whole message is one word of this verb — נֶהְפָּכֶת, 'is being overthrown'.",
  }],
  ["H539", "to believe, to trust", ["to doubt", "to mock", "to forget"], {
    familyGloss: "to believe",
    notes: "The root behind אָמֵן — to be firm, to rely on.",
  }],
  ["H6685", "a fast", ["a feast", "a march", "a sacrifice"], { pos: "noun" }],
  ["H3847", "to put on, to clothe", ["to strip", "to wash", "to tear"], { familyGloss: "to clothe" }],
  ["H8242", "sackcloth", ["linen", "wool", "silk"], {
    pos: "noun",
    notes: "Coarse cloth worn in mourning. Jonah 3:8 puts it on the cattle too.",
  }],
  ["H6996", "small, young", ["great", "old", "strong"], { pos: "adjective" }],
  ["H4428", "king", ["servant", "priest", "prophet"], { pos: "noun" }],
  ["H3678", "throne", ["table", "bed", "gate"], { pos: "noun" }],
  ["H155", "robe, mantle", ["crown", "sandal", "belt"], { pos: "noun" }],
  ["H665", "ashes", ["oil", "grain", "water"], { pos: "noun" }],
  ["H2940", "decree, taste", ["custom", "rumour", "wish"], {
    root: "טעמ", familyGloss: "taste, judgement",
    familyNotes: "The verb טָעַם means to taste; the noun means both a taste and a considered decision. Jonah 3:7 has the king's טַעַם — his decree — and 3:7 also forbids anyone to taste (טָעַם) anything.",
  }],
  ["H120", "human being, mankind", ["angel", "beast", "god"], {
    pos: "noun",
    notes: "Related to אֲדָמָה, the ground — the human is the earth-creature.",
  }],
  ["H929", "beast, cattle", ["bird", "fish", "human"], { pos: "noun" }],
  ["H1241", "herd, oxen", ["flock", "swarm", "pack"], { pos: "noun" }],
  ["H6629", "flock, sheep", ["herd", "swarm", "pack"], { pos: "noun" }],
  ["H2938", "to taste", ["to smell", "to touch", "to hear"], { root: "טעמ" }],
  ["H3972", "anything, a whit", ["everything", "nothing at all", "much"], { pos: "noun" }],
  ["H7462", "to graze, to feed", ["to hunt", "to starve", "to slaughter"], {
    familyGloss: "to graze, shepherd",
    notes: "Same consonants as רַע 'evil' and רֵעַ 'companion' but a different word. Unpointed Hebrew cannot tell them apart; context and vowels can.",
  }],
  ["H8354", "to drink", ["to eat", "to pour", "to thirst"], { familyGloss: "to drink" }],
  ["H2394", "force, violence", ["gentleness", "silence", "patience"], { pos: "noun" }],
  ["H3709", "palm, hand", ["foot", "head", "arm"], { pos: "noun" }],
  ["H2555", "violence, wrong", ["justice", "peace", "mercy"], { pos: "noun" }],
  ["H7725", "to turn back, to repent", ["to continue", "to depart", "to remain"], {
    familyGloss: "to return",
    notes: "Turning back physically and turning from wrongdoing are the same verb — the pivot of the whole book.",
  }],
  ["H2740", "burning anger", ["calm", "delight", "pity"], { root: "חרה", familyGloss: "to burn, anger" }],
  ["H5162", "to relent, to be sorry", ["to insist", "to rejoice", "to forget"], {
    familyGloss: "to relent, comfort",
    notes: "The same verb means to comfort and to change one's mind. Jonah 3:10: God relented of the evil he had said he would do.",
  }],

  // ---- chapter 4: Jonah's anger and the gourd -----------------------------
  ["H3415", "to be displeasing", ["to please", "to delight", "to satisfy"], { familyGloss: "to be displeasing" }],
  ["H2734", "to burn with anger", ["to cool", "to forgive", "to laugh"], { root: "חרה", familyGloss: "to burn, anger" }],
  ["H639", "anger; nose", ["joy", "patience", "mercy"], {
    pos: "noun",
    notes: "The same word for nose and for anger — from the flaring of the nostrils. אֶרֶךְ אַפַּיִם, 'long of nose', means slow to anger.",
  }],
  ["H6258", "now", ["then", "never", "soon"], { pos: "adverb" }],
  ["H3947", "to take", ["to give", "to leave", "to lose"], { familyGloss: "to take" }],
  ["H4194", "death", ["life", "birth", "sleep"], { root: "מות", familyGloss: "death, to die" }],
  ["H4191", "to die", ["to live", "to rise", "to heal"], { root: "מות" }],
  ["H2896", "good", ["evil", "small", "hard"], { pos: "adjective" }],
  ["H3190", "to do well, to be good", ["to do harm", "to fail", "to worsen"], { familyGloss: "to do well" }],
  ["H3318", "to go out", ["to enter", "to stay", "to return"], { familyGloss: "to go out" }],
  ["H6924", "east, front", ["west", "north", "south"], { root: "קדמ", familyGloss: "east, front, before" }],
  ["H6923", "to go before, to anticipate", ["to follow", "to delay", "to forget"], { root: "קדמ" }],
  ["H6921", "east wind", ["west wind", "sea breeze", "storm"], {
    root: "קדמ",
    notes: "The sirocco off the desert — dry, scorching, and in Jonah 4:8 sent deliberately.",
  }],
  ["H8033", "there", ["here", "everywhere", "nowhere"], { pos: "adverb" }],
  ["H5521", "booth, shelter", ["tent", "house", "cave"], { pos: "noun" }],
  ["H8478", "under, beneath", ["above", "beside", "within"], { pos: "preposition" }],
  ["H6738", "shade, shadow", ["light", "heat", "glare"], { pos: "noun" }],
  ["H7200", "to see", ["to hear", "to speak", "to hide"], { familyGloss: "to see" }],
  ["H4487", "to appoint, to allot", ["to remove", "to forbid", "to delay"], {
    familyGloss: "to appoint",
    notes: "Four times in the book God 'appoints' something: the fish, the gourd, the worm and the wind.",
  }],
  ["H7021", "the gourd (a plant)", ["a vine", "a thorn", "a palm"], {
    pos: "noun",
    notes: "The plant is unidentified. Strong's guesses the castor-oil plant; the text only says it grew fast and died faster.",
  }],
  ["H5337", "to deliver, to snatch away", ["to abandon", "to capture", "to bind"], { familyGloss: "to deliver" }],
  ["H8055", "to rejoice", ["to grieve", "to fear", "to rage"], { root: "שׂמח", familyGloss: "joy, to rejoice" }],
  ["H8057", "joy, gladness", ["sorrow", "anger", "fear"], { root: "שׂמח" }],
  ["H8438", "worm", ["bird", "fish", "beetle"], { pos: "noun" }],
  ["H7837", "dawn", ["dusk", "midnight", "noon"], { pos: "noun" }],
  ["H4283", "the next day", ["yesterday", "this evening", "long ago"], { pos: "noun" }],
  ["H5221", "to strike, to smite", ["to heal", "to spare", "to lift"], { familyGloss: "to strike" }],
  ["H3001", "to wither, to dry up", ["to bloom", "to grow", "to spread"], {
    root: "יבשׁ", familyGloss: "dry, to be dry",
    familyNotes: "The same root as יַבָּשָׁה, dry land, in chapter 1 — a plant withers by the same word the sea does not cover.",
  }],
  ["H2224", "to rise (of the sun)", ["to set", "to darken", "to hide"], { familyGloss: "to rise, shine" }],
  ["H8121", "sun", ["moon", "star", "cloud"], { pos: "noun" }],
  ["H2759", "sultry, scorching", ["cool", "damp", "gentle"], { pos: "adjective" }],
  ["H5968", "to grow faint", ["to revive", "to strengthen", "to wake"], { familyGloss: "to faint" }],
  ["H7592", "to ask, to request", ["to answer", "to refuse", "to command"], { familyGloss: "to ask" }],
  ["H2416", "life; alive", ["death", "sleep", "dust"], { pos: "noun" }],
  ["H2347", "to pity, to spare", ["to destroy", "to ignore", "to punish"], {
    familyGloss: "to pity",
    notes: "The book's last word turns on it: should God not pity Nineveh?",
  }],
  ["H5998", "to labour, to toil", ["to rest", "to play", "to sleep"], { familyGloss: "to labour" }],
  ["H1431", "to grow, to make great", ["to shrink", "to ruin", "to hide"], { root: "גדל" }],
  ["H3426", "there is", ["there is not", "perhaps", "always"], { pos: "particle" }],
  ["H7235", "to be many, to increase", ["to lessen", "to vanish", "to divide"], { familyGloss: "to be many" }],
  ["H8147", "two", ["one", "three", "ten"], { pos: "adjective" }],
  ["H6240", "-teen (in compounds)", ["-ty", "hundred", "thousand"], { pos: "adjective" }],
  ["H7239", "myriad, ten thousand", ["dozen", "hundred", "handful"], { pos: "adjective" }],
  ["H996", "between", ["beyond", "within", "around"], { pos: "preposition" }],
  ["H3225", "right hand", ["left hand", "head", "foot"], { pos: "noun" }],
  ["H8040", "left hand", ["right hand", "head", "foot"], {
    pos: "noun",
    notes: "Jonah 4:11: Nineveh's people cannot tell right hand from left — either children, or moral ignorance, or both.",
  }],
  ["H127", "ground, soil", ["sky", "sea", "stone"], {
    pos: "noun",
    notes: "Related to אָדָם, the human — the creature made from it.",
  }],
  ["H3651", "so, thus", ["never", "perhaps", "instead"], { pos: "particle" }],
  ["H410", "God, a god", ["king", "spirit", "idol"], { pos: "noun" }],
  ["H2587", "gracious", ["harsh", "distant", "silent"], { pos: "adjective" }],
  ["H7349", "compassionate", ["ruthless", "proud", "cold"], { pos: "adjective" }],
  ["H750", "long, slow", ["short", "quick", "sudden"], {
    pos: "adjective",
    notes: "אֶרֶךְ אַפַּיִם — 'long of nostrils', i.e. slow to anger. Jonah quotes the formula at God as a complaint.",
  }],
  ["H1696", "to speak", ["to listen", "to write", "to be silent"], { root: "דבר" }],
  ["H7489", "to be evil, to do harm", ["to do good", "to heal", "to build"], { root: "רעע" }],
  ["H4639", "deed, work", ["word", "thought", "plan"], { pos: "noun" }],
  ["H4480", "from, out of", ["to", "with", "toward"], { pos: "preposition" }],

  // Words met in more than one chapter. Listed once, deliberately — the
  // duplicate guard above exists because re-listing them silently discards
  // whichever entry came first.
  ["H7218", "head, top", ["foot", "hand", "side"], { pos: "noun" }],
  ["H3427", "to sit, to dwell", ["to stand", "to travel", "to flee"], { familyGloss: "to sit, dwell" }],
  ["H5674", "to pass over, to cross", ["to remain", "to return", "to stop"], { familyGloss: "to cross over" }],
  ["H3680", "to cover", ["to uncover", "to open", "to burn"], { familyGloss: "to cover" }],
  ["H5060", "to reach, to touch", ["to withdraw", "to miss", "to drop"], { familyGloss: "to touch" }],
  ["H7999", "to pay, to fulfil", ["to owe", "to borrow", "to refuse"], {
    familyGloss: "to complete, make whole",
    notes: "Same root as שָׁלוֹם: to make whole, hence to pay what is owed. Jonah 2:10 — “what I have vowed I will pay”.",
  }],
];

/*
 * A lemma may appear only once. The table is long and a word met in chapter 1
 * turns up again in chapter 4, so it is easy to re-list it — and because the
 * importer keys curation by lemma, a later bare entry silently overwrites the
 * earlier curated one, dropping its root and notes. That happened: adding
 * chapters 2–4 clobbered the roots on גָּדוֹל, רַע and נֶפֶשׁ.
 */
const duplicates = W.map(([lemma]) => lemma).filter((l, i, all) => all.indexOf(l) !== i);
if (duplicates.length) {
  throw new Error(
    `Duplicate lemmas in the glossary table: ${[...new Set(duplicates)].join(", ")}.\n` +
      `A word curated once covers every chapter it appears in — remove the repeat.`,
  );
}

const words = W.map(([lemma, gloss, distractors, extra = {}]) => ({
  lemma, gloss, distractors, ...extra,
}));

const out = {
  _readme: [
    "Curation layer for Jonah chapter 1. Everything else is derived by",
    "scripts/import-oshb.mjs from OSHB + Strong's.",
    "",
    "Generated from scripts/build-jonah-glossary.mjs — edit the table there, not",
    "this file, so the judgement stays in one reviewable place.",
    "",
    "NEEDS SPECIALIST REVIEW. Glosses are short teaching meanings chosen for a",
    "beginner reading Jonah, not lexicon entries. Hand-supplied roots are the",
    "least certain content here and should be checked first.",
    "",
    "Roots are deliberately WITHHELD from פָּנִים, עִיר, אֵת and מַלָּח even",
    "though Strong's offers derivations, because those derivations are guesses.",
    "See jonah-spike-findings.md §3.",
  ],
  words,
};

const file = resolve(HERE, "jonah-glossary.json");
writeFileSync(file, JSON.stringify(out, null, 2));
console.log(`wrote ${file}`);
console.log(`  ${words.length} curated entries`);
console.log(`  ${words.filter((w) => w.root).length} hand-supplied roots`);
console.log(`  ${words.filter((w) => w.notes).length} teaching notes`);
