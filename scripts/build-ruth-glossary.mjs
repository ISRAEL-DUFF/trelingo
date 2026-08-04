#!/usr/bin/env node
/**
 * The human contribution to the Ruth course.
 *
 * Everything the importer derives — text, parses, attestations, primitive-root
 * highlights — comes from OSHB and Strong's. Everything a learner READS is
 * here, and it is hand-written:
 *
 *   gloss        a short teaching meaning for a beginner reading Ruth. NOT a
 *                lexicon entry. Strong's own glosses are 19th-century
 *                paraphrase ("to be the next of kin", "a breathing creature")
 *                and several are actively misleading out of context.
 *   distractors  three plausible wrong answers. Auto-filled distractors are the
 *                weakest content a course can ship: the importer's fallback
 *                offers "to bale up water" against "to say", which teaches a
 *                learner to pick the sensible-looking option rather than the
 *                right one.
 *   root         ONLY where the safe primitive-root rule cannot reach it and
 *                the pairing is visible IN RUTH ITSELF. Strong's "from HXXXX"
 *                chains stay refused — see import-oshb.mjs and
 *                jonah-spike-findings.md §3.
 *   familyGloss  authored rather than inferred from the commonest member.
 *                Jonah left 34 of 97 families with an inferred coreGloss marked
 *                UNREVIEWED; this course does not repeat that.
 *
 * WHY RUTH. Vocabulary compounds inside a book far harder than between books
 * (coverage-findings.md §4a), and finishing Jonah leaves a reader at 52% of
 * Ruth — a real step up rather than a restart. Ruth is also 85 verses of
 * narrative prose with an unusually high proportion of dialogue, which is the
 * easiest continuous Hebrew there is.
 *
 * Usage:  node scripts/build-ruth-glossary.mjs
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * [strongs, gloss, [three distractors], extras?]
 *
 * Distractors are chosen from the same semantic neighbourhood as the answer
 * without being synonyms of it, and never from the answer's own family — a
 * learner must decide on meaning, not eliminate on shape.
 */
