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
 * Usage:  node scripts/import-morphgnt.mjs <corpusDir> [--out <file>]
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

const BOOK_NAMES = { "01": "Matthew", "02": "Mark", "03": "Luke", "04": "John", "05": "Acts", "06": "Romans" };

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

  const glossary = JSON.parse(readFileSync(resolve(HERE, "koine-glossary.json"), "utf8"));
  const tokens = loadCorpus(dir);
  const stems = deriveStems(tokens);

  console.log(`corpus: ${tokens.length} tokens, ${stems.size} lemmas with a derivable stem`);

  // Frequency, used to sanity-check that the curated list really is core vocabulary.
  const freq = new Map();
  for (const t of tokens) freq.set(t.lemma, (freq.get(t.lemma) ?? 0) + 1);

  // ---- words -------------------------------------------------------------
  const words = [];
  const families = new Map();
  const skipped = [];

  for (const entry of glossary.words) {
    const { lemma, id, gloss, distractors, notes, familyGloss, familyNotes } = entry;
    // Derivation is primary. Where the corpus cannot supply a stem — contract,
    // suppletive and μι-verbs, and 3rd-declension nouns whose nominative is
    // shorter than the stem (spike-a-findings.md §4.4) — the glossary may state
    // one explicitly. Overrides are the auditable exception, never the default.
    const derived = stems.has(lemma);
    const stemLen = entry.stem != null ? clusters(entry.stem).length : stems.get(lemma);
    const highlight = endingIndices(lemma, stemLen);
    if (!highlight) {
      skipped.push({ lemma, reason: stemLen == null ? "no derivable stem" : "degenerate split" });
      continue;
    }
    const stem = clusters(lemma).slice(0, stemLen).join("");
    // The glossary may group words into a shared family. Surface stems cannot
    // see that ἀγάπη (ἀγαπ-) and ἀγαπάω (ἀγαπα-) belong together, and the
    // family sheet is worthless if every word sits in a family of one.
    const familyId = entry.familyId ?? fold(stem);

    if (!families.has(familyId)) {
      families.set(familyId, {
        id: familyId,
        letters: familyId,
        coreGloss: familyGloss ?? gloss,
        ...(familyNotes ? { notes: familyNotes } : {}),
      });
    }

    // Parse and attestations come from the corpus, not the glossary.
    const occurrences = tokens.filter((t) => t.norm === lemma);
    const sample = occurrences[0];
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
      morphology: { highlight, kind: "ending" },
      // A verb's citation form is 1sg present active indicative BY DEFINITION,
      // so sampling an occurrence can only mislead — κρίνω matched a future and
      // was labelled "future". Nominal citation forms are nominative singular
      // and safe to read off the corpus.
      ...(sample && sample.pos !== "V-" ? { parse: parseOf(sample.code) } : {}),
      attestations,
      distractors,
      ...(notes ? { notes } : {}),
      _freq: freq.get(lemma) ?? 0,
      _stemSource: entry.stem != null ? (derived ? "override" : "manual") : "derived",
    });
  }

  // ---- passages ----------------------------------------------------------
  const passages = [];
  for (const spec of glossary.passages) {
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
        const stemLen = stems.get(t.lemma);
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

  const out = { families: [...families.values()], words, passages, skipped };
  writeFileSync(outFile, JSON.stringify(out, null, 2));

  console.log(`words:     ${words.length} (${skipped.length} skipped)`);
  console.log(`families:  ${families.size}`);
  console.log(`passages:  ${passages.length}`);
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
