#!/usr/bin/env node
/**
 * OSHB (Open Scriptures Hebrew Bible) → Hebrew course content.
 *
 * Third corpus pipeline, and the first where the derivation method had to
 * change rather than just the reader.
 *
 * WHY THE GREEK METHOD IS ABSENT HERE
 * The Koine and Attic importers derive a stem as the longest common prefix
 * across a lemma's attested forms — paradigm invariance. A Semitic root is
 * DISCONTINUOUS: שׁ־מ־ר sits inside שָׁמַר, יִשְׁמֹר and מִשְׁמֶרֶת with
 * different material around each radical, so there is no common prefix. The
 * method does not degrade for Hebrew; it does not apply.
 *
 * WHAT REPLACES IT
 * Strong's `derivation` marks an entry as either "a primitive root" — the lemma
 * IS the root — or "from HXXXX", a chain toward one. Radicals are then located
 * inside the pointed form as an ordered subsequence of letter clusters.
 *
 * THE CHAIN IS REFUSED, DELIBERATELY (jonah-spike-findings.md §3)
 * Following "from HXXXX" would lift root coverage from 25% to 45% of Jonah's
 * lexemes. It would also assert that יְהֹוָה is built on היה, that the object
 * marker אֵת comes from אות "sign", and that עִיר "city" derives from עור "to
 * awake" — Strong's own gloss calls a city "a place guarded by waking". Strong's
 * is an 1894 work whose etymologies are frequently speculative, and a coloured
 * highlight reads as authoritative. That is the root fallacy
 * (trelingo-pedagogical-foundation.md §3.1) applied mechanically at scale, to
 * the one claim a seminary-trained reader would check first.
 *
 * So this refuses to chain. It is not a default that curation can flip — the
 * function does not exist. Roots the safe rule cannot reach are supplied by
 * hand in the glossary, as with Koine's 13 stem overrides and Attic's 10.
 *
 * Weak forms are declined in silence: a hollow verb (בָּאָה from בוא) simply
 * does not contain its middle radical, so there is nothing to mark. The Greek
 * pipeline already behaves this way for reduplicated γέγονεν.
 *
 * Sources
 *   text + morphology  OSHB / Westminster Leningrad Codex   CC BY 4.0
 *   glosses + translit Strong's Hebrew Dictionary (1894)     CC BY-SA, PD original
 *   translations       JPS 1917, via Sefaria                 PUBLIC DOMAIN
 *
 * On the translation: it must be the 1917 edition. Sefaria's DEFAULT English
 * for Jonah is "THE JPS TANAKH: Gender-Sensitive Edition", which is a current
 * copyrighted work — its licence reads "unknown" and it is not ours to ship.
 * The fetcher pins the version by title and asserts `license === "Public
 * Domain"` per chapter rather than trusting the default.
 *
 * Verse numbering follows the HEBREW versification in both sources, so they
 * align without adjustment. (English Jonah 1:17 is Hebrew 2:1.)
 *
 * Usage:  node scripts/import-oshb.mjs <book.xml> <strongs.json>
 *                [--translations <file>] [--chapters 1,2] [--out <file>]
 *                [--glossary <file>]
 *
 * Book-agnostic: the glossary and output default to the XML file's own name,
 * so Ruth.xml reads ruth-glossary.json and writes generated-ruth.json.
 *
 * `--chapters` scopes the course to part of a book. Curating a whole book is a
 * large amount of Hebrew judgement; scoping lets a slice be curated properly
 * and reviewed before the rest is committed to.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

// ---- Hebrew letters -------------------------------------------------------
// Points (niqqud) and accents (te'amim). Everything outside this and the
// consonant block is punctuation.
const POINT = /[֑-ֽֿ-ׇ]/;
const LETTER = /[א-ת]/;
const FINALS = { "ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ" };

/**
 * OSHB writes a "/" at every morpheme boundary — וַ/יֹּאמֶר. It is markup, not
 * text, and must never reach the UI. Stripping it does not move any letter
 * index: it is not a letter, so `clusters` only ever appends it to the previous
 * cluster.
 */
