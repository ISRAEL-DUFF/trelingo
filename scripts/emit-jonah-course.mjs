#!/usr/bin/env node
/**
 * generated-jonah.json → src/content/courses/hebrew-jonah/generated.ts
 *
 * Counterpart to emit-koine-course.mjs and emit-attic-course.mjs. Separate for
 * the same reason: most of what these scripts do is state provenance, and the
 * provenance differs.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, "../src/content/courses/hebrew-jonah/generated.ts");
const data = JSON.parse(readFileSync(resolve(HERE, "generated-jonah.json"), "utf8"));
const j = (v) => JSON.stringify(v);

const strip = (o, keys) => Object.fromEntries(Object.entries(o).filter(([k]) => !keys.includes(k)));

const words = data.words.map((w) => {
  const note = w._rootSource === "derived" ? "root derived" : w._rootSource === "curated" ? "root HAND-SUPPLIED" : "no root";
  const auto = w._autoDistractors ? " · distractors AUTO-FILLED, unreviewed" : "";
  return `  // ${note} · ${w._freq}× in Jonah · seen as ${w._commonestForm}${auto}\n  ${j(strip(w, ["_freq", "_rootSource", "_strongs", "_fullGloss", "_commonestForm", "_autoDistractors"]))},`;
});
const families = data.families.map((f) => {
  const flag = f._inferredGloss ? "  // gloss inferred from the primary member — UNREVIEWED\n" : "";
  return `${flag}  ${j(strip(f, ["_inferredGloss"]))},`;
});

writeFileSync(OUT, `/**
 * GENERATED FILE — do not edit by hand.
 *
 * Produced by:
 *   node scripts/build-jonah-glossary.mjs
 *   node scripts/import-oshb.mjs <Jonah.xml> <strongs.json> \\
 *        --translations scripts/jps1917-jonah.json
 *   node scripts/emit-jonah-course.mjs
 *
 * SCOPE: ${data.passages.length} verses, ${data.passages.reduce((n, p) => n + p.tokens.length, 0)} running words, ${data.words.length} lexemes.
 * Derived from the data rather than written down, because the hardcoded line
 * that used to sit here still said "chapter 1 only — 16 verses, 254 running
 * words" long after the whole book landed.
 *
 * Roots are derived ONLY where Strong's marks the lemma itself a primitive root
 * and the radicals are present in the form. Strong's "from HXXXX" derivation
 * chains are refused outright — they would raise coverage by 20 points while
 * asserting that עִיר "city" comes from עור "to awake". See
 * jonah-spike-findings.md §3.
 *
 * Sources
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
 * are not equal — Jonah 1 brings 99 of the book's 245, and a path that showed
 * four identical headers would hide that entirely.
 */
export const sections: NonNullable<ContentBundle["sections"]> = [
${data.sections.map((x) => `  ${j({ id: x.id, label: x.label, subtitle: `${x.verses} verses · ${x.newLexemes} new words`, orderIndex: x.orderIndex })},`).join("\n")}
];
`);
console.log(`wrote ${OUT}`);
console.log(`  ${data.words.length} words, ${data.families.length} families, ${data.passages.length} passages`);
