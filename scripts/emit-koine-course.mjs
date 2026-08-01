#!/usr/bin/env node
/**
 * generated-koine.json → src/content/courses/greek-koine/generated.ts
 *
 * Emits the derived half of the course as a typed module. Unit structure lives
 * beside it in units.ts, hand-authored, because pedagogical ordering is a
 * judgement the corpus cannot make.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, "../src/content/courses/greek-koine/generated.ts");

const data = JSON.parse(readFileSync(resolve(HERE, "generated-koine.json"), "utf8"));

const j = (v) => JSON.stringify(v);

const words = data.words.map((w) => {
  const { _freq, _stemSource, ...rest } = w;
  return `  // ${_stemSource === "derived" ? "derived" : `stem ${_stemSource}`} · ${_freq} occurrences in the sampled corpus\n  ${j(rest)},`;
});

const families = data.families.map((f) => `  ${j(f)},`);
const passages = data.passages.map((p) => `  ${j(p)},`);

const out = `/**
 * GENERATED FILE — do not edit by hand.
 *
 * Produced by:
 *   node scripts/import-morphgnt.mjs <corpusDir>
 *   node scripts/emit-koine-course.mjs
 *
 * Stem/ending splits, letter indices, morphological parses and attestations are
 * DERIVED from MorphGNT by paradigm invariance (spike-a-findings.md §4).
 * Glosses, distractors and teaching notes come from scripts/koine-glossary.json
 * and are the human contribution — they still need specialist review.
 *
 * Sources
 *   text     SBLGNT            CC BY 4.0   https://sblgnt.com/license/
 *   parsing  MorphGNT/sblgnt   CC BY-SA    https://github.com/morphgnt/sblgnt
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
${passages.join("\n")}
];
`;

writeFileSync(OUT, out);
console.log(`wrote ${OUT}`);
console.log(`  ${data.words.length} words, ${data.families.length} families, ${data.passages.length} passages`);