const display = (w) => w.replace(/\//g, "");

/** Bare consonants: points stripped, final forms folded. */
function consonants(word) {
  let out = "";
  for (const ch of word) {
    if (!LETTER.test(ch)) continue;
    out += FINALS[ch] ?? ch;
  }
  return out;
}

/**
 * Letter clusters — a consonant plus the points hanging off it.
 *
 * Must agree with the app's `toLetterClusters`, because the indices produced
 * here are the indices the UI highlights. This is the bug the whole content
 * test suite exists to catch: a highlight landing on a vowel point.
 */
function clusters(word) {
  const out = [];
  for (const ch of word) {
    if (LETTER.test(ch)) out.push(ch);
    else if (out.length) out[out.length - 1] += ch; // points, maqqef, accents
  }
  return out;
}

const clusterConsonant = (c) => consonants(c);

/**
 * Where the root's radicals sit inside a surface form.
 *
 * Ordered subsequence, greedy.
 *
 * A weak root legitimately shows fewer radicals than it has, and the existing
 * hand-authored content already says so: "a III-he verb loses its final ה, a
 * geminate root collapses, so two indices is valid where the form genuinely
 * only exposes two root consonants". Both losses are of the FINAL radical, so
 * a match covering all but the last is accepted — רַע from רעע, נָקִי from נקה.
 *
 * Anything weaker than that is refused. Dropping two radicals from three would
 * let a single shared letter masquerade as a root, which is the same class of
 * error as trusting Strong's derivation chains.
 */
function locateRoot(rootConsonants, surface) {
  const cl = clusters(surface);
  const idx = [];
  let r = 0;
  for (let i = 0; i < cl.length && r < rootConsonants.length; i++) {
    if (clusterConsonant(cl[i]) === rootConsonants[r]) {
      idx.push(i);
      r++;
    }
  }
  if (r === rootConsonants.length) return idx;
  if (r >= 2 && r === rootConsonants.length - 1) return idx; // weak final radical

  // I-nun assimilation: an initial נ assimilates into the following consonant,
  // so the surviving radicals are the LAST ones rather than the first —
  // וַיִּדְּרוּ "they vowed" keeps only ד־ר of נדר. Narrowly scoped to an
  // initial נ, because a general "any one radical may be missing" rule would
  // let a single shared letter pass as a root.
  if (rootConsonants[0] === "נ" && rootConsonants.length >= 3) {
    const tail = rootConsonants.slice(1);
    const idx2 = [];
    let k = 0;
    for (let i = 0; i < cl.length && k < tail.length; i++) {
      if (clusterConsonant(cl[i]) === tail[k]) {
        idx2.push(i);
        k++;
      }
    }
    if (k === tail.length) return idx2;
  }
  return null;
}

// ---- OSHB morphology ------------------------------------------------------
// e.g. HVqp3ms = Hebrew, Verb, qal, perfect, 3rd, masc, sing
//      HNcmsc  = Hebrew, Noun, common, masc, sing, construct
const BINYAN = { q: "qal", N: "niphal", p: "piel", P: "pual", h: "hiphil", H: "hophal", t: "hitpael" };
const ASPECT = {
  p: "perfect", q: "perfect", i: "imperfect", w: "imperfect", // wayyiqtol is an imperfect form
  v: "imperative", a: "infinitive_absolute", c: "infinitive_construct",
  r: "participle", s: "participle", h: "cohortative", j: "jussive",
};
const GENDER = { m: "m", f: "f", c: "c", b: "c" };
const NUMBER = { s: "s", p: "p", d: "d" };
const POS = {
  V: "verb", N: "noun", A: "adjective", P: "pronoun", R: "preposition",
  C: "conjunction", D: "adverb", T: "particle", S: "pronoun",
};

/** Parse the segment of an OSHB morph code belonging to one lemma. */
function parseMorph(seg) {
  if (!seg) return { pos: undefined, parse: {} };
  const pos = POS[seg[0]];
  const parse = {};
  if (seg[0] === "V") {
    if (BINYAN[seg[1]]) parse.binyan = BINYAN[seg[1]];
    if (ASPECT[seg[2]]) parse.tense = ASPECT[seg[2]];
    // Participles and infinitives carry gender/number but no person.
    const rest = seg.slice(3);
    const m = rest.match(/^([123])?([mfcb])?([spd])?/);
    if (m) {
      if (m[1]) parse.person = m[1];
      if (m[2] && GENDER[m[2]]) parse.gender = GENDER[m[2]];
      if (m[3] && NUMBER[m[3]]) parse.number = NUMBER[m[3]];
    }
  } else if (seg[0] === "N") {
    // Nc m s c  → common, masc, sing, construct. Proper nouns (Np) carry none.
    const m = seg.slice(2).match(/^([mfcb])?([spd])?/);
    if (m) {
      if (m[1] && GENDER[m[1]]) parse.gender = GENDER[m[1]];
      if (m[2] && NUMBER[m[2]]) parse.number = NUMBER[m[2]];
    }
  } else if (seg[0] === "A") {
    const m = seg.slice(1).match(/([mfcb])([spd])/);
    if (m) {
      parse.gender = GENDER[m[1]];
      parse.number = NUMBER[m[2]];
    }
  }
  return { pos, parse };
}

// ---- Strong's -------------------------------------------------------------
function loadStrongs(path) {
  const raw = readFileSync(path, "utf8");
  return JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
}

/**
 * The lemma id as Strong's keys it.
 *
 * Two OSHB conventions have to come off. A trailing LETTER is a homograph
 * suffix (`5921 a`). A trailing PLUS marks the first word of a multi-word
 * proper name whose lemma continues on the next word — OSHB writes Bethlehem
 * as `lemma="1035+"` on בֵּית and `lemma="1035"` on לֶחֶם.
 *
 * Missing the plus left the first half of every Bethlehem with no lemma, so it
 * had no gloss at all: a learner tapping בֵּית got a blank card, and the gloss
 * "Bethlehem" sat on לֶחֶם alone, which is not what that word means. Both
 * halves are the one name and both now carry it.
 */
const strongsKey = (lemma) => `H${String(lemma).replace(/\+$/, "").replace(/[a-z]$/, "").trim()}`;

/**
 * The root, ONLY when the entry is itself a primitive root.
 *
 * Takes an already-resolved Strong's key, not a raw OSHB lemma.
 * There is deliberately no chain-following branch. See the header.
 */
function primitiveRoot(strongs, key) {
  const e = strongs[key];
  if (!e) return null;
  if (!/primitive root/.test(e.derivation ?? "")) return null;
  const c = consonants(e.lemma);
  return c.length >= 2 ? c : null;
}

/**
 * A usable first sense from a Strong's definition.
 *
 * "to say (used with great latitude)"                        → "to say"
 * "properly, self (but generally used to point out ...)"      → "self"
 */
function firstSense(def) {
  if (!def) return "";
  let s = def.replace(/\([^)]*\)/g, " ");            // drop parenthetical asides
  s = s.replace(/^\s*(properly|literally|figuratively)\s*,\s*/i, "");
  s = s.split(";")[0];                               // first sense group
  s = s.replace(/\s*,\s*i\.e\..*$/i, "");           // trailing "i.e. ..." restatement
  return s.replace(/\s+/g, " ").replace(/[.,]\s*$/, "").trim();
}