const ENTRIES = [
  // ---- the spine of the narrative ----
  ["H559", "to say", ["to ask", "to shout", "to whisper"], { root: "אמר", familyGloss: "to say" }],
  ["H7725", "to return, to turn back", ["to remain", "to hurry", "to wander"], {
    root: "שוב",
    familyGloss: "to return, to turn back",
    notes: "The verb the book is built on — twelve occurrences. Naomi returns, Orpah returns, and Ruth refuses to. In 1:22 the narrator calls Ruth 'the Moabitess who RETURNED' from a country she had never left.",
  }],
  ["H1350", "to redeem, to act as kinsman", ["to inherit", "to bargain", "to release"], {
    root: "גאל",
    familyGloss: "to redeem as next of kin",
    notes: "Not redemption in the abstract. A גֹּאֵל is the nearest relative, obliged to buy back family land and to preserve a dead man's name. Boaz is called this twenty-one times in four chapters.",
  }],
  ["H1353", "the right of redemption", ["a dowry", "a debt", "an oath"], { root: "גאל" }],
  ["H1961", "to be, to happen", ["to seem", "to remain", "to appear"], { root: "היה", familyGloss: "to be, to happen" }],
  ["H935", "to come, to go in", ["to send", "to stay", "to climb"], { root: "בוא", familyGloss: "to come, to go in" }],
  ["H3212", "to go, to walk", ["to run", "to stand", "to follow"], {
    notes: "The same verb as הָלַךְ, which Strong's lists separately. No root is marked: this form has lost the initial ה entirely, so there are no radicals in it to highlight. The importer declines it for exactly that reason.",
  }],
  ["H1980", "to walk, to go", ["to carry", "to wait", "to lead"], {
    root: "הלכ",
    familyGloss: "to walk, to go",
    notes: "Strong's keeps הָלַךְ and יָלַךְ as separate entries; they are one verb whose imperfect and imperative behave as if from another stem. Only this form shows all three radicals, so only this one carries the highlight.",
  }],
  ["H4191", "to die", ["to sleep", "to flee", "to be ill"], { root: "מות", familyGloss: "death, to die" }],
  ["H4194", "death", ["a grave", "mourning", "sickness"], { root: "מות" }],
  ["H3205", "to give birth, to bear", ["to nurse", "to raise", "to marry"], { root: "ילד", familyGloss: "to bear, to be born" }],
  ["H3206", "a child, a boy", ["a servant", "an heir", "a nephew"], { root: "ילד" }],

  // ---- people and place names ----
  ["H5281", "Naomi", ["Rachel", "Miriam", "Hannah"], { notes: "The name means 'pleasant'. In 1:20 she asks to be called מָרָא, 'bitter', instead." }],
  ["H1162", "Boaz", ["Barak", "Baruch", "Benaiah"], {}],
  ["H7327", "Ruth", ["Rachel", "Rebekah", "Rahab"], {}],
  ["H4755", "Mara (bitter)", ["Marah", "Mizpah", "Milcah"], {
    root: "מרר",
    notes: "Naomi's renaming of herself in 1:20, and the text supplies the etymology in the same breath: 'for the Almighty has dealt very BITTERLY with me'. The root is marked here because Ruth itself makes the connection, not because a lexicon proposes one.",
  }],
  ["H458", "Elimelech", ["Abimelech", "Ahimelech", "Elkanah"], {}],
  ["H4248", "Mahlon", ["Nahshon", "Mishael", "Machir"], {}],
  ["H3630", "Chilion", ["Calcol", "Kenan", "Chelub"], {}],
  ["H6204", "Orpah", ["Oholah", "Orpheus", "Ophrah"], {}],
  ["H1035", "Bethlehem", ["Bethel", "Beersheba", "Bethany"], {
    notes: "The name is 'house of bread', and the book opens with a famine there. The pun is the narrator's, though the text never spells it out.",
  }],
  ["H4124", "Moab", ["Edom", "Ammon", "Midian"], {}],
  ["H4125", "Moabite (woman)", ["Egyptian", "Canaanite", "Philistine"], {
    notes: "Applied to Ruth seven times, long after the reader knows it. Deuteronomy 23:4 bars a Moabite from the assembly of the LORD; the book keeps saying it anyway.",
  }],
  ["H3063", "Judah", ["Benjamin", "Ephraim", "Manasseh"], {}],
  ["H3478", "Israel", ["Jacob", "Judah", "Zion"], {}],
  ["H672", "Ephrath", ["Ephraim", "Eshtaol", "Etam"], {}],
  ["H673", "Ephrathite", ["Ephraimite", "Edomite", "Egyptian"], {}],
  ["H6557", "Perez", ["Zerah", "Peleg", "Pallu"], {}],
  ["H5744", "Obed", ["Oded", "Omri", "Ohel"], {}],
  ["H3448", "Jesse", ["Joash", "Jether", "Jehu"], {}],
  ["H1732", "David", ["Saul", "Solomon", "Samuel"], {}],
  ["H2696", "Hezron", ["Hebron", "Heshbon", "Hazor"], {}],
  ["H7410", "Ram", ["Rimmon", "Reu", "Rehob"], {}],
  ["H5992", "Amminadab", ["Abinadab", "Aminadar", "Ammiel"], {}],
  ["H5177", "Nahshon", ["Nahor", "Nahash", "Naaman"], {}],
  ["H8009", "Salmah", ["Salma", "Shelah", "Shallum"], {}],
  ["H8012", "Salmon", ["Shillem", "Shelomi", "Simeon"], {}],
  ["H7354", "Rachel", ["Rebekah", "Rahab", "Rizpah"], {}],
  ["H3812", "Leah", ["Lot", "Levi", "Lois"], {}],
  ["H8559", "Tamar", ["Tirzah", "Timnah", "Tabitha"], {}],
  ["H3068", "the LORD (YHWH)", ["God", "the Almighty", "the king"], {
    notes: "The divine name, pointed with the vowels of אֲדֹנָי 'Lord', which is what is read aloud. JPS renders it 'the LORD' in small capitals.",
  }],
  ["H430", "God, gods", ["the LORD", "an angel", "a priest"], {}],
  ["H7706", "the Almighty (Shaddai)", ["the Most High", "the Holy One", "the Lord of hosts"], {
    notes: "Naomi's word for God in 1:20–21, both times in complaint. It is the name Job uses more than any other book.",
  }],

  // ---- kinship ----
  ["H376", "a man", ["a youth", "a servant", "a stranger"], { root: "אישׁ", familyGloss: "man, woman" }],
  ["H802", "a woman, a wife", ["a widow", "a maid", "a mother"], { root: "אשׁה" }],
  ["H1121", "a son", ["a brother", "a nephew", "an heir"], {}],
  ["H1323", "a daughter", ["a sister", "a bride", "a maid"], {}],
  ["H2545", "mother-in-law", ["stepmother", "grandmother", "aunt"], {}],
  ["H3618", "daughter-in-law, bride", ["stepdaughter", "niece", "handmaid"], {}],
  ["H2994", "sister-in-law", ["cousin", "stepsister", "widow"], {}],
  ["H1", "a father", ["an uncle", "an elder", "a lord"], {}],
  ["H517", "a mother", ["a nurse", "a widow", "a sister"], {}],
  ["H251", "a brother", ["a cousin", "a friend", "a son"], {}],
  ["H4940", "a clan, a family", ["a tribe", "a household", "a village"], {}],
  ["H4138", "kindred, birthplace", ["homeland", "inheritance", "dwelling"], {}],
  ["H4129", "a kinsman", ["a neighbour", "a stranger", "an elder"], {
    notes: "Transparently built on יָדַע 'to know' — a kinsman is one who is known — but the initial י has become ו, so no radicals are left to mark and the root is not asserted.",
  }],
  ["H4130", "a kinswoman", ["a midwife", "a neighbour", "a handmaid"], {}],
  ["H5288", "a young man, a servant", ["an elder", "a soldier", "a shepherd"], { root: "נער", familyGloss: "young man, young woman" }],
  ["H5291", "a young woman, a maid", ["a widow", "a queen", "a sister"], { root: "נער", familyGloss: "young man, young woman" }],
  ["H519", "a maidservant", ["a queen", "a daughter", "a nurse"], {}],
  ["H8198", "a maidservant, a handmaid", ["a mistress", "a stranger", "a bride"], {
    notes: "Ruth calls herself שִׁפְחָה in 2:13 and אָמָה in 3:9. The second is the higher status — a maid who may be married into the household — and the shift is the point of the scene.",
  }],
  ["H7453", "a companion, a friend", ["an enemy", "a servant", "a rival"], {}],
  ["H7138", "near, a close relative", ["distant", "absent", "unrelated"], {
    notes: "Both occurrences are about kinship rather than distance: Boaz is 'near to us' in 2:20 and 'a nearer redeemer than I' in 3:12. Nearness in Ruth is a legal status.",
  }],
  ["H7934", "a neighbour", ["a kinsman", "a guest", "a foreigner"], {}],
  ["H113", "a lord, a master", ["a servant", "a prince", "a judge"], {}],

  // ---- the fields ----
  ["H7704", "a field", ["a garden", "a vineyard", "a pasture"], {}],
  ["H3950", "to glean", ["to sow", "to plough", "to thresh"], {
    root: "לקט",
    familyGloss: "to glean",
    notes: "Gathering what the reapers leave. Leviticus 19:9 commands that the corners and the droppings be left for the poor and the stranger; Ruth 2 is that law happening.",
  }],
  ["H7114", "to reap, to harvest", ["to sow", "to glean", "to grind"], { root: "קצר", familyGloss: "to reap, harvest" }],
  ["H7105", "harvest", ["seedtime", "vintage", "famine"], { root: "קצר" }],
  ["H8184", "barley", ["wheat", "millet", "flax"], {}],
  ["H2406", "wheat", ["barley", "rye", "olives"], {}],
  ["H6016", "a sheaf", ["a furrow", "a basket", "a scythe"], {}],
  ["H7641", "an ear of grain", ["a stalk", "a root", "a husk"], {}],
  ["H6653", "a bundle, a handful", ["a basket", "a sack", "a measure"], {}],
  ["H6194", "a heap", ["a pit", "a barn", "a field"], {}],
  ["H1637", "a threshing-floor", ["a winepress", "a granary", "a courtyard"], {}],
  ["H2251", "to beat out (grain)", ["to grind", "to sift", "to plant"], {}],
  ["H2219", "to winnow", ["to sow", "to reap", "to gather"], {}],
  ["H7997", "to pull out, to let fall", ["to tie up", "to pick up", "to hide"], {}],
  ["H374", "an ephah (a measure)", ["a shekel", "a cubit", "a homer"], {}],
  ["H4058", "to measure", ["to weigh", "to count", "to divide"], {}],
  ["H2513", "a portion of a field", ["a boundary", "a hill", "a well"], {}],
  ["H5159", "an inheritance", ["a dowry", "a tribute", "a wage"], {}],
  ["H4909", "wages, reward", ["a debt", "a gift", "a ransom"], {}],
  ["H6467", "work, a deed", ["a wage", "a plan", "a burden"], {}],

  // ---- food and drink ----
  ["H398", "to eat", ["to drink", "to serve", "to hunger"], { root: "אכל", familyGloss: "to eat, food" }],
  ["H400", "food", ["drink", "a feast", "a portion"], { root: "אכל" }],
  ["H3899", "bread, food", ["wine", "meat", "salt"], {}],
  ["H8354", "to drink", ["to eat", "to pour", "to thirst"], {}],
  ["H2558", "vinegar", ["oil", "honey", "wine"], {}],
  ["H6595", "a morsel, a piece", ["a loaf", "a bowl", "a crumb"], {}],
  ["H7039", "parched grain", ["baked bread", "dried figs", "fresh milk"], {}],
  ["H7646", "to be satisfied, to eat one's fill", ["to hunger", "to waste", "to share"], { root: "שׂבע", familyGloss: "to be satisfied" }],
  ["H7648", "plenty, satisfaction", ["hunger", "thirst", "want"], { root: "שׂבע" }],
  ["H7458", "famine", ["plague", "drought", "war"], {
    notes: "The famine in 1:1 is what drives the family to Moab, and its ending in 1:6 is what brings Naomi home.",
  }],
  ["H6770", "to be thirsty", ["to be hungry", "to be weary", "to be cold"], {}],
  ["H7579", "to draw (water)", ["to pour out", "to carry", "to boil"], {}],
  ["H3627", "a vessel, a jar", ["a rope", "a basket", "a tool"], {}],

  // ---- the threshing-floor scene ----
  ["H7901", "to lie down", ["to sit", "to kneel", "to rise"], { root: "שׁכב", familyGloss: "to lie down" }],
  ["H4772", "the place of the feet", ["the head of the bed", "the doorway", "the corner"], {
    notes: "A rare word, used four times, all in Ruth 3. The scene is told with great care and no explicit statement of what happens.",
  }],
  ["H3671", "a wing, a skirt", ["a hem", "a shadow", "a robe"], {
    notes: "Boaz blesses Ruth in 2:12 for coming to take refuge under the LORD's כְּנָפַיִם, 'wings'. In 3:9 she asks him to spread his כָּנָף over her — the same word, now the corner of his garment. She is asking him to be the answer to his own prayer.",
  }],
  ["H2620", "to take refuge", ["to hide", "to flee", "to trust"], {
    notes: "Distinct from חֶסֶד despite the resemblance — חסה and חסד are different roots, and only one of them means kindness.",
  }],
  ["H3909", "secrecy, softly", ["haste", "silence", "darkness"], {}],
  ["H3943", "to turn, to twist round", ["to wake", "to reach out", "to shiver"], {}],
  ["H2729", "to tremble, to startle", ["to sleep", "to shout", "to stumble"], {}],
  ["H2677", "the middle, half", ["the end", "the beginning", "the edge"], {}],
  ["H7364", "to wash", ["to anoint", "to dress", "to comb"], {}],
  ["H5480", "to anoint oneself", ["to wash", "to fast", "to veil"], {}],
  ["H8071", "a garment, a cloak", ["a sandal", "a veil", "a belt"], {}],
  ["H4304", "a shawl, a cloak", ["a sack", "an apron", "a girdle"], {}],
  ["H2436", "the bosom, the lap", ["the shoulder", "the arm", "the back"], {}],
  ["H6642", "to reach out, to hand", ["to withhold", "to snatch", "to point"], {}],
  ["H3885", "to lodge, to spend the night", ["to travel", "to wake", "to depart"], {}],
  ["H1242", "morning", ["evening", "noon", "midnight"], {}],
  ["H6153", "evening", ["morning", "noon", "dawn"], {}],
  ["H3915", "night", ["day", "dawn", "dusk"], {}],
  ["H2881", "to dip", ["to pour", "to sprinkle", "to wring"], {}],

  // ---- the gate and the legal scene ----
  ["H8179", "a gate", ["a wall", "a tower", "a road"], {
    notes: "The gate is where a town's legal business is done. Boaz goes up to it in 4:1 and the case is settled in public within ten verses.",
  }],
  ["H2205", "old, an elder", ["young", "wise", "noble"], { root: "זקנ", familyGloss: "old, to grow old" }],
  ["H2204", "to be old", ["to be young", "to be weak", "to be wise"], { root: "זקנ" }],
  ["H5707", "a witness", ["a judge", "a scribe", "an accuser"], {}],
  ["H7069", "to acquire, to buy", ["to sell", "to borrow", "to give"], { root: "קנה", familyGloss: "to acquire, to buy" }],
  ["H4376", "to sell", ["to buy", "to lend", "to pledge"], {}],
  ["H8545", "an exchange", ["a payment", "a pledge", "a gift"], {}],
  ["H8584", "attestation, confirmation", ["a dispute", "a summons", "a rumour"], {}],
  ["H5275", "a sandal", ["a belt", "a staff", "a ring"], {
    notes: "Drawing off a sandal seals the transfer in 4:7, and the narrator explains the custom as already old — a note written for readers who no longer did it.",
  }],
  ["H8025", "to draw off, to pull out", ["to fasten", "to tie", "to carry"], {}],
  ["H6423", "such a one, so-and-so", ["a certain man", "a neighbour", "a stranger"], {}],
  ["H492", "so-and-so, unnamed", ["nameless", "unknown", "hidden"], {
    notes: "The nearer redeemer is never named. פְּלֹנִי אַלְמֹנִי is the Hebrew for 'John Doe', and the man who refused to preserve a name does not get one.",
  }],
  ["H3772", "to cut off", ["to join", "to bind", "to raise"], {}],
  ["H8199", "to judge", ["to rule", "to accuse", "to punish"], {
    notes: "Ruth 1:1 dates the story 'in the days when the judges judged' — the period of the book of Judges, which ends in chaos. Ruth is what else was happening.",
  }],

  // ---- speech and thought ----
  ["H1696", "to speak", ["to hear", "to cry", "to answer"], { root: "דבר", familyGloss: "word, to speak" }],
  ["H1697", "a word, a matter", ["a song", "a name", "a sign"], { root: "דבר" }],
  ["H7121", "to call, to name", ["to send", "to answer", "to command"], { root: "קרא", familyGloss: "to call, to name" }],
  ["H6030", "to answer", ["to ask", "to refuse", "to obey"], {}],
  ["H8085", "to hear, to listen", ["to see", "to speak", "to obey"], {}],
  ["H6963", "a voice, a sound", ["a word", "a song", "a cry"], {}],
  ["H5046", "to tell, to declare", ["to conceal", "to ask", "to promise"], { root: "נגד", familyGloss: "to tell, in front of" }],
  ["H5048", "in front of, opposite", ["behind", "beside", "inside"], { root: "נגד" }],
  ["H6680", "to command", ["to request", "to permit", "to warn"], {}],
  ["H1288", "to bless", ["to curse", "to praise", "to thank"], { root: "ברכ", familyGloss: "to bless, to kneel" }],
  ["H1605", "to rebuke", ["to praise", "to forgive", "to ignore"], {}],
  ["H3637", "to shame, to humiliate", ["to honour", "to comfort", "to accuse"], {}],
  ["H3045", "to know", ["to forget", "to believe", "to learn"], { root: "ידע", familyGloss: "to know, to recognise" }],
  ["H5234", "to recognise, to notice", ["to ignore", "to forget", "to suspect"], {
    root: "נכר",
    familyGloss: "to recognise, a stranger",
    notes: "Ruth 2:10 turns on this root twice: 'why have I found favour in your eyes that you should NOTICE me, and I a FOREIGNER?' Recognising and being foreign are the same three letters.",
  }],
  ["H5237", "foreign, a foreigner", ["native", "familiar", "distant"], { root: "נכר" }],

  // ---- movement ----
  ["H3427", "to sit, to dwell", ["to stand", "to walk", "to sleep"], {}],
  ["H6965", "to arise, to stand up", ["to lie down", "to sit", "to fall"], {}],
  ["H5975", "to stand", ["to run", "to kneel", "to lean"], {}],
  ["H5324", "to be stationed, to stand over", ["to depart", "to hide", "to bow"], {}],
  ["H3318", "to go out", ["to come in", "to return", "to remain"], {}],
  ["H5927", "to go up, to ascend", ["to go down", "to cross", "to fall"], {}],
  ["H3381", "to go down", ["to go up", "to turn", "to stay"], {}],
  ["H5674", "to cross over, to pass by", ["to stop", "to return", "to enter"], {}],
  ["H5493", "to turn aside", ["to continue", "to approach", "to return"], {}],
  ["H5066", "to draw near", ["to withdraw", "to depart", "to wait"], {}],
  ["H5060", "to touch, to reach", ["to strike", "to hold", "to release"], {}],
  ["H5307", "to fall", ["to rise", "to lean", "to jump"], {}],
  ["H7812", "to bow down", ["to stand", "to kneel", "to look up"], {}],
  ["H1481", "to sojourn, to live as a stranger", ["to settle", "to rule", "to flee"], {}],
  ["H1692", "to cling, to stay close", ["to let go", "to follow", "to meet"], {
    notes: "Ruth 1:14: Orpah kisses her mother-in-law, but Ruth 'clung' to her. The same verb Genesis 2:24 uses of a man and his wife.",
  }],
  ["H5800", "to leave, to forsake", ["to keep", "to follow", "to send"], {}],
  ["H6504", "to separate, to part", ["to gather", "to join", "to meet"], {}],
  ["H6293", "to meet, to entreat", ["to avoid", "to pursue", "to summon"], {}],
  ["H7136", "to happen, to chance upon", ["to plan", "to seek", "to arrange"], { root: "קרה", familyGloss: "to happen, chance" }],
  ["H4745", "a chance, a happening", ["a plan", "a journey", "an omen"], {
    root: "קרה",
    notes: "Ruth 2:3 says literally 'her chance chanced upon' the field of Boaz — the noun and the verb from one root, side by side. The narrator says accident and means the opposite.",
  }],
  ["H622", "to gather", ["to scatter", "to count", "to carry"], {}],
  ["H3947", "to take", ["to give", "to send", "to leave"], {}],
  ["H5375", "to lift, to carry", ["to drop", "to push", "to hide"], {}],
  ["H5414", "to give", ["to take", "to sell", "to keep"], {}],
  ["H3051", "to give, to grant", ["to demand", "to refuse", "to borrow"], {}],
  ["H4672", "to find", ["to lose", "to seek", "to hide"], {}],
  ["H1245", "to seek", ["to find", "to avoid", "to keep"], {}],
  ["H270", "to seize, to take hold", ["to release", "to drop", "to offer"], {}],
  ["H7896", "to set, to place", ["to remove", "to lift", "to break"], {}],
  ["H7760", "to put, to set", ["to take away", "to raise", "to lose"], {}],
  ["H6566", "to spread out", ["to fold", "to tear", "to gather"], {}],
  ["H1540", "to uncover", ["to cover", "to close", "to hide"], {}],
  ["H6912", "to bury", ["to mourn", "to carry", "to raise"], {}],
  ["H5401", "to kiss", ["to embrace", "to bless", "to weep"], {}],
  ["H1058", "to weep", ["to laugh", "to sing", "to shout"], {}],
  ["H1129", "to build", ["to break", "to plant", "to buy"], {}],

  // ---- inner life and quality ----
  ["H2617", "steadfast love, loyalty", ["mercy", "justice", "peace"], {
    notes: "No single English word carries it. חֶסֶד is loyalty inside a relationship, kept when it need not be — 'kindness' is too weak, 'love' too vague. It is what Ruth shows Naomi and what Boaz shows Ruth, and the book uses it of God only once.",
  }],
  ["H2580", "favour, grace", ["mercy", "beauty", "honour"], {
    notes: "'To find favour in the eyes of' is the ordinary idiom for being well received. Ruth uses it three times, always to a superior.",
  }],
  ["H2896", "good", ["evil", "great", "holy"], { root: "טוב", familyGloss: "good" }],
  ["H3190", "to do well, to be pleasing", ["to fail", "to worsen", "to trouble"], {}],
  ["H7489", "to be bad, to do harm", ["to be good", "to mend", "to help"], {}],
  ["H4843", "to be bitter", ["to be sweet", "to be sour", "to be dry"], { root: "מרר", familyGloss: "bitter, to be bitter" }],
  ["H5162", "to comfort", ["to grieve", "to warn", "to rebuke"], {}],
  ["H3820", "the heart", ["the soul", "the mind", "the eye"], {
    notes: "In Hebrew the seat of thought and will rather than feeling. Boaz speaks 'to Ruth's heart' in 2:13 — that is reassurance, not romance.",
  }],
  ["H5315", "life, soul, self", ["body", "spirit", "breath"], {
    notes: "The living, breathing self — not a soul separable from a body. In 4:15 Obed will be a 'restorer of נֶפֶשׁ' to Naomi: her life brought back.",
  }],
  ["H2416", "living, alive", ["dead", "young", "strong"], {}],
  ["H157", "to love", ["to hate", "to fear", "to serve"], {}],
  ["H3372", "to fear", ["to trust", "to hope", "to obey"], {}],
  ["H2654", "to delight in, to be willing", ["to refuse", "to fear", "to forget"], {}],
  ["H553", "to be determined, to strengthen oneself", ["to weaken", "to hesitate", "to yield"], {}],
  ["H2308", "to cease, to leave off", ["to begin", "to continue", "to hurry"], {}],
  ["H7673", "to cease, to rest", ["to start", "to labour", "to hasten"], {}],
  ["H8252", "to be quiet, to rest", ["to stir", "to shout", "to hurry"], {}],
  ["H1949", "to be stirred up, to be in an uproar", ["to be silent", "to be calm", "to be asleep"], {
    notes: "Ruth 1:19: 'all the city was stirred'. One word, and a town's reaction to a woman coming home empty.",
  }],
  ["H7663", "to wait, to hope", ["to despair", "to hurry", "to demand"], {}],
  ["H8615", "hope", ["fear", "memory", "promise"], {}],
  ["H5702", "to shut oneself away", ["to open up", "to wait", "to marry"], {}],
  ["H4496", "rest, a settled home", ["a journey", "a burden", "a shelter"], { root: "נוח", familyGloss: "rest, a resting place" }],
  ["H4494", "a resting place", ["a lodging", "a road", "a market"], { root: "נוח" }],
  ["H7999", "to repay, to make whole", ["to owe", "to seize", "to forgive"], { root: "שׁלמ", familyGloss: "whole, to repay" }],
  ["H8003", "full, complete", ["broken", "empty", "partial"], { root: "שׁלמ" }],
  ["H539", "to support, to nurse", ["to abandon", "to teach", "to carry"], {}],
  ["H3557", "to sustain, to nourish", ["to starve", "to guard", "to bury"], {}],

  // ---- quantity and quality ----
  ["H4392", "full", ["empty", "heavy", "open"], {
    notes: "Naomi's summary of herself in 1:21: 'I went out FULL, and the LORD has brought me back EMPTY.' The book spends four chapters reversing it.",
  }],
  ["H7387", "empty, empty-handed", ["full", "poor", "alone"], {}],
  ["H4592", "a little, few", ["many", "enough", "all"], {}],
  ["H3966", "very, exceedingly", ["hardly", "somewhat", "never"], {}],
  ["H2428", "strength, worth", ["weakness", "wealth", "beauty"], {
    notes: "אֵשֶׁת חַיִל in 3:11 — 'a woman of worth', the same phrase Proverbs 31 uses. Boaz is introduced in 2:1 as a גִּבּוֹר חַיִל, the male counterpart.",
  }],
  ["H1368", "mighty, a warrior", ["weak", "wealthy", "gentle"], {}],
  ["H1800", "poor, weak", ["rich", "strong", "noble"], {}],
  ["H6223", "rich", ["poor", "generous", "powerful"], {}],
  ["H970", "a young man", ["an elder", "a child", "a soldier"], {}],
  ["H1431", "to grow up, to become great", ["to shrink", "to age", "to weaken"], { root: "גדל", familyGloss: "great, to grow" }],
  ["H7872", "old age, grey hair", ["youth", "childhood", "sickness"], {}],
  ["H8141", "a year", ["a month", "a season", "a day"], {}],
  ["H3117", "a day", ["a night", "a week", "an hour"], {}],
  ["H6256", "a time, a season", ["a place", "a moment", "an age"], {}],
  ["H8462", "a beginning", ["an end", "a middle", "a turn"], {}],
  ["H259", "one", ["two", "first", "alone"], {}],
  ["H8147", "two", ["three", "both", "second"], {}],
  ["H8145", "second", ["first", "double", "next"], {}],
  ["H7223", "first, former", ["last", "second", "next"], {}],
  ["H314", "latter, last", ["first", "former", "next"], { root: "אחר", familyGloss: "after, behind" }],
  ["H8337", "six", ["five", "seven", "sixty"], {}],
  ["H7651", "seven", ["six", "eight", "seventy"], {}],
  ["H6235", "ten", ["nine", "twelve", "hundred"], {}],
  ["H3605", "all, every", ["some", "none", "few"], {}],

  // ---- body ----
  ["H6440", "the face, the presence", ["the back", "the hand", "the eye"], {}],
  ["H5869", "an eye", ["an ear", "a face", "a hand"], {}],
  ["H241", "an ear", ["an eye", "a mouth", "a hand"], {}],
  ["H3027", "a hand", ["a foot", "an arm", "a finger"], {}],
  ["H4578", "the inward parts, the womb", ["the heart", "the head", "the back"], {}],
  ["H2233", "seed, offspring", ["a root", "a branch", "a harvest"], {}],
  ["H2032", "conception", ["birth", "labour", "barrenness"], {}],

  // ---- places and things ----
  ["H1004", "a house, a household", ["a tent", "a city", "a room"], {}],
  ["H5892", "a city", ["a village", "a field", "a gate"], {}],
  ["H776", "land, earth", ["sea", "sky", "mountain"], {}],
  ["H4725", "a place", ["a time", "a road", "a house"], {}],
  ["H1870", "a road, a way", ["a gate", "a field", "a journey"], {}],
  ["H7097", "an end, an edge", ["a middle", "a top", "a beginning"], {}],
  ["H6654", "a side", ["a front", "a top", "a middle"], {}],
  ["H5971", "a people, a nation", ["a family", "a city", "a king"], {}],
  ["H8034", "a name", ["a word", "a sign", "a title"], {}],
  ["H8435", "generations, a line of descent", ["a genealogy", "a family", "an ancestor"], {}],

  // ---- doing ----
  ["H6213", "to do, to make", ["to leave", "to break", "to seek"], { root: "עשׂה", familyGloss: "to do, to make" }],
  ["H3615", "to finish, to complete", ["to begin", "to continue", "to break"], {}],
  ["H3498", "to remain, to be left over", ["to depart", "to finish", "to increase"], {}],
  ["H7604", "to remain, to be left", ["to leave", "to perish", "to grow"], {}],
  ["H3254", "to add, to do again", ["to remove", "to stop", "to divide"], {}],
  ["H3201", "to be able", ["to refuse", "to fail", "to try"], {}],
  ["H7200", "to see", ["to hear", "to know", "to seek"], {}],
  ["H6485", "to visit, to attend to", ["to abandon", "to summon", "to punish"], {
    notes: "Ruth 1:6: the LORD had 'visited' his people by giving them bread. The verb covers both mercy and reckoning; here it is mercy.",
  }],
  ["H7843", "to ruin, to spoil", ["to mend", "to build", "to keep"], {}],

  // ---- grammar words ----
  ["H834", "who, which, that", ["and", "but", "if"], {}],
  ["H853", "(marks the direct object)", ["with", "to", "from"], {
    notes: "אֵת before a definite object has no English equivalent — it marks what is being acted on. Left untranslated everywhere.",
  }],
  ["H854", "with", ["without", "from", "toward"], {}],
  ["H3588", "for, because, that", ["but", "although", "unless"], {}],
  ["H413", "to, toward", ["from", "with", "under"], {}],
  ["H5921", "on, upon, over", ["under", "beside", "within"], {}],
  ["H5973", "with, together with", ["without", "against", "after"], {}],
  ["H5704", "as far as, until", ["from", "since", "before"], {}],
  ["H4480", "from, out of", ["to", "with", "in"], {}],
  ["H310", "after, behind", ["before", "beside", "within"], { root: "אחר", familyGloss: "after, behind" }],
  ["H312", "another, other", ["same", "first", "own"], { root: "אחר", familyGloss: "after, behind" }],
  ["H8478", "under, instead of", ["above", "beside", "before"], {}],
  ["H996", "between", ["among", "beyond", "within"], {}],
  ["H2108", "except, besides", ["including", "with", "beyond"], {}],
  ["H3808", "not", ["yes", "also", "still"], {}],
  ["H408", "do not", ["please do", "always", "never again"], {
    notes: "The negative for commands and requests. לֹא negates a statement; אַל stops an action.",
  }],
  ["H369", "there is not", ["there is", "not yet", "no longer"], {}],
  ["H3426", "there is, there are", ["there is not", "perhaps", "always"], {}],
  ["H1115", "not, except", ["only", "always", "surely"], {}],
  ["H6435", "lest", ["unless", "because", "although"], {}],
  ["H518", "if", ["when", "because", "unless"], {}],
  ["H3860", "therefore", ["however", "meanwhile", "because"], {}],
  ["H1571", "also, even", ["only", "never", "instead"], {}],
  ["H5750", "still, yet, again", ["never", "already", "no longer"], {}],
  ["H2009", "behold, look", ["listen", "wait", "come"], {}],
  ["H4994", "please, now", ["never", "again", "surely"], {}],
  ["H551", "truly, indeed", ["perhaps", "hardly", "never"], {}],
  ["H227", "then, at that time", ["now", "before", "always"], {}],
  ["H6258", "now", ["then", "later", "always"], {}],
  ["H2962", "before, not yet", ["after", "already", "during"], {}],
  ["H2958", "not yet", ["already", "again", "always"], {}],
  ["H8543", "yesterday, formerly", ["tomorrow", "today", "lately"], {}],
  ["H8032", "three days ago, before now", ["tomorrow", "soon", "today"], {
    notes: "תְּמוֹל שִׁלְשׁוֹם, 'yesterday and the day before', is the idiom for 'previously'. Neither word is used alone in this sense.",
  }],
  ["H8033", "there", ["here", "everywhere", "nowhere"], {}],
  ["H6311", "here", ["there", "everywhere", "somewhere"], {}],
  ["H1988", "hither, over here", ["away", "there", "back"], {}],
  ["H3541", "thus, so", ["never", "why", "perhaps"], {}],
  ["H4310", "who?", ["what?", "where?", "when?"], {}],
  ["H4100", "what?", ["who?", "why?", "how?"], {}],
  ["H4069", "why?", ["what?", "when?", "how many?"], {}],
  ["H349", "how?", ["why?", "where?", "who?"], {}],
  ["H375", "where?", ["when?", "how?", "which?"], {}],
  ["H575", "where? whither?", ["why?", "how?", "when?"], {}],
  ["H1931", "he, that", ["she", "they", "this"], {}],
  ["H1992", "they", ["we", "you", "these"], {}],
  ["H589", "I", ["you", "he", "we"], {}],
  ["H595", "I", ["we", "you", "she"], {
    notes: "Hebrew has two words for 'I'. אָנֹכִי is the longer and slightly weightier; both appear in Ruth with no clear difference in force.",
  }],
  ["H859", "you (masculine singular)", ["I", "he", "they"], {}],
  ["H2088", "this (masculine)", ["that", "these", "which"], {}],
  ["H2063", "this (feminine)", ["that", "those", "which"], {}],
  ["H428", "these", ["those", "this", "both"], {}],
];

