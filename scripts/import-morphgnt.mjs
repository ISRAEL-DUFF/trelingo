#!/usr/bin/env node
/**
 * MorphGNT → Koine course content.
 *
 * Everything MECHANICAL is derived from the corpus: stem/ending splits, letter
 * indices, morphological parses, attestations, frequency. Everything SEMANTIC —
 * glosses, distractors, pedagogical ordering — comes from `koine-glossary.json`,
 * because a corpus cannot supply meaning.
 *
 * That split is the whole point of spike-a-findings.md: hand-authoring splits
 * produced a 50% error rate in the prototype (greek-build-plan.md §7), while
 * deriving them spot-checked 11/11 and corrected a mistake I had made by hand.
 *
 * Sources
 *   text     SBLGNT              CC BY 4.0        https://sblgnt.com/license/
 *   parsing  MorphGNT/sblgnt     CC BY-SA         https://github.com/morphgnt/sblgnt
 *
 * TWO MODES.
 *   default     passages come from hand-authored specs in the glossary, each
 *               with its own per-token glosses. That is how the curated
 *               four-verse Gospels track was built.
 *   --book NN   a WHOLE BOOK: every verse becomes a passage, token glosses come
 *               from the word entries, and chapters become sections. The same
 *               shape Jonah and Ruth have on the Hebrew side.
 *
 * Stems are ALWAYS derived from the entire corpus directory, never from the
 * book alone. Paradigm invariance needs as many attested forms of a lemma as it
 * can get; deriving from one short book would leave most lemmas with a single
 * form and no derivable stem at all.
 *
 * Usage:  node scripts/import-morphgnt.mjs <corpusDir> [--out <file>]
 *         node scripts/import-morphgnt.mjs <corpusDir> --book 23 \
 *              --glossary scripts/1john-glossary.json \
 *              --translations scripts/web-1john.json --out <file>
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------- Greek text
// Accents only. Breathings, iota subscript and diaeresis are part of a letter's
// identity — folding them would merge genuinely distinct endings.
const ACCENTS = /[̀́͂]/g;
const foldAccents = (s) => s.normalize("NFD").replace(ACCENTS, "").normalize("NFC");
const fold = (s) => foldAccents(s).replace(/ς/g, "σ").toLowerCase();

function clusters(word) {
  const out = [];
  for (const ch of word.normalize("NFC")) {
    if (/\p{Mn}/u.test(ch) && out.length) out[out.length - 1] += ch;
    else out.push(ch);
  }
  return out;
}

const commonPrefixLen = (a, b) => {
  let i = 0;
  while (i < a.length && i < b.length && fold(a[i]) === fold(b[i])) i++;
  return i;
};

// ------------------------------------------------------------- parse mapping
const TENSE = { P: "present", I: "imperfect", F: "future", A: "aorist", X: "perfect", Y: "pluperfect" };
const VOICE = { A: "active", M: "middle", P: "passive" };
const MOOD = { I: "indicative", D: "imperative", S: "subjunctive", O: "optative", N: "infinitive", P: "participle" };
const CASE = { N: "nominative", G: "genitive", D: "dative", A: "accusative" };
const NUM = { S: "s", P: "p" };
const GEN = { M: "m", F: "f", N: "n" };

const at = (code, i, map) => (code[i] && code[i] !== "-" ? map[code[i]] : undefined);

function parseOf(code) {
  return Object.fromEntries(
    Object.entries({
      person: code[0] !== "-" ? code[0] : undefined,
      tense: at(code, 1, TENSE),
      voice: at(code, 2, VOICE),
      mood: at(code, 3, MOOD),
      case: at(code, 4, CASE),
      number: at(code, 5, NUM),
      gender: at(code, 6, GEN),
    }).filter(([, v]) => v !== undefined),
  );
}

// Function words carry no stem/ending contrast worth teaching.
const INDECLINABLE = new Set(["C-", "P-", "D-", "X-", "I-"]);
const FUNCTION_WORD = new Set(["RA"]);
const POS = { "N-": "noun", "A-": "adjective", "V-": "verb", "RA": "particle", "RP": "pronoun", "RD": "pronoun", "RR": "pronoun", "RI": "pronoun", "C-": "conjunction", "P-": "preposition", "D-": "adverb", "X-": "particle", "I-": "particle" };

const BOOK_NAMES = {
  "01": "Matthew", "02": "Mark", "03": "Luke", "04": "John", "05": "Acts",
  "06": "Romans", "07": "1 Corinthians", "08": "2 Corinthians", "09": "Galatians",
  "10": "Ephesians", "11": "Philippians", "12": "Colossians", "13": "1 Thessalonians",
  "14": "2 Thessalonians", "15": "1 Timothy", "16": "2 Timothy", "17": "Titus",
  "18": "Philemon", "19": "Hebrews", "20": "James", "21": "1 Peter", "22": "2 Peter",
  "23": "1 John", "24": "2 John", "25": "3 John", "26": "Jude", "27": "Revelation",
};

// ------------------------------------------------------------------- loading
function loadCorpus(dir) {
  const tokens = [];
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".txt"))) {
    for (const line of readFileSync(resolve(dir, f), "utf8").split("\n")) {
      const p = line.trim().split(/\s+/);
      if (p.length !== 7) continue;
      const [bcv, pos, code, , word, norm, lemma] = p;
      tokens.push({ bcv, pos, code, word, norm, lemma });
    }
  }
  return tokens;
}

// --------------------------------------------------------- stem/ending split
/**
 * The stem is the INVARIANT across every attested form of a lemma; the ending is
 * whatever remains. Verified in spike-a-findings.md §4.2 at 11/11 against
 * hand-checked answers, including the three the prototype got wrong.
 */
