#!/usr/bin/env node
/**
 * The human contribution to the Ecclesiastes course.
 *
 * THE FIRST HEBREW TRACK THAT IS NOT NARRATIVE. Jonah, Ruth and Esther are
 * prose stories; Qoheleth is wisdom poetry with an argument, and the difference
 * shows in the numbers. 2,949 content tokens over 562 lemmas is 5.2 tokens per
 * lemma against Esther's 6.0 — the review queue carries less of the load, and a
 * reader will meet more words once and never again.
 *
 * It is also the cheapest Hebrew book left: 277 of those 562 lemmas are already
 * glossed by the three books before it, so only 285 needed writing. Fewer than
 * Esther, fewer than Ruth.
 *
 * WHAT IS DIFFERENT ABOUT GLOSSING IT. In a narrative a word does a job and the
 * story moves on. Here the same handful of words carry the whole argument and
 * come back on every page — הֶבֶל, עָמָל, יִתְרוֹן, חֵלֶק, תַּחַת הַשֶּׁמֶשׁ.
 * A gloss that is merely adequate in Esther can misdirect a reader here, so the
 * inherited entries for the load-bearing words are RE-AUTHORED below rather
 * than accepted. הֶבֶל especially: it arrives from Jonah as "vanity, a vapour",
 * and "vanity" is a seventeenth-century word that now suggests conceit.
 *
 * WHERE THE VOCABULARY SITS. Chapter 2 is an inventory of works — vineyards,
 * pools, parks, herds — and chapter 12 is the allegory of old age, with the
 * almond tree, the grasshopper, the silver cord and the broken pitcher. Between
 * them they account for a large share of the 285.
 *
 * Usage:  node scripts/build-ecclesiastes-glossary.mjs
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
  // The argument — inherited words re-authored, because Qoheleth leans on them
  // =========================================================================
  ["H1892", "a breath, a vapour", ["a substance", "a burden", "a treasure"], {
    notes: "The word the book is built on — 38 times, and its first and last sentences. Literally the puff of air you can see on a cold morning: there and then not there, impossible to hold. 'Vanity' is Tyndale's rendering by way of Latin vanitas, and in modern English it suggests conceit, which is not the claim. Qoheleth is saying that everything is fleeting and cannot be gripped, not that everything is worthless.",
  }],
  ["H7307", "wind, breath, spirit", ["earth", "fire", "stone"], {
    notes: "Pairs with הֶבֶל throughout in the refrain רְעוּת רוּחַ — 'a chasing after wind'. The same word is the breath that returns to God in 12:7, so the book's image of futility and its image of the soul are one word.",
  }],
  ["H8121", "the sun", ["the moon", "a star", "the sky"], {
    notes: "תַּחַת הַשֶּׁמֶשׁ, 'under the sun', occurs 29 times and nowhere else in the Hebrew Bible. It marks the boundary of the book's enquiry: what can be observed from inside the world, without appeal to anything above it.",
  }],
  ["H5769", "long duration, forever", ["a moment", "yesterday", "an hour"], {
    notes: "3:11 puts הָעֹלָם in the human heart, and no one is sure what it means there — 'eternity', 'the world', 'a sense of past and future'. The gloss stays with the ordinary sense; the verse is famously beyond it.",
  }],
  ["H6256", "a time, an occasion", ["a place", "a reason", "a manner"], {
    notes: "The word of the poem in 3:1–8: a time for everything, twenty-eight of them in fourteen pairs. It means a right or appointed moment rather than duration.",
  }],
  ["H2896", "good", ["bad", "small", "new"], {
    root: "טוב",
    familyGloss: "good",
    notes: "Qoheleth's recurring verdict — אֵין טוֹב, 'there is nothing better than' to eat, drink and find good in one's toil. Read it as 'better' as often as 'good'.",
  }],
  ["H3820", "the heart", ["the soul", "the mind", "the eye"], {
    notes: "In Hebrew the seat of thought and will, not feeling. Qoheleth talks TO his own heart constantly — 'I said in my heart' is how nearly every experiment in the book begins.",
  }],
  ["H3045", "to know", ["to forget", "to doubt", "to guess"], {
    notes: "And its negative: מִי יוֹדֵעַ, 'who knows?' is the book's most characteristic question, and it is not rhetorical.",
  }],

  // =========================================================================
  // Qoheleth's own vocabulary
  // =========================================================================
  ["H6953", "Qoheleth, the Preacher", ["a prophet", "a king", "a scribe"], {
    notes: "A title, not a name: a feminine participle from the root 'to assemble', so roughly 'the one who convenes an assembly'. The Greek translators rendered it Ἐκκλησιαστής, from which 'Ecclesiastes'. Who he is meant to be — Solomon, or a persona — the book never quite says.",
  }],
  ["H2451", "wisdom", ["folly", "wealth", "strength"], {
    root: "חכמ",
    familyGloss: "wisdom, to be wise",
    notes: "28 times. Qoheleth pursues it further than anyone and then reports that it does not save you from the fate of the fool — which is the book's quarrel with the rest of the wisdom tradition.",
  }],
  ["H2449", "to be wise", ["to be foolish", "to be rich", "to be strong"], { root: "חכמ" }],
  ["H5999", "toil, wearying labour", ["rest", "play", "reward"], {
    root: "עמל",
    familyGloss: "toil",
    notes: "Not work in general but labour that costs something and may come to nothing. 22 times, and the question 'what profit has a man of all his עָמָל?' opens the book.",
  }],
  ["H6001", "a toiler; toiling", ["idle", "resting", "wealthy"], { root: "עמל" }],
  ["H3504", "profit, gain", ["a loss", "a debt", "a wage"], {
    notes: "A commercial word — what is left over after the accounting. Qoheleth applies it to a whole life and finds the ledger empty. Almost unique to this book.",
  }],
  ["H4195", "advantage, surplus", ["a shortfall", "a debt", "an equal share"], {}],
  ["H2506", "a portion, a share", ["the whole", "a debt", "a loss"], {
    notes: "What is actually allotted to you, as against the profit you cannot keep. Qoheleth's positive answer, such as it is: your portion is to eat, drink and find good in your work.",
  }],
  ["H6045", "a task, an occupation", ["leisure", "a reward", "a gift"], {
    notes: "Aramaic-flavoured and near-unique to this book: the 'business' God has given people to be busy with. 3:10 calls it an unhappy one.",
  }],
  ["H7469", "a chasing, a striving after", ["a resting", "a finding", "a keeping"], {
    notes: "Only ever in רְעוּת רוּחַ. The root suggests feeding on or pursuing, so 'chasing after wind' or, with equal warrant, 'feeding on wind'.",
  }],
  ["H7475", "a striving, a longing", ["contentment", "a possession", "an achievement"], {}],
  ["H3684", "a fool", ["a wise man", "a king", "a servant"], {
    notes: "18 times. Not a simpleton — the כְּסִיל is dull and self-satisfied, incapable of being taught. His fate and the wise man's are the same, which is what Qoheleth cannot get past.",
  }],
  ["H5530", "a fool, foolish", ["a sage", "a prophet", "a child"], { root: "סכל", familyGloss: "folly" }],
  ["H5529", "folly, a fool", ["wisdom", "learning", "skill"], { root: "סכל", familyGloss: "folly" }],
  ["H5531", "folly, silliness", ["wisdom", "prudence", "knowledge"], { root: "סכל", familyGloss: "folly" }],
  ["H1947", "madness", ["sanity", "wisdom", "calm"], { root: "הלל", familyGloss: "madness, boasting" }],
  ["H1948", "madness", ["prudence", "sobriety", "silence"], { root: "הלל" }],
  ["H1984", "to praise; to be mad", ["to blame", "to be silent", "to mourn"], { root: "הלל" }],
  ["H1847", "knowledge", ["ignorance", "a rumour", "a guess"], {}],
  ["H2656", "delight; a matter", ["a burden", "a duty", "a refusal"], {
    notes: "Both 'pleasure' and, in later Hebrew, simply 'a matter, a thing'. 3:1 uses the second: a season for every חֵפֶץ under heaven.",
  }],
  ["H3708", "vexation, provocation", ["delight", "calm", "relief"], { root: "כעס", familyGloss: "vexation" }],
  ["H3707", "to vex, to grieve", ["to please", "to calm", "to console"], { root: "כעס" }],
  ["H7814", "laughter", ["weeping", "silence", "anger"], { root: "שׂחק", familyGloss: "laughter" }],
  ["H7832", "to laugh", ["to weep", "to mourn", "to sigh"], { root: "שׂחק" }],
  ["H8446", "to explore, to search out", ["to ignore", "to conceal", "to abandon"], {}],
  ["H2713", "to search out, to examine", ["to overlook", "to invent", "to conceal"], {}],
  ["H2808", "a reckoning, a device", ["a guess", "an accident", "a refusal"], {}],
  ["H2810", "a scheme, a contrivance", ["a chance", "a plain fact", "an accident"], {}],
  ["H6592", "an interpretation", ["a riddle", "a rumour", "a translation"], {}],
  ["H4912", "a proverb, a saying", ["a song", "a law", "a story"], {}],

  // ---- the moral vocabulary ----
  ["H6662", "righteous, just", ["wicked", "foolish", "poor"], { root: "צדק", familyGloss: "righteous" }],
  ["H6664", "righteousness", ["wickedness", "folly", "poverty"], { root: "צדק" }],
  ["H7563", "wicked, guilty", ["righteous", "innocent", "wise"], { root: "רשׁע", familyGloss: "wicked" }],
  ["H7562", "wickedness", ["righteousness", "innocence", "mercy"], { root: "רשׁע" }],
  ["H7561", "to act wickedly", ["to act justly", "to repent", "to obey"], { root: "רשׁע" }],
  ["H2398", "to sin, to miss", ["to obey", "to succeed", "to repent"], { root: "חטא", familyGloss: "to sin" }],
  ["H2399", "a sin, an offence", ["a merit", "a gift", "a debt paid"], { root: "חטא" }],
  ["H4941", "judgement, justice", ["mercy", "a plea", "a witness"], {}],
  ["H3477", "upright, straight", ["crooked", "false", "broken"], { root: "ישׁר", familyGloss: "upright" }],
  ["H3476", "uprightness", ["crookedness", "deceit", "weakness"], { root: "ישׁר" }],
  ["H2889", "clean, pure", ["unclean", "profane", "broken"], {}],
  ["H2931", "unclean", ["clean", "holy", "whole"], {}],
  ["H6918", "holy, a holy place", ["common", "unclean", "ruined"], {}],
  ["H7455", "badness, evil", ["goodness", "beauty", "strength"], {}],

  // =========================================================================
  // Chapter 2 — the inventory of works
  // =========================================================================
  ["H5254", "to test, to try", ["to trust", "to refuse", "to abandon"], {}],
  ["H4900", "to draw, to prolong", ["to cut short", "to push", "to release"], {}],
  ["H5090", "to lead, to drive", ["to follow", "to halt", "to abandon"], {}],
  ["H5193", "to plant", ["to uproot", "to reap", "to burn"], {}],
  ["H3754", "a vineyard", ["an orchard", "a field", "a garden"], {}],
  ["H1593", "a garden", ["a field", "a forest", "a courtyard"], {}],
  ["H6508", "a park, an orchard", ["a desert", "a courtyard", "a field"], {
    notes: "A Persian loanword — the same word that comes into Greek as παράδεισος and into English as 'paradise'. Here it is simply a walled pleasure garden.",
  }],
  ["H6529", "fruit", ["a seed", "a root", "a leaf"], {}],
  ["H1295", "a pool, a reservoir", ["a well", "a river", "a cistern"], {}],
  ["H3293", "a forest, a wood", ["a desert", "a meadow", "a marsh"], {}],
  ["H6779", "to sprout, to grow", ["to wither", "to be cut", "to fall"], {}],
  ["H4735", "livestock, property", ["a debt", "a wage", "a tool"], {}],
  ["H5459", "treasure, a special possession", ["a debt", "a loan", "a common thing"], {}],
  ["H8588", "luxury, delight", ["hardship", "duty", "want"], {}],
  ["H7705", "a concubine; a lady", ["a queen", "a servant", "a stranger"], {
    notes: "2:8, and nobody is certain of it — the word occurs nowhere else. Guesses run from 'ladies' to 'musical instruments' to 'chests'. JPS 1917 has 'women very many'.",
  }],
  ["H680", "to withhold, to reserve", ["to give freely", "to spend", "to lose"], {}],
  ["H4513", "to withhold, to keep back", ["to grant", "to offer", "to spend"], {}],
  ["H2976", "to despair", ["to hope", "to persist", "to rejoice"], {}],
  ["H3788", "skill, success", ["failure", "luck", "idleness"], {}],
  ["H2363", "to hurry; to enjoy", ["to delay", "to refuse", "to mourn"], {}],
  ["H2351", "outside, a street", ["inside", "above", "beneath"], {}],
  ["H2090", "this, that", ["those", "which", "another"], {}],
  ["H3528", "already, long since", ["not yet", "never", "soon"], {
    notes: "Late Hebrew, and one of the linguistic marks that dates the book well after Solomon. Nine times here and nowhere else in the Bible.",
  }],

  // =========================================================================
  // Chapter 3 — a time for everything
  // =========================================================================
  ["H6131", "to uproot", ["to plant", "to water", "to prune"], {}],
  ["H7495", "to heal", ["to wound", "to kill", "to bind"], {}],
  ["H6555", "to break down, to break out", ["to build", "to repair", "to guard"], {}],
  ["H5594", "to mourn, to lament", ["to dance", "to laugh", "to sing"], {}],
  ["H7540", "to dance, to skip", ["to mourn", "to stand still", "to kneel"], {}],
  ["H68", "a stone", ["wood", "clay", "iron"], {}],
  ["H2263", "to embrace", ["to push away", "to strike", "to release"], {}],
  ["H7368", "to be far, to keep away", ["to draw near", "to embrace", "to arrive"], {}],
  ["H8609", "to sew", ["to tear", "to weave", "to wash"], {}],
  ["H2814", "to be silent, to hold one's peace", ["to shout", "to answer", "to sing"], {}],
  ["H160", "love", ["hatred", "fear", "envy"], {}],
  ["H8135", "hatred", ["love", "pity", "indifference"], {}],
  ["H4421", "war, a battle", ["peace", "a truce", "a feast"], {}],
  ["H5490", "an end", ["a beginning", "a middle", "a turn"], {}],
  ["H1097", "without", ["with", "through", "beside"], {}],
  ["H1639", "to take away, to diminish", ["to add", "to keep", "to double"], {}],
  ["H7291", "to pursue, to seek out", ["to flee", "to abandon", "to await"], {}],
  ["H1700", "a matter, a cause", ["a person", "a place", "a time"], {}],
  ["H1305", "to sift, to test", ["to mix", "to hide", "to accept"], {}],
  ["H6083", "dust", ["stone", "water", "gold"], {
    notes: "3:20 and 12:7 — all are from the dust and all return to it. The line quotes Genesis, and the book's argument turns on the reader hearing that.",
  }],
  ["H4605", "above, upward", ["below", "beside", "within"], {}],
  ["H4295", "below, downward", ["above", "beside", "outside"], {}],
  ["H6031", "to afflict, to be humbled", ["to exalt", "to comfort", "to release"], {
    noRoot: true,
    notes: "Spelled exactly like עָנָה 'to answer', which is a different root entirely. Neither is given a root family here: the consonants cannot tell them apart, and filing them together would teach that afflicting and answering are one word.",
  }],
  // The other half of that pair, inherited from Ruth and overridden only to
  // refuse the family it would otherwise join.
  ["H6030", "to answer", ["to ask", "to ignore", "to shout"], {
    noRoot: true,
    notes: "Spelled exactly like עָנָה 'to afflict', which is an unrelated root. Neither carries a root family here — see that entry.",
  }],
  ["H5791", "to make crooked, to bend", ["to straighten", "to build", "to measure"], {}],
  ["H8626", "to make straight", ["to bend", "to break", "to hide"], {}],
  ["H2642", "a lack, a deficiency", ["a surplus", "a fullness", "a gain"], { root: "חסר", familyGloss: "to lack" }],
  ["H2637", "to lack, to be without", ["to abound", "to fill", "to gain"], { root: "חסר", familyGloss: "to lack" }],
  ["H2638", "lacking, without", ["full", "abundant", "complete"], { root: "חסר", familyGloss: "to lack" }],
  ["H4341", "pain, sorrow", ["comfort", "pleasure", "rest"], {}],
  ["H216", "light", ["darkness", "shadow", "smoke"], { root: "אור", familyGloss: "light" }],
  ["H215", "to shine, to give light", ["to darken", "to fade", "to hide"], { root: "אור" }],
  ["H2822", "darkness", ["light", "dawn", "noon"], { root: "חשׁכ", familyGloss: "darkness" }],
  ["H2821", "to be dark, to grow dim", ["to brighten", "to clear", "to shine"], { root: "חשׁכ" }],
  ["H7911", "to forget", ["to remember", "to record", "to recall"], {}],
  ["H1320", "flesh, the body", ["the spirit", "a bone", "a garment"], {}],
  ["H5183", "quietness, rest", ["turmoil", "haste", "labour"], {}],

  // =========================================================================
  // Chapters 4–6 — oppression, company, wealth
  // =========================================================================
  ["H6217", "the oppressed", ["the oppressor", "the wealthy", "the free"], { root: "עשׁק", familyGloss: "oppression" }],
  ["H6231", "to oppress, to defraud", ["to release", "to defend", "to enrich"], { root: "עשׁק" }],
  ["H6233", "oppression, extortion", ["justice", "generosity", "release"], { root: "עשׁק" }],
  ["H1832", "a tear, weeping", ["laughter", "sweat", "a smile"], {}],
  ["H3581", "strength, power", ["weakness", "wealth", "wisdom"], {}],
  ["H7623", "to praise, to commend", ["to blame", "to mourn", "to accuse"], {}],
  ["H5728", "yet, still", ["never", "already", "afterwards"], {}],
  ["H7068", "jealousy, rivalry", ["contentment", "pity", "friendship"], {
    notes: "4:4 — all toil and skill come from a man's rivalry with his neighbour. The word covers both jealousy and the zeal that drives competition.",
  }],
  ["H2651", "a handful, a fist", ["an armful", "a basketful", "an empty hand"], {}],
  ["H4393", "a full measure, fullness", ["emptiness", "a half", "a lack"], {}],
  ["H2270", "a companion, a partner", ["a rival", "a stranger", "an enemy"], { root: "חבר", familyGloss: "to join, a companion" }],
  ["H2266", "to join, to be joined", ["to divide", "to flee", "to refuse"], { root: "חבר" }],
  ["H337", "woe! alas!", ["hurrah!", "behold!", "amen"], {}],
  ["H2552", "to be warm", ["to be cold", "to freeze", "to cool"], {}],
  ["H3179", "to be hot, to be in heat", ["to cool", "to shiver", "to rest"], {}],
  ["H8630", "to overpower, to prevail", ["to yield", "to weaken", "to flee"], { root: "תקפ", familyGloss: "to be strong" }],
  ["H8623", "strong, mighty", ["weak", "small", "gentle"], { root: "תקפ" }],
  ["H2339", "a cord, a thread", ["a rod", "a chain", "a net"], {}],
  ["H8027", "to be threefold", ["to be single", "to halve", "to double"], {}],
  ["H5423", "to snap, to break off", ["to tie", "to mend", "to weave"], {}],
  ["H4120", "quickly, speedily", ["slowly", "later", "never"], {}],
  ["H4542", "poor, indigent", ["wealthy", "noble", "wise"], {}],
  ["H2094", "to warn, to be admonished", ["to ignore", "to praise", "to conceal"], {}],
  ["H7326", "to be poor", ["to be rich", "to prosper", "to inherit"], {}],
  ["H631", "to bind, to imprison", ["to release", "to carry", "to hide"], {}],
  ["H309", "to delay, to be late", ["to hurry", "to arrive", "to begin"], {}],
  ["H2472", "a dream", ["a vision", "a sign", "waking"], {}],
  ["H7684", "an unintentional sin, an error", ["a deliberate crime", "a merit", "an oath"], {}],
  ["H4397", "a messenger, an angel", ["a master", "a stranger", "a priest"], {}],
  ["H2254", "to destroy; to pledge", ["to build", "to redeem", "to bless"], {}],
  ["H1499", "robbery, what is seized", ["a gift", "a wage", "a purchase"], {}],
  ["H8539", "to be astonished", ["to be unmoved", "to understand", "to expect"], {}],
  ["H1995", "abundance, a multitude", ["scarcity", "silence", "a few"], {}],
  ["H8393", "produce, income", ["a loss", "a seed", "a debt"], {}],
  ["H7212", "a looking, beholding", ["blindness", "a hearing", "a touch"], {}],
  ["H7207", "seeing, a sight", ["hearing", "blindness", "a dream"], {}],
  ["H7647", "plenty, satiety", ["famine", "hunger", "want"], {}],
  ["H3462", "to sleep", ["to wake", "to rise", "to watch"], {}],
  ["H4966", "sweet", ["bitter", "sour", "salty"], {}],
  ["H5647", "to work, to serve", ["to rest", "to rule", "to flee"], {}],
  ["H2470", "to be sick, to be weak", ["to be well", "to be strong", "to recover"], { root: "חלה", familyGloss: "sickness" }],
  ["H2483", "sickness, disease", ["health", "strength", "cure"], { root: "חלה" }],
  ["H5980", "alongside, corresponding to", ["against", "far from", "instead of"], {}],
  ["H5233", "riches, wealth", ["poverty", "debt", "a wage"], {}],
  ["H6174", "naked", ["clothed", "armed", "adorned"], {
    notes: "5:14 — as he came from his mother's womb, naked he shall return. Job says the same thing; Qoheleth says it as an accountant.",
  }],
  ["H183", "to desire, to long for", ["to refuse", "to despise", "to possess"], {}],
  ["H6900", "a burial, a grave", ["a birth", "a wedding", "a house"], {}],
  ["H5309", "a stillbirth", ["a firstborn", "an heir", "a twin"], {}],
  ["H6471", "a time, an occurrence", ["a place", "a person", "a reason"], {}],
  ["H6041", "poor, afflicted", ["wealthy", "proud", "comfortable"], {}],
  ["H1777", "to contend, to judge", ["to yield", "to flee", "to ignore"], {}],

  // =========================================================================
  // Chapters 7–9 — better sayings, the fate of all
  // =========================================================================
  ["H1606", "a rebuke", ["praise", "a song", "a blessing"], {}],
  ["H7892", "a song", ["a lament", "a speech", "silence"], { root: "שׁיר", familyGloss: "song, to sing" }],
  ["H7891", "to sing", ["to weep", "to shout", "to whisper"], { root: "שׁיר", familyGloss: "song, to sing" }],
  ["H5518", "a pot; a thorn", ["a lid", "a cup", "a plate"], {
    notes: "7:6 — 'as the crackling of thorns under a pot, so is the laughter of a fool'. The Hebrew puts סִיר 'thorns' next to סִיר 'pot': the joke is a pun and the sound is the point.",
  }],
  ["H7225", "the beginning, the first", ["the end", "the middle", "the least"], {}],
  ["H319", "the end, the outcome", ["the beginning", "the middle", "the cause"], {}],
  ["H1362", "proud, lofty", ["humble", "low", "gentle"], {}],
  ["H748", "to be long, to prolong", ["to shorten", "to begin", "to end"], {}],
  ["H8074", "to be appalled, to be desolate", ["to be comforted", "to flourish", "to be busy"], {}],
  ["H5810", "to be strong", ["to weaken", "to yield", "to fall"], {}],
  ["H7989", "a ruler, one in power", ["a subject", "a servant", "a stranger"], { root: "שׁלט", familyGloss: "power, to rule" }],
  ["H7983", "power, authority", ["weakness", "submission", "freedom"], { root: "שׁלט", familyGloss: "power, to rule" }],
  ["H4910", "to rule", ["to obey", "to serve", "to rebel"], {}],
  ["H3689", "confidence; folly", ["fear", "wisdom", "doubt"], {}],
  ["H4685", "a net, a snare", ["a shield", "a rope", "a gate"], {}],
  ["H2764", "a net; a thing devoted", ["a gift", "a shield", "a path"], {}],
  ["H612", "a bond, a fetter", ["a release", "a gift", "a road"], {}],
  ["H3920", "to capture, to catch", ["to release", "to flee", "to lose"], {}],
  ["H6013", "deep, unsearchable", ["shallow", "clear", "narrow"], {}],
  ["H7621", "an oath", ["a promise broken", "a rumour", "a request"], {}],
  ["H8132", "to change, to alter", ["to keep", "to repeat", "to fix"], {}],
  ["H5797", "strength, might", ["weakness", "beauty", "wealth"], {}],
  ["H3607", "to restrain, to shut up", ["to release", "to open", "to send"], {}],
  ["H4917", "a discharge, a sending away", ["a summons", "a capture", "an arrival"], {}],
  ["H952", "to examine, to search", ["to ignore", "to conceal", "to accept"], {}],
  ["H5652", "a deed, a work", ["a word", "a thought", "a plan"], {}],
  ["H7650", "to swear an oath", ["to deny", "to refuse", "to whisper"], {}],
  ["H977", "to choose", ["to reject", "to ignore", "to lose"], {}],
  ["H986", "confidence, hope", ["despair", "fear", "doubt"], {}],
  ["H3611", "a dog", ["a lion", "a sheep", "a wolf"], {
    notes: "9:4 — 'a living dog is better than a dead lion'. In this culture the dog is a scavenger and no compliment, which is exactly why the line lands.",
  }],
  ["H738", "a lion", ["a dog", "a bear", "an ox"], {}],
  ["H3836", "white", ["black", "red", "grey"], {}],
  ["H6833", "a bird", ["a fish", "an insect", "a beast"], {}],
  ["H7031", "swift, light", ["slow", "heavy", "strong"], {}],
  ["H4793", "a race, a running", ["a rest", "a walk", "a fall"], {}],
  ["H995", "to understand, to discern", ["to confuse", "to forget", "to guess"], {}],
  ["H6294", "chance, an occurrence", ["a plan", "a certainty", "a decree"], {
    notes: "9:11 — 'time and chance happen to them all'. פֶּגַע is a collision, something that simply meets you. Paired with עֵת, it is as close as Hebrew comes to saying 'luck'.",
  }],
  ["H6341", "a snare, a trap", ["a shelter", "a gift", "a road"], {}],
  ["H3369", "to be ensnared", ["to be freed", "to escape", "to hunt"], {}],
  ["H6597", "suddenly", ["gradually", "later", "never"], {}],
  ["H7128", "battle, war", ["peace", "a feast", "a truce"], {}],
  ["H5158", "a wadi, a stream", ["a sea", "a well", "a road"], {}],
  ["H1864", "the south", ["the north", "the east", "the west"], {}],
  ["H6828", "the north", ["the south", "the east", "the west"], {}],
  ["H5439", "around, round about", ["through", "beneath", "away from"], {}],
  ["H7602", "to pant, to gasp after", ["to rest", "to exhale", "to refuse"], {}],
  ["H2319", "new", ["old", "broken", "borrowed"], {}],
  ["H6437", "to turn, to face", ["to stand still", "to depart", "to hide"], {}],
  ["H176", "or", ["and", "but", "nor"], {}],
  ["H1933", "to be, to become", ["to cease", "to seem", "to vanish"], {}],
  ["H4991", "a gift", ["a debt", "a wage", "a loan"], {}],
  ["H3023", "weary, wearisome", ["fresh", "eager", "restful"], { root: "יגע", familyGloss: "weariness" }],
  ["H3021", "to labour, to grow weary", ["to rest", "to play", "to hurry"], { root: "יגע" }],
  ["H3024", "weariness", ["freshness", "rest", "strength"], { root: "יגע" }],

  // =========================================================================
  // Chapters 10–11 — proverbs, risk, youth
  // =========================================================================
  ["H2070", "a fly", ["a bee", "a locust", "a moth"], {}],
  ["H887", "to stink, to become foul", ["to sweeten", "to freshen", "to preserve"], {}],
  ["H5042", "to bubble up, to ferment", ["to settle", "to dry", "to freeze"], {}],
  ["H7543", "to compound perfume", ["to spoil", "to sour", "to burn"], {}],
  ["H3368", "precious, costly", ["cheap", "common", "spoiled"], {}],
  ["H4832", "healing, a remedy", ["a wound", "a poison", "a disease"], {}],
  ["H4791", "a high place, height", ["a low place", "a valley", "a plain"], {}],
  ["H8216", "a low place, low rank", ["a height", "a throne", "honour"], { root: "שׁפל", familyGloss: "low, lowly" }],
  ["H8217", "low, lowly", ["high", "proud", "great"], { root: "שׁפל" }],
  ["H8220", "sinking, lowness", ["rising", "height", "strength"], { root: "שׁפל" }],
  ["H2658", "to dig", ["to fill", "to build", "to cover"], {}],
  ["H1475", "a pit", ["a hill", "a wall", "a well of water"], {}],
  ["H1447", "a wall, a fence", ["a gate", "a roof", "a floor"], {}],
  ["H5175", "a serpent", ["a lion", "a bird", "a fish"], {}],
  ["H5391", "to bite", ["to soothe", "to swallow", "to flee"], {}],
  ["H5265", "to pull up, to set out", ["to settle", "to remain", "to build"], {}],
  ["H6087", "to hurt, to grieve", ["to heal", "to please", "to ignore"], {}],
  ["H1234", "to split, to cleave", ["to join", "to mend", "to smooth"], {}],
  ["H5533", "to be endangered", ["to be safe", "to profit", "to rest"], {}],
  ["H6949", "to be blunt, to be dull", ["to be sharp", "to shine", "to break"], {}],
  ["H1270", "iron", ["gold", "wood", "clay"], {}],
  ["H1396", "to prevail, to be strong", ["to yield", "to fail", "to flee"], {}],
  ["H3908", "a charm, a whisper", ["a shout", "a song", "a curse"], {}],
  ["H8193", "a lip; language", ["an ear", "a hand", "an eye"], {}],
  ["H835", "happy, blessed", ["wretched", "cursed", "poor"], {}],
  ["H2715", "a noble, a freeman", ["a slave", "a beggar", "a stranger"], {}],
  ["H8358", "drinking", ["fasting", "eating", "sleeping"], {}],
  ["H6103", "sloth, idleness", ["diligence", "haste", "strength"], {}],
  ["H4355", "to sink, to decay", ["to rise", "to stand", "to be repaired"], {}],
  ["H4746", "a beam, a roof frame", ["a floor", "a wall", "a door"], {}],
  ["H1811", "to drip, to leak", ["to dry", "to seal", "to flood"], {}],
  ["H4093", "a thought, knowledge", ["a deed", "a word", "ignorance"], {}],
  ["H2315", "an inner room, a chamber", ["a courtyard", "a roof", "a street"], {}],
  ["H4904", "a bed, a couch", ["a table", "a chair", "a chest"], {}],
  ["H5775", "a bird, flying creatures", ["a fish", "a beast", "a reptile"], {
    notes: "10:20 — 'a bird of the air shall carry the voice'. The oldest surviving form of 'a little bird told me'.",
  }],
  ["H8083", "eight", ["seven", "nine", "ten"], {}],
  ["H5645", "a cloud", ["the sun", "the wind", "a mist"], {}],
  ["H1653", "rain, a shower", ["drought", "hail", "snow"], {}],
  ["H7324", "to empty out, to pour", ["to fill", "to seal", "to store"], {}],
  ["H2232", "to sow", ["to reap", "to plough", "to thresh"], {}],
  ["H6106", "a bone; the substance of", ["flesh", "skin", "a shadow"], {}],
  ["H3208", "youth, childhood", ["old age", "manhood", "infancy"], {}],
  ["H979", "youth, the prime of life", ["old age", "childhood", "decline"], {}],
  ["H7839", "the dawn of life, youth", ["dusk", "old age", "midday"], {}],

  // =========================================================================
  // Chapter 12 — the allegory of old age
  //
  // Every noun here is a figure for something in a failing body, and the book
  // never says for what. The glosses give the LITERAL object and leave the
  // reading to the reader, which is what the Hebrew does.
  // =========================================================================
  ["H1254", "to create", ["to destroy", "to find", "to inherit"], {}],
  ["H3394", "the moon", ["the sun", "a star", "a cloud"], {}],
  ["H3556", "a star", ["the moon", "the sun", "a cloud"], {}],
  ["H988", "to cease, to stop working", ["to begin", "to hurry", "to continue"], {}],
  ["H2912", "to grind", ["to sow", "to bake", "to sift"], { root: "טחנ", familyGloss: "grinding" }],
  ["H2913", "a mill, grinding", ["an oven", "a granary", "a press"], { root: "טחנ" }],
  ["H4591", "to be few, to diminish", ["to increase", "to remain", "to double"], {}],
  ["H699", "a window, a lattice", ["a door", "a wall", "a roof"], {}],
  ["H5462", "to shut, to close", ["to open", "to break", "to guard"], {}],
  ["H1817", "a door", ["a window", "a wall", "a roof"], {}],
  ["H7784", "a street", ["a house", "a field", "a gate"], {}],
  ["H7817", "to bow down, to be brought low", ["to rise", "to stand firm", "to grow"], {}],
  ["H2849", "terrors", ["comforts", "delights", "hopes"], {}],
  ["H5006", "to reject, to spurn", ["to accept", "to honour", "to desire"], {}],
  ["H8247", "the almond tree", ["the fig tree", "the olive", "the vine"], {
    notes: "12:5 — 'the almond tree blossoms'. Its blossom is white, and it flowers before any other tree, which is why it stands here for a head going grey early.",
  }],
  ["H5445", "to bear, to carry a load", ["to drop", "to lighten", "to refuse"], {}],
  ["H2284", "a locust, a grasshopper", ["a bee", "a fly", "a moth"], {}],
  ["H6565", "to break, to frustrate", ["to keep", "to mend", "to fulfil"], {}],
  ["H35", "the caper berry", ["the fig", "the olive", "the date"], {
    notes: "Eaten as an appetite stimulant, which is the point: even that fails. The whole clause is uncertain, and translators split between 'the caper berry fails' and 'desire fails'.",
  }],
  ["H7576", "to be snapped, to be bound", ["to be woven", "to be tied", "to be freed"], {}],
  ["H1543", "a bowl", ["a cup", "a jar", "a plate"], {}],
  ["H3537", "a jar, a pitcher", ["a bowl", "a cup", "a basket"], {}],
  ["H7533", "to be shattered, to be crushed", ["to be mended", "to be filled", "to be sealed"], {}],
  ["H4002", "a spring, a fountain", ["a desert", "a cistern", "a river"], {}],
  ["H1534", "a wheel", ["a rope", "a beam", "an axle"], {}],
  ["H953", "a cistern, a pit", ["a spring", "a river", "a hill"], {}],
  ["H3925", "to teach", ["to learn nothing", "to forget", "to conceal"], {}],
  ["H239", "to weigh, to ponder", ["to guess", "to discard", "to shout"], {}],
  ["H1861", "a goad", ["a staff", "a whip", "a plough"], {}],
  ["H4930", "a nail, a peg", ["a rope", "a hammer", "a board"], {}],
  ["H627", "a collection, an assembly", ["a scattering", "a single man", "a silence"], {}],
  ["H3854", "study, wearying talk", ["silence", "rest", "play"], {}],
  ["H5956", "to hide, to conceal", ["to reveal", "to announce", "to find"], {}],

  // Family heads inherited from earlier books, re-stated only to author a
  // coreGloss, so no family in this track ships with one inferred from
  // whichever member happened to be commonest.
  ["H7980", "to have power over", ["to submit to", "to plead with", "to flee from"], { root: "שׁלט", familyGloss: "power, to rule" }],
  ["H4191", "to die", ["to live", "to sleep", "to rise"], { root: "מות", familyGloss: "death, to die" }],
  ["H4194", "death", ["life", "birth", "sleep"], { root: "מות", familyGloss: "death, to die" }],
  ["H4745", "a chance, a happening", ["a plan", "a decree", "a certainty"], { root: "קרה", familyGloss: "chance, to happen" }],
  ["H7136", "to happen, to chance upon", ["to plan", "to prevent", "to expect"], { root: "קרה", familyGloss: "chance, to happen" }],

  // =========================================================================
  // Odds and ends
  // =========================================================================
  ["H5980", "alongside, corresponding to", ["against", "far from", "instead of"], { skip: true }],
];

// ---------------------------------------------------------------------------

/** Jonah's, Ruth's and Esther's entries, inherited wholesale; later wins. */
function inherited() {
  const merged = new Map();
  for (const file of ["jonah-glossary.json", "ruth-glossary.json", "esther-glossary.json"]) {
    const { words = [] } = JSON.parse(readFileSync(resolve(HERE, file), "utf8"));
    for (const w of words) merged.set(String(w.lemma), { ...w });
  }
  return merged;
}

