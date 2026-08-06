#!/usr/bin/env node
/**
 * AGDT (Perseus Ancient Greek Dependency Treebank) → Attic course content.
 *
 * Same derivation as the Koine pipeline; different reader and different corpus
 * hygiene. Two filters exist here that Koine does not need, both from
 * attic-spike-findings.md §4.2:
 *
 *   CRASIS       τἀνθρώπων is τῶν + ἀνθρώπων fused into one word. Its prefix
 *                is not the stem, so it collapses the paradigm invariant to
 *                zero — the noun equivalent of the verbal augment.
 *   DORIC ALPHA  tragic lyric writes ἁμέρα for ἡμέρα. Pooling dialects silently
 *                degrades derivation, which is why only Attic PROSE is read.
 *
 * ⚠️ LICENCE UNRESOLVED. This reads the upstream AGDT 2.1 distribution, whose
 * repository states CC BY-SA 3.0 US. The Universal Dependencies conversion of
 * the same data states CC BY-NC-SA 2.5 (NonCommercial) — the two are mutually
 * inconsistent, since share-alike forbids adding a NonCommercial restriction.
 * Do not ship Attic content until someone qualified resolves this. See
 * attic-spike-findings.md §2.
 *
 * Usage:  node scripts/import-agdt.mjs <proseDir> [--out <file>]
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { derivedFamilyId } from "./greek-families.mjs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

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

// ---- AGDT 9-character postag -------------------------------------------
// pos person number tense mood voice gender case degree
const TENSE = { p: "present", i: "imperfect", r: "perfect", l: "pluperfect", f: "future", a: "aorist", t: "future" };
const MOOD = { i: "indicative", s: "subjunctive", o: "optative", n: "infinitive", m: "imperative", p: "participle" };
const VOICE = { a: "active", m: "middle", p: "passive", e: "mediopassive" };
const CASE = { n: "nominative", g: "genitive", d: "dative", a: "accusative", v: "vocative" };
const NUM = { s: "s", p: "p", d: "d" };
const GEN = { m: "m", f: "f", n: "n" };
const POS = { n: "noun", v: "verb", a: "adjective", d: "adverb", l: "particle", g: "particle", c: "conjunction", r: "preposition", p: "pronoun", m: "noun", i: "particle", x: "particle" };

const at = (t, i, map) => (t[i] && t[i] !== "-" ? map[t[i]] : undefined);
const parseOf = (t) =>
  Object.fromEntries(
    Object.entries({
      person: t[1] && t[1] !== "-" ? t[1] : undefined,
      tense: at(t, 3, TENSE),
      voice: at(t, 5, VOICE),
      mood: at(t, 4, MOOD),
      case: at(t, 7, CASE),
      number: at(t, 2, NUM),
      gender: at(t, 6, GEN),
    }).filter(([, v]) => v !== undefined),
  );

const WORK_NAMES = {
  tlg0059: "Plato, Euthyphro",
  tlg0003: "Thucydides",
  tlg0540: "Lysias",
};

function loadCorpus(dir) {
  const tokens = [];
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".xml"))) {
    const xml = readFileSync(resolve(dir, f), "utf8");
    const work = WORK_NAMES[f.split(".")[0]] ?? f;
    for (const m of xml.matchAll(/<word\s([^>]*)\/>/g)) {
      const a = Object.fromEntries([...m[1].matchAll(/(\w+)="([^"]*)"/g)].map((x) => [x[1], x[2]]));
      if (!a.form || !a.lemma || !a.postag) continue;
      if (a.postag[0] === "u") continue; // punctuation
      tokens.push({ form: a.form, lemma: a.lemma, postag: a.postag, pos: a.postag[0], work, cite: a.cite ?? "", sentenceId: a.id });
    }
  }
  return tokens;
}

/**
 * A form usable for deriving a stem.
 *
 * Rejects anything whose first letter differs from the lemma's — which is what
 * both crasis (τἀνθρώπων) and Doric alpha (ἁμέρα) look like. Cheap, and it
 * targets precisely the two mechanisms the spike identified.
 */
function usableForStem(form, lemma) {
  const f = clusters(form);
  const l = clusters(lemma);
  if (!f.length || !l.length) return false;
  return fold(f[0]) === fold(l[0]);
}