function deriveStems(tokens) {
  const forms = new Map();
  for (const t of tokens) {
    // WHY NOT "JUST SKIP THE AUGMENT". Dropping augmented indicatives from the
    // comparison looks like it would rescue the common verbs, and it does not.
    // It was tried: coverage rose from 103 of 1 John's content words to 143,
    // and the stems it produced were wrong. Perfect REDUPLICATION survives the
    // filter (πεπίστευκα against πιστεύω leaves the prefix "π"), and suppletion
    // ignores it entirely (λέγω/εἶπον share nothing). Checked against the 13
    // hand-verified overrides in koine-glossary.json, 12 of 13 disagreed:
    // πιστεύω came out as "π", μένω as "μέ", σῴζω as "σ".
    //
    // Those are not near misses. They are confident answers replacing correct
    // refusals, which is the failure mode spike-a-findings.md exists to avoid.
    // The rule stays conservative: when the corpus cannot establish a stem, it
    // says so, and the glossary supplies one that a reader has checked.
    if (!forms.has(t.lemma)) forms.set(t.lemma, new Set());
    forms.get(t.lemma).add(t.norm);
  }
  const stems = new Map();
  for (const [lemma, set] of forms) {
    const arr = [...set].map(clusters);
    if (arr.length < 2) continue;
    let n = arr[0].length;
    for (const f of arr.slice(1)) n = Math.min(n, commonPrefixLen(arr[0], f));
    const shortest = Math.min(...arr.map((f) => f.length));
    if (n > 0 && n < shortest) stems.set(lemma, n);
  }
  return stems;
}

/** Letter indices of the ending, i.e. everything after the stem. */
function endingIndices(surface, stemLen) {
  const len = clusters(surface).length;
  if (stemLen == null || stemLen <= 0 || stemLen >= len) return null;
  return Array.from({ length: len - stemLen }, (_, i) => stemLen + i);
}

