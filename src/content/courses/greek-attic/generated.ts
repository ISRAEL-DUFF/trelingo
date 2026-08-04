/**
 * GENERATED FILE — do not edit by hand.
 *
 * Produced by:
 *   node scripts/import-agdt.mjs <proseDir>
 *   node scripts/emit-attic-course.mjs
 *
 * LICENCE: CC BY-SA 3.0 US. This content is an ADAPTATION and inherits
 * ShareAlike — it must be redistributed under BY-SA 3.0 US or a later
 * compatible version, and must credit Perseus. See NOTICE.md.
 *
 * The grant is taken from the copyright holder's own repository. A separate
 * Universal Dependencies conversion of the same treebank is labelled
 * CC BY-NC-SA 2.5, which is where the "unresolved licence" note here used to
 * come from. A downstream converter cannot add a NonCommercial restriction to
 * BY-SA material, so that label is the conversion's problem, not this
 * project's: we build from the UPSTREAM XML only and never from the UD data.
 * See attic-spike-findings.md §2.
 *
 * Corpus is Attic PROSE ONLY (Thucydides 1, Plato Euthyphro, Lysias).
 * Tragedy and epic are excluded on purpose: pooling dialects took the spike's
 * spot check from 8/8 to 6/8 via Doric alpha and crasis (findings §4.2).
 *
 * Sources
 *   text + parsing  Ancient Greek and Latin Dependency Treebank 2.1,
 *                   PerseusDL/treebank_data.
 *                   © 2014 The Perseus Digital Library, Tufts University.
 *                   CC BY-SA 3.0 US.
 *
 * 41 words · 37 families · 2 passages
 */
import type { ContentBundle } from "../../schema";

export const families: ContentBundle["families"] = [
  {"id":"πολ","letters":"πολ","coreGloss":"city"},
  {"id":"πολεμ","letters":"πολεμ","coreGloss":"war","notes":"Behind πολέμιος (hostile) and English “polemic”."},
  {"id":"θε","letters":"θε","coreGloss":"god"},
  {"id":"λογ","letters":"λογ","coreGloss":"word, reason, account"},
  {"id":"νομ","letters":"νομ","coreGloss":"law, custom"},
  {"id":"δικ","letters":"δικ","coreGloss":"justice","notes":"Behind δίκαιος (just) and δικαστής (juror)."},
  {"id":"ἐργ","letters":"ἐργ","coreGloss":"work"},
  {"id":"ἀνθρωπ","letters":"ἀνθρωπ","coreGloss":"human being"},
  {"id":"χρον","letters":"χρον","coreGloss":"time","notes":"Behind English “chronology”."},
  {"id":"ἀρχ","letters":"ἀρχ","coreGloss":"beginning, rule"},
  {"id":"γνωμ","letters":"γνωμ","coreGloss":"judgement"},
  {"id":"φιλ","letters":"φιλ","coreGloss":"friend, dear"},
  {"id":"ὁσι","letters":"ὁσι","coreGloss":"holy, pious","notes":"The word the whole Euthyphro argues about."},
  {"id":"πρωτ","letters":"πρωτ","coreGloss":"first"},
  {"id":"ὀλιγ","letters":"ὀλιγ","coreGloss":"few","notes":"Behind “oligarchy” — rule by the few."},
  {"id":"μον","letters":"μον","coreGloss":"alone"},
  {"id":"χωρι","letters":"χωρι","coreGloss":"place"},
  {"id":"δυναμ","letters":"δυναμ","coreGloss":"power","notes":"Behind English “dynamic”."},
  {"id":"βασιλε","letters":"βασιλε","coreGloss":"king"},
  {"id":"ἀν","letters":"ἀν","coreGloss":"man"},
  {"id":"πατ","letters":"πατ","coreGloss":"father"},
  {"id":"πα","letters":"πα","coreGloss":"all"},
  {"id":"ναυτικ","letters":"ναυτικ","coreGloss":"naval"},
  {"id":"σπονδ","letters":"σπονδ","coreGloss":"treaty, libation"},
  {"id":"βαρβαρ","letters":"βαρβαρ","coreGloss":"non-Greek"},
  {"id":"ἑκαστ","letters":"ἑκαστ","coreGloss":"each"},
  {"id":"ὁσ","letters":"ὁσ","coreGloss":"as much as"},
  {"id":"οἱ","letters":"οἱ","coreGloss":"of what sort"},
  {"id":"θαλασσ","letters":"θαλασσ","coreGloss":"sea"},
  {"id":"ἀθηναι","letters":"ἀθηναι","coreGloss":"Athenian"},
  {"id":"χρημ","letters":"χρημ","coreGloss":"thing, money"},
  {"id":"νεωτερ","letters":"νεωτερ","coreGloss":"new, young"},
  {"id":"μεγα","letters":"μεγα","coreGloss":"great"},
  {"id":"λεγ","letters":"λεγ","coreGloss":"say, speak"},
  {"id":"ἐχ","letters":"ἐχ","coreGloss":"have, hold"},
  {"id":"ποιε","letters":"ποιε","coreGloss":"make, do","notes":"A contract verb. Behind English “poet” — one who makes."},
  {"id":"ἡγε","letters":"ἡγε","coreGloss":"lead, consider"},
];