/**
 * Glosses for tokens that are pure function words.
 *
 * A preposition with a pronominal suffix — לָנוּ "to us", בָּהּ "in it" — has no
 * numeric lemma at all: OSHB tags it `lemma="l" morph="HR/Sp1cp"`. Nine such
 * tokens appear in Jonah 1, and leaving them blank means tapping a word in the
 * text sometimes shows nothing, which reads as a broken app rather than as an
 * untaught word.
 */
const CLITIC = { b: "in", l: "to", k: "like", m: "from", c: "and", d: "the", s: "which" };
const SUFFIX = {
  "1cs": "me", "1cp": "us",
  "2ms": "you", "2fs": "you", "2mp": "you", "2fp": "you",
  "3ms": "him, it", "3fs": "her, it", "3mp": "them", "3fp": "them",
};

/** A gloss for a token carrying no content lemma, or "" if none can be made. */
function functionGloss(lemmas, morphs) {
  const base = CLITIC[lemmas[0]];
  if (!base) return "";
  const suffix = (morphs ?? []).map((m) => /^Sp(\d[cmf][sp])$/.exec(m ?? "")?.[1]).find(Boolean);
  return suffix && SUFFIX[suffix] ? `${base} ${SUFFIX[suffix]}` : base;
}

// ---- corpus ---------------------------------------------------------------
/**
 * Read an OSHB book into tokens.
 *
 * A `<w>` may carry several slash-separated lemmas — Hebrew fuses clitics onto
 * the host word, so וַיְהִי is `c/1961`, the conjunction plus היה. Content
 * lemmas are numeric; alphabetic parts are clitic codes and are skipped as
 * vocabulary while remaining part of the running text.
 */
