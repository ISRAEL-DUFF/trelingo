#!/usr/bin/env node
/**
 * The human contribution to the Matthew course.
 *
 * CHEAPER THAN LUKE, AND THAT IS A FACT ABOUT THE SYNOPTIC PROBLEM. Matthew is
 * 18,329 running words over 1,680 lemmas — 10.9 tokens per lemma, the best
 * ratio of any remaining Gospel. Mark, John and 1 John already gloss 1,154 of
 * those lemmas, so only 526 needed writing. Luke is almost exactly the same
 * length and needs 934, because Matthew overlaps Mark heavily where Luke
 * carries a large vocabulary of its own. When John was added, Luke was the
 * obvious next book; after John, Matthew costs little more than half as much.
 *
 * WHAT THE 526 ARE. Not evenly spread. 252 are nouns and a striking number of
 * those are concrete: farm tools, coins, spices, birds, cloth. Matthew's own
 * material — the genealogy, the Sermon on the Mount, the parables of the
 * kingdom, the woes — is where nearly all of it sits. Chapter 1 alone
 * introduces some forty proper names in fourteen verses of ancestry.
 *
 * Two of them are people this app already teaches from the other side: Βόες is
 * the Boaz of the Ruth track and Ῥούθ is Ruth herself, four verses into a Greek
 * gospel. Their notes say so.
 *
 * Usage:  node scripts/build-matthew-glossary.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { translit, slug } from "./lib/greek-translit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * Glosses already written for another Koine track.
 *
 * Reused rather than retyped, as John reused Mark's. A Greek word means what it
 * means; re-authoring 1,154 entries would only be 1,154 fresh chances to
 * disagree with myself. Where Matthew genuinely uses a word differently, the
 * entry below overrides the reused one.
 */
const REUSED = ["john-glossary.json", "mark-glossary.json", "1john-glossary.json", "koine-glossary.json"]
  .flatMap((f) => {
    try {
      return JSON.parse(readFileSync(resolve(HERE, f), "utf8")).words;
    } catch {
      return [];
    }
  });

/**
 * [lemma, gloss, [three distractors], extras?]
 *
 * Distractors sit in the answer's semantic neighbourhood without being
 * synonyms, and never come from its own family.
 */