export const words: ContentBundle["words"] = [
  // derived · 152 occurrences in the sampled corpus
  {"id":"polis","familyId":"πολ","text":"πόλις","translit":"polis","gloss":"city, city-state","partOfSpeech":"noun","morphology":{"highlight":[3,4],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"f"},"attestations":["Thucydides","Plato, Euthyphro","Lysias"],"distractors":["house","field","ship"],"frequency":{"inCorpus":1128,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":31}},
  // derived · 110 occurrences in the sampled corpus
  {"id":"polemos","familyId":"πολεμ","text":"πόλεμος","translit":"polemos","gloss":"war","partOfSpeech":"noun","morphology":{"highlight":[5,6],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"m"},"attestations":["Thucydides","Plato, Euthyphro","Lysias"],"distractors":["peace","law","council"],"frequency":{"inTrack":1,"inCorpus":601,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":26}},
  // derived · 73 occurrences in the sampled corpus
  {"id":"theos","familyId":"θε","text":"θεός","translit":"theos","gloss":"god","partOfSpeech":"noun","morphology":{"highlight":[2,3],"kind":"ending"},"attestations":["Thucydides","Plato, Euthyphro","Lysias"],"distractors":["man","king","hero"],"frequency":{"inCorpus":1577,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":29}},
  // derived · 58 occurrences in the sampled corpus
  {"id":"logos","familyId":"λογ","text":"λόγος","translit":"logos","gloss":"word, argument, account","partOfSpeech":"noun","morphology":{"highlight":[3,4],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"m"},"attestations":["Thucydides","Plato, Euthyphro","Lysias"],"distractors":["deed","law","custom"],"notes":"In Plato λόγος is usually “argument” or “account”, not simply “word”.","frequency":{"inCorpus":551,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":29}},
  // derived · 54 occurrences in the sampled corpus
  {"id":"nomos","familyId":"νομ","text":"νόμος","translit":"nomos","gloss":"law, custom","partOfSpeech":"noun","morphology":{"highlight":[3,4],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"m"},"attestations":["Thucydides","Plato, Euthyphro","Lysias"],"distractors":["war","city","justice"],"frequency":{"inCorpus":210,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":26}},
  // derived · 52 occurrences in the sampled corpus
  {"id":"dike","familyId":"δικ","text":"δίκη","translit":"dikē","gloss":"justice, lawsuit","partOfSpeech":"noun","morphology":{"highlight":[3],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"f"},"attestations":["Thucydides","Plato, Euthyphro","Lysias"],"distractors":["war","wealth","honour"],"frequency":{"inCorpus":286,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":30}},
  // derived · 48 occurrences in the sampled corpus
  {"id":"ergon","familyId":"ἐργ","text":"ἔργον","translit":"ergon","gloss":"work, deed","partOfSpeech":"noun","morphology":{"highlight":[3,4],"kind":"ending"},"parse":{"case":"accusative","number":"s","gender":"n"},"attestations":["Thucydides","Plato, Euthyphro","Lysias"],"distractors":["word","rest","plan"],"frequency":{"inCorpus":571,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":30}},
  // derived · 46 occurrences in the sampled corpus
  {"id":"anthropos","familyId":"ἀνθρωπ","text":"ἄνθρωπος","translit":"anthrōpos","gloss":"human being","partOfSpeech":"noun","morphology":{"highlight":[6,7],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"m"},"attestations":["Thucydides","Plato, Euthyphro","Lysias"],"distractors":["god","beast","city"],"frequency":{"inCorpus":550,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":29}},
  // derived · 58 occurrences in the sampled corpus
  {"id":"chronos","familyId":"χρον","text":"χρόνος","translit":"chronos","gloss":"time","partOfSpeech":"noun","morphology":{"highlight":[4,5],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"m"},"attestations":["Thucydides","Plato, Euthyphro","Lysias"],"distractors":["place","war","year"],"frequency":{"inCorpus":405,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":31}},
  // derived · 29 occurrences in the sampled corpus
  {"id":"arche","familyId":"ἀρχ","text":"ἀρχή","translit":"archē","gloss":"beginning, rule","partOfSpeech":"noun","morphology":{"highlight":[3],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"f"},"attestations":["Thucydides","Plato, Euthyphro","Lysias"],"distractors":["end","middle","law"],"frequency":{"inCorpus":226,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":27}},
  // derived · 41 occurrences in the sampled corpus
  {"id":"gnome","familyId":"γνωμ","text":"γνώμη","translit":"gnōmē","gloss":"judgement, opinion","partOfSpeech":"noun","morphology":{"highlight":[4],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"f"},"attestations":["Thucydides","Lysias"],"distractors":["fear","hope","custom"],"frequency":{"inCorpus":141,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":21}},
  // derived · 37 occurrences in the sampled corpus
  {"id":"philos","familyId":"φιλ","text":"φίλος","translit":"philos","gloss":"friend; dear","partOfSpeech":"noun","morphology":{"highlight":[3,4],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"m"},"attestations":["Thucydides","Plato, Euthyphro","Lysias"],"distractors":["enemy","stranger","slave"],"frequency":{"inCorpus":1079,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":31}},
  // derived · 55 occurrences in the sampled corpus
  {"id":"dikaios","familyId":"δικ","text":"δίκαιος","translit":"dikaios","gloss":"just","partOfSpeech":"adjective","morphology":{"highlight":[5,6],"kind":"ending"},"attestations":["Thucydides","Plato, Euthyphro","Lysias"],"distractors":["unjust","wise","brave"],"frequency":{"inCorpus":194,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":28}},
  // derived · 36 occurrences in the sampled corpus
  {"id":"dikastes","familyId":"δικ","text":"δικαστής","translit":"dikastēs","gloss":"juror, judge","partOfSpeech":"noun","morphology":{"highlight":[6,7],"kind":"ending"},"attestations":["Thucydides","Plato, Euthyphro","Lysias"],"distractors":["general","orator","priest"],"frequency":{"inCorpus":53,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":14}},
  // derived · 73 occurrences in the sampled corpus
  {"id":"hosios","familyId":"ὁσι","text":"ὅσιος","translit":"hosios","gloss":"holy, pious","partOfSpeech":"adjective","morphology":{"highlight":[3,4],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"m"},"attestations":["Thucydides","Plato, Euthyphro"],"distractors":["unholy","just","wise"],"frequency":{"inCorpus":84,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":12}},
  // derived · 59 occurrences in the sampled corpus
  {"id":"protos","familyId":"πρωτ","text":"πρῶτος","translit":"prōtos","gloss":"first","partOfSpeech":"adjective","morphology":{"highlight":[4,5],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"m"},"attestations":["Thucydides","Plato, Euthyphro","Lysias"],"distractors":["last","many","few"],"frequency":{"inCorpus":554,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":29}},
  // derived · 31 occurrences in the sampled corpus
  {"id":"oligos","familyId":"ὀλιγ","text":"ὀλίγος","translit":"oligos","gloss":"few, little","partOfSpeech":"adjective","morphology":{"highlight":[4,5],"kind":"ending"},"attestations":["Thucydides","Plato, Euthyphro","Lysias"],"distractors":["many","great","whole"],"frequency":{"inCorpus":174,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":18}},
  // derived · 35 occurrences in the sampled corpus
  {"id":"monos","familyId":"μον","text":"μόνος","translit":"monos","gloss":"alone, only","partOfSpeech":"adjective","morphology":{"highlight":[3,4],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"m"},"attestations":["Thucydides","Plato, Euthyphro","Lysias"],"distractors":["all","both","each"],"frequency":{"inCorpus":361,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":28}},
  // derived · 29 occurrences in the sampled corpus
  {"id":"chorion","familyId":"χωρι","text":"χωρίον","translit":"chōrion","gloss":"place, district","partOfSpeech":"noun","morphology":{"highlight":[4,5],"kind":"ending"},"parse":{"case":"accusative","number":"s","gender":"n"},"attestations":["Thucydides","Lysias"],"distractors":["time","army","wall"],"frequency":{"inCorpus":50,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":9}},
  // derived · 41 occurrences in the sampled corpus
  {"id":"dynamis","familyId":"δυναμ","text":"δύναμις","translit":"dynamis","gloss":"power, force","partOfSpeech":"noun","morphology":{"highlight":[5,6],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"f"},"attestations":["Thucydides","Lysias"],"distractors":["weakness","wealth","fame"],"frequency":{"inCorpus":314,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":18}},
  // derived · 38 occurrences in the sampled corpus
  {"id":"basileus","familyId":"βασιλε","text":"βασιλεύς","translit":"basileus","gloss":"king","partOfSpeech":"noun","morphology":{"highlight":[6,7],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"m"},"attestations":["Thucydides","Plato, Euthyphro","Lysias"],"distractors":["citizen","slave","general"],"frequency":{"inCorpus":480,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":25}},
  // derived · 103 occurrences in the sampled corpus
  {"id":"aner","familyId":"ἀν","text":"ἀνήρ","translit":"anēr","gloss":"man","partOfSpeech":"noun","morphology":{"highlight":[2,3],"kind":"ending"},"attestations":["Thucydides","Plato, Euthyphro","Lysias"],"distractors":["woman","child","god"],"frequency":{"inCorpus":1992,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":32}},
  // derived · 35 occurrences in the sampled corpus
  {"id":"pater","familyId":"πατ","text":"πατήρ","translit":"patēr","gloss":"father","partOfSpeech":"noun","morphology":{"highlight":[3,4],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"m"},"attestations":["Thucydides","Plato, Euthyphro","Lysias"],"distractors":["mother","son","brother"],"frequency":{"inCorpus":805,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":30}},
  // derived · 131 occurrences in the sampled corpus
  {"id":"pas","familyId":"πα","text":"πᾶς","translit":"pas","gloss":"all, every","partOfSpeech":"adjective","morphology":{"highlight":[2],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"m"},"attestations":["Thucydides","Plato, Euthyphro","Lysias"],"distractors":["none","few","some"],"frequency":{"inCorpus":2441,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":33}},
  // derived · 31 occurrences in the sampled corpus
  {"id":"nautikos","familyId":"ναυτικ","text":"ναυτικός","translit":"nautikos","gloss":"naval; a fleet","partOfSpeech":"adjective","morphology":{"highlight":[6,7],"kind":"ending"},"attestations":["Thucydides"],"distractors":["infantry","civic","sacred"],"frequency":{"inCorpus":86,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":9}},
  // derived · 31 occurrences in the sampled corpus
  {"id":"sponde","familyId":"σπονδ","text":"σπονδή","translit":"spondē","gloss":"treaty, truce","partOfSpeech":"noun","morphology":{"highlight":[5],"kind":"ending"},"attestations":["Thucydides"],"distractors":["battle","speech","tribute"],"frequency":{"inCorpus":47,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":11}},
  // derived · 30 occurrences in the sampled corpus
  {"id":"polemios","familyId":"πολεμ","text":"πολέμιος","translit":"polemios","gloss":"hostile; enemy","partOfSpeech":"adjective","morphology":{"highlight":[6,7],"kind":"ending"},"attestations":["Thucydides","Lysias"],"distractors":["friendly","neutral","allied"],"frequency":{"inCorpus":214,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":14}},
  // derived · 31 occurrences in the sampled corpus
  {"id":"barbaros","familyId":"βαρβαρ","text":"βάρβαρος","translit":"barbaros","gloss":"foreign; a foreigner","partOfSpeech":"noun","morphology":{"highlight":[6,7],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"m"},"attestations":["Thucydides"],"distractors":["Greek","noble","free"],"frequency":{"inCorpus":154,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":14}},
  // derived · 41 occurrences in the sampled corpus
  {"id":"hekastos","familyId":"ἑκαστ","text":"ἕκαστος","translit":"hekastos","gloss":"each","partOfSpeech":"adjective","morphology":{"highlight":[5,6],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"m"},"attestations":["Thucydides","Plato, Euthyphro","Lysias"],"distractors":["all","none","both"],"frequency":{"inCorpus":422,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":27}},
  // derived · 68 occurrences in the sampled corpus
  {"id":"hosos","familyId":"ὁσ","text":"ὅσος","translit":"hosos","gloss":"as much as, how great","partOfSpeech":"adjective","morphology":{"highlight":[2,3],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"m"},"attestations":["Thucydides","Plato, Euthyphro","Lysias"],"distractors":["who","where","when"],"frequency":{"inCorpus":551,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":29}},
  // derived · 29 occurrences in the sampled corpus
  {"id":"hoios","familyId":"οἱ","text":"οἷος","translit":"hoios","gloss":"such as, what sort of","partOfSpeech":"adjective","morphology":{"highlight":[2,3],"kind":"ending"},"attestations":["Thucydides","Plato, Euthyphro","Lysias"],"distractors":["how many","how often","whether"],"frequency":{"inCorpus":404,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":28}},
  // stem override · 40 occurrences in the sampled corpus
  {"id":"thalassa","familyId":"θαλασσ","text":"θάλασσα","translit":"thalassa","gloss":"sea","partOfSpeech":"noun","morphology":{"highlight":[6],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"f"},"attestations":["Thucydides","Lysias"],"distractors":["land","river","mountain"],"notes":"Stem supplied by hand: the corpus invariant stopped at θάλα-, which is not the standard analysis.","frequency":{"inCorpus":318,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":22}},
  // stem override · 89 occurrences in the sampled corpus
  {"id":"athenaios","familyId":"ἀθηναι","text":"Ἀθηναῖος","translit":"Athēnaios","gloss":"Athenian","partOfSpeech":"noun","morphology":{"highlight":[6,7],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"m"},"attestations":["Thucydides","Plato, Euthyphro","Lysias"],"distractors":["Spartan","Corinthian","Persian"],"frequency":{"inTrack":2,"inCorpus":199,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":12}},
  // stem override · 45 occurrences in the sampled corpus
  {"id":"chrema","familyId":"χρημ","text":"χρῆμα","translit":"chrēma","gloss":"thing; (plural) money","partOfSpeech":"noun","morphology":{"highlight":[4],"kind":"ending"},"attestations":["Thucydides","Plato, Euthyphro","Lysias"],"distractors":["word","deed","place"],"notes":"3rd declension: the stem is really χρηματ-, visible in the genitive χρήματος. The nominative hides the tau.","frequency":{"inCorpus":165,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":25}},
  // stem override · 5 occurrences in the sampled corpus
  {"id":"neoteros","familyId":"νεωτερ","text":"νεώτερος","translit":"neōteros","gloss":"newer, younger","partOfSpeech":"adjective","morphology":{"highlight":[6,7],"kind":"ending"},"attestations":["Thucydides","Plato, Euthyphro"],"distractors":["older","greater","fewer"],"notes":"Comparative of νέος. The corpus invariant stopped inside the comparative suffix -τερ-, so the stem is supplied by hand.","frequency":{"inTrack":1,"inCorpus":27,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":11}},
  // stem override · 100 occurrences in the sampled corpus
  {"id":"megas","familyId":"μεγα","text":"μέγας","translit":"megas","gloss":"great, large","partOfSpeech":"adjective","morphology":{"highlight":[4],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"m"},"attestations":["Thucydides","Plato, Euthyphro","Lysias"],"distractors":["small","few","swift"],"notes":"Irregular: most forms use the stem μεγαλ-, as in μεγάλου.","frequency":{"inCorpus":1554,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":31}},
  // stem override · 135 occurrences in the sampled corpus
  {"id":"lego","familyId":"λεγ","text":"λέγω","translit":"legō","gloss":"I say, I speak","partOfSpeech":"verb","morphology":{"highlight":[3],"kind":"ending"},"attestations":["Thucydides","Plato, Euthyphro","Lysias"],"distractors":["I hear","I write","I ask"],"frequency":{"inCorpus":1083,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":32}},
  // stem override · 187 occurrences in the sampled corpus
  {"id":"echo","familyId":"ἐχ","text":"ἔχω","translit":"echō","gloss":"I have, I hold","partOfSpeech":"verb","morphology":{"highlight":[2],"kind":"ending"},"attestations":["Thucydides","Plato, Euthyphro","Lysias"],"distractors":["I give","I lose","I take"],"frequency":{"inCorpus":2271,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":32}},
  // stem override · 148 occurrences in the sampled corpus
  {"id":"poieo","familyId":"ποιε","text":"ποιέω","translit":"poieō","gloss":"I make, I do","partOfSpeech":"verb","morphology":{"highlight":[4],"kind":"ending"},"attestations":["Thucydides","Plato, Euthyphro","Lysias"],"distractors":["I destroy","I find","I send"],"frequency":{"inCorpus":862,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":30}},
  // stem override · 63 occurrences in the sampled corpus
  {"id":"hegeomai","familyId":"ἡγε","text":"ἡγέομαι","translit":"hēgeomai","gloss":"I lead; I consider","partOfSpeech":"verb","morphology":{"highlight":[3,4,5,6],"kind":"ending"},"attestations":["Thucydides","Plato, Euthyphro","Lysias"],"distractors":["I follow","I flee","I fear"],"notes":"Deponent: middle in form, active in meaning.","frequency":{"inCorpus":187,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":28}},
  // stem override · 32 occurrences in the sampled corpus
  {"id":"parecho","familyId":"ἐχ","text":"παρέχω","translit":"parechō","gloss":"I provide, I furnish","partOfSpeech":"verb","morphology":{"highlight":[5],"kind":"ending"},"attestations":["Thucydides","Plato, Euthyphro","Lysias"],"distractors":["I withhold","I demand","I destroy"],"notes":"παρά (beside) prefixed to ἔχω — “hold out to”, hence “provide”.","frequency":{"inCorpus":145,"corpus":"the Perseus Greek treebank","corpusComplete":false,"corpusBooks":24}},
];

export const passages: ContentBundle["passages"] = [
  {"id":"euthyphro-opening","reference":"Plato, Euthyphro 2a","translation":"What's new, Socrates?","notes":"The opening line of the dialogue. τί νεώτερον is literally “what newer thing?” — Greek uses a comparative where English would not.","tokens":[{"text":"τί","translit":"ti","gloss":"what","wordId":null,"familyId":null,"morphology":null,"parse":{"case":"nominative","number":"s","gender":"n"}},{"text":"νεώτερον","translit":"neōteron","gloss":"newer thing","wordId":"neoteros","familyId":"νεωτερ","morphology":{"highlight":[6,7],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"n"}},{"text":"ὦ","translit":"ō","gloss":"O (addressing someone)","wordId":null,"familyId":null,"morphology":null},{"text":"Σώκρατες","translit":"Sōkrates","gloss":"Socrates","wordId":null,"familyId":null,"morphology":null,"parse":{"case":"vocative","number":"s","gender":"m"}},{"text":"γέγονεν","translit":"gegonen","gloss":"has happened","wordId":null,"familyId":null,"morphology":null,"parse":{"person":"3","tense":"perfect","voice":"active","mood":"indicative","number":"s"}}]},
  {"id":"thucydides-opening","reference":"Thucydides, Histories 1.1","translation":"Thucydides the Athenian wrote up the war of the Peloponnesians and the Athenians.","notes":"The first sentence of the Histories. Thucydides names himself in the third person — a convention of Greek historiography.","tokens":[{"text":"Θουκυδίδης","translit":"Thoukydidēs","gloss":"Thucydides","wordId":null,"familyId":null,"morphology":null,"parse":{"case":"nominative","number":"s","gender":"m"}},{"text":"Ἀθηναῖος","translit":"Athēnaios","gloss":"the Athenian","wordId":"athenaios","familyId":"ἀθηναι","morphology":{"highlight":[6,7],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"m"}},{"text":"ξυνέγραψε","translit":"xynegrapse","gloss":"wrote up","wordId":null,"familyId":null,"morphology":null,"parse":{"person":"3","tense":"aorist","voice":"active","mood":"indicative","number":"s"}},{"text":"τὸν","translit":"ton","gloss":"the","wordId":null,"familyId":null,"morphology":null},{"text":"πόλεμον","translit":"polemon","gloss":"war","wordId":"polemos","familyId":"πολεμ","morphology":{"highlight":[5,6],"kind":"ending"},"parse":{"case":"accusative","number":"s","gender":"m"}},{"text":"τῶν","translit":"tōn","gloss":"of the","wordId":null,"familyId":null,"morphology":null},{"text":"Πελοποννησίων","translit":"Peloponnēsiōn","gloss":"of the Peloponnesians","wordId":null,"familyId":null,"morphology":null,"parse":{"case":"genitive","number":"p","gender":"m"}},{"text":"καὶ","translit":"kai","gloss":"and","wordId":null,"familyId":null,"morphology":null},{"text":"Ἀθηναίων","translit":"Athēnaiōn","gloss":"of the Athenians","wordId":"athenaios","familyId":"ἀθηναι","morphology":{"highlight":[6,7],"kind":"ending"},"parse":{"case":"genitive","number":"p","gender":"m"}}]},
];
