#!/usr/bin/env node
/**
 * The human contribution to the 1 John course.
 *
 * Same split as the Hebrew books: the importer derives stems, endings, parses,
 * attestations and frequency from MorphGNT; everything a learner READS is here
 * and is hand-written.
 *
 * WHY 1 JOHN. Measured against every other candidate: 2,137 running words over
 * just 233 lemmas — 9.2 tokens per lemma — and only 38% of its vocabulary
 * occurs once, against Jude's 74% and Mark's 48%. It says the same few things
 * many times (love, light, truth, abide, know), which is exactly the
 * within-book compounding coverage-findings.md §4a says pays. It has been the
 * first continuous text for Greek beginners for a very long time, and the
 * numbers say why.
 *
 * EVERY lemma gets an entry, including the function words the course will not
 * teach as vocabulary. Teaching is decided by the importer — a word needs a
 * derivable stem to carry an ending highlight — but a token with no glossary
 * entry renders a blank tap-to-gloss card, and 1 John is 359 occurrences of ὁ.
 *
 * Transliteration and ids are GENERATED, not typed: 233 hand-typed
 * transliterations would be 233 chances to slip, and the mapping is mechanical.
 *
 * Usage:  node scripts/build-1john-glossary.mjs
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

import { translit, slug } from "./lib/greek-translit.mjs";

/**
 * [lemma, gloss, [three distractors], extras?]
 *
 * Distractors sit in the answer's semantic neighbourhood without being
 * synonyms, and never come from its own family.
 */