const ENTRIES = [
  // ==========================================================================
  // The genealogy (1:1–17)
  //
  // Fourteen verses, some forty names, and almost nothing that transfers. They
  // are taught because the book cannot be read without them, and glossed with
  // the English spelling a reader will recognise from the Hebrew Bible rather
  // than a transliteration of the Greek.
  // ==========================================================================
  ["γένεσις", "origin, genealogy", ["an ending", "a journey", "a promise"], {
    notes: "βίβλος γενέσεως — 'the book of the genesis of Jesus Christ'. The same phrase opens the genealogies of Genesis in the Greek Old Testament, which is the point.",
  }],
  ["Θαμάρ", "Tamar", ["Rahab", "Ruth", "Bathsheba"], {
    notes: "The first of four women in a genealogy that otherwise names only fathers. Her story is Genesis 38, and it is not a decorous one.",
  }],
  ["Φαρές", "Perez", ["Zerah", "Hezron", "Ram"], {}],
  ["Ζάρα", "Zerah", ["Perez", "Hezron", "Amminadab"], {}],
  ["Ἑσρώμ", "Hezron", ["Ram", "Perez", "Nahshon"], {}],
  ["Ἀράμ", "Ram", ["Hezron", "Amminadab", "Nahshon"], {}],
  ["Ἀμιναδάβ", "Amminadab", ["Nahshon", "Ram", "Salmon"], {}],
  ["Ναασσών", "Nahshon", ["Amminadab", "Salmon", "Obed"], {}],
  ["Σαλμών", "Salmon", ["Boaz", "Obed", "Jesse"], {}],
  ["Ῥαχάβ", "Rahab", ["Tamar", "Ruth", "Bathsheba"], {}],
  ["Βόες", "Boaz", ["Obed", "Jesse", "Salmon"], {
    notes: "The Boaz of the Ruth track, four verses into a Greek gospel. Matthew spells him Βόες; the Septuagint of Ruth has Βοος.",
  }],
  ["Ῥούθ", "Ruth", ["Tamar", "Rahab", "Naomi"], {
    notes: "The Moabitess of the Hebrew track, named here as David's great-grandmother — which is what the book of Ruth spends four chapters getting to.",
  }],
  ["Ἰωβήδ", "Obed", ["Jesse", "Boaz", "Salmon"], {}],
  ["Ἰεσσαί", "Jesse", ["Obed", "Boaz", "Rehoboam"], {}],
  ["Οὐρίας", "Uriah", ["Solomon", "Jesse", "Rehoboam"], {
    notes: "Bathsheba is not named — she is 'the wife of Uriah'. Matthew keeps the accusation in the genealogy.",
  }],
  ["Ῥοβοάμ", "Rehoboam", ["Abijah", "Asa", "Jehoshaphat"], {}],
  ["Ἀβιά", "Abijah", ["Asa", "Rehoboam", "Jehoshaphat"], {}],
  ["Ἀσάφ", "Asa", ["Abijah", "Jehoshaphat", "Joram"], {}],
  ["Ἰωσαφάτ", "Jehoshaphat", ["Joram", "Asa", "Uzziah"], {}],
  ["Ἰωράμ", "Joram", ["Jehoshaphat", "Uzziah", "Jotham"], {}],
  ["Ὀζίας", "Uzziah", ["Jotham", "Ahaz", "Joram"], {}],
  ["Ἰωαθάμ", "Jotham", ["Ahaz", "Uzziah", "Hezekiah"], {}],
  ["Ἀχάζ", "Ahaz", ["Jotham", "Hezekiah", "Manasseh"], {}],
  ["Ἑζεκίας", "Hezekiah", ["Manasseh", "Ahaz", "Josiah"], {}],
  ["Μανασσῆς", "Manasseh", ["Amon", "Hezekiah", "Josiah"], {}],
  ["Ἀμώς", "Amon", ["Manasseh", "Josiah", "Jeconiah"], {}],
  ["Ἰωσίας", "Josiah", ["Jeconiah", "Amon", "Manasseh"], {}],
  ["Ἰεχονίας", "Jeconiah", ["Josiah", "Shealtiel", "Zerubbabel"], {}],
  ["μετοικεσία", "deportation, exile", ["a homecoming", "a pilgrimage", "a conquest"], {
    notes: "The hinge of the genealogy: Matthew counts fourteen generations to David, fourteen to the deportation, fourteen from it. The exile is treated as an event on the scale of the monarchy itself.",
  }],
  ["Βαβυλών", "Babylon", ["Egypt", "Assyria", "Persia"], {}],
  ["Σαλαθιήλ", "Shealtiel", ["Zerubbabel", "Jeconiah", "Abiud"], {}],
  ["Ζοροβαβέλ", "Zerubbabel", ["Shealtiel", "Abiud", "Eliakim"], {}],
  ["Ἀβιούδ", "Abiud", ["Eliakim", "Azor", "Zadok"], {}],
  ["Ἐλιακίμ", "Eliakim", ["Azor", "Abiud", "Zadok"], {}],
  ["Ἀζώρ", "Azor", ["Zadok", "Eliakim", "Achim"], {}],
  ["Σαδώκ", "Zadok", ["Achim", "Azor", "Eliud"], {}],
  ["Ἀχίμ", "Achim", ["Eliud", "Zadok", "Eleazar"], {}],
  ["Ἐλιούδ", "Eliud", ["Eleazar", "Achim", "Matthan"], {}],
  ["Ἐλεάζαρ", "Eleazar", ["Matthan", "Eliud", "Jacob"], {}],
  ["Ματθάν", "Matthan", ["Eleazar", "Eliud", "Achim"], {}],
  ["δεκατέσσαρες", "fourteen", ["twelve", "forty", "seventy"], {}],

  // ==========================================================================
  // The infancy narrative (1:18 – 2:23)
  // ==========================================================================
  ["μνηστεύομαι", "I am betrothed", ["I am married", "I am divorced", "I am widowed"], {}],
  ["ἐνθυμέομαι", "I consider, I ponder", ["I forget", "I announce", "I refuse"], {}],
  ["δειγματίζω", "I expose to public shame", ["I shelter", "I honour", "I conceal"], {
    notes: "1:19 — Joseph, unwilling to δειγματίσαι her, resolves to divorce her quietly. The word is about making an example of someone in public.",
  }],
  ["ὄναρ", "a dream", ["a vision", "a sign", "a voice"], {
    notes: "Indeclinable, and always in the phrase κατ' ὄναρ, 'in a dream'. Five times in Matthew and nowhere else in the New Testament — every warning in the infancy narrative arrives this way.",
  }],
  ["παρθένος", "a virgin, a young woman", ["a widow", "a bride", "a mother"], {}],
  ["Ἐμμανουήλ", "Immanuel", ["Messiah", "Emmaus", "Elijah"], {}],
  ["μάγος", "a magus, an astrologer", ["a priest", "a scribe", "a merchant"], {
    notes: "Persian court astrologers, not kings and not necessarily three — Matthew never counts them. 'Wise men' is a translator's softening.",
  }],
  ["ἡγέομαι", "I lead, I rule", ["I follow", "I serve", "I flee"], {}],
  ["οὐδαμῶς", "by no means", ["certainly", "perhaps", "always"], {}],
  ["ἀκριβόω", "I find out exactly", ["I guess", "I forget", "I conceal"], {}],
  ["ἀκριβῶς", "carefully, exactly", ["carelessly", "quickly", "rarely"], {}],
  ["ἐπάν", "when, as soon as", ["before", "unless", "although"], {}],
  ["λίβανος", "frankincense", ["myrrh", "gold", "oil"], {}],
  ["χρηματίζω", "I am warned, I am instructed (by God)", ["I am praised", "I am ignored", "I am sent"], {}],
  ["ἀνακάμπτω", "I return", ["I depart", "I remain", "I hurry"], {}],
  ["Αἴγυπτος", "Egypt", ["Babylon", "Syria", "Judea"], {}],
  ["τελευτή", "death, an end", ["a birth", "a beginning", "a reign"], {}],
  ["θυμόομαι", "I am enraged", ["I am calmed", "I am pleased", "I am afraid"], {}],
  ["ἀναιρέω", "I kill, I do away with", ["I rescue", "I heal", "I raise"], {}],
  ["διετής", "two years old", ["newborn", "grown", "elderly"], {}],
  ["κατωτέρω", "under, younger than", ["above", "beyond", "beside"], {}],
  ["Ἰερεμίας", "Jeremiah", ["Isaiah", "Daniel", "Jonah"], {}],
  ["Ῥαμά", "Ramah", ["Bethlehem", "Nazareth", "Rama"], {}],
  ["κλαυθμός", "weeping", ["laughter", "silence", "singing"], {
    notes: "Seven times, and six of those in the formula κλαυθμὸς καὶ ὁ βρυγμὸς τῶν ὀδόντων — 'weeping and gnashing of teeth', which is Matthew's own refrain for exclusion from the kingdom.",
  }],
  ["ὀδυρμός", "mourning, lamentation", ["rejoicing", "silence", "praise"], {}],
  ["Ῥαχήλ", "Rachel", ["Leah", "Ruth", "Tamar"], {}],
  ["Ἀρχέλαος", "Archelaus", ["Herod", "Pilate", "Caiaphas"], {}],
  ["βασιλεύω", "I reign, I am king", ["I serve", "I rebel", "I resign"], {}],
  ["κατοικέω", "I dwell, I settle", ["I depart", "I travel", "I visit"], {}],

  // ==========================================================================
  // John the Baptist and the temptation (3–4)
  // ==========================================================================
  ["ἔνδυμα", "clothing, a garment", ["a staff", "a belt", "a sandal"], {}],
  ["γέννημα", "offspring, brood", ["a parent", "a stranger", "a friend"], {}],
  ["ἔχιδνα", "a viper", ["a dove", "a lamb", "a locust"], {}],
  ["ὑποδείκνυμι", "I warn, I show", ["I conceal", "I forget", "I deny"], {}],
  ["ἐκκόπτω", "I cut down", ["I plant", "I prune", "I water"], {}],
  ["ἀξίνη", "an axe", ["a plough", "a sickle", "a hammer"], {}],
  ["πτύον", "a winnowing fork", ["a sickle", "a plough", "a yoke"], {}],
  ["διακαθαρίζω", "I clean out thoroughly", ["I fill", "I scatter", "I sow"], {}],
  ["ἅλων", "a threshing floor", ["a vineyard", "a granary", "a field"], {}],
  ["ἀποθήκη", "a barn, a storehouse", ["a threshing floor", "a market", "a stable"], {}],
  ["ἄχυρον", "chaff", ["grain", "straw", "seed"], {}],
  ["κατακαίω", "I burn up", ["I extinguish", "I kindle", "I scorch"], {}],
  ["διακωλύω", "I try to prevent", ["I permit", "I command", "I ignore"], {}],
  ["πρέπω", "it is fitting", ["it is forbidden", "it is doubtful", "it is late"], {}],
  ["ἀνάγω", "I lead up", ["I bring down", "I send away", "I follow"], {}],
  ["πτερύγιον", "a pinnacle", ["a courtyard", "a gate", "a foundation"], {}],
  ["ἐκπειράζω", "I put to the test", ["I trust", "I obey", "I praise"], {}],
  ["λατρεύω", "I serve, I worship", ["I command", "I abandon", "I doubt"], {}],
  ["ὕστερος", "later, afterwards", ["earlier", "immediately", "never"], {}],
  ["Ναζαρά", "Nazareth", ["Capernaum", "Bethlehem", "Nazirite"], {}],
  ["Ναζαρέθ", "Nazareth", ["Capernaum", "Bethany", "Bethlehem"], {}],
  ["παραθαλάσσιος", "beside the sea", ["inland", "on a hill", "in a desert"], {}],
  ["Ζαβουλών", "Zebulun", ["Naphtali", "Judah", "Benjamin"], {}],
  ["Νεφθαλίμ", "Naphtali", ["Zebulun", "Ephraim", "Manasseh"], {}],
  ["ἀμφίβληστρον", "a casting net", ["a dragnet", "a rope", "an oar"], {}],
  ["Συρία", "Syria", ["Galilee", "Judea", "Egypt"], {}],
  ["μαλακία", "sickness, weakness", ["health", "strength", "wealth"], {}],
  ["βάσανος", "torment, severe pain", ["comfort", "rest", "relief"], {}],
  ["συνέχω", "I afflict, I grip", ["I release", "I heal", "I avoid"], {}],
  ["σεληνιάζομαι", "I am epileptic", ["I am blind", "I am deaf", "I am lame"], {
    notes: "Literally 'moonstruck' — the ancient name for the falling sickness, from the belief that the moon caused it. Rendered 'lunatic' in older English for exactly the same reason.",
  }],

  // ==========================================================================
  // The Sermon on the Mount (5–7)
  //
  // The single densest patch of new vocabulary in the book, and the reason
  // Matthew costs anything at all beyond Mark.
  // ==========================================================================
  ["πραΰς", "gentle, meek", ["harsh", "proud", "violent"], {
    notes: "Not weakness. The word is used of a horse broken to the bridle — strength under control.",
  }],
  ["ἐλεήμων", "merciful", ["cruel", "just", "generous"], {}],
  ["εἰρηνοποιός", "a peacemaker", ["a warrior", "a judge", "a witness"], {}],
  ["μωραίνω", "I become tasteless, I make foolish", ["I season", "I sweeten", "I preserve"], {}],
  ["καταπατέω", "I trample underfoot", ["I lift up", "I honour", "I preserve"], {}],
  ["λάμπω", "I shine", ["I fade", "I darken", "I flicker"], {}],
  ["νομίζω", "I suppose, I think", ["I know", "I prove", "I deny"], {}],
  ["ἰῶτα", "an iota (the smallest letter)", ["a word", "a scroll", "a chapter"], {
    notes: "5:18 — not one ἰῶτα or κεραία will pass from the law. The iota stands for the Hebrew yod, the smallest letter in the alphabet.",
  }],
  ["κεραία", "a stroke, a serif", ["a page", "a seal", "a margin"], {}],
  ["ἐλάχιστος", "least, smallest", ["greatest", "first", "chief"], {}],
  ["ἀρχαῖος", "ancient, of old", ["modern", "future", "recent"], {}],
  ["ῥακά", "raka (an Aramaic insult)", ["a blessing", "a greeting", "a title"], {
    notes: "Left untranslated by Matthew himself. Roughly 'empty-head' — contemptuous, but the point of the saying is that the insult is treated as a capital matter.",
  }],
  ["μωρός", "foolish", ["wise", "learned", "clever"], {}],
  ["θυσιαστήριον", "an altar", ["a temple", "a courtyard", "a synagogue"], {}],
  ["διαλλάσσομαι", "I am reconciled", ["I quarrel", "I depart", "I accuse"], {}],
  ["εὐνοέω", "I make friends, I settle", ["I quarrel", "I sue", "I flee"], {}],
  ["ἀντίδικος", "an accuser, an opponent at law", ["an advocate", "a witness", "a judge"], {}],
  ["κριτής", "a judge", ["an accuser", "a witness", "a defendant"], {}],
  ["ταχύς", "quick, quickly", ["slow", "late", "never"], {}],
  ["ἐπιθυμέω", "I desire, I covet", ["I refuse", "I despise", "I forget"], {}],
  ["ἐξαιρέω", "I tear out, I rescue", ["I put in", "I keep", "I heal"], {}],
  ["μέλος", "a limb, a member", ["a whole", "a garment", "a wound"], {}],
  ["παρεκτός", "except for", ["including", "because of", "instead of"], {}],
  ["ἐπιορκέω", "I break an oath", ["I swear truly", "I keep faith", "I testify"], {}],
  ["ὅλως", "at all", ["partly", "rarely", "sometimes"], {
    // ὅλος "whole" is already taught and transliterates identically. The id
    // guard caught the collision; the adverb takes an explicit id rather than
    // silently overwriting the adjective's card.
    id: "holos-adv",
  }],
  ["ὑποπόδιον", "a footstool", ["a throne", "a table", "a step"], {}],
  ["μέλας", "black", ["white", "red", "grey"], {}],
  ["ἀνθίστημι", "I resist, I oppose", ["I yield", "I assist", "I flee"], {}],
  ["ῥαπίζω", "I strike, I slap", ["I caress", "I heal", "I bind"], {}],
  ["σιαγών", "a cheek, a jaw", ["a shoulder", "a forehead", "a hand"], {}],
  ["μίλιον", "a mile", ["a stone's throw", "a day's journey", "a stadium"], {}],
  ["ἀποστρέφω", "I turn away", ["I welcome", "I approach", "I return"], {}],
  ["δανείζω", "I lend; (middle) I borrow", ["I give", "I steal", "I repay"], {}],
  ["βρέχω", "I send rain", ["I dry", "I scorch", "I freeze"], {}],
  ["ἄδικος", "unjust, unrighteous", ["just", "merciful", "generous"], {}],
  ["ἐθνικός", "a Gentile, a pagan", ["a Jew", "a priest", "a proselyte"], {}],
  ["οὐράνιος", "heavenly", ["earthly", "human", "hidden"], {
    notes: "Matthew's characteristic phrase is ὁ πατὴρ ὑμῶν ὁ οὐράνιος, 'your heavenly Father' — where Mark and Luke more often say simply 'God'.",
  }],
  ["ἐλεημοσύνη", "alms, charitable giving", ["a tithe", "a sacrifice", "a debt"], {}],
  ["σαλπίζω", "I sound a trumpet", ["I whisper", "I sing", "I knock"], {}],
  ["ῥύμη", "a street, a lane", ["a square", "a gate", "a rooftop"], {}],
  ["πλατύς", "a street (as a broad way)", ["an alley", "a courtyard", "a wall"], {}],
  ["ταμεῖον", "an inner room", ["a courtyard", "a rooftop", "a doorway"], {}],
  ["βατταλογέω", "I babble, I heap up empty words", ["I keep silent", "I speak plainly", "I sing"], {}],
  ["πολυλογία", "many words, wordiness", ["silence", "brevity", "eloquence"], {}],
  ["εἰσακούω", "I am heard, I listen to", ["I ignore", "I speak", "I refuse"], {}],
  ["ἐπιούσιος", "daily, for the coming day", ["yesterday's", "abundant", "rationed"], {
    notes: "The hardest word in the Lord's Prayer. It occurs nowhere else in Greek literature before this, so 'daily' is a reasoned guess rather than a translation.",
  }],
  ["ὀφειλέτης", "a debtor", ["a creditor", "a lender", "a witness"], {}],
  ["ὀφείλημα", "a debt", ["a payment", "a gift", "a wage"], {}],
  ["εἰσφέρω", "I bring into, I lead into", ["I take out", "I keep back", "I follow"], {}],
  ["ῥύομαι", "I rescue, I deliver", ["I abandon", "I accuse", "I bind"], {}],
  ["σκυθρωπός", "gloomy-faced", ["cheerful", "calm", "pale"], {}],
  ["ἀφανίζω", "I disfigure; I destroy", ["I adorn", "I preserve", "I reveal"], {}],
  ["κρυφαῖος", "hidden, secret", ["open", "public", "obvious"], {}],
  ["θησαυρίζω", "I store up treasure", ["I spend", "I give away", "I lose"], {}],
  ["σής", "a moth", ["rust", "a worm", "a locust"], {}],
  ["διορύσσω", "I break in (by digging through)", ["I lock", "I guard", "I build"], {
    notes: "A mud-brick wall is dug through rather than forced. The thief in 6:19 does not pick a lock; he makes a hole.",
  }],
  ["ἁπλοῦς", "healthy, single, clear", ["diseased", "double", "dim"], {}],
  ["φωτεινός", "full of light", ["dark", "shadowed", "dim"], {}],
  ["σκοτεινός", "dark", ["bright", "clear", "shining"], {}],
  ["ἀντέχομαι", "I hold fast to", ["I let go of", "I despise", "I forget"], {}],
  ["καταφρονέω", "I despise, I think little of", ["I honour", "I obey", "I fear"], {}],
  ["μαμωνᾶς", "mammon, wealth", ["poverty", "a treasury", "a wage"], {
    notes: "An Aramaic word for property or wealth, left untranslated. Matthew treats it as the name of a rival master, not merely as money.",
  }],
  ["μεριμνάω", "I am anxious, I worry", ["I am calm", "I trust", "I forget"], {}],
  ["τρέφω", "I feed, I nourish", ["I starve", "I hunt", "I sell"], {}],
  ["καταμανθάνω", "I observe closely", ["I overlook", "I forget", "I guess"], {}],
  ["κρίνον", "a lily", ["a thorn", "a vine", "a reed"], {}],
  ["νήθω", "I spin (thread)", ["I weave", "I sew", "I dye"], {}],
  ["ἀμφιέννυμι", "I clothe", ["I strip", "I wash", "I feed"], {}],
  ["κλίβανος", "an oven", ["a hearth", "a lamp", "a forge"], {}],
  ["ὀλιγόπιστος", "of little faith", ["faithful", "unbelieving", "devout"], {
    notes: "Matthew's own word — four of its five New Testament occurrences are here. It is a rebuke to disciples, never to outsiders.",
  }],
  ["ἐπιζητέω", "I seek after, I crave", ["I avoid", "I abandon", "I find"], {}],
  ["χρῄζω", "I need", ["I possess", "I spend", "I refuse"], {}],
  ["αὔριον", "tomorrow", ["yesterday", "today", "soon"], {}],
  ["ἀρκετός", "enough, sufficient", ["too little", "excessive", "lacking"], {}],
  ["κακία", "trouble, evil", ["kindness", "peace", "ease"], {}],
  ["κάρφος", "a speck, a splinter", ["a beam", "a stone", "a thorn"], {}],
  ["δοκός", "a beam, a plank", ["a speck", "a nail", "a rope"], {}],
  ["κατανοέω", "I notice, I consider", ["I ignore", "I forget", "I dismiss"], {}],
  ["κύων", "a dog", ["a wolf", "a sheep", "a pig"], {}],
  ["μαργαρίτης", "a pearl", ["a coin", "a jewel", "a stone"], {}],
  ["κρούω", "I knock", ["I open", "I enter", "I depart"], {}],
  ["ἐπιδίδωμι", "I hand over, I give", ["I withhold", "I take", "I sell"], {}],
  ["δόμα", "a gift", ["a debt", "a wage", "a loan"], { id: "doma-gift" }],
  ["στενός", "narrow", ["wide", "long", "short"], {}],
  ["πύλη", "a gate", ["a wall", "a road", "a tower"], {}],
  ["εὐρύχωρος", "spacious, broad", ["narrow", "cramped", "short"], {}],
  ["πλατεῖα", "broad", ["narrow", "steep", "straight"], {}],
  ["ἅρπαξ", "ravenous, a robber", ["gentle", "generous", "harmless"], {}],
  ["σταφυλή", "a bunch of grapes", ["a fig", "an olive", "a thorn"], {}],
  ["τρίβολος", "a thistle", ["a vine", "a fig tree", "a reed"], {}],
  ["σαπρός", "bad, rotten", ["sound", "ripe", "fresh"], {}],
  ["ἀποχωρέω", "I depart, I go away", ["I approach", "I remain", "I return"], {}],
  ["φρόνιμος", "wise, prudent", ["foolish", "ignorant", "reckless"], {}],
  ["θεμελιόω", "I found, I lay a foundation", ["I demolish", "I decorate", "I roof"], {}],
  ["βροχή", "rain", ["drought", "wind", "hail"], {}],
  ["ἄμμος", "sand", ["rock", "clay", "soil"], {}],
  ["πτῶσις", "a fall, a collapse", ["a rising", "a repair", "a foundation"], {}],

  // ==========================================================================
  // Healings and mission (8–10)
  // ==========================================================================
  ["δεινῶς", "terribly, grievously", ["mildly", "slightly", "rarely"], {}],
  ["ἑκατόνταρχος", "a centurion", ["a governor", "a tribune", "a soldier"], {}],
  ["ἑκατοντάρχης", "a centurion", ["a governor", "a legate", "a guard"], {}],
  ["κελεύω", "I order, I command", ["I request", "I permit", "I forbid"], {}],
  ["δυσμή", "the west (where the sun sets)", ["the east", "the north", "the south"], {}],
  ["ἐξώτερος", "outer, outermost", ["inner", "upper", "lower"], {}],
  ["βρυγμός", "grinding, gnashing", ["silence", "laughter", "sighing"], {}],
  ["ἀλώπηξ", "a fox", ["a wolf", "a dog", "a jackal"], {}],
  ["φωλεός", "a den, a hole", ["a nest", "a cave", "a stable"], {}],
  ["κατασκήνωσις", "a nest, a roosting place", ["a den", "a stable", "a perch"], {}],
  ["θάπτω", "I bury", ["I raise", "I mourn", "I embalm"], {}],
  ["καλύπτω", "I cover, I hide", ["I uncover", "I reveal", "I open"], {}],
  ["Γαδαρηνός", "Gadarene, of Gadara", ["Galilean", "Samaritan", "Syrian"], {}],
  ["χαλεπός", "violent, hard", ["gentle", "easy", "quiet"], {}],
  ["δαίμων", "a demon", ["an angel", "a spirit", "a prophet"], {}],
  ["ἐνθύμησις", "a thought, a reasoning", ["a word", "a deed", "a decision"], {}],
  ["ἱνατί", "why?", ["how?", "when?", "where?"], {}],
  ["ἔλεος", "mercy", ["judgement", "sacrifice", "justice"], {
    notes: "9:13 and 12:7 both quote Hosea: ἔλεος θέλω καὶ οὐ θυσίαν, 'I desire mercy and not sacrifice'. Only Matthew uses the line, and he uses it twice.",
  }],
  ["ἀμφότεροι", "both", ["neither", "each", "all"], {}],
  ["αἱμορροέω", "I have a flow of blood", ["I am healed", "I am feverish", "I am lame"], {}],
  ["αὐλητής", "a flute player", ["a singer", "a mourner", "a drummer"], {}],
  ["φήμη", "a report, news", ["a rumour denied", "a silence", "a command"], {}],
  ["ῥίπτω", "I throw down, I cast", ["I lift", "I carry", "I catch"], {}],
  ["ἐργάτης", "a worker, a labourer", ["an owner", "a merchant", "a steward"], {}],
  ["κτάομαι", "I acquire, I get", ["I lose", "I give away", "I spend"], {}],
  ["ἄργυρος", "silver", ["gold", "bronze", "iron"], {}],
  ["κονιορτός", "dust", ["mud", "ash", "sand"], {}],
  ["ἀνεκτός", "bearable, tolerable", ["unbearable", "pleasant", "certain"], {}],
  ["Σόδομα", "Sodom", ["Gomorrah", "Babylon", "Nineveh"], {}],
  ["Γόμορρα", "Gomorrah", ["Sodom", "Tyre", "Sidon"], {}],
  ["ἀκέραιος", "innocent, unmixed", ["cunning", "guilty", "harmful"], {}],
  ["οἰκιακός", "a member of the household", ["a stranger", "a guest", "a servant"], {}],
  ["ἐπικαλέω", "I call by a name, I nickname", ["I forget", "I greet", "I dismiss"], {}],
  ["στρουθίον", "a sparrow", ["a dove", "an eagle", "a raven"], {}],
  ["ἀσσάριον", "an assarion (a small coin)", ["a denarius", "a talent", "a drachma"], {}],
  ["ἄνευ", "without", ["with", "beside", "through"], {}],
  ["ἀριθμέω", "I count, I number", ["I lose", "I weigh", "I estimate"], {}],
  ["διχάζω", "I set at variance, I divide", ["I unite", "I reconcile", "I gather"], {}],
  ["ψυχρός", "cold", ["hot", "warm", "boiling"], {}],
  ["μόνον", "only", ["also", "never", "always"], {}],

  // ==========================================================================
  // John's question, the yoke, the sabbath (11–12)
  // ==========================================================================
  ["διατάσσω", "I instruct, I give orders", ["I request", "I obey", "I forget"], {}],
  ["δεσμωτήριον", "a prison", ["a courtroom", "a palace", "a barracks"], {}],
  ["προσδοκάω", "I wait for, I expect", ["I dismiss", "I forget", "I fear"], {}],
  ["εὐαγγελίζω", "I bring good news", ["I warn", "I accuse", "I mourn"], {}],
  ["μαλακός", "soft", ["rough", "coarse", "heavy"], {}],
  ["γεννητός", "born (of)", ["unborn", "created", "adopted"], {}],
  ["βιάζω", "I suffer violence, I force", ["I yield", "I soothe", "I persuade"], {}],
  ["βιαστής", "a violent person", ["a peacemaker", "a prophet", "a beggar"], {}],
  ["προσφωνέω", "I call out to", ["I ignore", "I whisper", "I answer"], {}],
  ["αὐλέω", "I play the flute", ["I sing", "I dance", "I mourn"], {}],
  ["φάγος", "a glutton", ["an ascetic", "a host", "a cook"], {}],
  ["οἰνοπότης", "a drunkard", ["an abstainer", "a vintner", "a host"], {}],
  ["δικαιόω", "I justify, I vindicate", ["I condemn", "I accuse", "I punish"], {}],
  ["Χοραζίν", "Chorazin", ["Bethsaida", "Capernaum", "Tyre"], {}],
  ["σάκκος", "sackcloth", ["linen", "wool", "silk"], {}],
  ["σποδός", "ashes", ["dust", "soot", "sand"], {}],
  ["ᾅδης", "Hades, the realm of the dead", ["heaven", "paradise", "the grave"], {}],
  ["σοφός", "wise", ["foolish", "young", "learned"], {}],
  ["συνετός", "intelligent, understanding", ["foolish", "simple", "ignorant"], {}],
  ["νήπιος", "an infant, a child", ["an elder", "a sage", "a teacher"], {}],
  ["εὐδοκία", "good pleasure, favour", ["displeasure", "duty", "chance"], {}],
  ["φορτίζω", "I load, I burden", ["I unload", "I lighten", "I carry"], {}],
  ["ζυγός", "a yoke", ["a burden", "a plough", "a harness"], {}],
  ["ταπεινός", "humble, lowly", ["proud", "exalted", "noble"], {}],
  ["ἀνάπαυσις", "rest", ["labour", "haste", "worry"], {}],
  ["χρηστός", "kind, easy", ["harsh", "heavy", "bitter"], {}],
  ["ἐλαφρός", "light (in weight)", ["heavy", "large", "costly"], {}],
  ["φορτίον", "a burden, a load", ["a rest", "a gift", "a wage"], {}],
  ["βεβηλόω", "I profane", ["I hallow", "I honour", "I keep"], {}],
  ["ἀναίτιος", "innocent, guiltless", ["guilty", "accused", "condemned"], {}],
  ["καταδικάζω", "I condemn", ["I acquit", "I pardon", "I release"], {}],
  ["ἐμπίπτω", "I fall into", ["I climb out", "I leap over", "I avoid"], {}],
  ["βόθυνος", "a pit", ["a hill", "a well", "a ditch bank"], {}],
  ["αἱρετίζω", "I choose", ["I reject", "I ignore", "I send"], {}],
  ["ἐρίζω", "I quarrel, I wrangle", ["I agree", "I keep silent", "I yield"], {}],
  ["λίνον", "a wick, flax", ["a lamp", "an oil jar", "a cord"], {}],
  ["τύφομαι", "I smoulder", ["I blaze", "I go out", "I glow"], {}],
  ["νῖκος", "victory", ["defeat", "a truce", "a battle"], {}],
  ["ἐρημόομαι", "I am laid waste", ["I am rebuilt", "I am settled", "I am defended"], {}],
  ["φθάνω", "I arrive, I come upon", ["I delay", "I depart", "I follow"], {}],
  ["ἀργός", "idle, careless", ["diligent", "useful", "urgent"], {}],
  ["Ἰωνᾶς", "Jonah", ["Jeremiah", "Isaiah", "Elijah"], {
    notes: "The 'sign of Jonah' — three days in the fish read as three days in the earth. The Hebrew track teaches the book itself.",
  }],
  ["κῆτος", "a sea creature, a great fish", ["a bird", "a serpent", "a beast of the field"], {}],
  ["Νινευίτης", "a Ninevite", ["a Sodomite", "a Galilean", "a Samaritan"], {}],
  ["βασίλισσα", "a queen", ["a princess", "a servant", "a prophetess"], {}],
  ["νότος", "the south", ["the north", "the east", "the west"], {}],
  ["πέρας", "an end, a limit", ["a centre", "a beginning", "a border town"], {}],
  ["ἄνυδρος", "waterless, dry", ["fertile", "flooded", "green"], {}],
  ["σχολάζω", "I stand empty, I am unoccupied", ["I am full", "I am busy", "I am locked"], {}],
  ["σαρόω", "I sweep", ["I soil", "I fill", "I build"], {}],
  ["κοσμέω", "I put in order, I adorn", ["I ruin", "I empty", "I scatter"], {}],

  // ==========================================================================
  // The parables of the kingdom (13)
  // ==========================================================================
  ["ἀναπληρόω", "I fulfil, I complete", ["I break", "I begin", "I empty"], {}],
  ["προφητεία", "a prophecy", ["a law", "a proverb", "a psalm"], {}],
  ["παχύνομαι", "I grow dull, I become fat", ["I sharpen", "I awaken", "I soften"], {}],
  ["βαρέως", "with difficulty, dully", ["easily", "quickly", "gladly"], {}],
  ["καμμύω", "I close (the eyes)", ["I open", "I raise", "I rub"], {}],
  ["δή", "indeed, now", ["never", "perhaps", "hardly"], { id: "de-indeed" }],
  ["ζιζάνιον", "a weed, a darnel", ["wheat", "a vine", "a thorn"], {
    notes: "A specific weed that looks like wheat until it heads — which is why the parable's servants are told to wait rather than pull it. 'Tares' in older English.",
  }],
  ["ἐπισπείρω", "I sow on top of, I oversow", ["I harvest", "I plough", "I weed"], {}],
  ["συναυξάνομαι", "I grow together", ["I wither", "I separate", "I ripen alone"], {}],
  ["ἐκριζόω", "I uproot", ["I plant", "I water", "I graft"], {}],
  ["ἅμα", "together with, at the same time", ["apart from", "before", "after"], {}],
  ["θεριστής", "a reaper, a harvester", ["a sower", "a labourer", "a landowner"], {}],
  ["δέσμη", "a bundle", ["a sheaf loose", "a heap", "a sack"], {}],
  ["συλλέγω", "I gather up, I collect", ["I scatter", "I sow", "I discard"], {}],
  ["ἐγκρύπτω", "I hide inside, I mix in", ["I reveal", "I remove", "I sift"], {}],
  ["ἄλευρον", "flour, meal", ["dough", "bran", "grain"], {}],
  ["σάτον", "a seah (a dry measure)", ["a talent", "a denarius", "a cubit"], {}],
  ["ζυμόω", "I leaven", ["I purge", "I bake", "I knead"], {}],
  ["ἐρεύγομαι", "I utter, I pour out", ["I swallow", "I withhold", "I whisper"], {}],
  ["διασαφέω", "I explain clearly", ["I obscure", "I repeat", "I deny"], {}],
  ["συντέλεια", "the consummation, the end", ["the beginning", "the middle", "the delay"], {
    notes: "Always in συντέλεια τοῦ αἰῶνος, 'the end of the age'. The phrase is Matthew's — it is how the book closes, in 28:20.",
  }],
  ["κάμινος", "a furnace", ["a hearth", "an oven", "a forge"], {}],
  ["ἐκλάμπω", "I shine out", ["I fade", "I darken", "I flicker"], {}],
  ["ἔμπορος", "a merchant", ["a farmer", "a fisherman", "a steward"], {}],
  ["σαγήνη", "a dragnet", ["a casting net", "a rope", "a basket"], {}],
  ["ἀναβιβάζω", "I haul up", ["I sink", "I cast out", "I lower"], {}],
  ["ἄγγος", "a container, a vessel", ["a net", "a boat", "an oar"], {}],
  ["ἀφορίζω", "I separate, I set apart", ["I gather", "I mix", "I include"], {}],
  ["μαθητεύω", "I make a disciple, I am discipled", ["I abandon", "I teach badly", "I forget"], {
    notes: "The verb of the Great Commission — μαθητεύσατε πάντα τὰ ἔθνη, 'make disciples of all nations' (28:19). It is a Matthean word.",
  }],
  ["μεταίρω", "I depart, I move away", ["I arrive", "I settle", "I return"], {}],

  // ==========================================================================
  // Herod, the feeding, the Canaanite woman (14–15)
  // ==========================================================================
  ["τετραάρχης", "a tetrarch", ["a king", "a governor", "a prefect"], {}],
  ["ἀποτίθημι", "I put away, I lay aside", ["I take up", "I keep", "I display"], {}],
  ["προβιβάζω", "I prompt, I urge forward", ["I restrain", "I dissuade", "I follow"], {}],
  ["καταποντίζομαι", "I sink, I am drowned", ["I float", "I swim", "I rise"], {}],
  ["διστάζω", "I doubt, I hesitate", ["I trust", "I decide", "I rush"], {}],
  ["διασῴζω", "I bring safely through, I heal", ["I endanger", "I abandon", "I wound"], {}],
  ["παραβαίνω", "I transgress, I break", ["I keep", "I fulfil", "I honour"], {}],
  ["ψευδομαρτυρία", "false testimony", ["true witness", "an oath", "a confession"], {}],
  ["φυτεία", "a plant, a planting", ["a harvest", "a field", "a root"], {}],
  ["ὁδηγός", "a guide", ["a follower", "a stranger", "a traveller"], {}],
  ["φράζω", "I explain", ["I conceal", "I ask", "I repeat"], {}],
  ["ἀκμήν", "still, yet", ["already", "never", "soon"], {}],
  ["Χαναναῖος", "Canaanite", ["Samaritan", "Galilean", "Syrian"], {}],
  ["Μαγαδάν", "Magadan", ["Magdala", "Bethsaida", "Gennesaret"], {}],

  // ==========================================================================
  // Peter's confession, the transfiguration, the church (16–18)
  // ==========================================================================
  ["ἐπιδείκνυμι", "I show, I point out", ["I hide", "I deny", "I destroy"], {}],
  ["εὐδία", "fair weather", ["a storm", "rain", "cloud"], {}],
  ["πυρράζω", "I am fiery red", ["I am pale", "I darken", "I clear"], {}],
  ["Βαριωνᾶ", "Bar-Jonah (son of Jonah)", ["Bartimaeus", "Barabbas", "Barnabas"], {}],
  ["κατισχύω", "I prevail against, I overpower", ["I yield", "I defend", "I flee"], {}],
  ["κλείς", "a key", ["a lock", "a gate", "a bolt"], {}],
  ["ἵλεως", "merciful; God forbid!", ["cruel", "certainly", "indifferent"], {
    notes: "16:22 — Peter's ἵλεώς σοι, κύριε is an idiom of protest: 'may God be merciful to you', that is, 'this must never happen to you'.",
  }],
  ["πρᾶξις", "a deed, a practice", ["a word", "a thought", "an intention"], {}],
  ["ὅραμα", "a vision", ["a dream", "a sign", "a parable"], {}],
  ["διαστρέφω", "I pervert, I twist", ["I straighten", "I restore", "I guide"], {}],
  ["ὀλιγοπιστία", "littleness of faith", ["great faith", "unbelief", "certainty"], {}],
  ["ἔνθεν", "from here", ["to here", "from there", "nowhere"], {}],
  ["ἀδυνατέω", "it is impossible", ["it is certain", "it is easy", "it is likely"], {}],
  ["συστρέφω", "I gather together", ["I scatter", "I depart", "I hide"], {}],
  ["δίδραχμον", "a two-drachma coin (the temple tax)", ["a denarius", "a talent", "a mite"], {}],
  ["προφθάνω", "I anticipate, I speak first", ["I follow", "I delay", "I repeat"], {}],
  ["ἄγκιστρον", "a fish hook", ["a net", "a line", "a spear"], {}],
  ["στατήρ", "a stater (a four-drachma coin)", ["an assarion", "a denarius", "a talent"], {}],
  ["ταπεινόω", "I humble, I lower", ["I exalt", "I honour", "I raise"], {}],
  ["κρεμάννυμι", "I hang", ["I release", "I bury", "I lift"], {}],
  ["πέλαγος", "the open sea, the deep", ["the shore", "a river", "a harbour"], {}],
  ["ἀνάγκη", "necessity", ["a choice", "an accident", "a delay"], {}],
  ["ἐνενήκοντα", "ninety", ["nineteen", "nine", "seventy"], {}],
  ["ἐννέα", "nine", ["ninety", "nineteen", "seven"], {}],
  ["συμφωνέω", "I agree", ["I dispute", "I refuse", "I forget"], {}],
  ["πρᾶγμα", "a matter, a thing", ["a person", "a word", "a place"], {}],
  ["ποσάκις", "how often?", ["how many?", "how long?", "why?"], {}],
  ["ἑπτάκις", "seven times", ["seventy times", "twice", "once"], {}],
  ["ἑβδομηκοντάκις", "seventy times", ["seven times", "seventeen times", "twice"], {}],
  ["συναίρω", "I settle accounts", ["I open an account", "I borrow", "I forgive a debt"], {}],
  ["μύριοι", "ten thousand", ["a thousand", "a hundred", "countless few"], {}],
  ["τάλαντον", "a talent (an enormous sum)", ["a denarius", "an assarion", "a drachma"], {
    notes: "Roughly six thousand denarii — some twenty years of a labourer's wages. Ten thousand of them is a deliberately unpayable number, and the joke of the parable is that the same man then throttles a colleague over a hundred.",
  }],
  ["μακροθυμέω", "I am patient", ["I am hasty", "I am angry", "I give up"], {}],
  ["δάνειον", "a loan, a debt", ["a gift", "a wage", "a fine"], {}],
  ["σύνδουλος", "a fellow slave", ["a master", "a freeman", "a steward"], {}],
  ["ὀφειλή", "a debt owed", ["a payment", "a credit", "a gift"], {}],
  ["βασανιστής", "a torturer, a jailer", ["a judge", "a guard", "a physician"], {}],

  // ==========================================================================
  // Judea, the rich young man, the vineyard (19–20)
  // ==========================================================================
  ["ἕνεκα", "because of, for the sake of", ["in spite of", "instead of", "along with"], {}],
  ["κολλάομαι", "I am joined to, I cling", ["I am separated", "I depart", "I resist"], {}],
  ["εὐνοῦχος", "a eunuch", ["a priest", "a soldier", "a servant"], {}],
  ["εὐνουχίζω", "I make a eunuch of", ["I marry", "I release", "I ordain"], {}],
  ["ὑπάρχω", "I possess; I exist", ["I lack", "I lose", "I owe"], {}],
  ["τρύπημα", "an eye (of a needle), a hole", ["a thread", "a point", "a seam"], {}],
  ["παλιγγενεσία", "the renewal, the regeneration", ["the destruction", "the present age", "the beginning"], {}],
  ["φυλή", "a tribe", ["a nation", "a family", "a city"], {}],
  ["μισθόομαι", "I hire", ["I dismiss", "I pay", "I serve"], {}],
  ["ἑνδέκατος", "eleventh", ["twelfth", "ninth", "first"], {}],
  ["ἐπίτροπος", "a foreman, a steward", ["an owner", "a labourer", "a tenant"], {}],
  ["βάρος", "weight, burden", ["lightness", "rest", "a wage"], {}],
  ["καύσων", "scorching heat", ["frost", "rain", "shade"], {}],
  ["ἑταῖρος", "friend, comrade", ["enemy", "stranger", "master"], {
    notes: "Matthew uses it three times and every one is edged — to the grumbling labourer, to the guest with no wedding garment, and to Judas in the garden. 'Friend' is not warmth here.",
  }],
  ["ἀδικέω", "I wrong, I treat unjustly", ["I help", "I repay", "I forgive"], {}],

  // ==========================================================================
  // Jerusalem: entry, temple, controversy, woes (21–23)
  // ==========================================================================
  ["ἐπιβαίνω", "I mount, I get on", ["I dismount", "I follow", "I lead"], {}],
  ["ὑποζύγιον", "a donkey, a beast of burden", ["a horse", "an ox", "a camel"], {}],
  ["συντάσσω", "I direct, I appoint", ["I forbid", "I forget", "I obey"], {}],
  ["ἐπικαθίζω", "I sit on", ["I stand", "I dismount", "I kneel"], {}],
  ["σείω", "I shake, I stir up", ["I calm", "I steady", "I settle"], {}],
  ["θαυμάσιος", "wonderful", ["ordinary", "dreadful", "plain"], {}],
  ["αἶνος", "praise", ["blame", "a request", "a complaint"], {}],
  ["αὐλίζομαι", "I lodge for the night", ["I set out", "I remain awake", "I return home"], {}],
  ["ἐπανάγω", "I return", ["I depart", "I remain", "I hurry"], {}],
  ["παραχρῆμα", "immediately, at once", ["gradually", "later", "never"], {}],
  ["μεταμέλομαι", "I change my mind, I regret", ["I persist", "I decide", "I forget"], {}],
  ["πόρνη", "a prostitute", ["a widow", "a bride", "a servant"], {}],
  ["ληνός", "a winepress", ["a threshing floor", "a granary", "a cistern"], {}],
  ["λιθοβολέω", "I stone", ["I spare", "I release", "I honour"], {}],
  ["συνθλάομαι", "I am broken to pieces", ["I am mended", "I am polished", "I am lifted"], {}],
  ["λικμάω", "I crush, I scatter like chaff", ["I gather", "I rebuild", "I spare"], {}],
  ["ἄριστον", "a meal, a banquet", ["a fast", "a market", "a wage"], {}],
  ["ταῦρος", "a bull, an ox", ["a lamb", "a goat", "a calf of the herd"], {}],
  ["σιτιστός", "fattened, grain-fed", ["lean", "wild", "young"], {}],
  ["ἀμελέω", "I neglect, I pay no attention", ["I attend to", "I hurry", "I obey"], {}],
  ["ἐμπορία", "business, trade", ["idleness", "farming", "a festival"], {}],
  ["ὑβρίζω", "I mistreat, I insult", ["I honour", "I welcome", "I spare"], {}],
  ["στράτευμα", "an army, troops", ["a crowd", "a council", "a household"], {}],
  ["φονεύς", "a murderer", ["a victim", "a witness", "a judge"], {}],
  ["ἐμπίμπρημι", "I burn down", ["I rebuild", "I spare", "I quench"], {}],
  ["διέξοδος", "a street corner, a crossroads", ["a dead end", "a courtyard", "a gate"], {}],
  ["πίμπλημι", "I fill", ["I empty", "I break", "I open"], {}],
  ["κλητός", "called, invited", ["chosen", "rejected", "absent"], {}],
  ["παγιδεύω", "I trap, I ensnare", ["I release", "I warn", "I assist"], {}],
  ["νόμισμα", "a coin, currency", ["a seal", "a weight", "a ledger"], {}],
  ["ἐπιγαμβρεύω", "I marry (a brother's widow)", ["I divorce", "I inherit", "I mourn"], {}],
  ["νομικός", "an expert in the law", ["a priest", "a scribe of accounts", "an elder"], {}],
  ["δεσμεύω", "I bind, I tie up", ["I loose", "I carry", "I lighten"], {}],
  ["ὦμος", "a shoulder", ["a back", "a neck", "an arm"], { id: "omos-shoulder" }],
  ["πλατύνω", "I make broad, I widen", ["I narrow", "I shorten", "I hide"], {}],
  ["φυλακτήριον", "a phylactery, a prayer box", ["a scroll", "a fringe", "a headdress"], {}],
  ["μεγαλύνω", "I make large, I magnify", ["I shrink", "I hide", "I despise"], {}],
  ["καθηγητής", "a teacher, an instructor", ["a pupil", "a servant", "a father"], {}],
  ["προσήλυτος", "a proselyte, a convert", ["a native", "an apostate", "a stranger"], {}],
  ["διπλοῦς", "double, twice as much", ["half", "single", "equal"], {}],
  ["ἀποδεκατόω", "I tithe, I give a tenth", ["I withhold", "I double", "I spend"], {}],
  ["ἡδύοσμον", "mint", ["dill", "cumin", "salt"], {}],
  ["ἄνηθον", "dill", ["mint", "cumin", "coriander"], {}],
  ["κύμινον", "cumin", ["mint", "dill", "pepper"], {}],
  ["διϋλίζω", "I strain out, I filter", ["I swallow", "I pour", "I mix"], {}],
  ["κώνωψ", "a gnat", ["a camel", "a locust", "a fly of the field"], {}],
  ["καταπίνω", "I swallow, I gulp down", ["I strain out", "I spit out", "I chew"], {}],
  ["παροψίς", "a dish, a plate", ["a cup", "a jar", "a basket"], {}],
  ["γέμω", "I am full of", ["I am empty", "I overflow", "I lack"], {}],
  ["ἁρπαγή", "plunder, greed", ["generosity", "poverty", "restraint"], {}],
  ["ἀκρασία", "lack of self-control", ["moderation", "purity", "patience"], {}],
  ["ἐντός", "inside", ["outside", "above", "beneath"], {}],
  ["ἐκτός", "outside", ["inside", "beneath", "beyond"], { id: "ektos-outside" }],
  ["παρομοιάζω", "I am like, I resemble", ["I differ from", "I oppose", "I exceed"], {}],
  ["κονιάω", "I whitewash", ["I blacken", "I demolish", "I dig"], {}],
  ["τάφος", "a tomb, a grave", ["a temple", "a monument", "a house"], {}],
  ["ὡραῖος", "beautiful, in season", ["ugly", "ruined", "faded"], {}],
  ["ἀκαθαρσία", "uncleanness, filth", ["purity", "beauty", "order"], {}],
  ["κοινωνός", "a partner, a sharer", ["a rival", "a stranger", "an opponent"], {}],
  ["Ἅβελ", "Abel", ["Cain", "Adam", "Seth"], {}],
  ["Ζαχαρίας", "Zechariah", ["Zebedee", "Zerubbabel", "Barachiah"], {}],
  ["Βαραχίας", "Barachiah", ["Zechariah", "Zebedee", "Zerah"], {}],
  ["Ἰερουσαλήμ", "Jerusalem", ["Bethlehem", "Samaria", "Jericho"], {
    notes: "Matthew normally writes Ἱεροσόλυμα, the Greek-shaped form. He switches to the indeclinable Hebrew Ἰερουσαλήμ for the lament in 23:37 — the vocative of a city being mourned.",
  }],
  ["τρόπος", "a manner, a way", ["a reason", "a place", "a time"], {}],
  ["ὄρνις", "a hen, a bird", ["a chick", "an eagle", "a serpent"], {}],
  ["νοσσίον", "a chick, a nestling", ["a hen", "an egg", "a nest"], {}],
  ["πτέρυξ", "a wing", ["a feather", "a beak", "a claw"], {}],

  // ==========================================================================
  // The Olivet discourse and its parables (24–25)
  // ==========================================================================
  ["πληθύνω", "I increase, I multiply", ["I diminish", "I halt", "I divide"], {}],
  ["ψύχομαι", "I grow cold", ["I grow warm", "I burn", "I harden"], {}],
  ["οἰκουμένη", "the inhabited world", ["a wilderness", "a province", "a village"], {}],
  ["Δανιήλ", "Daniel", ["Jeremiah", "Ezekiel", "Isaiah"], {}],
  ["φυγή", "flight, escape", ["pursuit", "a stand", "a siege"], {}],
  ["ἀστραπή", "lightning", ["thunder", "a cloud", "hail"], {}],
  ["ἀετός", "an eagle, a vulture", ["a dove", "a raven", "a sparrow"], {}],
  ["σάλπιγξ", "a trumpet", ["a horn of oil", "a drum", "a flute"], {}],
  ["Νῶε", "Noah", ["Abraham", "Enoch", "Lot"], {}],
  ["κατακλυσμός", "a flood", ["a drought", "a fire", "an earthquake"], {}],
  ["κιβωτός", "an ark", ["a boat", "a chest of gold", "a raft"], {}],
  ["ἀλήθω", "I grind (at a mill)", ["I bake", "I sow", "I reap"], {}],
  ["ἐάω", "I allow, I let", ["I forbid", "I compel", "I prevent"], {}],
  ["καθίστημι", "I appoint, I put in charge", ["I dismiss", "I demote", "I accuse"], {}],
  ["οἰκετεία", "a household of servants", ["a family", "a village", "an estate"], {}],
  ["χρονίζω", "I delay, I take a long time", ["I hurry", "I arrive", "I return"], {}],
  ["διχοτομέω", "I cut in two", ["I spare", "I release", "I restore"], {}],
  ["ἀγγεῖον", "a flask, a vessel", ["a lamp", "a wick", "a basket"], {}],
  ["νυστάζω", "I grow drowsy", ["I wake", "I rise", "I watch"], {}],
  ["κραυγή", "a shout, a cry", ["a whisper", "a silence", "a song"], {}],
  ["ἀπάντησις", "a meeting", ["a parting", "a delay", "a refusal"], {}],
  ["ὀκνηρός", "lazy, hesitant", ["diligent", "eager", "faithful"], {}],
  ["τραπεζίτης", "a banker, a money-changer", ["a merchant", "a farmer", "a steward"], {}],
  ["κομίζω", "I receive back, I recover", ["I lose", "I lend", "I spend"], {}],
  ["τόκος", "interest (on money)", ["capital", "a wage", "a fine"], {}],
  ["ἀχρεῖος", "useless, worthless", ["profitable", "faithful", "wise"], {}],
  ["ἔριφος", "a goat", ["a sheep", "a lamb", "a calf"], {}],
  ["ἐρίφιον", "a young goat, a kid", ["a lamb", "a ewe", "a ram"], {}],
  ["ξένος", "a stranger; strange", ["a citizen", "a kinsman", "a neighbour"], {}],
  ["ἐπισκέπτομαι", "I visit, I look after", ["I neglect", "I avoid", "I summon"], {}],

  // ==========================================================================
  // The passion and the resurrection (26–28)
  // ==========================================================================
  ["ἀλάβαστρον", "an alabaster jar", ["a clay pot", "a wineskin", "a basket"], {}],
  ["βαρύτιμος", "very costly", ["cheap", "common", "worthless"], {}],
  ["εὐκαιρία", "an opportunity, a good moment", ["a delay", "a difficulty", "a refusal"], {}],
  ["δεῖνα", "a certain man, so-and-so", ["everyone", "no one", "a stranger"], {
    notes: "26:18 — 'go into the city to ὁ δεῖνα'. Greek's placeholder for a name the speaker will not or need not give, like English 'such a one'.",
  }],
  ["αὐτοῦ", "here, in this place", ["there", "everywhere", "nowhere"], {}],
  ["βαρέω", "I weigh down", ["I lighten", "I raise", "I release"], {}],
  ["ἀποσπάω", "I draw out, I pull away", ["I sheathe", "I hand over", "I drop"], {}],
  ["ψευδόμαρτυς", "a false witness", ["a true witness", "a judge", "an accuser"], {}],
  ["ἐξορκίζω", "I put under oath, I adjure", ["I release", "I accuse", "I absolve"], {}],
  ["πυλών", "a gateway, a porch", ["an inner room", "a roof", "a cellar"], {}],
  ["δῆλος", "clear, evident", ["hidden", "doubtful", "false"], {}],
  ["καταθεματίζω", "I curse, I call down a curse", ["I bless", "I swear truly", "I pray"], {}],
  ["πικρῶς", "bitterly", ["sweetly", "quietly", "gladly"], {}],
  ["ἀπάγχομαι", "I hang myself", ["I escape", "I confess", "I flee"], {}],
  ["κορβανᾶς", "the temple treasury", ["the altar", "the storeroom", "the porch"], {}],
  ["κεραμεύς", "a potter", ["a farmer", "a mason", "a smith"], {}],
  ["ταφή", "a burial place", ["a wedding", "a market", "a garden"], {}],
  ["διό", "therefore", ["although", "unless", "meanwhile"], {}],
  ["καθά", "just as", ["unlike", "before", "unless"], {}],
  ["ἐπίσημος", "notorious, well known", ["obscure", "innocent", "forgotten"], {}],
  ["ἀπονίπτω", "I wash off", ["I stain", "I anoint", "I dry"], {}],
  ["ἀπέναντι", "opposite, before", ["behind", "beside", "within"], {}],
  ["ἀθῷος", "innocent", ["guilty", "condemned", "accused"], {}],
  ["χλαμύς", "a cloak, a military robe", ["a tunic", "a belt", "a sandal"], {}],
  ["κόκκινος", "scarlet", ["purple", "white", "black"], {}],
  ["χολή", "gall, bile", ["honey", "vinegar", "oil"], {}],
  ["μίγνυμι", "I mix", ["I separate", "I pour", "I strain"], {}],
  ["ἠλί", "Eli (my God)", ["Elijah", "Amen", "Hosanna"], {
    notes: "27:46, left in Aramaic and then translated by Matthew himself. It is the opening of Psalm 22, and the bystanders mishear it as a call for Elijah.",
  }],
  ["ἀναβοάω", "I cry out loudly", ["I whisper", "I fall silent", "I sing"], {}],
  ["ἔγερσις", "a resurrection, a rising", ["a burial", "a death", "a sleep"], {}],
  ["τοὔνομα", "by name", ["by trade", "by birth", "in secret"], {}],
  ["πλάνος", "a deceiver; misleading", ["truthful", "faithful", "harmless"], {}],
  ["ἀσφαλίζω", "I make secure, I guard", ["I open", "I abandon", "I weaken"], {}],
  ["κουστωδία", "a guard, a watch", ["a prisoner", "a crowd", "a council"], {
    notes: "A Latin loanword, custodia, in Greek dress — one of several signs that Matthew's world is an occupied one.",
  }],
  ["ἐπιφώσκω", "it dawns, it grows light", ["it darkens", "it rains", "it thunders"], {}],
  ["εἰδέα", "appearance, form", ["a name", "a voice", "a shadow"], {}],
  ["χιών", "snow", ["frost", "wool", "ash"], {}],
  ["ἀμέριμνος", "free from care", ["anxious", "guilty", "burdened"], {}],
  ["τάσσω", "I appoint, I arrange", ["I forbid", "I cancel", "I forget"], {}],

  // ==========================================================================
  // Odds and ends — words that belong to no one scene
  //
  // Several below carry an explicit `id`. Greek transliteration drops breathings
  // and accents, so ὅλος/ὅλως, δέ/δή, γῆ/γέ, ἕκτος/ἐκτός, δῶμα/δόμα and
  // ὅμως/ὦμος each collapse to one slug. The builder's collision guard caught
  // all six; without it the second word of each pair would have silently
  // overwritten the first's card.
  // ==========================================================================
  ["μήτε", "and not, neither", ["and also", "but", "or else"], {}],
  ["γέ", "indeed, at least", ["never", "hardly", "perhaps"], { id: "ge-particle" }],
  ["οὗ", "where", ["when", "why", "how"], { id: "hou-where" }],
  ["προσέχω", "I pay attention, I beware", ["I ignore", "I forget", "I hurry"], {}],
  ["χρυσός", "gold", ["silver", "bronze", "iron"], {}],
  ["θρόνος", "a throne", ["a footstool", "a couch", "a table"], {}],
  ["ὑπάγω_SKIP", "", [], { skip: true }],
];