// ---------------------------------------------------------------------------

const seen = new Map();
const words = ENTRIES.map(([lemma, gloss, distractors, extras = {}]) => {
  // A duplicate lemma silently clobbers whichever entry the importer keeps, and
  // in Jonah that quietly stripped the roots off three curated words before a
  // guard caught it. Fail loudly instead.
  if (seen.has(lemma)) throw new Error(`duplicate lemma ${lemma}: "${seen.get(lemma)}" and "${gloss}"`);
  seen.set(lemma, gloss);
  if (distractors.length !== 3) throw new Error(`${lemma} has ${distractors.length} distractors, want 3`);
  if (distractors.includes(gloss)) throw new Error(`${lemma} lists its own gloss as a distractor`);
  if (new Set(distractors).size !== 3) throw new Error(`${lemma} has a repeated distractor`);
  return { lemma, gloss, distractors, ...extras };
});

const out = {
  _readme:
    "Hand-written glosses, distractors, roots and teaching notes for Ruth. " +
    "Generated by build-ruth-glossary.mjs — edit that, not this. Glosses are short " +
    "TEACHING meanings for a beginner reading Ruth, not lexicon entries, and they " +
    "flatten real semantic range. Roots are supplied only where the pairing is " +
    "visible in Ruth itself; Strong's derivation chains are refused. A Hebraist " +
    "should read all of it.",
  words,
};

const path = resolve(HERE, "ruth-glossary.json");
writeFileSync(path, `${JSON.stringify(out, null, 1)}\n`);
console.log(`wrote ${path}`);
console.log(`  ${words.length} entries · ${words.filter((w) => w.root).length} hand-supplied roots`);
console.log(`  ${words.filter((w) => w.notes).length} teaching notes`);