// ------------------------------------------------------------------ pipeline
function main() {
  const dir = process.argv[2];
  if (!dir) {
    console.error("usage: node scripts/import-morphgnt.mjs <corpusDir> [--out <file>]");
    process.exit(1);
  }
  const outIdx = process.argv.indexOf("--out");
  const outFile = outIdx > 0 ? process.argv[outIdx + 1] : resolve(HERE, "generated-koine.json");

  const bookIdx = process.argv.indexOf("--book");
  const book = bookIdx > 0 ? process.argv[bookIdx + 1].padStart(2, "0") : null;

  /**
   * Scope a book to some of its chapters.
   *
   * Curating a whole book is a large amount of Greek judgement — Mark alone
   * needs 1,158 glosses written from nothing — and the alternative to scoping
   * is auto-generated content, which is the weakest thing a course can ship.
   * The Hebrew importer has carried the same flag for the same reason.
   */
  const chIdx = process.argv.indexOf("--chapters");
  const chapters = chIdx > 0 ? new Set(process.argv[chIdx + 1].split(",").map((c) => c.trim().padStart(2, "0"))) : null;

  const glIdx = process.argv.indexOf("--glossary");
  const glossaryPath = glIdx > 0 ? resolve(process.argv[glIdx + 1]) : resolve(HERE, "koine-glossary.json");
  const glossary = JSON.parse(readFileSync(glossaryPath, "utf8"));

  const trIdx = process.argv.indexOf("--translations");
  const translations = trIdx > 0 ? JSON.parse(readFileSync(process.argv[trIdx + 1], "utf8")) : {};
  const tokens = loadCorpus(dir);
  const stems = deriveStems(tokens);

  console.log(`corpus: ${tokens.length} tokens, ${stems.size} lemmas with a derivable stem`);

  // In book mode the interesting count is occurrences IN THE BOOK; the
  // whole-NT figure is added later from the frequency table.
  const scoped = book
    ? tokens.filter((t) => t.bcv.startsWith(book) && (!chapters || chapters.has(t.bcv.slice(2, 4))))
    : tokens;
  const freq = new Map();
  for (const t of scoped) freq.set(t.lemma, (freq.get(t.lemma) ?? 0) + 1);

  /** Whole-NT counts, so a lemma can be shown as rare or common. */
  let corpusFreq = null;
  try {
    corpusFreq = JSON.parse(readFileSync(resolve(HERE, "corpora/greek-nt-frequency.json"), "utf8"));
  } catch {
    console.log("no corpora/greek-nt-frequency.json — shipping in-book counts only");
  }

  // ---- words -------------------------------------------------------------
  const words = [];
  const families = new Map();
  const skipped = [];
  /** Taught, but with no morpheme marked — see the note at the highlight check. */
  const unsplit = [];

  for (const entry of glossary.words) {
    const { lemma, id, gloss, distractors, notes, familyGloss, familyNotes } = entry;
    // Derivation is primary. Where the corpus cannot supply a stem — contract,
    // suppletive and μι-verbs, and 3rd-declension nouns whose nominative is
    // shorter than the stem (spike-a-findings.md §4.4) — the glossary may state
    // one explicitly. Overrides are the auditable exception, never the default.
    // A curator may declare that a word HAS no markable morpheme. γῆ is a
    // contraction whose stem is the single letter γ-, which is correct and
    // useless at once; marking it would teach that one letter is a morpheme.
    if (entry.noStem) {
      skipped.push({ lemma, reason: "no markable morpheme (curator's decision)" });
      continue;
    }
    const derived = stems.has(lemma);
    const stemLen = entry.stem != null ? clusters(entry.stem).length : stems.get(lemma);
    const highlight = endingIndices(lemma, stemLen);

    // NO STEM IS NOT A REASON NOT TO TEACH THE WORD.
    //
    // This used to skip the entry outright, which was defensible for the
    // four-verse curated track where every word existed to demonstrate a
    // stem/ending split. Over a whole gospel it is plainly wrong: 429 content
    // words had no derivable stem — εἷς, ἐσθίω, θέλω, ἐγείρω, ἀκολουθέω — and
    // dropping them meant Mark taught none of them at all.
    //
    // Hebrew settled this long ago. A word whose root the corpus cannot
    // establish is shown PLAIN and still taught (see WordSchema.morphology,
    // optional for exactly this reason). Greek now does the same: no highlight,
    // no family, nothing guessed, but the word is vocabulary.
    if (!highlight && !book) {
      skipped.push({ lemma, reason: stemLen == null ? "no derivable stem" : "degenerate split" });
      continue;
    }
    if (!highlight) unsplit.push(lemma);
    const stem = highlight ? clusters(lemma).slice(0, stemLen).join("") : null;
    // The glossary may group words into a shared family. Surface stems cannot
    // see that ἀγάπη (ἀγαπ-) and ἀγαπάω (ἀγαπα-) belong together, and the
    // family sheet is worthless if every word sits in a family of one.
    const familyId = highlight ? (entry.familyId ?? fold(stem)) : null;

    if (familyId && !families.has(familyId)) {
      families.set(familyId, {
        id: familyId,
        letters: familyId,
        coreGloss: familyGloss ?? gloss,
        ...(familyNotes ? { notes: familyNotes } : {}),
      });
    }

    // Parse and attestations come from the corpus, not the glossary.
    const occurrences = scoped.filter((t) => t.norm === lemma);

    // In BOOK MODE the glossary may be wider than the text — Mark's reuses 249
    // entries from the 1 John and Gospels glossaries so that every token has a
    // gloss, and 106 of those words never occur in Mark 1–4. A track must teach
    // only what its own text contains, or a learner drills ἀγάπη for a letter
    // they are not reading. Those entries still gloss passage tokens; they just
    // do not become vocabulary.
    if (book && !freq.get(lemma)) {
      skipped.push({ lemma, reason: "not attested in this book" });
      continue;
    }
    const sample = occurrences[0];

    // Function words gloss passage tokens but are never VOCABULARY. Teaching ὁ
    // "the" as a card would put the commonest word in Greek into the review
    // queue 359 times over. The split-based skip used to exclude them by
    // accident; now that a missing stem no longer drops a word, the exclusion
    // has to be stated. A word that DOES have a stem/ending split is teachable
    // whatever its part of speech.
    if (book && !highlight && (INDECLINABLE.has(sample?.pos) || FUNCTION_WORD.has(sample?.pos))) {
      skipped.push({ lemma, reason: "function word — glossed but not taught" });
      continue;
    }
    const attestations = [
      ...new Set(
        occurrences.slice(0, 3).map((t) => {
          const b = BOOK_NAMES[t.bcv.slice(0, 2)] ?? t.bcv.slice(0, 2);
          return `${b} ${Number(t.bcv.slice(2, 4))}:${Number(t.bcv.slice(4, 6))}`;
        }),
      ),
    ];

    words.push({
      id,
      familyId,
      text: lemma,
      translit: entry.translit,
      gloss,
      partOfSpeech: POS[sample?.pos] ?? "noun",
      ...(highlight ? { morphology: { highlight, kind: "ending" } } : {}),
      // A verb's citation form is 1sg present active indicative BY DEFINITION,
      // so sampling an occurrence can only mislead — κρίνω matched a future and
      // was labelled "future". Nominal citation forms are nominative singular
      // and safe to read off the corpus.
      ...(sample && sample.pos !== "V-" ? { parse: parseOf(sample.code) } : {}),
      attestations,
      distractors,
      ...(notes ? { notes } : {}),
      frequency: {
        ...(freq.get(lemma) ? { inTrack: freq.get(lemma) } : {}),
        ...(corpusFreq?.frequency?.[lemma]
          ? {
              inCorpus: corpusFreq.frequency[lemma],
              corpus: "the New Testament",
              // All 27 books counted — this is what licenses "hapax".
              corpusComplete: true,
              ...(corpusFreq.books?.[lemma] > 1 ? { corpusBooks: corpusFreq.books[lemma] } : {}),
            }
          : {}),
      },
      _freq: freq.get(lemma) ?? 0,
      _stemSource: entry.stem != null ? (derived ? "override" : "manual") : "derived",
    });
  }

  // ---- passages ----------------------------------------------------------
  const passages = [];
  const sections = [];
  const byLemmaAll = new Map(glossary.words.map((w) => [w.lemma, w]));
  const wordIds = new Set(words.map((w) => w.id));

  /**
   * The stem length a token should actually use.
   *
   * Overrides FIRST, derivation second — the same order the word builder uses.
   * Reading `stems` directly here meant a passage token split by the corpus's
   * guess while its glossary entry split by a hand-checked stem, so ἀπαγγέλλω
   * was ἀπ|αγγέλλω in the verse and ἀπαγγέλλ|ω in the vocabulary list. Seven of
   * 1 John's compound verbs did this, because a Greek augment sits INSIDE a
   * compound (ἀπήγγειλεν) and truncates the common prefix to the preposition.
   */
  const effectiveStemLen = (lemma) => {
    const entry = byLemmaAll.get(lemma);
    return entry?.stem != null ? clusters(entry.stem).length : stems.get(lemma);
  };

  /**
   * A stem LENGTH cannot locate a stem in a form that grew at the front.
   *
   * Greek augments and reduplicates: μένω has stem μεν-, but its perfect is
   * μεμενήκεισαν, where μεν- starts at letter three. Slicing the first three
   * letters off that form highlights nine letters of nonsense. Twelve of
   * 1 John's tokens do this — ἐθεασάμεθα, περιεπάτησεν, ἐξεληλύθασιν.
   *
   * So a token is split only when its surface form ACTUALLY BEGINS with the
   * lemma's stem. Otherwise it is shown plain. This is the same rule the Attic
   * importer already applies, and for the same reason: silence is the correct
   * output where the split cannot be located, and a confident wrong highlight
   * is the failure spike-a-findings.md exists to avoid.
   */
  const splitAt = (lemma, surface) => {
    const n = effectiveStemLen(lemma);
    if (n == null || n <= 0) return null;
    const stem = clusters(lemma).slice(0, n).map(fold).join("");
    const head = clusters(surface).slice(0, n).map(fold).join("");
    return stem === head ? n : null;
  };

  /** Every token of one verse, rendered for the passage schema. */
  const renderTokens = (verseTokens) =>
    verseTokens.map((t) => {
      const teachable = !INDECLINABLE.has(t.pos) && !FUNCTION_WORD.has(t.pos);
      const stemLen = splitAt(t.lemma, t.word);
      const highlight = teachable ? endingIndices(t.word, stemLen) : null;
      const entry = byLemmaAll.get(t.lemma);
      const stem = stemLen ? clusters(t.lemma).slice(0, stemLen).join("") : null;
      const familyId = highlight && stem && families.has(fold(stem)) ? fold(stem) : null;
      return {
        // MorphGNT marks textual variants with ⸀ and friends; they are
        // apparatus, not letters, and would render as stray glyphs.
        text: t.word.replace(/[\u2E00-\u2E7F]/g, ""),
        translit: t.norm,
        gloss: entry?.gloss ?? "—",
        wordId: entry && wordIds.has(entry.id) ? entry.id : null,
        familyId,
        morphology: highlight ? { highlight, kind: "ending" } : null,
        ...(teachable ? { parse: parseOf(t.code) } : {}),
      };
    });

  if (book) {
    // A WHOLE BOOK: every verse in text order, chapters as sections. The unit
    // path is derived from this downstream, exactly as Jonah and Ruth are.
    const bookName = BOOK_NAMES[book] ?? book;
    const slug = bookName.toLowerCase().replace(/\s+/g, "");
    const verses = new Map();
    for (const t of scoped) (verses.get(t.bcv) ?? verses.set(t.bcv, []).get(t.bcv)).push(t);

    const seen = new Set();
    const perChapter = new Map();
    for (const bcv of [...verses.keys()].sort()) {
      const ch = Number(bcv.slice(2, 4));
      const vs = Number(bcv.slice(4, 6));
      const reference = `${bookName} ${ch}:${vs}`;
      const key = `${bookName}.${ch}.${vs}`;
      const translation = translations[key];
      if (!translation) throw new Error(`no translation for ${key} — run fetch-web-nt.mjs first`);

      const toks = renderTokens(verses.get(bcv));
      passages.push({ id: `${slug}-${ch}-${vs}`, reference, translation, tokens: toks });

      const stat = perChapter.get(ch) ?? { verses: 0, newLexemes: 0 };
      stat.verses++;
      for (const t of toks) {
        if (t.wordId && !seen.has(t.wordId)) {
          seen.add(t.wordId);
          stat.newLexemes++;
        }
      }
      perChapter.set(ch, stat);
    }
    for (const [ch, stat] of [...perChapter.entries()].sort((a, b) => a[0] - b[0])) {
      sections.push({
        id: `${slug}-${ch}`,
        label: `Chapter ${ch}`,
        orderIndex: ch - 1,
        verses: stat.verses,
        newLexemes: stat.newLexemes,
      });
    }
  }

  for (const spec of book ? [] : glossary.passages) {
    const verseTokens = tokens.filter((t) => t.bcv === spec.bcv);
    if (!verseTokens.length) {
      skipped.push({ lemma: spec.bcv, reason: "verse not found in corpus" });
      continue;
    }
    const byLemma = new Map(glossary.words.map((w) => [w.lemma, w]));
    passages.push({
      id: spec.id,
      reference: spec.reference,
      translation: spec.translation,
      ...(spec.notes ? { notes: spec.notes } : {}),
      tokens: verseTokens.map((t) => {
        const teachable = !INDECLINABLE.has(t.pos) && !FUNCTION_WORD.has(t.pos);
        const stemLen = splitAt(t.lemma, t.word);
        const highlight = teachable ? endingIndices(t.word, stemLen) : null;
        const entry = byLemma.get(t.lemma);
        const stem = stemLen ? clusters(t.lemma).slice(0, stemLen).join("") : null;
        const familyId = highlight && stem && families.has(fold(stem)) ? fold(stem) : null;
        return {
          text: t.word,
          translit: spec.translit?.[t.word] ?? spec.translit?.[t.norm] ?? t.norm,
          gloss: spec.gloss[t.word] ?? spec.gloss[t.norm] ?? entry?.gloss ?? "—",
          wordId: entry && familyId ? entry.id : null,
          familyId,
          morphology: highlight ? { highlight, kind: "ending" } : null,
          ...(teachable ? { parse: parseOf(t.code) } : {}),
        };
      }),
    });
  }

  const out = { families: [...families.values()], words, passages, skipped, ...(sections.length ? { sections } : {}) };
  writeFileSync(outFile, JSON.stringify(out, null, 2));

  console.log(`words:     ${words.length} (${skipped.length} skipped, ${unsplit.length} taught with no morpheme)`);
  console.log(`families:  ${families.size}`);
  console.log(`passages:  ${passages.length}`);
  if (sections.length) {
    console.log(`sections:  ${sections.length} — ${sections.map((x) => `ch${x.label.split(" ")[1]}:+${x.newLexemes}`).join(" ")}`);
  }
  if (skipped.length) {
    console.log("\nskipped — need a human or a rule:");
    for (const s of skipped) console.log(`  ${s.lemma}: ${s.reason}`);
  }
  console.log(`\nwrote ${outFile}`);

  // A quick frequency sanity check: a beginner course should be teaching common words.
  const rare = words.filter((w) => w._freq < 10).map((w) => `${w.text}(${w._freq})`);
  if (rare.length) console.log(`\nlow-frequency in this corpus slice: ${rare.join(", ")}`);

  const bySource = words.reduce((a, w) => ((a[w._stemSource] = (a[w._stemSource] ?? 0) + 1), a), {});
  console.log(`\nstem provenance: ${JSON.stringify(bySource)}`);
}

main();