function deriveStems(tokens) {
  const forms = new Map();
  for (const t of tokens) {
    if (!usableForStem(t.form, t.lemma)) continue;
    if (!forms.has(t.lemma)) forms.set(t.lemma, new Set());
    forms.get(t.lemma).add(t.form);
  }
  const stems = new Map();
  for (const [lemma, set] of forms) {
    const arr = [...set].map(clusters);
    if (arr.length < 2) continue;
    let n = arr[0].length;
    for (const f of arr.slice(1)) n = Math.min(n, commonPrefixLen(arr[0], f));
    const shortest = Math.min(...arr.map((f) => f.length));
    // MIN_STEM, matching import-morphgnt.mjs: a single letter is not a
    // morpheme. This importer was written without the rule and πόλις, πόλεμος,
    // ὅσος and οἷος each derived a one-letter stem, giving families called "π"
    // and "ὁ" — which the content schema rejects outright (a family id must be
    // at least two characters). The schema catching it is a backstop; the rule
    // belongs here, as it does on the Koine side.
    if (n >= MIN_STEM && n < shortest) stems.set(lemma, n);
  }
  return stems;
}

/** A single letter is not a morpheme. See deriveStems above. */
const MIN_STEM = 2;

const endingIndices = (surface, stemLen) => {
  const len = clusters(surface).length;
  if (stemLen == null || stemLen <= 0 || stemLen >= len) return null;
  return Array.from({ length: len - stemLen }, (_, i) => stemLen + i);
};

const INDECLINABLE = new Set(["c", "r", "d", "g", "i", "x"]);
const FUNCTION_WORD = new Set(["l"]);

