#!/usr/bin/env node
/**
 * JPS 1917 English, from Sefaria → scripts/jps1917-<book>.json
 *
 * WHY THIS EXISTS. Jonah's translation file was produced by hand and the step
 * was never written down, so the one part of the Hebrew pipeline that touches
 * a rights question was also the one part nobody could reproduce or audit.
 *
 * WHY THE VERSION IS PINNED BY TITLE. Sefaria serves several English versions
 * per book and the DEFAULT is not the one we may ship. For Ruth the default is
 * "Tanakh: The Holy Scriptures, published by JPS" (CC-BY-NC) and the newest is
 * "THE JPS TANAKH: Gender-Sensitive Edition" (CC-BY-NC) — both current
 * copyrighted works. Only the 1917 edition is public domain.
 *
 * So this asks for one exact version title and then REFUSES TO WRITE unless
 * the server echoes back that title AND `license === "Public Domain"`, for
 * every chapter. A silent fallback to the default version is precisely the
 * failure that would put a copyrighted translation into the bundle, and it
 * would look like success.
 *
 * Usage:
 *   node scripts/fetch-jps1917.mjs Ruth 4
 *   node scripts/fetch-jps1917.mjs Jonah 4 --out scripts/jps1917-jonah.json
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

/** The only English version of the Tanakh this project may ship. */
const VERSION_TITLE = "The Holy Scriptures: A New Translation (JPS 1917)";
const REQUIRED_LICENSE = "Public Domain";

/**
 * Sefaria returns light HTML: footnote markers, small-caps spans, italics.
 * The passage schema wants a plain sentence.
 */
function plain(html) {
  return String(html)
    // Footnotes carry editorial content that is not part of the 1917 text.
    .replace(/<sup[^>]*>.*?<\/sup>/gs, "")
    .replace(/<i\b[^>]*class="footnote"[^>]*>.*?<\/i>/gs, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function chapter(book, n) {
  const url =
    `https://www.sefaria.org/api/v3/texts/${encodeURIComponent(book)}.${n}` +
    `?version=${encodeURIComponent(`english|${VERSION_TITLE}`)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${book} ${n}: HTTP ${res.status}`);
  const body = await res.json();
  const version = body.versions?.[0];
  if (!version) throw new Error(`${book} ${n}: no version returned`);

  // Both assertions matter. A wrong title means Sefaria fell back to another
  // version; a wrong licence means the text is not ours to ship. Either one
  // aborts the whole run rather than writing a partial file.
  if (version.versionTitle !== VERSION_TITLE) {
    throw new Error(
      `${book} ${n}: served "${version.versionTitle}", expected "${VERSION_TITLE}". ` +
        `Refusing to write — this is the copyrighted-translation trap.`,
    );
  }
  if (version.license !== REQUIRED_LICENSE) {
    throw new Error(
      `${book} ${n}: licence is "${version.license}", expected "${REQUIRED_LICENSE}". Refusing to write.`,
    );
  }
  return version.text.map(plain);
}

async function main() {
  const [book, chaptersArg] = process.argv.slice(2);
  const outFlag = process.argv.indexOf("--out");
  if (!book || !chaptersArg) {
    console.error("usage: node scripts/fetch-jps1917.mjs <Book> <chapterCount> [--out <file>]");
    process.exit(1);
  }
  const chapters = Number(chaptersArg);
  const out = {};
  let verses = 0;

  for (let n = 1; n <= chapters; n++) {
    const text = await chapter(book, n);
    text.forEach((t, i) => {
      if (!t) throw new Error(`${book} ${n}:${i + 1} is empty`);
      out[`${book}.${n}.${i + 1}`] = t;
      verses++;
    });
    console.log(`  ${book} ${n}: ${text.length} verses`);
  }

  const path = outFlag > 0 ? process.argv[outFlag + 1] : resolve(HERE, `jps1917-${book.toLowerCase()}.json`);
  writeFileSync(path, `${JSON.stringify(out, null, 1)}\n`);
  console.log(`wrote ${path}`);
  console.log(`  ${verses} verses · "${VERSION_TITLE}" · ${REQUIRED_LICENSE}`);
}

main().catch((e) => {
  console.error(String(e.message ?? e));
  process.exit(1);
});
