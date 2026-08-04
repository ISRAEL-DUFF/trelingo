#!/usr/bin/env node
/**
 * Greek lemma frequencies → scripts/corpora/greek-<corpus>-frequency.json
 *
 * The Greek counterpart to build-hebrew-frequency.mjs, and it has to make a
 * distinction Hebrew did not:
 *
 *   nt     the whole New Testament, from MorphGNT. A COMPLETE corpus — every
 *          word of it is counted — so a lemma occurring once really is a New
 *          Testament hapax legomenon, a category the literature names and
 *          commentaries discuss. The badge is earned here.
 *
 *   agdt   the Perseus Ancient Greek Dependency Treebank. A SAMPLE, and a small
 *          one: a few hundred thousand tokens against the millions of surviving
 *          Ancient Greek. A lemma occurring once in it may be perfectly ordinary
 *          in Greek, so this corpus is marked incomplete and its counts never
 *          license a hapax claim.
 *
 * That asymmetry is the whole point of `corpusComplete` in the schema. It would
 * be easy, and wrong, to count both the same way and let a 1 mean the same
 * thing in each.
 *
 * Usage:  node scripts/build-greek-frequency.mjs nt
 *         node scripts/build-greek-frequency.mjs agdt
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const CACHE = resolve(HERE, "corpora/greek");

async function cached(name, url) {
  const path = resolve(CACHE, name);
  if (existsSync(path)) return readFileSync(path, "utf8");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  const body = await res.text();
  writeFileSync(path, body);
  return body;
}

/**
 * MorphGNT: one whitespace-separated row per token, lemma last.
 *   010101 N- ----NSF- Βίβλος Βίβλος βίβλος βίβλος
 */
async function newTestament() {
  const listing = await (await fetch("https://api.github.com/repos/morphgnt/sblgnt/contents/")).json();
  const files = listing.filter((f) => f.name.endsWith("-morphgnt.txt")).map((f) => f.name);
  const counts = new Map();
  const inBooks = new Map();
  let tokens = 0;

  for (const name of files) {
    const text = await cached(name, `https://raw.githubusercontent.com/morphgnt/sblgnt/master/${name}`);
    const book = name.replace(/^\d+-|-morphgnt\.txt$/g, "");
    for (const line of text.split("\n")) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 7) continue;
      const lemma = parts[parts.length - 1];
      tokens++;
      counts.set(lemma, (counts.get(lemma) ?? 0) + 1);
      (inBooks.get(lemma) ?? inBooks.set(lemma, new Set()).get(lemma)).add(book);
    }
  }
  return {
    id: "nt",
    display: "the New Testament",
    complete: true,
    units: files.length,
    unitNoun: "books",
    tokens,
    counts,
    inBooks,
  };
}

/**
 * AGDT: one <word lemma="…"> element per token, across every work in the
 * treebank — not only the Attic prose the course reads from, because the
 * broader the reference the more useful the number.
 */
async function treebank() {
  const listing = await (
    await fetch("https://api.github.com/repos/PerseusDL/treebank_data/contents/v2.1/Greek/texts")
  ).json();
  const files = listing.filter((f) => f.name.endsWith(".xml")).map((f) => f.name);
  const counts = new Map();
  const inBooks = new Map();
  let tokens = 0;

  for (const name of files) {
    const xml = await cached(
      name,
      `https://raw.githubusercontent.com/PerseusDL/treebank_data/master/v2.1/Greek/texts/${name}`,
    );
    for (const m of xml.matchAll(/<word\b[^>]*\blemma="([^"]*)"/g)) {
      // AGDT appends a homograph digit to some lemmas (πόλις1); strip it so one
      // word is one key, exactly as the Hebrew side strips its suffix letter.
      const lemma = m[1].replace(/\d+$/, "").trim();
      if (!lemma) continue;
      tokens++;
      counts.set(lemma, (counts.get(lemma) ?? 0) + 1);
      (inBooks.get(lemma) ?? inBooks.set(lemma, new Set()).get(lemma)).add(name);
    }
  }
  return {
    id: "agdt",
    display: "the Perseus Greek treebank",
    // A treebank is a sample of Greek, not the whole of it. Nothing counted
    // here may be called a hapax legomenon.
    complete: false,
    units: files.length,
    unitNoun: "works",
    tokens,
    counts,
    inBooks,
  };
}

async function main() {
  mkdirSync(CACHE, { recursive: true });
  const which = process.argv[2];
  if (which !== "nt" && which !== "agdt") {
    console.error("usage: node scripts/build-greek-frequency.mjs <nt|agdt>");
    process.exit(1);
  }
  const r = which === "nt" ? await newTestament() : await treebank();

  const frequency = Object.fromEntries([...r.counts.entries()].sort((a, b) => b[1] - a[1]));
  const books = Object.fromEntries([...r.inBooks.entries()].map(([k, v]) => [k, v.size]));
  const singles = Object.values(frequency).filter((n) => n === 1).length;

  const out = resolve(HERE, `corpora/greek-${r.id}-frequency.json`);
  writeFileSync(
    out,
    `${JSON.stringify(
      {
        _readme:
          `Occurrences of every lemma in ${r.display}, counted by build-greek-frequency.mjs. ` +
          (r.complete
            ? "This corpus is COMPLETE, so a count of 1 is a genuine hapax legomenon."
            : "This corpus is a SAMPLE, so a count of 1 means once in the sample and NOT that the word is rare in Greek."),
        _corpus: r.display,
        _complete: r.complete,
        [`_${r.unitNoun}`]: r.units,
        _tokens: r.tokens,
        _lemmas: r.counts.size,
        _onceOnly: singles,
        frequency,
        books,
      },
      null,
      0,
    )}\n`,
  );
  console.log(`wrote ${out}`);
  console.log(
    `  ${r.units} ${r.unitNoun} · ${r.tokens.toLocaleString()} tokens · ${r.counts.size.toLocaleString()} lemmas`,
  );
  console.log(
    `  ${singles.toLocaleString()} occur exactly once` +
      (r.complete ? " — genuine hapax legomena" : " in the sample — NOT hapax"),
  );
}

main().catch((e) => {
  console.error(String(e.message ?? e));
  process.exit(1);
});
