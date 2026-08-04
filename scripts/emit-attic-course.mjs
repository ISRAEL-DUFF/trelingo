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

/**
 * Corpus frequencies, keyed by LEMMA — which is exactly what our headword
 * text is, so every headword matches by construction (verified: all of them).
 */
let corpusFreq = null;
try {
  corpusFreq = JSON.parse(readFileSync(resolve(HERE, "corpora/greek-agdt-frequency.json"), "utf8"));
} catch {
  console.log("no corpora/greek-agdt-frequency.json — shipping in-track counts only");
}

/** How often each word appears in the verses this track actually shows. */
const trackOccurrences = new Map();
for (const p of data.passages) {
  for (const t of p.tokens) {
    if (t.wordId) trackOccurrences.set(t.wordId, (trackOccurrences.get(t.wordId) ?? 0) + 1);
  }
}

const words = data.words.map((w) => {
  const { _freq, _stemSource, ...rest } = w;
  // Absent from the shown verses is a real answer; do not floor it to 1.
  const inTrack = trackOccurrences.get(w.id) ?? 0;
  const corpusCount = corpusFreq?.frequency?.[w.text];
  // The treebank is a SAMPLE of Greek — 549k tokens against the millions that
  // survive — so a lemma occurring once in it may be perfectly ordinary. It is
  // marked incomplete and can never license a hapax claim.
  const withFreq = {
    ...rest,
    frequency: {
      ...(inTrack ? { inTrack } : {}),
      ...(corpusCount
        ? {
            inCorpus: Math.max(corpusCount, inTrack),
            corpus: "the Perseus Greek treebank",
            corpusComplete: false,
            ...(corpusFreq.books?.[w.text] > 1 ? { corpusBooks: corpusFreq.books[w.text] } : {}),
          }
        : {}),
    },
  };
  return `  // ${_stemSource === "derived" ? "derived" : `stem ${_stemSource}`} · ${_freq} occurrences in the sampled corpus\n  ${j(withFreq)},`;
});

const out = `/**
 * GENERATED FILE — do not edit by hand.
 *
 * Produced by:
 *   node scripts/import-agdt.mjs <proseDir>
 *   node scripts/emit-attic-course.mjs
 *
 * LICENCE: CC BY-SA 3.0 US. This content is an ADAPTATION and inherits
 * ShareAlike — it must be redistributed under BY-SA 3.0 US or a later
 * compatible version, and must credit Perseus. See NOTICE.md.
 *
 * The grant is taken from the copyright holder's own repository. A separate
 * Universal Dependencies conversion of the same treebank is labelled
 * CC BY-NC-SA 2.5, which is where the "unresolved licence" note here used to
 * come from. A downstream converter cannot add a NonCommercial restriction to
 * BY-SA material, so that label is the conversion's problem, not this
 * project's: we build from the UPSTREAM XML only and never from the UD data.
 * See attic-spike-findings.md §2.
 *
 * Corpus is Attic PROSE ONLY (Thucydides 1, Plato Euthyphro, Lysias).
 * Tragedy and epic are excluded on purpose: pooling dialects took the spike's
 * spot check from 8/8 to 6/8 via Doric alpha and crasis (findings §4.2).
 *
 * Sources
 *   text + parsing  Ancient Greek and Latin Dependency Treebank 2.1,
 *                   PerseusDL/treebank_data.
 *                   © 2014 The Perseus Digital Library, Tufts University.
 *                   CC BY-SA 3.0 US.
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
