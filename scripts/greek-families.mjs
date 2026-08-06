/**
 * When a derived Greek stem may be called a family, and when it may not.
 *
 * THE BUG THIS EXISTS TO STOP. Both Greek importers derive a stem as the
 * longest common prefix across a lemma's attested forms — paradigm invariance,
 * and correct for deciding which letters to highlight. They then used that stem
 * string as the `familyId`, which is a different and much stronger claim: that
 * two words share a lexical root.
 *
 * For compound verbs it is systematically false. ἀναβαίνω's forms include
 * ἀνέβη, so the augment breaks the common prefix at ἀν- and the "stem" is the
 * preposition. Every ἀνα- verb then lands in one family. Measured across the
 * Greek tracks before this rule existed:
 *
 *     ἀν    17 members   ἀνίστημι, ἀναβαίνω, ἀναχωρέω … and ἀνήρ, "a man"
 *     ἐπ    16           ἐπιτιμάω, ἐπιβάλλω, ἐπερωτάω …
 *     κατ   13           καταβαίνω, κατεσθίω, καταρτίζω …
 *     δι    13    ἀπ 12    προσ 10    συ 8    παρ 8    ὑπ 6    συν 6    περι 5
 *
 * ἀνήρ shares nothing with ἀναβαίνω but two letters. The app's central claim is
 * that a shared morpheme pays off across a family, and the family sheet was
 * quietly disproving it.
 *
 * This is the same error the Hebrew pipeline refuses by name — the root fallacy
 * of jonah-spike-findings.md §3, where Strong's derivation chains are declined
 * because "a coloured highlight reads as authoritative". Greek was asserting a
 * shared root on the evidence of two shared letters, which is weaker still.
 *
 * WHAT THIS DOES NOT CHANGE: the highlight. Paradigm invariance really did find
 * ἀν- invariant across ἀνήρ/ἀνδρός, so marking -ήρ as what varies is an unusual
 * analysis but a true one. The family was the falsehood; the split was not.
 *
 * A CURATED familyId ALWAYS WINS. A human saying ἀγαπάω, ἀγάπη and ἀγαπητός
 * belong together is evidence; a shared prefix is not. Nothing here applies to
 * `entry.familyId`.
 */

/**
 * Greek prepositions as they appear in compounds, after `fold`.
 *
 * A closed, finite set — this is a fact about the language, not a heuristic
 * blocklist that needs topping up as words are added. Elided and assimilated
 * forms are listed because they are what survives a prefix collapse: ἀπο
 * becomes ἀπ- before a vowel and ἀφ- before a rough breathing, and both show up
 * as derived stems.
 */
export const PREPOSITIONS = new Set([
  "ἀμφι", "ἀμφ",
  "ἀνα", "ἀν",
  "ἀντι", "ἀντ", "ἀνθ",
  "ἀπο", "ἀπ", "ἀφ",
  "δια", "δι",
  "εἰς", "εἰσ",
  "ἐκ", "ἐξ",
  "ἐν", "ἐμ", "ἐγ",
  "ἐπι", "ἐπ", "ἐφ",
  "κατα", "κατ", "καθ",
  "μετα", "μετ", "μεθ",
  "παρα", "παρ",
  "περι",
  "προ",
  "προς", "προσ",
  "συν", "συ", "συμ", "συγ", "συλ", "συσ",
  "ὑπερ",
  "ὑπο", "ὑπ", "ὑφ",
]);

/**
 * NO LENGTH BAR, and that was tried and reverted.
 *
 * Requiring three letters looked like cheap extra safety and was not: θεός
 * derives a two-letter stem (θε-), and the Attic track lost 13 of its 41
 * hand-curated words in one run. Length does not separate a root from a
 * prefix — πιστ and περι are both four letters, one real and one not.
 *
 * The preposition rule below does the actual work. MIN_STEM in the importers
 * still governs the split, where two invariant letters are a real finding.
 */

/**
 * Is this derived stem a preposition, and therefore not a root?
 *
 * EXACT MATCH ONLY, and a looser rule was tried and reverted. Allowing
 * "preposition plus one letter" caught συντ — συντρίβω and συντίθεμαι diverging
 * one letter past συν- — but it also caught δικ, which is δι- plus a letter by
 * coincidence and is a real family: δίκη, δίκαιος, δικαστής. One bogus pair is
 * not worth one genuine family of three, so συντ survives as a known residual
 * and is listed in families.test.ts.
 *
 * The lesson generalises: no string rule separates a root from a prefix in the
 * general case. This one is narrow because it encodes a closed fact — the list
 * of Greek prepositions — rather than a guess about shape.
 */
export function isPrefixArtefact(id) {
  return PREPOSITIONS.has(id);
}

/**
 * The family id for a derived stem, or null to teach the word plain.
 *
 * `fold` is passed in because the two importers each carry their own.
 */
export function derivedFamilyId(stem, fold) {
  if (!stem) return null;
  const id = fold(stem);
  if (isPrefixArtefact(id)) return null;
  return id;
}
