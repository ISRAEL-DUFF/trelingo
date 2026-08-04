#!/usr/bin/env node
/**
 * generated-<book>.json → src/content/courses/hebrew-<book>/generated.ts
 *
 * One emitter for every Hebrew book. The Greek courses keep separate emitters
 * because their provenance genuinely differs — different corpora, different
 * licences, different derivation methods. Two Hebrew books from OSHB differ
 * only in which book they are, so a second copy of this file would be a second
 * place for the provenance header to go stale, which is exactly what happened
 * to Jonah's ("chapter 1 only — 16 verses" long after the whole book landed).
 *
 * Usage:  node scripts/emit-hebrew-course.mjs ruth
 *         node scripts/emit-hebrew-course.mjs jonah
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

const book = (process.argv[2] ?? "").toLowerCase();
if (!book) {
  console.error("usage: node scripts/emit-hebrew-course.mjs <book>   e.g. ruth");
  process.exit(1);
}
const Book = book[0].toUpperCase() + book.slice(1);

const OUT = resolve(HERE, `../src/content/courses/hebrew-${book}/generated.ts`);
const data = JSON.parse(readFileSync(resolve(HERE, `generated-${book}.json`), "utf8"));
const j = (v) => JSON.stringify(v);

const strip = (o, keys) => Object.fromEntries(Object.entries(o).filter(([k]) => !keys.includes(k)));

const words = data.words.map((w) => {
  const note =
    w._rootSource === "derived" ? "root derived" : w._rootSource === "curated" ? "root HAND-SUPPLIED" : "no root";
  const auto = w._autoDistractors ? " · distractors AUTO-FILLED, unreviewed" : "";
  return `  // ${note} · ${w._freq}× in ${Book} · seen as ${w._commonestForm}${auto}\n  ${j(
    strip(w, ["_freq", "_rootSource", "_strongs", "_fullGloss", "_commonestForm", "_autoDistractors"]),
  )},`;
});
const families = data.families.map((f) => {
  const flag = f._inferredGloss ? "  // gloss inferred from the primary member — UNREVIEWED\n" : "";
  return `${flag}  ${j(strip(f, ["_inferredGloss"]))},`;
});

const runningWords = data.passages.reduce((n, p) => n + p.tokens.length, 0);
const inferred = data.families.filter((f) => f._inferredGloss).length;
const curatedRoots = data.words.filter((w) => w._rootSource === "curated").length;

writeFileSync(
  OUT,
  `/**
 * GENERATED FILE — do not edit by hand.
 *
 * Produced by:
 *   node scripts/build-${book}-glossary.mjs
 *   node scripts/fetch-jps1917.mjs ${Book} ${data.sections?.length ?? 1}
 *   node scripts/import-oshb.mjs scripts/corpora/${Book}.xml \\
 *        scripts/corpora/strongs-hebrew-dictionary.js \\
 *        --translations scripts/jps1917-${book}.json
 *   node scripts/emit-hebrew-course.mjs ${book}
 *
 * SCOPE: ${data.passages.length} verses, ${runningWords} running words, ${data.words.length} lexemes.
 * Every figure in this header is derived from the data, never written down.
 *
 * Roots are derived ONLY where Strong's marks the lemma itself a primitive root
 * and the radicals are present in the form. Strong's "from HXXXX" derivation
 * chains are refused outright — they would raise coverage while asserting that
 * עִיר "city" comes from עור "to awake". See jonah-spike-findings.md §3.
 * ${curatedRoots} root${curatedRoots === 1 ? " is" : "s are"} hand-supplied in the glossary and marked below.
 * ${inferred === 0 ? "Every family gloss is authored." : `${inferred} family gloss${inferred === 1 ? " is" : "es are"} inferred rather than authored — marked UNREVIEWED.`}
 *
 * Sources — see NOTICE.md
 *   text + morphology  OSHB / Westminster Leningrad Codex   CC BY 4.0
 *   glosses + translit Strong's Hebrew Dictionary (1894)     CC BY-SA, PD original
 *   translation        JPS 1917, via Sefaria                 Public domain
 *
 * ${data.words.length} words · ${data.families.length} families · ${data.passages.length} passages
 */
import type { ContentBundle } from "../../schema";

export const families: ContentBundle["families"] = [
${families.join("\n")}
];

export const words: ContentBundle["words"] = [
${words.join("\n")}
];

export const passages: ContentBundle["passages"] = [
${data.passages.map((p) => `  ${j(p)},`).join("\n")}
];

/**
 * Chapters. Each carries the count of lexemes it introduces, because chapters
 * are not equal — a path showing identical headers would hide that the first
 * chapter of a book always costs far more than the last.
 */
export const sections: NonNullable<ContentBundle["sections"]> = [
${data.sections
  .map(
    (x) =>
      `  ${j({
        id: x.id,
        label: x.label,
        subtitle: `${x.verses} verses · ${x.newLexemes} new words`,
        orderIndex: x.orderIndex,
      })},`,
  )
  .join("\n")}
];
`,
);
console.log(`wrote ${OUT}`);
console.log(
  `  ${data.words.length} words, ${data.families.length} families, ${data.passages.length} passages, ${runningWords} running words`,
);