const ENTRIES = [
  // ---- the vocabulary the letter is built on ----
  ["ἀγαπάω", "I love", ["I hate", "I fear", "I need"], { stem: "ἀγαπά", familyId: "ἀγαπ", familyGloss: "love" }],
  ["ἀγάπη", "love", ["hope", "mercy", "peace"], { familyId: "ἀγαπ" }],
  ["ἀγαπητός", "beloved", ["chosen", "faithful", "blessed"], { familyId: "ἀγαπ" }],
  ["μένω", "I remain, I abide", ["I leave", "I arrive", "I wander"], { stem: "μέν",
    notes: "The letter's characteristic verb — 24 occurrences in five chapters, against 118 in the whole New Testament. To 'abide in' someone is to stay where you already are, not to arrive.",
  }],
  ["γινώσκω", "I know, I come to know", ["I forget", "I believe", "I doubt"], { stem: "γινώσκ",
    notes: "Knowing by acquaintance and experience. οἶδα is the other 'know' in this letter — settled knowledge rather than knowledge arrived at.",
  }],
  ["οἶδα", "I know (as a settled fact)", ["I learn", "I suppose", "I recall"], { stem: "οἶ",}],
  ["φῶς", "light", ["fire", "day", "glory"], {}],
  ["σκοτία", "darkness", ["night", "shadow", "silence"], {
    notes: "17 occurrences in the New Testament, and John's writings hold most of them. σκότος in 1:6 is the same idea in a different noun.",
  }],
  ["σκότος", "darkness", ["cloud", "depth", "evening"], {}],
  ["ἀλήθεια", "truth", ["wisdom", "justice", "faith"], {}],
  ["ἀληθής", "true, truthful", ["false", "hidden", "plain"], {}],
  ["ἀληθινός", "true, genuine", ["counterfeit", "partial", "ordinary"], {}],
  ["ἀληθῶς", "truly", ["barely", "perhaps", "openly"], { stem: "ἀληθῶ",}],
  ["ψεύστης", "a liar", ["a thief", "a fool", "a stranger"], { familyId: "ψευ", familyGloss: "falsehood, lying" }],
  ["ψεῦδος", "a lie", ["a rumour", "an error", "a secret"], { familyId: "ψευ" }],
  ["ψεύδομαι", "I lie", ["I boast", "I forget", "I deny"], { stem: "ψεύδ", familyId: "ψευ" }],
  ["ψευδοπροφήτης", "a false prophet", ["a false teacher", "a deceiver", "an idolater"], {}],
  ["ἁμαρτία", "sin", ["guilt", "debt", "shame"], { familyId: "ἁμαρτ", familyGloss: "sin" }],
  ["ἁμαρτάνω", "I sin", ["I stumble", "I repent", "I suffer"], { stem: "ἁμαρτάν", familyId: "ἁμαρτ" }],
  ["κόσμος", "the world", ["the age", "the earth", "the nations"], {
    notes: "Not the planet. In this letter the κόσμος is human life organised without God — which is why it can be loved wrongly (2:15) and why it passes away (2:17).",
  }],
  ["ζωή", "life", ["breath", "soul", "health"], {}],
  ["θάνατος", "death", ["sleep", "sickness", "ruin"], {}],
  ["ἐντολή", "a commandment", ["a promise", "a warning", "a custom"], {}],
  ["τηρέω", "I keep, I guard", ["I break", "I forget", "I give"], { stem: "τηρέ",}],
  ["μαρτυρέω", "I testify, I bear witness", ["I question", "I accuse", "I conceal"], { stem: "μαρτυρέ", familyId: "μαρτυρ", familyGloss: "witness, testimony" }],
  ["μαρτυρία", "testimony", ["a rumour", "a verdict", "a promise"], { stem: "μαρτυρί", familyId: "μαρτυρ" }],
  ["ὁμολογέω", "I confess, I acknowledge", ["I deny", "I doubt", "I conceal"], { stem: "ὁμολογέ",}],
  ["ἀρνέομαι", "I deny, I disown", ["I confess", "I accept", "I forget"], { stem: "ἀρνέ",}],
  ["πιστεύω", "I believe, I trust", ["I doubt", "I test", "I obey"], { stem: "πιστεύ", familyId: "πιστ", familyGloss: "faith, trust" }],
  ["πίστις", "faith, trust", ["hope", "knowledge", "obedience"], { familyId: "πιστ" }],
  ["πιστός", "faithful, trustworthy", ["doubtful", "wise", "willing"], { familyId: "πιστ" }],
  ["μισέω", "I hate", ["I love", "I fear", "I avoid"], { stem: "μισέ",}],
  ["νικάω", "I conquer, I overcome", ["I flee", "I surrender", "I endure"], { stem: "νικά", familyId: "νικ", familyGloss: "victory, to conquer" }],
  ["νίκη", "victory", ["battle", "reward", "strength"], { stem: "νίκ",
    familyId: "νικ",
    notes: "The only occurrence of this noun in the whole New Testament — a genuine hapax legomenon, in 5:4. The related verb νικάω is common; the noun is not.",
  }],

  // ---- God, Christ, spirit ----
  ["θεός", "God", ["a lord", "a spirit", "a king"], {}],
  ["πατήρ", "a father", ["a son", "a brother", "an elder"], {}],
  ["υἱός", "a son", ["a father", "a servant", "a child"], {}],
  ["Ἰησοῦς", "Jesus", ["Joshua", "John", "James"], { stem: "Ἰησοῦ",}],
  ["Χριστός", "Christ, the Anointed", ["the Lord", "the Prophet", "the King"], {}],
  ["πνεῦμα", "spirit, breath", ["flesh", "soul", "mind"], { stem: "πνεῦμ",}],
  ["ἅγιος", "holy", ["righteous", "pure", "great"], {}],
  ["χρῖσμα", "an anointing", ["a blessing", "a seal", "an offering"], { stem: "χρῖσμ",
    notes: "Three occurrences in the New Testament, all of them in this letter (2:20, 2:27 twice). It shares its root with Χριστός, 'anointed'.",
  }],
  ["παράκλητος", "an advocate, a helper", ["a judge", "a witness", "a servant"], {}],
  ["σωτήρ", "a saviour", ["a healer", "a shepherd", "a ruler"], { stem: "σωτή",}],
  ["μονογενής", "only-begotten, one and only", ["firstborn", "beloved", "chosen"], {}],
  ["ἱλασμός", "an atoning sacrifice", ["a ransom", "an offering", "a covenant"], {
    notes: "Twice in the New Testament, both here (2:2, 4:10). English has no short equivalent; 'propitiation' and 'expiation' are both attempts at it.",
  }],
  ["ἐπαγγελία", "a promise", ["a command", "a warning", "a blessing"], { familyId: "ἐπαγγελ", familyGloss: "promise" }],
  ["ἐπαγγέλλομαι", "I promise", ["I refuse", "I request", "I foretell"], { stem: "ἐπαγγέλλ", familyId: "ἐπαγγελ" }],
  ["παρουσία", "a coming, an arrival", ["a departure", "a delay", "a judgement"], {}],

  // ---- the adversary ----
  ["ἀντίχριστος", "antichrist", ["a false prophet", "an idol", "an accuser"], {}],
  ["διάβολος", "the devil, slanderous", ["an enemy", "a tempter", "a liar"], {}],
  ["πονηρός", "evil, the evil one", ["good", "weak", "foolish"], {}],
  ["ἀνομία", "lawlessness", ["injustice", "rebellion", "ignorance"], {}],
  ["ἀδικία", "unrighteousness, wrongdoing", ["weakness", "sorrow", "poverty"], {}],
  ["πλανάω", "I lead astray, I deceive", ["I guide", "I warn", "I follow"], { stem: "πλανά", familyId: "πλαν", familyGloss: "wandering, deception" }],
  ["πλάνη", "error, deception", ["ignorance", "doubt", "malice"], { familyId: "πλαν" }],
  ["σκάνδαλον", "a stumbling block", ["a burden", "a trap", "a warning"], {}],
  ["ἀνθρωποκτόνος", "a murderer", ["a thief", "a traitor", "an enemy"], { stem: "ἀνθρωποκτόν",
    notes: "Three occurrences in the New Testament, two of them here in 3:15 — literally 'man-killer'.",
  }],
  ["σφάζω", "I slaughter, I slay", ["I bind", "I strike", "I bury"], { stem: "σφάζ",}],
  ["Κάϊν", "Cain", ["Abel", "Esau", "Korah"], {}],
  ["εἴδωλον", "an idol", ["an image", "a temple", "an altar"], {}],
  ["ἀλαζονεία", "boasting, pretension", ["greed", "envy", "anger"], { stem: "ἀλαζονεί",}],
  ["ἐπιθυμία", "desire, craving", ["hunger", "anger", "ambition"], {}],
  ["βίος", "life, livelihood", ["death", "wealth", "labour"], {
    notes: "Not ζωή. βίος is life as means and duration — the ἀλαζονεία τοῦ βίου in 2:16 is pride in what one has.",
  }],
  ["σάρξ", "flesh", ["spirit", "blood", "body"], {}],

  // ---- people ----
  ["ἀδελφός", "a brother", ["a father", "a friend", "a neighbour"], {}],
  ["τεκνίον", "a little child", ["an infant", "a servant", "a pupil"], { stem: "τεκνίο",
    notes: "The author's word for his readers — seven of its eight New Testament occurrences are in this letter. A diminutive of τέκνον, and affectionate rather than belittling.",
  }],
  ["τέκνον", "a child", ["a son", "a servant", "an heir"], {}],
  ["παιδίον", "a young child", ["a youth", "a servant", "an orphan"], {}],
  ["νεανίσκος", "a young man", ["an elder", "a boy", "a soldier"], {}],
  ["ἄνθρωπος", "a person, a human being", ["a man", "a servant", "a stranger"], {}],
  ["ἀλλήλων", "one another", ["ourselves", "the others", "everyone"], {}],
  ["ἑαυτοῦ", "himself, herself, itself", ["another", "the same", "one another"], {}],

  // ---- doing and being ----
  ["εἰμί", "I am", ["I have", "I become", "I go"], { stem: "εἰ",}],
  ["γίνομαι", "I become, I happen", ["I remain", "I appear", "I cease"], { stem: "γίν",}],
  ["ἔχω", "I have, I hold", ["I lack", "I give", "I seek"], { stem: "ἔχ",}],
  ["ποιέω", "I do, I make", ["I destroy", "I say", "I know"], { stem: "ποιέ",}],
  ["ἔργον", "a work, a deed", ["a word", "a gift", "a plan"], {}],
  ["περιπατέω", "I walk, I conduct myself", ["I stand", "I rest", "I hurry"], { stem: "περιπατέ",
    notes: "Walking as a way of living — the same idiom Hebrew uses. 'To walk in the light' is not a journey.",
  }],
  ["ἔρχομαι", "I come", ["I go out", "I remain", "I send"], { stem: "ἔρχ",}],
  ["ἐξέρχομαι", "I go out", ["I come in", "I stay", "I return"], { stem: "ἐξέρχ",}],
  ["ὑπάγω", "I go away, I depart", ["I approach", "I remain", "I follow"], {}],
  ["μεταβαίνω", "I pass over, I move", ["I stumble", "I return", "I wait"], { stem: "μεταβαίν",}],
  ["ἥκω", "I have come, I am present", ["I depart", "I wait", "I hasten"], { stem: "ἥκ" }],
  ["ἀκούω", "I hear", ["I see", "I speak", "I obey"], { stem: "ἀκού",}],
  ["ὁράω", "I see", ["I hear", "I seek", "I show"], { stem: "ὁρά",}],
  ["θεάομαι", "I behold, I look at", ["I glance", "I ignore", "I imagine"], { stem: "θεά",}],
  ["θεωρέω", "I observe, I watch", ["I hide", "I hear", "I judge"], { stem: "θεωρέ",}],
  ["ψηλαφάω", "I touch, I handle", ["I see", "I carry", "I break"], { stem: "ψηλαφά",
    notes: "Four occurrences in the New Testament. In 1:1 it is deliberately physical: what the writer's hands handled.",
  }],
  ["ἅπτω", "I touch, I take hold of", ["I release", "I strike", "I carry"], { stem: "ἅπτ",}],
  ["λέγω", "I say", ["I ask", "I hear", "I write"], { stem: "λέγ",}],
  ["λαλέω", "I speak", ["I listen", "I shout", "I answer"], { stem: "λαλέ",}],
  ["γράφω", "I write", ["I read", "I say", "I send"], { stem: "γράφ",}],
  ["ἀπαγγέλλω", "I announce, I report", ["I conceal", "I ask", "I promise"], { stem: "ἀπαγγέλλ", familyId: "αγγελ", familyGloss: "message, to announce" }],
  ["ἀναγγέλλω", "I declare, I proclaim", ["I whisper", "I deny", "I inquire"], { stem: "ἀναγγέλλ", familyId: "αγγελ" }],
  ["ἀγγελία", "a message", ["a rumour", "a command", "a letter"], { stem: "ἀγγελί",
    familyId: "αγγελ",
    notes: "Twice in the New Testament, both in this letter (1:5, 3:11).",
  }],
  ["διδάσκω", "I teach", ["I learn", "I ask", "I obey"], { stem: "διδάσκ",}],
  ["ἐρωτάω", "I ask, I request", ["I answer", "I command", "I refuse"], { stem: "ἐρωτά",}],
  ["αἰτέω", "I ask for, I request", ["I give", "I refuse", "I receive"], { stem: "αἰτέ", familyId: "αἰτ", familyGloss: "asking, a request" }],
  ["αἴτημα", "a request", ["an answer", "a gift", "a promise"], { stem: "αἴτημ", familyId: "αἰτ" }],
  ["δίδωμι", "I give", ["I take", "I keep", "I sell"], { stem: "δίδ",}],
  ["λαμβάνω", "I take, I receive", ["I give", "I lose", "I seek"], { stem: "λαμβάν",}],
  ["ἀφίημι", "I forgive, I let go", ["I hold", "I condemn", "I remember"], { stem: "ἀφίη",}],
  ["καθαρίζω", "I cleanse", ["I stain", "I cover", "I break"], { stem: "καθαρίζ",}],
  ["ἁγνίζω", "I purify", ["I defile", "I anoint", "I bless"], { stem: "ἁγνίζ", familyId: "ἁγν", familyGloss: "pure, to purify" }],
  ["ἁγνός", "pure", ["stained", "holy", "simple"], { familyId: "ἁγν" }],
  ["τελειόω", "I complete, I perfect", ["I begin", "I ruin", "I delay"], { stem: "τελειό", familyId: "τελε", familyGloss: "complete, to finish" }],
  ["τέλειος", "complete, perfect", ["partial", "new", "small"], { familyId: "τελε" }],
  ["πληρόω", "I fill, I fulfil", ["I empty", "I break", "I begin"], { stem: "πληρό",}],
  ["φανερόω", "I make manifest, I reveal", ["I hide", "I promise", "I destroy"], { stem: "φανερό", familyId: "φανερ", familyGloss: "manifest, to reveal" }],
  ["φανερός", "manifest, visible", ["hidden", "doubtful", "distant"], { familyId: "φανερ" }],
  ["φαίνω", "I shine, I appear", ["I fade", "I hide", "I burn"], { stem: "φαίν",}],
  ["γεννάω", "I beget, I give birth to", ["I raise", "I adopt", "I bury"], { stem: "γεννά",
    notes: "Ten occurrences here, always in the perfect passive: those 'begotten of God'. The image is birth, not adoption.",
  }],
  ["σπέρμα", "seed, offspring", ["a root", "a harvest", "a branch"], { stem: "σπέρμ",}],
  ["ἀποστέλλω", "I send", ["I receive", "I keep", "I follow"], { stem: "ἀποστέλλ",}],
  ["καλέω", "I call, I name", ["I answer", "I send", "I choose"], { stem: "καλέ",}],
  ["δύναμαι", "I am able", ["I refuse", "I try", "I fail"], { stem: "δύνα",}],
  ["ὀφείλω", "I ought, I owe", ["I refuse", "I deserve", "I forgive"], { stem: "ὀφείλ",}],
  ["θέλημα", "will, desire", ["a command", "a plan", "a gift"], { stem: "θέλημ",}],
  ["τίθημι", "I lay down, I place", ["I lift", "I take", "I hide"], { stem: "τί",}],
  ["αἴρω", "I take up, I take away", ["I put down", "I hold", "I receive"], { stem: "αἴρ",}],
  ["βάλλω", "I throw, I cast", ["I catch", "I carry", "I place"], { stem: "βάλλ",}],
  ["λύω", "I loose, I destroy", ["I bind", "I build", "I keep"], { stem: "λύ",}],
  ["κλείω", "I shut", ["I open", "I break", "I guard"], { stem: "κλεί",}],
  ["πείθω", "I persuade, I convince", ["I resist", "I doubt", "I compel"], { stem: "πείθ",}],
  ["δοκιμάζω", "I test, I examine", ["I accept", "I ignore", "I trust"], { stem: "δοκιμάζ",}],
  ["καταγινώσκω", "I condemn", ["I acquit", "I praise", "I question"], { stem: "καταγινώσκ",
    notes: "Three occurrences in the New Testament, two of them in 3:20–21 — the heart condemning its owner.",
  }],
  ["φυλάσσω", "I guard, I keep", ["I abandon", "I seek", "I release"], { stem: "φυλάσσ",}],
  ["κεῖμαι", "I lie, I am laid", ["I rise", "I walk", "I fall"], { stem: "κεῖ",}],
  ["ζάω", "I live", ["I die", "I sleep", "I remain"], { stem: "ζά",}],
  ["παράγω", "I pass away", ["I endure", "I approach", "I return"], {}],
  ["θαυμάζω", "I marvel, I am amazed", ["I despise", "I fear", "I understand"], { stem: "θαυμάζ",}],
  ["φοβέομαι", "I fear", ["I trust", "I hope", "I rejoice"], { stem: "φοβέ", familyId: "φοβ", familyGloss: "fear" }],
  ["φόβος", "fear", ["courage", "anger", "grief"], { familyId: "φοβ" }],
  ["αἰσχύνομαι", "I am ashamed", ["I am proud", "I am afraid", "I am glad"], {}],
  ["τυφλόω", "I blind", ["I heal", "I darken", "I open"], { stem: "τυφλό",}],

  // ---- qualities and abstractions ----
  ["δίκαιος", "righteous, just", ["wicked", "merciful", "wise"], { familyId: "δικαι", familyGloss: "righteous, righteousness" }],
  ["δικαιοσύνη", "righteousness", ["mercy", "holiness", "wisdom"], { familyId: "δικαι" }],
  ["κρίσις", "judgement", ["mercy", "a verdict", "a trial"], {}],
  ["κόλασις", "punishment", ["a reward", "a warning", "a debt"], { stem: "κόλασι",
    notes: "Twice in the New Testament. In 4:18 it is what perfect love casts out fear of.",
  }],
  ["παρρησία", "boldness, confidence", ["shame", "silence", "caution"], {}],
  ["ἐλπίς", "hope", ["faith", "desire", "patience"], {}],
  ["χαρά", "joy", ["peace", "hope", "comfort"], {}],
  ["κοινωνία", "fellowship, sharing", ["a gathering", "a covenant", "friendship"], {}],
  ["καρδία", "the heart", ["the mind", "the soul", "the body"], {}],
  ["ψυχή", "soul, life", ["spirit", "body", "breath"], {}],
  ["διάνοια", "understanding, mind", ["memory", "will", "opinion"], {}],
  ["σπλάγχνον", "inward parts, compassion", ["the heart", "the will", "kindness"], {
    notes: "Literally the entrails, which Greek treats as the seat of pity. 'Shuts up his σπλάγχνα' in 3:17 is closing off compassion.",
  }],
  ["χρεία", "need", ["plenty", "desire", "duty"], { stem: "χρεί",}],
  ["αἷμα", "blood", ["water", "flesh", "wine"], { stem: "αἷμ",}],
  ["ὕδωρ", "water", ["blood", "wine", "oil"], {}],
  ["ὀφθαλμός", "an eye", ["an ear", "a hand", "a face"], {}],
  ["χείρ", "a hand", ["a foot", "an eye", "an arm"], {}],
  ["γλῶσσα", "a tongue, a language", ["a mouth", "a word", "a voice"], {}],
  ["ὄνομα", "a name", ["a word", "a title", "a sign"], { stem: "ὄνομ",}],
  ["λόγος", "a word, a message", ["a deed", "a name", "a thought"], {}],
  ["ἀρχή", "a beginning", ["an end", "a source", "a rule"], {}],
  ["ὥρα", "an hour, a time", ["a day", "a moment", "a season"], {}],
  ["ἡμέρα", "a day", ["a night", "a year", "an hour"], {}],
  ["αἰών", "an age", ["a moment", "a world", "a lifetime"], { familyId: "αἰων", familyGloss: "age, eternal" }],
  ["αἰώνιος", "eternal", ["temporary", "ancient", "endless"], { familyId: "αἰων" }],

  // ---- adjectives and quantity ----
  ["πᾶς", "all, every", ["none", "few", "some"], {}],
  ["ὅλος", "whole, entire", ["partial", "empty", "half"], {}],
  ["πολύς", "many, much", ["few", "all", "enough"], {
    stem: "πολ",
    notes: "Suppletive: πολύς beside πολλή and πολλῶν. Derivation produced a one-letter stem, which is no morpheme at all. The Attic course dropped this word rather than assert πολ-, because there it collided with πόλις; 1 John has no πόλις, so the split is stated here with that reasoning on the record.",
  }],
  ["μέγας", "great, large", ["small", "many", "high"], {}],
  ["μόνος", "only, alone", ["together", "many", "first"], {}],
  ["εἷς", "one", ["two", "first", "alone"], {}],
  ["τρεῖς", "three", ["two", "four", "many"], {}],
  ["πρῶτος", "first", ["last", "second", "chief"], {}],
  ["ἔσχατος", "last", ["first", "next", "final"], {}],
  ["καινός", "new", ["old", "young", "strange"], {}],
  ["παλαιός", "old", ["new", "ancient", "worn"], {}],
  ["ὅμοιος", "like, similar", ["different", "equal", "opposite"], {}],
  ["ἰσχυρός", "strong", ["weak", "great", "loud"], {}],
  ["βαρύς", "heavy, burdensome", ["light", "hard", "sharp"], {}],
  ["ἀρεστός", "pleasing", ["hateful", "useful", "necessary"], {}],
  ["ἡμέτερος", "our", ["your", "their", "his"], {}],
  ["οὐδείς", "no one, nothing", ["someone", "everyone", "another"], {}],
  ["μηδείς", "no one, nothing", ["anyone", "everyone", "something"], {}],
  ["ποταπός", "of what sort", ["how many", "how great", "which"], {}],

  // ---- function words: not taught, but every token needs a gloss ----
  ["ὁ", "the", ["a", "this", "that"], {}],
  ["καί", "and, also", ["but", "or", "for"], {}],
  ["αὐτός", "he, she, it; self", ["this", "that", "another"], {}],
  ["ἐν", "in", ["out of", "with", "to"], {}],
  ["ὅτι", "that, because", ["although", "unless", "when"], {}],
  ["ἐγώ", "I", ["you", "he", "we"], {}],
  ["σύ", "you", ["I", "he", "they"], {}],
  ["οὐ", "not", ["yes", "also", "still"], {}],
  ["οὐδέ", "and not, neither", ["and also", "or", "but"], {}],
  ["οὔπω", "not yet", ["already", "no longer", "again"], {}],
  ["μή", "not", ["indeed", "always", "already"], {}],
  ["μηδέ", "and not, nor", ["and also", "either", "but"], {}],
  ["οὗτος", "this", ["that", "the other", "such"], {}],
  ["ἐκεῖνος", "that one", ["this one", "the same", "another"], {}],
  ["ὅς", "who, which", ["what", "someone", "this"], {}],
  ["ὅστις", "whoever, which", ["no one", "someone", "this"], {}],
  ["τις", "someone, a certain one", ["no one", "everyone", "this"], {
    notes: "Unaccented and enclitic. Its accented twin τίς is the question word — the accent is the only thing that separates 'someone' from 'who?', which is why ids here cannot be generated from the letters alone.",
  }],
  ["τίς", "who? what?", ["where?", "when?", "how?"], { id: "tis-interrogative" }],
  ["ἐκ", "out of, from", ["into", "with", "toward"], {}],
  ["ἀπό", "from, away from", ["to", "with", "through"], {}],
  ["εἰς", "into, to", ["out of", "from", "beside"], {}],
  ["πρός", "toward, with", ["away from", "under", "against"], {}],
  ["περί", "concerning, about", ["against", "without", "beneath"], {}],
  ["μετά", "with; after", ["without", "before", "against"], {}],
  ["διά", "through; because of", ["without", "beside", "against"], {}],
  ["ὑπέρ", "on behalf of, for", ["against", "under", "beside"], {}],
  ["ἐπί", "on, upon", ["under", "beside", "within"], {}],
  ["κατά", "according to; against", ["with", "beyond", "before"], {}],
  ["ἕως", "until, as far as", ["since", "before", "during"], {}],
  ["ἔμπροσθεν", "before, in front of", ["behind", "beside", "within"], {}],
  ["ἐνώπιον", "before, in the presence of", ["behind", "far from", "against"], {}],
  ["ἔξω", "outside", ["inside", "beyond", "near"], {}],
  ["χάριν", "for the sake of", ["instead of", "despite", "besides"], {}],
  ["ἐάν", "if", ["when", "because", "unless"], {}],
  ["εἰ", "if", ["then", "because", "although"], {}],
  ["ἵνα", "in order that", ["because", "although", "when"], {}],
  ["ὅταν", "whenever, when", ["before", "because", "unless"], {}],
  ["ὅθεν", "from where, therefore", ["however", "meanwhile", "because"], {}],
  ["καθώς", "just as", ["unlike", "before", "unless"], {}],
  ["ὡς", "as, like", ["unlike", "than", "when"], { id: "hos-like" }],
  ["οὕτω(ς)", "thus, in this way", ["otherwise", "never", "again"], { id: "houtos-thus" }],
  ["πῶς", "how?", ["why?", "when?", "who?"], {}],
  ["ποῦ", "where?", ["when?", "how?", "which?"], {}],
  ["ἀλλά", "but", ["and", "or", "so"], {}],
  ["δέ", "but, and", ["therefore", "because", "or"], {}],
  ["γάρ", "for, because", ["but", "therefore", "although"], {}],
  ["ἤ", "or", ["and", "but", "nor"], {}],
  ["ἄν", "(marks a condition)", ["not", "indeed", "again"], {}],
  ["νῦν", "now", ["then", "later", "always"], {}],
  ["ἤδη", "already", ["not yet", "soon", "again"], {}],
  ["ἄρτι", "just now", ["long ago", "soon", "never"], {}],
  ["πάλιν", "again", ["never", "first", "still"], {}],
  ["πώποτε", "ever, at any time", ["never", "often", "once"], {}],
];