/**
 * Notes anchored in another book's story, dropped rather than re-pointed — the
 * rule Esther established. A note about Boaz or Haman shown while reading
 * Qoheleth reads as a bug. The words that matter here are re-authored above.
 */
const FOREIGN_NOTE =
  /Ruth|Jonah|Naomi|Boaz|Nineveh|Moab|Bethlehem|Orpah|Esther|Mordecai|Haman|Vashti|Susa|Shushan|Persia|the fish|the storm/i;

const seen = new Map();
const authored = ENTRIES.filter(([, , , x = {}]) => !x.skip).map(
  ([lemma, gloss, distractors, extras = {}]) => {
    if (seen.has(lemma)) throw new Error(`duplicate lemma ${lemma}: "${seen.get(lemma)}" and "${gloss}"`);
    seen.set(lemma, gloss);
    if (distractors.length !== 3) throw new Error(`${lemma} has ${distractors.length} distractors, want 3`);
    if (distractors.includes(gloss)) throw new Error(`${lemma} lists its own gloss as a distractor`);
    if (new Set(distractors).size !== 3) throw new Error(`${lemma} has a repeated distractor`);
    const { skip, ...rest } = extras;
    return { lemma, gloss, distractors, ...rest };
  },
);

const words = [];
let reused = 0;
let stripped = 0;
for (const [lemma, w] of inherited()) {
  if (seen.has(lemma)) continue; // this book's own entry wins
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
    "Hand-written glosses, distractors, roots and teaching notes for Ecclesiastes. " +
    "Generated by build-ecclesiastes-glossary.mjs — edit that, not this. Entries " +
    "shared with Jonah, Ruth and Esther are inherited at build time, except for the " +
    "words Qoheleth's argument leans on, which are re-authored here because a gloss " +
    "adequate in a narrative can misdirect a reader in wisdom poetry. Glosses are " +
    "short TEACHING meanings, not lexicon entries. Roots are supplied only where the " +
    "pairing is visible in Ecclesiastes itself; Strong's derivation chains are " +
    "refused. A Hebraist should read all of it.",
  words,
};

const path = resolve(HERE, "ecclesiastes-glossary.json");
writeFileSync(path, `${JSON.stringify(out, null, 1)}\n`);
console.log(`wrote ${path}`);
console.log(`  ${words.length} entries — ${authored.length} written for Ecclesiastes, ${reused} inherited`);
console.log(`  ${words.filter((w) => w.root).length} hand-supplied roots · ${words.filter((w) => w.notes).length} teaching notes`);
console.log(`  ${stripped} inherited notes dropped as anchored in another book`);