function main() {
  const dir = process.argv[2];
  if (!dir) {
    console.error("usage: node scripts/import-agdt.mjs <proseDir> [--out <file>]");
    process.exit(1);
  }
  const outIdx = process.argv.indexOf("--out");
  const outFile = outIdx > 0 ? process.argv[outIdx + 1] : resolve(HERE, "generated-attic.json");

  const glossary = JSON.parse(readFileSync(resolve(HERE, "attic-glossary.json"), "utf8"));
  const tokens = loadCorpus(dir);
  const stems = deriveStems(tokens);

  const dropped = tokens.filter((t) => !usableForStem(t.form, t.lemma));
  console.log(`corpus: ${tokens.length} tokens (${dropped.length} crasis/dialect forms excluded from stem derivation)`);
  console.log(`        ${stems.size} lemmas with a derivable stem`);

  const freq = new Map();
  for (const t of tokens) freq.set(t.lemma, (freq.get(t.lemma) ?? 0) + 1);

  const words = [];
  const families = new Map();
  const skipped = [];
  /** lemma (and spelling variants of it) → the split this course actually teaches. */
  const curated = new Map();
  /** Taught, but with no morpheme claimed — reported like Koine does. */
  const unsplit = [];

  for (const entry of glossary.words) {
    const { lemma, id, gloss, distractors, notes, familyGloss, familyNotes } = entry;
    const derived = stems.has(lemma);
    const stemLen = entry.stem != null ? clusters(entry.stem).length : stems.get(lemma);
    const highlight = endingIndices(lemma, stemLen);
    /*
     * A word with no derivable stem is TAUGHT PLAIN, not dropped.
     *
     * This importer used to drop it, which was survivable only because it also
     * accepted one-letter stems — so almost everything got a "morpheme". Adding
     * MIN_STEM exposed the gap: πόλις, πόλεμος, ὅσος and οἷος each lost their
     * one-letter stem and with it their place in a 41-word curated course.
     *
     * Koine and Hebrew both settled this long ago (see the note in
     * import-morphgnt.mjs, and WordSchema.morphology being optional). No
     * highlight, no family, nothing guessed — but the word is still vocabulary.
     */
    const stem = highlight ? clusters(lemma).slice(0, stemLen).join("") : null;
    // Curated wins; derived must clear greek-families.mjs. Same rule as Koine.
    const familyId = highlight ? (entry.familyId ?? derivedFamilyId(stem, fold)) : null;
    // No family, no highlight — a refused family means the split it rested on
    // was a prefix artefact, and ἀν- + -ήρ is a worse claim than none.
    const shown = familyId ? highlight : null;
    if (!shown) unsplit.push(lemma);
    for (const key of [lemma, ...(entry.lemmaAliases ?? [])])
      curated.set(key, { stem: shown ? stem : null, familyId, id });
    if (familyId && !families.has(familyId)) {
      families.set(familyId, {
        id: familyId,
        letters: familyId,
        coreGloss: familyGloss ?? gloss,
        ...(familyNotes ? { notes: familyNotes } : {}),
      });
    }

    // Two different samples, deliberately. Part of speech and attestation are
    // properties of the LEMMA, so any occurrence will do — and must, since a
    // citation form often never appears verbatim (ποιέω occurs only inflected).
    // A parse, however, is a property of one FORM: reading it off an inflected
    // token is what once labelled κρίνω "future".
    const ofLemma = tokens.filter((t) => t.lemma === lemma);
    const ofForm = ofLemma.filter((t) => t.form === lemma);
    const sample = ofForm[0];
    const attestations = [...new Set(ofLemma.map((t) => t.work))];
    const pos = entry.pos ?? ofLemma[0]?.pos ?? "n";

    words.push({
      id,
      familyId,
      text: lemma,
      translit: entry.translit,
      gloss,
      partOfSpeech: POS[pos] ?? "noun",
      ...(shown ? { morphology: { highlight: shown, kind: "ending" } } : {}),
      // As in Koine: a verb's citation form is 1sg present by definition, so a
      // sampled parse can only mislead.
      ...(sample && pos !== "v" ? { parse: parseOf(sample.postag) } : {}),
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
    // Some AGDT files carry a CTS `cite` per token; others (Thucydides) carry
    // none, so a passage may instead be specified by work plus a token count.
    const verse = spec.cite
      ? tokens.filter((t) => t.cite === spec.cite)
      : tokens.filter((t) => t.work === spec.work);
    if (!verse.length) {
      skipped.push({ lemma: spec.cite ?? spec.work, reason: "passage source not found" });
      continue;
    }
    const limit = spec.tokenLimit ?? verse.length;
    passages.push({
      id: spec.id,
      reference: spec.reference,
      translation: spec.translation,
      ...(spec.notes ? { notes: spec.notes } : {}),
      tokens: verse.slice(0, limit).map((t) => {
        const teachable = !INDECLINABLE.has(t.pos) && !FUNCTION_WORD.has(t.pos);
        const entry = curated.get(t.lemma);
        // Three gates, each of which caught a real error in this passage:
        //   curated      — an uncurated stem is a raw guess. νεώτερος derived
        //                  νεώτερο|ν, which is not the standard split.
        //   prefix match — a stem only marks an ending if the form actually
        //                  starts with it. γίγνομαι/γέγονεν reduplicates, so a
        //                  fixed stem length would cut it at γέγο|νεν.
        //   non-empty    — a form identical to its stem has no ending to show.
        // entry.stem is now null for a word taught plain, so both guards have
        // to check it rather than just `entry`.
        const stemLen = entry?.stem ? clusters(entry.stem).length : null;
        const prefixed = Boolean(entry?.stem) && fold(t.form).startsWith(fold(entry.stem));
        const highlight = teachable && prefixed ? endingIndices(t.form, stemLen) : null;
        return {
          text: t.form,
          translit: spec.translit?.[t.form] ?? t.form,
          gloss: spec.gloss[t.form] ?? "—",
          wordId: highlight ? entry.id : null,
          familyId: highlight ? entry.familyId : null,
          morphology: highlight ? { highlight, kind: "ending" } : null,
          ...(teachable ? { parse: parseOf(t.postag) } : {}),
        };
      }),
    });
  }

  writeFileSync(outFile, JSON.stringify({ families: [...families.values()], words, passages, skipped }, null, 2));

  console.log(`words:     ${words.length} (${skipped.length} skipped, ${unsplit.length} taught with no morpheme)`);
  console.log(`families:  ${families.size}`);
  console.log(`passages:  ${passages.length}`);
  if (skipped.length) for (const s of skipped) console.log(`  skipped ${s.lemma}: ${s.reason}`);
  const bySource = words.reduce((a, w) => ((a[w._stemSource] = (a[w._stemSource] ?? 0) + 1), a), {});
  console.log(`stem provenance: ${JSON.stringify(bySource)}`);
  console.log(`wrote ${outFile}`);
}

main();
