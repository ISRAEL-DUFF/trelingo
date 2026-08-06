/**
 * GENERATED FILE — do not edit by hand.
 *
 * Produced by:
 *   node scripts/import-morphgnt.mjs <corpusDir>
 *   node scripts/emit-koine-course.mjs
 *
 * Stem/ending splits, letter indices, morphological parses and attestations are
 * DERIVED from MorphGNT by paradigm invariance (spike-a-findings.md §4).
 * Glosses, distractors and teaching notes come from scripts/koine-glossary.json
 * and are the human contribution — they still need specialist review.
 *
 * Sources
 *   text     SBLGNT            CC BY 4.0   https://sblgnt.com/license/
 *   parsing  MorphGNT/sblgnt   CC BY-SA    https://github.com/morphgnt/sblgnt
 *
 * 47 words · 44 families · 4 passages
 */
import type { ContentBundle } from "../../schema";

export const families: ContentBundle["families"] = [
  {"id":"θε","letters":"θε","coreGloss":"god","notes":"Behind θεός and θεολογία."},
  {"id":"λογ","letters":"λογ","coreGloss":"word, reason, account","notes":"Behind λόγος, λέγω (say) and every English -logy."},
  {"id":"ἀρχ","letters":"ἀρχ","coreGloss":"beginning, rule","notes":"Behind ἀρχή (beginning) and ἄρχων (ruler)."},
  {"id":"κοσμ","letters":"κοσμ","coreGloss":"order, world","notes":"The same family gives both “cosmos” and “cosmetic”."},
  {"id":"ζω","letters":"ζω","coreGloss":"life"},
  {"id":"ἀληθει","letters":"ἀληθει","coreGloss":"truth"},
  {"id":"ἀγαπ","letters":"ἀγαπ","coreGloss":"love","notes":"Shares a family with ἀγαπάω, to love."},
  {"id":"ἁμαρτι","letters":"ἁμαρτι","coreGloss":"sin, missing the mark"},
  {"id":"ἀνθρωπ","letters":"ἀνθρωπ","coreGloss":"human being"},
  {"id":"κυρι","letters":"κυρι","coreGloss":"lord, master"},
  {"id":"υἱ","letters":"υἱ","coreGloss":"son"},
  {"id":"ἡμερ","letters":"ἡμερ","coreGloss":"day"},
  {"id":"οὐραν","letters":"οὐραν","coreGloss":"heaven, sky"},
  {"id":"καρδι","letters":"καρδι","coreGloss":"heart"},
  {"id":"δοξ","letters":"δοξ","coreGloss":"glory, opinion"},
  {"id":"εἰρην","letters":"εἰρην","coreGloss":"peace"},
  {"id":"ἐκκλησι","letters":"ἐκκλησι","coreGloss":"assembly"},
  {"id":"νομ","letters":"νομ","coreGloss":"law, custom"},
  {"id":"μαθητ","letters":"μαθητ","coreGloss":"disciple, learner"},
  {"id":"βασιλ","letters":"βασιλ","coreGloss":"kingdom, reign"},
  {"id":"ἐργ","letters":"ἐργ","coreGloss":"work"},
  {"id":"ὡρ","letters":"ὡρ","coreGloss":"hour, time"},
  {"id":"ἀδελφ","letters":"ἀδελφ","coreGloss":"brother"},
  {"id":"τεκν","letters":"τεκν","coreGloss":"child"},
  {"id":"δουλ","letters":"δουλ","coreGloss":"servant"},
  {"id":"καιρ","letters":"καιρ","coreGloss":"appointed time"},
  {"id":"ὁδ","letters":"ὁδ","coreGloss":"way, road"},
  {"id":"εὐαγγελι","letters":"εὐαγγελι","coreGloss":"good news"},
  {"id":"σκοτι","letters":"σκοτι","coreGloss":"darkness"},
  {"id":"ἀγαθ","letters":"ἀγαθ","coreGloss":"good"},
  {"id":"ἁγι","letters":"ἁγι","coreGloss":"holy, set apart"},
  {"id":"πιστ","letters":"πιστ","coreGloss":"faithful"},
  {"id":"καιν","letters":"καιν","coreGloss":"new"},
  {"id":"πρωτ","letters":"πρωτ","coreGloss":"first"},
  {"id":"αἰωνι","letters":"αἰωνι","coreGloss":"eternal"},
  {"id":"ἀκου","letters":"ἀκου","coreGloss":"hear","notes":"Behind English “acoustic”."},
  {"id":"γραφ","letters":"γραφ","coreGloss":"write","notes":"Behind γραφή (writing, Scripture) and every English -graphy."},
  {"id":"βλεπ","letters":"βλεπ","coreGloss":"see, look"},
  {"id":"μεν","letters":"μεν","coreGloss":"remain, abide"},
  {"id":"λαμβαν","letters":"λαμβαν","coreGloss":"take, receive"},
  {"id":"γινωσκ","letters":"γινωσκ","coreGloss":"know","notes":"Behind γνῶσις (knowledge) and English “gnostic”."},
  {"id":"κριν","letters":"κριν","coreGloss":"judge, decide","notes":"Behind κρίσις (judgement) and English “critic”."},
  {"id":"φαιν","letters":"φαιν","coreGloss":"shine, appear"},
  {"id":"σῳζ","letters":"σῳζ","coreGloss":"save, rescue","notes":"Behind σωτηρία (salvation)."},
];

