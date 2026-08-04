/**
 * Greek → Latin transliteration, shared by every Koine glossary builder.
 *
 * Extracted rather than copied. The rough-breathing rule below is subtle enough
 * that a second hand-maintained copy would drift, and the bug it encodes was
 * found only because an id collision surfaced it.
 */
const LETTERS = {
  α: "a", β: "b", γ: "g", δ: "d", ε: "e", ζ: "z", η: "ē", θ: "th", ι: "i",
  κ: "k", λ: "l", μ: "m", ν: "n", ξ: "x", ο: "o", π: "p", ρ: "r", σ: "s",
  ς: "s", τ: "t", υ: "y", φ: "ph", χ: "ch", ψ: "ps", ω: "ō",
};
const PLAIN = { ē: "e", ō: "o" };

/**
 * Rough breathing is an h; everything else is a letter or an accent.
 *
 * The h prefixes the WHOLE WORD, not the letter carrying the mark. In a
 * diphthong the breathing sits on the SECOND vowel — εἷς is ε + ἷ — so keying
 * off "is this the first letter?" drops the aspiration entirely. That turned
 * εἷς "one" into `eis`, colliding with εἰς "into", and quietly mistransliterated
 * υἱός as `yios` instead of `huios`. Rough breathing only ever occurs
 * word-initially in Greek, so its presence anywhere is enough.
 */
export function translit(word) {
  const d = word.normalize("NFD");
  const rough = d.includes("\u0314");
  let out = "";
  for (const ch of d) {
    if (/\p{Mn}/u.test(ch)) continue; // accents, breathings, iota subscript
    const mapped = LETTERS[ch.toLowerCase()];
    if (mapped) out += mapped;
  }
  out = rough ? `h${out}` : out;
  // γγ/γκ/γχ are pronounced ng-; standard transliteration reflects it.
  return out.replace(/gg/g, "ng").replace(/gk/g, "nk").replace(/gch/g, "nch");
}

export const slug = (word) =>
  translit(word)
    .split("")
    .map((c) => PLAIN[c] ?? c)
    .join("")
    .replace(/[^a-z]/g, "");

