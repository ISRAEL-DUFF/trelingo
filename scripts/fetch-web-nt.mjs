#!/usr/bin/env node
/**
 * World English Bible → scripts/web-<book>.json
 *
 * The Greek counterpart to fetch-jps1917.mjs, and it follows the same rule: ask
 * for one named translation and REFUSE TO WRITE unless the server confirms both
 * the translation and its licence, for every chapter.
 *
 * WHY THE WEB. The New Testament needs a public-domain English text, and the
 * candidates are not equally clean:
 *
 *   WEB    explicitly DEDICATED to the public domain by its publisher. No term
 *          to expire, no jurisdiction to argue about. This one.
 *   ASV    public domain by age (1901). Fine, but relies on the passage of time
 *          rather than a statement, and the WEB is a modernised ASV anyway.
 *   KJV    public domain in most of the world, but the Crown holds a perpetual
 *          letters-patent right in the United Kingdom. A free app can live with
 *          that; a project that has already been careful about NonCommercial
 *          conflicts should not choose it when a cleaner option exists.
 *
 * Usage:  node scripts/fetch-web-nt.mjs "1 John" 5
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

const TRANSLATION = "web";
const REQUIRED_NAME = "World English Bible";
const REQUIRED_NOTE = "Public Domain";

/** Verse text with footnote markers and whitespace collapsed. */
const plain = (s) =>
  String(s)
    .replace(/\{[^}]*\}/g, "") // WEB brackets words supplied by the translator
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\s+/g, " ")
    .trim();

async function chapter(book, n) {
  const url = `https://bible-api.com/${encodeURIComponent(`${book} ${n}`)}?translation=${TRANSLATION}`;
  // One retry on a rate limit, then give up loudly. Silently continuing would
  // write a file with a chapter missing.
  let res = await fetch(url);
  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 8000));
    res = await fetch(url);
  }
  if (!res.ok) throw new Error(`${book} ${n}: HTTP ${res.status}`);
  const body = await res.json();

  // Both assertions matter, and both abort the whole run rather than writing a
  // partial file. A silently substituted translation would look like success.
  if (body.translation_name !== REQUIRED_NAME) {
    throw new Error(
      `${book} ${n}: served "${body.translation_name}", expected "${REQUIRED_NAME}". Refusing to write.`,
    );
  }
  if (body.translation_note !== REQUIRED_NOTE) {
    throw new Error(
      `${book} ${n}: licence is "${body.translation_note}", expected "${REQUIRED_NOTE}". Refusing to write.`,
    );
  }
  if (!Array.isArray(body.verses) || !body.verses.length) {
    throw new Error(`${book} ${n}: no verses returned`);
  }
  return body.verses;
}

async function main() {
  const [book, chaptersArg] = process.argv.slice(2);
  if (!book || !chaptersArg) {
    console.error('usage: node scripts/fetch-web-nt.mjs "<Book>" <chapterCount>');
    process.exit(1);
  }
  const chapters = Number(chaptersArg);
  const out = {};
  let verses = 0;

  for (let n = 1; n <= chapters; n++) {
    const rows = await chapter(book, n);
    for (const v of rows) {
      const text = plain(v.text);
      if (!text) throw new Error(`${book} ${n}:${v.verse} is empty`);
      out[`${book}.${v.chapter}.${v.verse}`] = text;
      verses++;
    }
    console.log(`  ${book} ${n}: ${rows.length} verses`);
    // The API is a courtesy; do not hammer it. 400ms drew a 429 on a
    // sixteen-chapter book, so the gap is generous rather than minimal.
    await new Promise((r) => setTimeout(r, 1500));
  }

  const slug = book.toLowerCase().replace(/\s+/g, "");
  const path = resolve(HERE, `web-${slug}.json`);
  writeFileSync(path, `${JSON.stringify(out, null, 1)}\n`);
  console.log(`wrote ${path}`);
  console.log(`  ${verses} verses · "${REQUIRED_NAME}" · ${REQUIRED_NOTE}`);
}

main().catch((e) => {
  console.error(String(e.message ?? e));
  process.exit(1);
});
