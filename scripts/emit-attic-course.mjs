#!/usr/bin/env node
/**
 * generated-attic.json → src/content/courses/greek-attic/generated.ts
 *
 * Counterpart to emit-koine-course.mjs. Kept separate rather than shared
 * because almost all of what these two scripts do is state their provenance
 * correctly, and the provenance is what differs: a different corpus, a
 * different licence, and — here — an unresolved one.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, "../src/content/courses/greek-attic/generated.ts");

const data = JSON.parse(readFileSync(resolve(HERE, "generated-attic.json"), "utf8"));
const j = (v) => JSON.stringify(v);

const words = data.words.map((w) => {
  const { _freq, _stemSource, ...rest } = w;
  return `  // ${_stemSource === "derived" ? "derived" : `stem ${_stemSource}`} · ${_freq} occurrences in the sampled corpus\n  ${j(rest)},`;
});

const out = `/**
 * GENERATED FILE — do not edit by hand.
 *
 * Produced by:
 *   node scripts/import-agdt.mjs <proseDir>
 *   node scripts/emit-attic-course.mjs
 *
 * ⚠️ LICENCE UNRESOLVED — THIS COURSE MUST NOT SHIP UNTIL IT IS.
 * The upstream AGDT 2.1 repository states CC BY-SA 3.0 US. The Universal
 * Dependencies conversion of the same data states CC BY-NC-SA 2.5. Those two
 * statements cannot both be right: ShareAlike forbids adding a NonCommercial
 * restriction to a derivative. This file is built from the UPSTREAM XML only,
 * never the UD conversion, but that does not resolve the contradiction —
 * someone qualified has to. See attic-spike-findings.md §2.
 *
 * Corpus is Attic PROSE ONLY (Thucydides 1, Plato Euthyphro, Lysias).
 * Tragedy and epic are excluded on purpose: pooling dialects took the spike's
 * spot check from 8/8 to 6/8 via Doric alpha and crasis (findings §4.2).
 *
 * Sources
 *   text + parsing  PerseusDL/treebank_data AGDT 2.1  (licence — see above)
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
`;

writeFileSync(OUT, out);
console.log(`wrote ${OUT}`);
console.log(`  ${data.words.length} words, ${data.families.length} families, ${data.passages.length} passages`);