function loadBook(path) {
  const xml = readFileSync(path, "utf8");
  const verses = [];
  const verseRe = /<verse\s+osisID="([^"]+)"[^>]*>([\s\S]*?)<\/verse>/g;
  for (const v of xml.matchAll(verseRe)) {
    const tokens = [];
    const wRe = /<w\s+([^>]*?)>([^<]*)<\/w>/g;
    for (const w of v[2].matchAll(wRe)) {
      const attrs = Object.fromEntries(
        [...w[1].matchAll(/(\w+)="([^"]*)"/g)].map((m) => [m[1], m[2]]),
      );
      if (!attrs.lemma) continue;
      const lemmas = attrs.lemma.split("/").map((p) => p.replace(/\s+/g, "")).filter(Boolean);
      const morphs = (attrs.morph ?? "").replace(/^H/, "").split("/");
      tokens.push({ text: w[2], lemmas, morphs });
    }
    if (tokens.length) verses.push({ osisID: v[1], tokens });
  }
  return verses;
}

/** "Jonah.1.3" → "Jonah 1:3" */
/**
 * Re-key a translation file onto the corpus's own book abbreviation.
 *
 * Sefaria names books in full — "Esther.1.1" — and OSHB abbreviates them:
 * "Esth.1.1". Ruth and Jonah happen to agree, so this went unnoticed until
 * Esther silently imported 167 verses with no English at all. The check is
 * strict on purpose: every key must share one prefix, or the file is not what
 * it claims to be and nothing is remapped.
 */
function rekey(translations, bookPath) {
  const book = (bookPath.split("/").pop() ?? "").replace(/\.xml$/i, "");
  const keys = Object.keys(translations);
  if (!keys.length) return translations;
  const prefixes = new Set(keys.map((k) => k.split(".")[0]));
  if (prefixes.size !== 1) throw new Error(`translations span several books: ${[...prefixes]}`);
  const [from] = prefixes;
  if (from === book) return translations;
  console.log(`translations keyed "${from}.c.v" — remapping to "${book}.c.v"`);
  return Object.fromEntries(keys.map((k) => [`${book}.${k.split(".").slice(1).join(".")}`, translations[k]]));
}

/** OSIS abbreviations that are not the name a reader expects to see. */
const DISPLAY_BOOK = { Esth: "Esther", Eccl: "Ecclesiastes", Judg: "Judges", Gen: "Genesis" };

const reference = (osisID) => {
  const [book, ch, vs] = osisID.split(".");
  return `${DISPLAY_BOOK[book] ?? book} ${ch}:${vs}`;
};

/** The index of a token's content lemma, so the right morph segment is used. */
function contentIndex(lemmas) {
  return lemmas.findIndex((l) => /^\d/.test(l));
}

/**
 * Three wrong glosses, for words curation has not reached yet.
 *
 * Recognition exercises need distractors; production picks other words at
 * runtime. Rather than block a whole book on hand-writing 3 × 245 of them,
 * these are drawn from other words in the SAME book — same part of speech
 * where possible, never the same family, never a duplicate gloss.
 *
 * Deterministic, seeded by the lemma, so rebuilding the course does not reshuffle
 * every exercise. They are marked `_autoDistractors` and are the weakest content
 * in the bundle: a hand-picked distractor teaches a contrast, a random one only
 * fills a slot.
 */
