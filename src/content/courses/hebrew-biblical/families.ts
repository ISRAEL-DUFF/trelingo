import type { WordFamily } from "../../schema";

/**
 * Word families taught by this course. For Hebrew these are triliteral roots;
 * for Greek they will be verb stems and lemmas.
 *
 * `id` is the bare letters with no points and no separators — it is the join key
 * for every word, exercise and passage token, so it must stay stable.
 */
export const families: WordFamily[] = [
  { id: "ברא", letters: "ברא", coreGloss: "create", notes: "Used in the Hebrew Bible only with God as subject." },
  { id: "ראשׁ", letters: "ראשׁ", coreGloss: "head, first", notes: "Behind רֹאשׁ (head), רִאשׁוֹן (first) and בְּרֵאשִׁית (in the beginning)." },
  { id: "אלה", letters: "אלה", coreGloss: "god, deity", notes: "אֱלֹהִים is grammatically plural but takes singular verbs when it denotes the God of Israel." },
  { id: "שׁמי", letters: "שׁמי", coreGloss: "sky, heavens", notes: "The root behind שָׁמַיִם is disputed; treated here as שׁ־מ־י for teaching purposes." },
  { id: "ארץ", letters: "ארץ", coreGloss: "earth, land" },
  { id: "אור", letters: "אור", coreGloss: "light" },
  { id: "חשׁך", letters: "חשׁך", coreGloss: "darkness, be dark" },
  { id: "יום", letters: "יום", coreGloss: "day" },
  { id: "ליל", letters: "ליל", coreGloss: "night" },
  { id: "אמר", letters: "אמר", coreGloss: "say, speak" },
  { id: "היה", letters: "היה", coreGloss: "be, become", notes: "A III-he verb: the final ה drops out in many forms." },
  { id: "ראה", letters: "ראה", coreGloss: "see" },
  { id: "טוב", letters: "טוב", coreGloss: "be good" },
  { id: "שׁמר", letters: "שׁמר", coreGloss: "guard, keep, watch" },
  { id: "רעה", letters: "רעה", coreGloss: "shepherd, pasture", notes: "The noun רֹעֶה (shepherd) is the qal participle of this verb." },
  { id: "חסר", letters: "חסר", coreGloss: "lack, be without" },
  { id: "זמר", letters: "זמר", coreGloss: "sing, make music" },
  { id: "אהב", letters: "אהב", coreGloss: "love" },
  { id: "דבר", letters: "דבר", coreGloss: "speak; word, thing", notes: "Qal is rare; the piel דִּבֶּר is the ordinary verb for 'speak'." },
  { id: "גדל", letters: "גדל", coreGloss: "be great, grow" },
  { id: "למד", letters: "למד", coreGloss: "learn; (piel) teach" },
  { id: "הלך", letters: "הלך", coreGloss: "walk, go" },
  { id: "שׁוב", letters: "שׁוב", coreGloss: "return, turn back" },
  { id: "עמם", letters: "עמם", coreGloss: "people, kinsfolk", notes: "A geminate root: the doubled מ shows up in forms like עַמִּי (my people)." },
  { id: "מלך", letters: "מלך", coreGloss: "reign; king" },
  { id: "קדשׁ", letters: "קדשׁ", coreGloss: "be holy, set apart" },
  { id: "כתב", letters: "כתב", coreGloss: "write" },
  { id: "שׁפט", letters: "שׁפט", coreGloss: "judge, govern" },
  { id: "קרא", letters: "קרא", coreGloss: "call, proclaim, read aloud" },
  { id: "ברך", letters: "ברך", coreGloss: "bless, kneel", notes: "The noun בֶּרֶךְ (knee) shares this root — blessing and kneeling are the same idea." },
];

export const familyById = new Map(families.map((f) => [f.id, f]));
