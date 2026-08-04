#!/usr/bin/env node
/**
 * Whole-Tanakh lemma frequencies → scripts/corpora/hebrew-frequency.json
 *
 * WHY THIS IS NEEDED, AND WHY IN-BOOK COUNTS ARE NOT ENOUGH.
 *
 * "Hapax legomenon" means a word occurring exactly once IN A CORPUS. Ruth has
 * 133 lexemes appearing once in Ruth, and almost none of them are hapax: אֹזֶן
 * "ear" occurs once in Ruth and about 187 times in the Hebrew Bible. Showing a
 * learner "1×" without saying 1× of WHAT would teach them that ordinary words
 * are rare, which is worse than showing nothing.
 *
 * So the count that answers the question has to come from the whole Tanakh, and
 * the only honest way to get it is to count it. This reads all 39 books of OSHB
 * and tallies every Strong's lemma.
 *
 * NORMALISATION MUST MATCH THE IMPORTER. OSHB writes a token's lemma as a
 * slash-separated stack of prefixes and the content word — `c/3212` is
 * conjunction + "to go" — with a trailing letter for homographs (`5921 a`) and
 * a trailing plus for the first word of a multi-word name (`1035+`). Counting
 * raw lemma strings would scatter one word across several keys and undercount
 * every common word in the Bible. The rules here are the same three the
 * importer applies, deliberately duplicated in full rather than shared, because
 * a silent divergence would produce numbers that look plausible and are wrong.
 *
 * Usage:  node scripts/build-hebrew-frequency.mjs
 *         node scripts/build-hebrew-frequency.mjs --offline   (use cache only)
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const CACHE = resolve(HERE, "corpora/wlc");
const OUT = resolve(HERE, "corpora/hebrew-frequency.json");
const BASE = "https://raw.githubusercontent.com/openscriptures/morphhb/master/wlc";

/** Same three rules as import-oshb.mjs: prefix stack, homograph, compound. */
function strongsKeys(lemma) {
  return String(lemma)
    .split("/")
    .map((p) => p.replace(/\s+/g, "").replace(/\+$/, "").replace(/[a-z]$/, ""))
    .filter((p) => /^\d+$/.test(p)) // drop the prefix letters: c, d, b, l, k, m…
    .map((p) => `H${p}`);
}

async function books() {
  const res = await fetch("https://api.github.com/repos/openscriptures/morphhb/contents/wlc");
  if (!res.ok) throw new Error(`listing failed: HTTP ${res.status}`);
  return (await res.json()).filter((f) => f.name.endsWith(".xml")).map((f) => f.name);
}

async function fetchBook(name) {
  const cached = resolve(CACHE, name);
  if (existsSync(cached)) return readFileSync(cached, "utf8");
  const res = await fetch(`${BASE}/${name}`);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  const xml = await res.text();
  writeFileSync(cached, xml);
  return xml;
}

async function main() {
  mkdirSync(CACHE, { recursive: true });
  const offline = process.argv.includes("--offline");
  const names = offline ? readdirSync(CACHE).filter((n) => n.endsWith(".xml")) : await books();

  const counts = new Map();
  /** Which books each lemma appears in — "once in one book" is not the same fact. */
  const inBooks = new Map();
  let tokens = 0;
  let parsed = 0;

  for (const name of names) {
    const xml = await fetchBook(name);
    const words = xml.match(/<w\b[^>]*>/g) ?? [];
    if (!words.length) continue; // not a text file (VerseMap and friends)
    parsed++;
    const book = name.replace(/\.xml$/, "");
    for (const tag of words) {
      const m = tag.match(/\blemma="([^"]*)"/);
      if (!m) continue;
      tokens++;
      for (const key of strongsKeys(m[1])) {
        counts.set(key, (counts.get(key) ?? 0) + 1);
        (inBooks.get(key) ?? inBooks.set(key, new Set()).get(key)).add(book);
      }
    }
  }

  const frequency = Object.fromEntries([...counts.entries()].sort((a, b) => b[1] - a[1]));
  const bookSpread = Object.fromEntries([...inBooks.entries()].map(([k, v]) => [k, v.size]));

  const hapax = Object.values(frequency).filter((n) => n === 1).length;
  writeFileSync(
    OUT,
    `${JSON.stringify(
      {
        _readme:
          "Occurrences of every Strong's Hebrew lemma across the whole Tanakh, counted from OSHB " +
          "(CC BY 4.0) by build-hebrew-frequency.mjs. `frequency` is total occurrences; `books` is " +
          "how many of the 39 books it appears in. A lemma with frequency 1 is a hapax legomenon.",
        _source: "openscriptures/morphhb wlc",
        _books: parsed,
        _tokens: tokens,
        _lemmas: counts.size,
        _hapax: hapax,
        frequency,
        books: bookSpread,
      },
      null,
      0,
    )}\n`,
  );

  console.log(`wrote ${OUT}`);
  console.log(`  ${parsed} books · ${tokens.toLocaleString()} tokens · ${counts.size.toLocaleString()} distinct lemmas`);
  console.log(`  ${hapax.toLocaleString()} lemmas occur exactly once in the Hebrew Bible`);
}

main().catch((e) => {
  console.error(String(e.message ?? e));
  process.exit(1);
});