// ---------------------------------------------------------------------------

const seen = new Map();
const ids = new Map();
const words = ENTRIES.map(([lemma, gloss, distractors, extras = {}]) => {
  if (seen.has(lemma)) throw new Error(`duplicate lemma ${lemma}: "${seen.get(lemma)}" and "${gloss}"`);
  seen.set(lemma, gloss);
  if (distractors.length !== 3) throw new Error(`${lemma} has ${distractors.length} distractors, want 3`);
  if (distractors.includes(gloss)) throw new Error(`${lemma} lists its own gloss as a distractor`);
  if (new Set(distractors).size !== 3) throw new Error(`${lemma} has a repeated distractor`);

  // An explicit id is the escape hatch for words that transliterate alike.
  // Greek has several pairs a Latin slug cannot keep apart: τις "someone" and
  // τίς "who?" differ only by an accent; ὅς "who" and ὡς "as" only by ο/ω,
  // which the macron-stripping slug flattens. The collision guard below is what
  // surfaces them — it has caught three real ones in this glossary alone, one
  // of which was a genuine bug in the transliterator rather than a clash.
  const id = extras.id ?? slug(lemma);
  if (!id) throw new Error(`${lemma} transliterates to nothing`);
  if (ids.has(id)) throw new Error(`id collision "${id}": ${ids.get(id)} and ${lemma}`);
  ids.set(id, lemma);

  return { lemma, id, translit: translit(lemma), gloss, distractors, ...extras };
});

writeFileSync(
  resolve(HERE, "1john-glossary.json"),
  `${JSON.stringify(
    {
      _readme:
        "Hand-written glosses, distractors, families and teaching notes for 1 John. " +
        "Generated by build-1john-glossary.mjs — edit that, not this. Transliterations " +
        "and ids are derived mechanically from the Greek. Glosses are short TEACHING " +
        "meanings for a beginner reading 1 John, not lexicon entries. A Koine specialist " +
        "should read all of them.",
      words,
      passages: [],
    },
    null,
    1,
  )}\n`,
);
console.log(`wrote scripts/1john-glossary.json`);
console.log(`  ${words.length} entries · ${words.filter((w) => w.notes).length} teaching notes`);
console.log(`  ${new Set(words.map((w) => w.familyId).filter(Boolean)).size} curated families`);
