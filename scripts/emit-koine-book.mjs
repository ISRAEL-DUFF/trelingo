#!/usr/bin/env node
/**
 * generated-<book>.json → src/content/courses/greek-<book>/generated.ts
 *
 * The whole-book counterpart to emit-koine-course.mjs, which serves the curated
 * four-verse Gospels track. Separate for the same reason the Hebrew side has
 * one shared emitter: a whole book carries sections and a derived unit path,
 * and everything in its header is computed rather than written down.
 *
 * Usage:  node scripts/emit-koine-book.mjs 1john "1 John"
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

const slug = process.argv[2];
const title = process.argv[3] ?? slug;
if (!slug) {
  console.error('usage: node scripts/emit-koine-book.mjs <slug> "<Title>"');
  process.exit(1);
}

const OUT = resolve(HERE, `../src/content/courses/greek-${slug}/generated.ts`);
const data = JSON.parse(readFileSync(resolve(HERE, `generated-${slug}.json`), "utf8"));
const j = (v) => JSON.stringify(v);
const strip = (o, keys) => Object.fromEntries(Object.entries(o).filter(([k]) => !keys.includes(k)));

const words = data.words.map((w) => {
  const how = w._stemSource === "derived" ? "stem derived" : `stem ${w._stemSource}`;
  return `  // ${how} · ${w._freq}× in ${title}\n  ${j(strip(w, ["_freq", "_stemSource"]))},`;
});

const runningWords = data.passages.reduce((n, p) => n + p.tokens.length, 0);
const overrides = data.words.filter((w) => w._stemSource !== "derived").length;

writeFileSync(
  OUT,
  `/**
 * GENERATED FILE — do not edit by hand.
 *
 * Produced by:
 *   node scripts/build-${slug}-glossary.mjs
 *   node scripts/fetch-web-nt.mjs "${title}" ${data.sections.length}
 *   node scripts/import-morphgnt.mjs scripts/corpora/greek --book <NN> \\
 *        --glossary scripts/${slug}-glossary.json \\
 *        --translations scripts/web-${slug}.json --out scripts/generated-${slug}.json
 *   node scripts/emit-koine-book.mjs ${slug} "${title}"
 *
 * SCOPE: ${data.passages.length} verses, ${runningWords} running words, ${data.words.length} taught lexemes.
 * Every figure in this header is derived from the data, never written down.
 *
 * Stem/ending splits are DERIVED by paradigm invariance across the whole New
 * Testament (spike-a-findings.md §4). ${overrides} carry a hand-checked stem instead,
 * because a Greek verb's augment and perfect reduplication break the common
 * prefix — ἠγάπησεν shares no leading letter with ἀγαπῶμεν. Filtering augments
 * out was tried and produced confidently WRONG stems (πιστεύω → "π"), so the
 * derivation stays conservative and curation supplies the rest.
 *
 * Sources — see NOTICE.md
 *   text        SBLGNT                       CC BY 4.0
 *   parsing     MorphGNT/sblgnt              CC BY-SA
 *   translation World English Bible          Public domain
 *
 * ${data.words.length} words · ${data.families.length} families · ${data.passages.length} passages
 */
import type { ContentBundle } from "../../schema";

export const families: ContentBundle["families"] = [
${data.families.map((f) => `  ${j(f)},`).join("\n")}
];

export const words: ContentBundle["words"] = [
${words.join("\n")}
];

export const passages: ContentBundle["passages"] = [
${data.passages.map((p) => `  ${j(p)},`).join("\n")}
];

/** Chapters, each carrying the count of lexemes it introduces. */
export const sections: NonNullable<ContentBundle["sections"]> = [
${data.sections
  .map((x) =>
    `  ${j({ id: x.id, label: x.label, subtitle: `${x.verses} verses · ${x.newLexemes} new words`, orderIndex: x.orderIndex })},`,
  )
  .join("\n")}
];
`,
);
console.log(`wrote ${OUT}`);
console.log(`  ${data.words.length} words, ${data.families.length} families, ${data.passages.length} passages, ${runningWords} running words`);