// ---------------------------------------------------------------------------

const mine = new Map();
for (const [lemma, gloss, distractors, extras = {}] of ENTRIES) {
  if (extras.skip) continue;
  if (mine.has(lemma)) throw new Error(`duplicate lemma ${lemma}`);
  if (distractors.length !== 3) throw new Error(`${lemma} has ${distractors.length} distractors, want 3`);
  if (distractors.includes(gloss)) throw new Error(`${lemma} lists its own gloss as a distractor`);
  if (new Set(distractors).size !== 3) throw new Error(`${lemma} has a repeated distractor`);
  const { skip, ...rest } = extras;
  mine.set(lemma, { lemma, gloss, distractors, ...rest });
}

// Reused entries fill in behind the hand-written ones, never over them.
const merged = new Map();
for (const w of REUSED) if (!mine.has(w.lemma)) merged.set(w.lemma, { ...w });
for (const [lemma, w] of mine) merged.set(lemma, w);

const ids = new Map();
const words = [...merged.values()].map((w) => {
  const id = w.id ?? slug(w.lemma);
  if (!id) throw new Error(`${w.lemma} transliterates to nothing`);
  if (ids.has(id)) throw new Error(`id collision "${id}": ${ids.get(id)} and ${w.lemma}`);
  ids.set(id, w.lemma);
  return { ...w, id, translit: w.translit ?? translit(w.lemma) };
});

writeFileSync(
  resolve(HERE, "matthew-glossary.json"),
  `${JSON.stringify(
    {
      _readme:
        "Hand-written glosses, distractors, families and teaching notes for Matthew. " +
        `Generated by build-matthew-glossary.mjs — edit that, not this. ${mine.size} entries are ` +
        "written here; the rest are reused from the John, Mark, 1 John and Gospels " +
        "glossaries. Glosses are short TEACHING meanings for a beginner reading " +
        "Matthew, not lexicon entries. A Koine specialist should read all of them.",
      words,
      passages: [],
    },
    null,
    1,
  )}\n`,
);
console.log("wrote scripts/matthew-glossary.json");
console.log(`  ${words.length} entries · ${mine.size} written here · ${words.length - mine.size} reused`);