function autoDistractors(word, pool) {
  let seed = 0;
  for (const ch of word.id) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const rand = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 0xffffffff);

  const eligible = pool.filter(
    (w) =>
      w.id !== word.id &&
      w.gloss &&
      w.gloss !== word.gloss &&
      !(w.familyId && word.familyId && w.familyId === word.familyId),
  );
  const sameClass = eligible.filter((w) => w.partOfSpeech === word.partOfSpeech);
  const ordered = [...(sameClass.length >= 3 ? sameClass : eligible)];
  // Deterministic Fisher-Yates.
  for (let i = ordered.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
  }
  const out = [];
  for (const w of ordered) {
    if (out.includes(w.gloss)) continue;
    out.push(w.gloss);
    if (out.length === 3) break;
  }
  return out;
}

// ---- main -----------------------------------------------------------------
function main() {
  const [bookPath, strongsPath] = process.argv.slice(2);
  if (!bookPath || !strongsPath) {
    console.error("usage: node scripts/import-oshb.mjs <book.xml> <strongs.json> [--out <file>]");
    process.exit(1);
  }
  const outIdx = process.argv.indexOf("--out");
  const outFile =
    outIdx > 0
      ? process.argv[outIdx + 1]
      : resolve(HERE, `generated-${(bookPath.split("/").pop() ?? "").replace(/\.xml$/i, "").toLowerCase()}.json`);

  const chIdx = process.argv.indexOf("--chapters");
  const chapters = chIdx > 0 ? new Set(process.argv[chIdx + 1].split(",").map((c) => c.trim())) : null;

  const trIdx = process.argv.indexOf("--translations");
  let translations = {};
  if (trIdx > 0) translations = rekey(JSON.parse(readFileSync(process.argv[trIdx + 1], "utf8")), bookPath);

  // The glossary is per BOOK, named after it, so a second book reuses this
  // importer rather than forking it. Defaults to the book file's own name.
  const glIdx = process.argv.indexOf("--glossary");
  const bookSlug = (bookPath.split("/").pop() ?? "").replace(/\.xml$/i, "").toLowerCase();
  const glossaryPath =
    glIdx > 0 ? resolve(process.argv[glIdx + 1]) : resolve(HERE, `${bookSlug}-glossary.json`);
  let glossary = { words: [], families: [] };
  try {
    glossary = JSON.parse(readFileSync(glossaryPath, "utf8"));
  } catch {
    console.log(`no ${glossaryPath.split("/").pop()} yet — deriving everything, curating nothing`);
  }
  const curated = new Map((glossary.words ?? []).map((w) => [String(w.lemma), w]));

  const strongs = loadStrongs(strongsPath);

  /**
   * Whole-Tanakh counts, so the app can tell a hapax legomenon from a word that
   * merely happens to appear once in this book. Optional: without the table the
   * course still ships, reporting in-book counts only and claiming no hapax.
   */
  let corpusFreq = null;
  try {
    corpusFreq = JSON.parse(readFileSync(resolve(HERE, "corpora/hebrew-frequency.json"), "utf8"));
  } catch {
    console.log("no corpora/hebrew-frequency.json — shipping in-book counts only, no hapax claims");
  }
  let verses = loadBook(bookPath);
  if (chapters) verses = verses.filter((v) => chapters.has(v.osisID.split(".")[1]));
  const running = verses.reduce((n, v) => n + v.tokens.length, 0);

  // ---- frequency over content lemmas ----
  //
  // Keyed by Strong's id, NOT by the raw OSHB lemma. OSHB appends homograph
  // suffixes — 834, 834a, 834b — that all resolve to one dictionary entry, so
  // keying on the raw lemma emitted אֲשֶׁר three times as three identical
  // vocabulary cards. Where the suffixes really do mark distinct words, Strong's
  // gives them distinct numbers (יָרֵא the verb is H3372, the adjective H3373)
  // and they stay separate.
  const freq = new Map();
  const occurrences = new Map();
  for (const v of verses) {
    for (const t of v.tokens) {
      const ci = contentIndex(t.lemmas);
      if (ci < 0) continue;
      const key = strongsKey(t.lemmas[ci]);
      freq.set(key, (freq.get(key) ?? 0) + 1);
      if (!occurrences.has(key)) occurrences.set(key, []);
      occurrences.get(key).push({ ...t, ci, ref: reference(v.osisID) });
    }
  }

  const words = [];
  const families = new Map();
  const stats = { derived: 0, curatedRoot: 0, noRoot: 0, weak: 0 };
  const declined = [];

  for (const [lemma, n] of [...freq.entries()].sort((a, b) => b[1] - a[1])) {
    const entry = strongs[lemma];
    if (!entry) continue;
    const cur = curated.get(String(lemma)) ?? {};

    // The headword is the DICTIONARY form, taken from Strong's — אָמַר, not
    // whichever inflection happened to be commonest in this book (אָמַרְתִּי
    // "I said"), and not the word fused to its clitics (הָאֱלֹהִים). A learner
    // acquires אָמַר and then meets it inflected in the text; the reverse
    // teaches a form rather than a word, which is §6.2's card-bound knowledge.
    const occ = occurrences.get(lemma);
    const headword = display(cur.text ?? entry.lemma ?? "");
    // Parse comes from a real occurrence, since a citation form has none. The
    // commonest bare occurrence is the most representative.
    const bare = occ.filter((o) => o.lemmas.length === 1);
    const pool = bare.length ? bare : occ;
    const byForm = new Map();
    for (const o of pool) byForm.set(o.text, (byForm.get(o.text) ?? 0) + 1);
    const commonest = [...byForm.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const sample = pool.find((o) => o.text === commonest);
    const surface = headword;
    const { pos, parse } = parseMorph(sample.morphs[sample.ci]);

    // ---- root, safely ----
    const root = cur.root ? consonants(cur.root) : primitiveRoot(strongs, lemma);
    let highlight = null;
    if (root) {
      highlight = locateRoot(root, surface);
      if (highlight) (cur.root ? stats.curatedRoot++ : stats.derived++);
      else {
        stats.weak++;
        declined.push({ lemma, surface, root, reason: "radical elided (weak form)" });
      }
    } else {
      stats.noRoot++;
      declined.push({ lemma, surface, reason: "no primitive root — chains refused" });
    }

    const familyId = root ?? null;
    if (familyId && highlight && !families.has(familyId)) {
      families.set(familyId, {
        id: familyId,
        letters: familyId,
        // The schema requires a coreGloss. Where curation has not supplied one,
        // the first (most frequent) member's gloss stands in — which is exactly
        // the assumption the pedagogical doc §3.2 warns about, that a family has
        // one shared meaning. Sound for שׁמר; wrong for a family whose members
        // only share consonants. Flagged in ATTIC-style review notes until
        // coreGloss becomes optional and a divergence marker exists.
        coreGloss: cur.familyGloss ?? cur.gloss ?? firstSense(entry.strongs_def),
        ...(cur.familyNotes ? { notes: cur.familyNotes } : {}),
        ...(cur.familyGloss ? {} : { _inferredGloss: true }),
      });
    }

    words.push({
      id: cur.id ?? lemma.toLowerCase(),
      familyId: highlight ? familyId : null,
      text: surface,
      translit: cur.translit ?? entry.xlit ?? "",
      // strongs_def is a paragraph of 19th-century lexicography. This reduces
      // it to a first sense so curation has something to shorten rather than
      // something to write; every gloss still needs a human pass.
      gloss: cur.gloss ?? firstSense(entry.strongs_def),
      partOfSpeech: cur.pos ?? pos ?? "noun",
      ...(highlight ? { morphology: { highlight, kind: "root" } } : {}),
      // No parse on a verb headword: the citation form is a lexical entry, not
      // an inflection, and labelling אָמַר "3ms perfect" would be the same
      // error that once labelled κρίνω "future".
      ...(Object.keys(parse).length && pos !== "verb" ? { parse } : {}),
      attestations: [...new Set(occ.slice(0, 3).map((o) => o.ref))],
      ...(cur.distractors ? { distractors: cur.distractors } : {}),
      ...(cur.notes ? { notes: cur.notes } : {}),
      frequency: {
        inTrack: n,
        ...(corpusFreq?.frequency?.[lemma]
          ? {
              inCorpus: corpusFreq.frequency[lemma],
              corpus: "the Hebrew Bible",
              // All 39 books were counted, which is what licenses "hapax".
              corpusComplete: true,
              ...(corpusFreq.books?.[lemma] ? { corpusBooks: corpusFreq.books[lemma] } : {}),
            }
          : {}),
      },
      _freq: n,
      _rootSource: cur.root ? "curated" : root ? "derived" : "none",
      _commonestForm: display(commonest),
      _strongs: lemma,
      _fullGloss: entry.strongs_def ?? "",
    });
  }

  // ---- distractors for anything curation has not reached ----
  let autoFilled = 0;
  for (const w of words) {
    if (w.distractors && w.distractors.length >= 3) continue;
    w.distractors = autoDistractors(w, words);
    w._autoDistractors = true;
    autoFilled++;
  }

  // ---- passages: every verse of the book ----
  const passages = verses.map((v) => ({
    id: v.osisID.toLowerCase().replace(/\./g, "-"),
    reference: reference(v.osisID),
    translation: translations[v.osisID] ?? "",
    tokens: v.tokens.map((t) => {
      const ci = contentIndex(t.lemmas);
      const lemma = ci >= 0 ? t.lemmas[ci] : null;
      const w = lemma ? words.find((x) => x._strongs === strongsKey(lemma)) : null;
      const root = w && w.familyId ? w.familyId : null;
      const highlight = root ? locateRoot(root, display(t.text)) : null;
      return {
        text: display(t.text),
        translit: "",
        gloss: w?.gloss || functionGloss(t.lemmas, t.morphs),
        // A token links to its vocabulary entry whether or not the root can be
        // marked. Tapping a word to see what it means must not depend on
        // whether Strong's happened to classify its lemma as a primitive root.
        wordId: w ? w.id : null,
        familyId: highlight ? root : null,
        morphology: highlight ? { highlight, kind: "root" } : null,
      };
    }),
  }));

  // ---- sections: one per chapter, in order --------------------------------
  //
  // A track is a whole book and a book is read chapter by chapter. Each section
  // carries its own new-lexeme count, because chapters are NOT equal: Genesis 10
  // introduces 94 where Genesis 9 introduces 25 (the Table of Nations). Showing
  // the number is honest; implying they cost the same is not.
  // See coverage-findings.md §4a.
  const seenByChapter = new Set();
  const sections = [];
  for (const v of verses) {
    const ch = v.osisID.split(".")[1];
    let sec = sections.find((x) => x.chapter === ch);
    if (!sec) {
      sec = {
        id: `${v.osisID.split(".")[0].toLowerCase()}-${ch}`,
        label: `Chapter ${ch}`,
        chapter: ch,
        orderIndex: sections.length,
        verses: 0,
        newLexemes: 0,
      };
      sections.push(sec);
    }
    sec.verses++;
    for (const t of v.tokens) {
      const ci = contentIndex(t.lemmas);
      if (ci < 0) continue;
      const key = strongsKey(t.lemmas[ci]);
      if (!seenByChapter.has(key)) {
        seenByChapter.add(key);
        sec.newLexemes++;
      }
    }
  }

  writeFileSync(
    outFile,
    JSON.stringify(
      { families: [...families.values()], words, passages, sections, declined },
      null,
      2,
    ),
  );

  const total = words.length;
  console.log(`corpus:    ${running} running words, ${verses.length} verses`);
  console.log(`lexemes:   ${total} distinct content lemmas`);
  console.log(`roots:     ${stats.derived} derived + ${stats.curatedRoot} curated = ` +
              `${stats.derived + stats.curatedRoot} (${Math.round(100 * (stats.derived + stats.curatedRoot) / total)}%)`);
  console.log(`           ${stats.weak} declined (weak form), ${stats.noRoot} no primitive root`);
  console.log(`families:  ${families.size}`);
  console.log(`distractors: ${total - autoFilled} curated, ${autoFilled} AUTO-FILLED (weakest content)`);
  const untranslated = passages.filter((p) => !p.translation).length;
  console.log(`sections:  ${sections.length} — ` +
              sections.map((x) => `${x.label.replace("Chapter ", "ch")}:+${x.newLexemes}`).join(" "));
  console.log(`passages:  ${passages.length}` +
              (untranslated ? `  (${untranslated} WITHOUT a translation)` : "  (all translated)"));
  console.log(`\nwrote ${outFile}`);
  console.log(`\nStill needed in ${glossaryPath.split("/").pop()}: short glosses, distractors,`);
  console.log(`and roots for the ${stats.weak + stats.noRoot} lexemes above.`);
}

main();