export const words: ContentBundle["words"] = [
  // derived · 1307 occurrences in the sampled corpus
  {"id":"theos","familyId":"θε","text":"θεός","translit":"theos","gloss":"God","partOfSpeech":"noun","morphology":{"highlight":[2,3],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"m"},"attestations":["Matthew 1:23","Matthew 3:9","Matthew 6:30"],"distractors":["spirit","world","truth"],"frequency":{"inTrack":2,"inCorpus":1307,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":27}},
  // derived · 330 occurrences in the sampled corpus
  {"id":"logos","familyId":"λογ","text":"λόγος","translit":"logos","gloss":"word, reason","partOfSpeech":"noun","morphology":{"highlight":[3,4],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"m"},"attestations":["Matthew 5:37","Matthew 28:15","Mark 4:15"],"distractors":["light","life","flesh"],"notes":"2nd declension. The -ος ending marks nominative singular; the accusative is λόγον.","frequency":{"inTrack":3,"inCorpus":330,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":24}},
  // derived · 55 occurrences in the sampled corpus
  {"id":"arche","familyId":"ἀρχ","text":"ἀρχή","translit":"archē","gloss":"beginning","partOfSpeech":"noun","morphology":{"highlight":[3],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"f"},"attestations":["Matthew 24:8","Mark 1:1","Mark 13:8"],"distractors":["end","word","light"],"frequency":{"inTrack":2,"inCorpus":55,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":17}},
  // derived · 185 occurrences in the sampled corpus
  {"id":"kosmos","familyId":"κοσμ","text":"κόσμος","translit":"kosmos","gloss":"world","partOfSpeech":"noun","morphology":{"highlight":[4,5],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"m"},"attestations":["Matthew 13:38","John 1:10"],"distractors":["temple","heaven","sin"],"frequency":{"inCorpus":185,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":20}},
  // derived · 135 occurrences in the sampled corpus
  {"id":"zoe","familyId":"ζω","text":"ζωή","translit":"zōē","gloss":"life","partOfSpeech":"noun","morphology":{"highlight":[2],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"f"},"attestations":["Luke 12:15","John 1:4"],"distractors":["death","peace","joy"],"frequency":{"inTrack":2,"inCorpus":135,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":22}},
  // derived · 109 occurrences in the sampled corpus
  {"id":"aletheia","familyId":"ἀληθει","text":"ἀλήθεια","translit":"alētheia","gloss":"truth","partOfSpeech":"noun","morphology":{"highlight":[6],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"f"},"attestations":["John 1:17","John 8:32","John 8:44"],"distractors":["lie","grace","hope"],"frequency":{"inCorpus":109,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":23}},
  // derived · 116 occurrences in the sampled corpus
  {"id":"agape","familyId":"ἀγαπ","text":"ἀγάπη","translit":"agapē","gloss":"love","partOfSpeech":"noun","morphology":{"highlight":[4],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"f"},"attestations":["Matthew 24:12","John 17:26","Romans 5:5"],"distractors":["fear","faith","mercy"],"frequency":{"inCorpus":116,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":24}},
  // derived · 172 occurrences in the sampled corpus
  {"id":"hamartia","familyId":"ἁμαρτι","text":"ἁμαρτία","translit":"hamartia","gloss":"sin","partOfSpeech":"noun","morphology":{"highlight":[6],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"f"},"attestations":["Matthew 12:31","John 9:41","Romans 5:12"],"distractors":["law","death","flesh"],"frequency":{"inCorpus":172,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":20}},
  // derived · 550 occurrences in the sampled corpus
  {"id":"anthropos","familyId":"ἀνθρωπ","text":"ἄνθρωπος","translit":"anthrōpos","gloss":"human being","partOfSpeech":"noun","morphology":{"highlight":[6,7],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"m"},"attestations":["Matthew 4:4","Matthew 7:9","Matthew 8:9"],"distractors":["city","river","soul"],"frequency":{"inTrack":1,"inCorpus":550,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":24}},
  // derived · 713 occurrences in the sampled corpus
  {"id":"kyrios","familyId":"κυρι","text":"κύριος","translit":"kyrios","gloss":"lord, master","partOfSpeech":"noun","morphology":{"highlight":[4,5],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"m"},"attestations":["Matthew 10:25","Matthew 12:8","Matthew 18:25"],"distractors":["servant","prophet","priest"],"frequency":{"inCorpus":713,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":23}},
  // derived · 375 occurrences in the sampled corpus
  {"id":"huios","familyId":"υἱ","text":"υἱός","translit":"huios","gloss":"son","partOfSpeech":"noun","morphology":{"highlight":[2,3],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"m"},"attestations":["Matthew 1:20","Matthew 3:17","Matthew 4:3"],"distractors":["daughter","father","servant"],"frequency":{"inCorpus":375,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":20}},
  // derived · 389 occurrences in the sampled corpus
  {"id":"hemera","familyId":"ἡμερ","text":"ἡμέρα","translit":"hēmera","gloss":"day","partOfSpeech":"noun","morphology":{"highlight":[4],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"f"},"attestations":["Luke 6:13","Luke 9:12","Luke 21:34"],"distractors":["night","year","hour"],"frequency":{"inCorpus":389,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":23}},
  // derived · 273 occurrences in the sampled corpus
  {"id":"ouranos","familyId":"οὐραν","text":"οὐρανός","translit":"ouranos","gloss":"heaven, sky","partOfSpeech":"noun","morphology":{"highlight":[5,6],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"m"},"attestations":["Matthew 5:18","Matthew 16:2","Matthew 16:3"],"distractors":["earth","sea","mountain"],"frequency":{"inCorpus":273,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":19}},
  // derived · 156 occurrences in the sampled corpus
  {"id":"kardia","familyId":"καρδι","text":"καρδία","translit":"kardia","gloss":"heart","partOfSpeech":"noun","morphology":{"highlight":[5],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"f"},"attestations":["Matthew 6:21","Matthew 13:15","Matthew 15:8"],"distractors":["hand","eye","mind"],"frequency":{"inCorpus":156,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":22}},
  // derived · 165 occurrences in the sampled corpus
  {"id":"doxa","familyId":"δοξ","text":"δόξα","translit":"doxa","gloss":"glory","partOfSpeech":"noun","morphology":{"highlight":[3],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"f"},"attestations":["Luke 2:9","Luke 2:14","Luke 14:10"],"distractors":["shame","power","peace"],"frequency":{"inCorpus":165,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":23}},
  // derived · 91 occurrences in the sampled corpus
  {"id":"eirene","familyId":"εἰρην","text":"εἰρήνη","translit":"eirēnē","gloss":"peace","partOfSpeech":"noun","morphology":{"highlight":[5],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"f"},"attestations":["Matthew 10:13","Luke 2:14"],"distractors":["war","joy","hope"],"frequency":{"inCorpus":91,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":26}},
  // derived · 114 occurrences in the sampled corpus
  {"id":"ekklesia","familyId":"ἐκκλησι","text":"ἐκκλησία","translit":"ekklēsia","gloss":"assembly, church","partOfSpeech":"noun","morphology":{"highlight":[7],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"f"},"attestations":["Acts 9:31","Acts 19:32","1 Corinthians 14:5"],"distractors":["temple","city","household"],"frequency":{"inCorpus":114,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":17}},
  // derived · 193 occurrences in the sampled corpus
  {"id":"nomos","familyId":"νομ","text":"νόμος","translit":"nomos","gloss":"law","partOfSpeech":"noun","morphology":{"highlight":[3,4],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"m"},"attestations":["Matthew 7:12","Matthew 11:13","Matthew 22:40"],"distractors":["grace","sin","promise"],"frequency":{"inCorpus":193,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":12}},
  // derived · 262 occurrences in the sampled corpus
  {"id":"mathetes","familyId":"μαθητ","text":"μαθητής","translit":"mathētēs","gloss":"disciple","partOfSpeech":"noun","morphology":{"highlight":[5,6],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"m"},"attestations":["Matthew 10:24","Luke 6:40","Luke 14:26"],"distractors":["teacher","crowd","brother"],"frequency":{"inCorpus":262,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":5}},
  // derived · 162 occurrences in the sampled corpus
  {"id":"basileia","familyId":"βασιλ","text":"βασιλεία","translit":"basileia","gloss":"kingdom","partOfSpeech":"noun","morphology":{"highlight":[7],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"f"},"attestations":["Matthew 3:2","Matthew 4:17","Matthew 5:3"],"distractors":["city","nation","throne"],"frequency":{"inCorpus":162,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":17}},
  // derived · 169 occurrences in the sampled corpus
  {"id":"ergon","familyId":"ἐργ","text":"ἔργον","translit":"ergon","gloss":"work, deed","partOfSpeech":"noun","morphology":{"highlight":[3,4],"kind":"ending"},"parse":{"case":"accusative","number":"s","gender":"n"},"attestations":["Matthew 26:10","Mark 13:34","Mark 14:6"],"distractors":["word","faith","rest"],"frequency":{"inCorpus":169,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":26}},
  // derived · 106 occurrences in the sampled corpus
  {"id":"hora","familyId":"ὡρ","text":"ὥρα","translit":"hōra","gloss":"hour","partOfSpeech":"noun","morphology":{"highlight":[2],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"f"},"attestations":["Matthew 14:15","Matthew 26:45","Mark 6:35"],"distractors":["day","year","moment"],"frequency":{"inCorpus":106,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":13}},
  // derived · 342 occurrences in the sampled corpus
  {"id":"adelphos","familyId":"ἀδελφ","text":"ἀδελφός","translit":"adelphos","gloss":"brother","partOfSpeech":"noun","morphology":{"highlight":[5,6],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"m"},"attestations":["Matthew 5:23","Matthew 10:2"],"distractors":["father","son","friend"],"frequency":{"inCorpus":342,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":25}},
  // derived · 99 occurrences in the sampled corpus
  {"id":"teknon","familyId":"τεκν","text":"τέκνον","translit":"teknon","gloss":"child","partOfSpeech":"noun","morphology":{"highlight":[4,5],"kind":"ending"},"parse":{"number":"s","gender":"n"},"attestations":["Matthew 9:2","Matthew 10:21","Matthew 21:28"],"distractors":["son","servant","woman"],"frequency":{"inCorpus":99,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":23}},
  // derived · 126 occurrences in the sampled corpus
  {"id":"doulos","familyId":"δουλ","text":"δοῦλος","translit":"doulos","gloss":"servant, slave","partOfSpeech":"noun","morphology":{"highlight":[4,5],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"m"},"attestations":["Matthew 10:24","Matthew 10:25","Matthew 18:26"],"distractors":["lord","friend","king"],"frequency":{"inCorpus":126,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":21}},
  // derived · 85 occurrences in the sampled corpus
  {"id":"kairos","familyId":"καιρ","text":"καιρός","translit":"kairos","gloss":"appointed time","partOfSpeech":"noun","morphology":{"highlight":[4,5],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"m"},"attestations":["Matthew 21:34","Matthew 26:18","Mark 1:15"],"distractors":["place","hour","age"],"frequency":{"inCorpus":85,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":19}},
  // derived · 101 occurrences in the sampled corpus
  {"id":"hodos","familyId":"ὁδ","text":"ὁδός","translit":"hodos","gloss":"way, road","partOfSpeech":"noun","morphology":{"highlight":[2,3],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"f"},"attestations":["Matthew 7:13","Matthew 7:14","John 14:6"],"distractors":["gate","wall","field"],"frequency":{"inCorpus":101,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":13}},
  // derived · 75 occurrences in the sampled corpus
  {"id":"euangelion","familyId":"εὐαγγελι","text":"εὐαγγέλιον","translit":"euangelion","gloss":"good news, gospel","partOfSpeech":"noun","morphology":{"highlight":[8,9],"kind":"ending"},"parse":{"case":"accusative","number":"s","gender":"n"},"attestations":["Matthew 4:23","Matthew 9:35","Matthew 24:14"],"distractors":["letter","commandment","parable"],"frequency":{"inTrack":1,"inCorpus":75,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":17}},
  // derived · 17 occurrences in the sampled corpus
  {"id":"skotia","familyId":"σκοτι","text":"σκοτία","translit":"skotia","gloss":"darkness","partOfSpeech":"noun","morphology":{"highlight":[5],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"f"},"attestations":["John 1:5","John 6:17","John 12:35"],"distractors":["light","cloud","night"],"frequency":{"inTrack":2,"inCorpus":17,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":4}},
  // derived · 101 occurrences in the sampled corpus
  {"id":"agathos","familyId":"ἀγαθ","text":"ἀγαθός","translit":"agathos","gloss":"good","partOfSpeech":"adjective","morphology":{"highlight":[4,5],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"m"},"attestations":["Matthew 12:35","Matthew 19:17","Matthew 20:15"],"distractors":["swift","far","old"],"frequency":{"inCorpus":101,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":21}},
  // derived · 233 occurrences in the sampled corpus
  {"id":"hagios","familyId":"ἁγι","text":"ἅγιος","translit":"hagios","gloss":"holy","partOfSpeech":"adjective","morphology":{"highlight":[3,4],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"m"},"attestations":["Mark 1:24","Luke 4:34","John 6:69"],"distractors":["great","faithful","wise"],"frequency":{"inCorpus":233,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":23}},
  // derived · 67 occurrences in the sampled corpus
  {"id":"pistos","familyId":"πιστ","text":"πιστός","translit":"pistos","gloss":"faithful","partOfSpeech":"adjective","morphology":{"highlight":[4,5],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"m"},"attestations":["Matthew 24:45","Matthew 25:21","Matthew 25:23"],"distractors":["fearful","wise","strong"],"frequency":{"inCorpus":67,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":19}},
  // derived · 42 occurrences in the sampled corpus
  {"id":"kainos","familyId":"καιν","text":"καινός","translit":"kainos","gloss":"new","partOfSpeech":"noun","morphology":{"highlight":[4,5],"kind":"ending"},"attestations":[],"distractors":["old","first","last"],"frequency":{"inCorpus":42,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":14}},
  // derived · 153 occurrences in the sampled corpus
  {"id":"protos","familyId":"πρωτ","text":"πρῶτος","translit":"prōtos","gloss":"first","partOfSpeech":"adjective","morphology":{"highlight":[4,5],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"m"},"attestations":["Matthew 10:2","Matthew 20:27","Matthew 21:31"],"distractors":["last","great","few"],"frequency":{"inCorpus":153,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":20}},
  // stem override · 69 occurrences in the sampled corpus
  {"id":"aionios","familyId":"αἰωνι","text":"αἰώνιος","translit":"aiōnios","gloss":"eternal","partOfSpeech":"adjective","morphology":{"highlight":[5,6],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"f"},"attestations":["John 12:50","John 17:3","Romans 6:23"],"distractors":["temporary","holy","hidden"],"notes":"Every attested ending here begins with omicron, so the corpus invariant looks like αἰωνιο-. The standard analysis is stem αἰωνι- with the 2nd-declension -ος ending.","frequency":{"inCorpus":69,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":19}},
  // stem manual · 241 occurrences in the sampled corpus
  {"id":"pisteuo","familyId":"πιστ","text":"πιστεύω","translit":"pisteuō","gloss":"I believe","partOfSpeech":"verb","morphology":{"highlight":[6],"kind":"ending"},"attestations":["Mark 9:24","John 9:38","Acts 27:25"],"distractors":["I hear","I see","I know"],"notes":"The -ω ending marks 1st person singular present; -ει marks 3rd person.","frequency":{"inCorpus":241,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":21}},
  // stem manual · 427 occurrences in the sampled corpus
  {"id":"akouo","familyId":"ἀκου","text":"ἀκούω","translit":"akouō","gloss":"I hear","partOfSpeech":"verb","morphology":{"highlight":[4],"kind":"ending"},"attestations":["Luke 9:9","Luke 16:2","John 5:30"],"distractors":["I speak","I see","I write"],"frequency":{"inCorpus":427,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":23}},
  // stem manual · 190 occurrences in the sampled corpus
  {"id":"grapho","familyId":"γραφ","text":"γράφω","translit":"graphō","gloss":"I write","partOfSpeech":"verb","morphology":{"highlight":[4],"kind":"ending"},"attestations":["1 Corinthians 4:14","1 Corinthians 14:37","2 Corinthians 13:10"],"distractors":["I read","I send","I ask"],"frequency":{"inCorpus":190,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":22}},
  // stem manual · 133 occurrences in the sampled corpus
  {"id":"blepo","familyId":"βλεπ","text":"βλέπω","translit":"blepō","gloss":"I see, I look at","partOfSpeech":"verb","morphology":{"highlight":[4],"kind":"ending"},"attestations":["Mark 8:24","John 9:15","John 9:25"],"distractors":["I hear","I find","I follow"],"frequency":{"inCorpus":133,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":16}},
  // stem manual · 118 occurrences in the sampled corpus
  {"id":"meno","familyId":"μεν","text":"μένω","translit":"menō","gloss":"I remain, I abide","partOfSpeech":"verb","morphology":{"highlight":[3],"kind":"ending"},"attestations":["John 15:10"],"distractors":["I leave","I come","I fall"],"frequency":{"inCorpus":118,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":16}},
  // stem manual · 258 occurrences in the sampled corpus
  {"id":"lambano","familyId":"λαμβαν","text":"λαμβάνω","translit":"lambanō","gloss":"I take, I receive","partOfSpeech":"verb","morphology":{"highlight":[6],"kind":"ending"},"attestations":["John 5:34","John 5:41"],"distractors":["I give","I lose","I carry"],"frequency":{"inCorpus":258,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":21}},
  // stem manual · 221 occurrences in the sampled corpus
  {"id":"ginosko","familyId":"γινωσκ","text":"γινώσκω","translit":"ginōskō","gloss":"I know","partOfSpeech":"verb","morphology":{"highlight":[6],"kind":"ending"},"attestations":["Luke 1:34","John 10:14","John 10:15"],"distractors":["I forget","I teach","I ask"],"frequency":{"inCorpus":221,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":20}},
  // stem manual · 114 occurrences in the sampled corpus
  {"id":"krino","familyId":"κριν","text":"κρίνω","translit":"krinō","gloss":"I judge","partOfSpeech":"verb","morphology":{"highlight":[4],"kind":"ending"},"attestations":["Luke 19:22","John 5:30","John 8:15"],"distractors":["I forgive","I rule","I choose"],"frequency":{"inCorpus":114,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":15}},
  // stem manual · 31 occurrences in the sampled corpus
  {"id":"phaino","familyId":"φαιν","text":"φαίνω","translit":"phainō","gloss":"I shine, I appear","partOfSpeech":"noun","morphology":{"highlight":[4],"kind":"ending"},"attestations":[],"distractors":["I hide","I burn","I fall"],"frequency":{"inTrack":1,"inCorpus":31,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":13}},
  // stem manual · 106 occurrences in the sampled corpus
  {"id":"sozo","familyId":"σῳζ","text":"σῴζω","translit":"sōzō","gloss":"I save","partOfSpeech":"noun","morphology":{"highlight":[3],"kind":"ending"},"attestations":[],"distractors":["I judge","I lose","I heal"],"frequency":{"inCorpus":106,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":18}},
  // stem manual · 2345 occurrences in the sampled corpus
  {"id":"lego","familyId":"λογ","text":"λέγω","translit":"legō","gloss":"I say","partOfSpeech":"verb","morphology":{"highlight":[3],"kind":"ending"},"attestations":["Matthew 3:9","Matthew 5:18","Matthew 5:20"],"distractors":["I hear","I write","I ask"],"frequency":{"inCorpus":2345,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":25}},
  // stem manual · 143 occurrences in the sampled corpus
  {"id":"agapao","familyId":"ἀγαπ","text":"ἀγαπάω","translit":"agapaō","gloss":"I love","partOfSpeech":"noun","morphology":{"highlight":[5],"kind":"ending"},"attestations":[],"distractors":["I hate","I fear","I seek"],"frequency":{"inCorpus":143,"corpus":"the New Testament","corpusComplete":true,"corpusBooks":22}},
];

export const passages: ContentBundle["passages"] = [
  {"id":"john-1-1","reference":"John 1:1","translation":"In the beginning was the Word, and the Word was with God, and the Word was God.","notes":"θεόν and θεὸς are the same word in different cases — accusative after πρός, then nominative. Only the ending moves.","tokens":[{"text":"Ἐν","translit":"en","gloss":"in","wordId":null,"familyId":null,"morphology":null},{"text":"ἀρχῇ","translit":"archē","gloss":"the beginning","wordId":"arche","familyId":"ἀρχ","morphology":{"highlight":[3],"kind":"ending"},"parse":{"case":"dative","number":"s","gender":"f"}},{"text":"ἦν","translit":"ēn","gloss":"was","wordId":null,"familyId":null,"morphology":null,"parse":{"person":"3","tense":"imperfect","voice":"active","mood":"indicative","number":"s"}},{"text":"ὁ","translit":"ho","gloss":"the","wordId":null,"familyId":null,"morphology":null},{"text":"λόγος","translit":"logos","gloss":"Word","wordId":"logos","familyId":"λογ","morphology":{"highlight":[3,4],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"m"}},{"text":"καὶ","translit":"kai","gloss":"and","wordId":null,"familyId":null,"morphology":null},{"text":"ὁ","translit":"ho","gloss":"the","wordId":null,"familyId":null,"morphology":null},{"text":"λόγος","translit":"logos","gloss":"Word","wordId":"logos","familyId":"λογ","morphology":{"highlight":[3,4],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"m"}},{"text":"ἦν","translit":"ēn","gloss":"was","wordId":null,"familyId":null,"morphology":null,"parse":{"person":"3","tense":"imperfect","voice":"active","mood":"indicative","number":"s"}},{"text":"πρὸς","translit":"pros","gloss":"with","wordId":null,"familyId":null,"morphology":null},{"text":"τὸν","translit":"ton","gloss":"the","wordId":null,"familyId":null,"morphology":null},{"text":"θεόν","translit":"theon","gloss":"God","wordId":"theos","familyId":"θε","morphology":{"highlight":[2,3],"kind":"ending"},"parse":{"case":"accusative","number":"s","gender":"m"}},{"text":"καὶ","translit":"kai","gloss":"and","wordId":null,"familyId":null,"morphology":null},{"text":"θεὸς","translit":"theos","gloss":"God","wordId":"theos","familyId":"θε","morphology":{"highlight":[2,3],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"m"}},{"text":"ἦν","translit":"ēn","gloss":"was","wordId":null,"familyId":null,"morphology":null,"parse":{"person":"3","tense":"imperfect","voice":"active","mood":"indicative","number":"s"}},{"text":"ὁ","translit":"ho","gloss":"the","wordId":null,"familyId":null,"morphology":null},{"text":"λόγος","translit":"logos","gloss":"Word","wordId":"logos","familyId":"λογ","morphology":{"highlight":[3,4],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"m"}}]},
  {"id":"john-1-4","reference":"John 1:4","translation":"In him was life, and the life was the light of men.","notes":"τῶν ἀνθρώπων is genitive plural — “of the men”. The article declines with its noun.","tokens":[{"text":"ἐν","translit":"en","gloss":"in","wordId":null,"familyId":null,"morphology":null},{"text":"αὐτῷ","translit":"autō","gloss":"him","wordId":null,"familyId":null,"morphology":null,"parse":{"case":"dative","number":"s","gender":"m"}},{"text":"ζωὴ","translit":"zōē","gloss":"life","wordId":"zoe","familyId":"ζω","morphology":{"highlight":[2],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"f"}},{"text":"ἦν","translit":"ēn","gloss":"was","wordId":null,"familyId":null,"morphology":null,"parse":{"person":"3","tense":"imperfect","voice":"active","mood":"indicative","number":"s"}},{"text":"καὶ","translit":"kai","gloss":"and","wordId":null,"familyId":null,"morphology":null},{"text":"ἡ","translit":"hē","gloss":"the","wordId":null,"familyId":null,"morphology":null},{"text":"ζωὴ","translit":"zōē","gloss":"life","wordId":"zoe","familyId":"ζω","morphology":{"highlight":[2],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"f"}},{"text":"ἦν","translit":"ēn","gloss":"was","wordId":null,"familyId":null,"morphology":null,"parse":{"person":"3","tense":"imperfect","voice":"active","mood":"indicative","number":"s"}},{"text":"τὸ","translit":"to","gloss":"the","wordId":null,"familyId":null,"morphology":null},{"text":"φῶς","translit":"phōs","gloss":"light","wordId":null,"familyId":null,"morphology":null,"parse":{"case":"nominative","number":"s","gender":"n"}},{"text":"τῶν","translit":"tōn","gloss":"of the","wordId":null,"familyId":null,"morphology":null},{"text":"ἀνθρώπων","translit":"anthrōpōn","gloss":"of men","wordId":"anthropos","familyId":"ἀνθρωπ","morphology":{"highlight":[6,7],"kind":"ending"},"parse":{"case":"genitive","number":"p","gender":"m"}}]},
  {"id":"john-1-5","reference":"John 1:5","translation":"And the light shines in the darkness, and the darkness did not overcome it.","notes":"φαίνει is present — “shines”, not “shone”. κατέλαβεν is aorist, a single completed act in the past.","tokens":[{"text":"καὶ","translit":"kai","gloss":"and","wordId":null,"familyId":null,"morphology":null},{"text":"τὸ","translit":"to","gloss":"the","wordId":null,"familyId":null,"morphology":null},{"text":"φῶς","translit":"phōs","gloss":"light","wordId":null,"familyId":null,"morphology":null,"parse":{"case":"nominative","number":"s","gender":"n"}},{"text":"ἐν","translit":"en","gloss":"in","wordId":null,"familyId":null,"morphology":null},{"text":"τῇ","translit":"tē","gloss":"the","wordId":null,"familyId":null,"morphology":null},{"text":"σκοτίᾳ","translit":"skotia","gloss":"darkness","wordId":"skotia","familyId":"σκοτι","morphology":{"highlight":[5],"kind":"ending"},"parse":{"case":"dative","number":"s","gender":"f"}},{"text":"φαίνει","translit":"phainei","gloss":"shines","wordId":"phaino","familyId":"φαιν","morphology":{"highlight":[4,5],"kind":"ending"},"parse":{"person":"3","tense":"present","voice":"active","mood":"indicative","number":"s"}},{"text":"καὶ","translit":"kai","gloss":"and","wordId":null,"familyId":null,"morphology":null},{"text":"ἡ","translit":"hē","gloss":"the","wordId":null,"familyId":null,"morphology":null},{"text":"σκοτία","translit":"skotia","gloss":"darkness","wordId":"skotia","familyId":"σκοτι","morphology":{"highlight":[5],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"f"}},{"text":"αὐτὸ","translit":"auto","gloss":"it","wordId":null,"familyId":null,"morphology":null,"parse":{"case":"accusative","number":"s","gender":"n"}},{"text":"οὐ","translit":"ou","gloss":"not","wordId":null,"familyId":null,"morphology":null},{"text":"κατέλαβεν","translit":"katelaben","gloss":"overcame","wordId":null,"familyId":null,"morphology":null,"parse":{"person":"3","tense":"aorist","voice":"active","mood":"indicative","number":"s"}}]},
  {"id":"mark-1-1","reference":"Mark 1:1","translation":"The beginning of the good news of Jesus Christ.","notes":"Three genitives in a row: “the beginning OF the gospel OF Jesus Christ”. Greek stacks them where English needs repeated “of”.","tokens":[{"text":"Ἀρχὴ","translit":"archē","gloss":"beginning","wordId":"arche","familyId":"ἀρχ","morphology":{"highlight":[3],"kind":"ending"},"parse":{"case":"nominative","number":"s","gender":"f"}},{"text":"τοῦ","translit":"tou","gloss":"of the","wordId":null,"familyId":null,"morphology":null},{"text":"εὐαγγελίου","translit":"euangeliou","gloss":"of the good news","wordId":"euangelion","familyId":"εὐαγγελι","morphology":{"highlight":[8,9],"kind":"ending"},"parse":{"case":"genitive","number":"s","gender":"n"}},{"text":"Ἰησοῦ","translit":"Iēsou","gloss":"of Jesus","wordId":null,"familyId":null,"morphology":null,"parse":{"case":"genitive","number":"s","gender":"m"}},{"text":"χριστοῦ","translit":"Christou","gloss":"of Christ","wordId":null,"familyId":null,"morphology":null,"parse":{"case":"genitive","number":"s","gender":"m"}}]},
];
