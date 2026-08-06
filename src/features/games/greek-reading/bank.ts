/**
 * The item bank for the Greek reading drills.
 *
 * HAND-AUTHORED, NOT DERIVED, and that is the right call rather than a gap.
 * Everywhere else in this app content comes from a corpus, because a corpus
 * cannot be argued with. Three of the five drills here cannot come from one:
 *
 *   Wrong-Form Detector needs a form that is WRONG. A critical text contains
 *   none — that is what makes it a critical text.
 *
 *   Who Did What to Whom needs word order scrambled on purpose, so that the
 *   ending is the only thing left to read the role from. Real sentences are in
 *   the order their author chose.
 *
 *   The feature tags — "nominative agent", "ground or reason", "μέν · half of a
 *   pair" — are finer than the parse data carries. MorphGNT will tell you a word
 *   is dative; it will not tell you it is a recipient rather than an instrument.
 *
 * So this is authored content of the same kind as a glossary, and carries the
 * same debt: a Koine specialist should read it. The sentences are mostly New
 * Testament phrases, lightly adapted for length, with the deliberate errors and
 * the reordering added here.
 *
 * WHAT THE `tag` IS FOR. Misses are logged against the grammatical feature, not
 * the sentence, so the end-of-session report can say "dative after ἐν — 2
 * missed, 1 slow" rather than listing verses. It tells a player what to drill
 * instead of what to re-read.
 */

/** One of the three aspectual shapes, answered as a glyph rather than a word. */
export type ShapeKey = "ongoing" | "bounded" | "standing";

export interface ChoiceItem {
  tokens: string[];
  /** Index of the "␣" token the options fill. */
  slot: number;
  opts: string[];
  a: number;
  tag: string;
  why: string;
}

export interface ShapeItem {
  tokens: string[];
  /** Index of the verb under test. */
  mark: number;
  a: ShapeKey;
  tag: string;
  why: string;
}

/** A prompt over one sentence — several may share a sentence. */
export interface TokenPrompt {
  ask: string;
  /** Token indices that count as correct; a phrase may be more than one. */
  a: number[];
  tag: string;
}

export interface TokenItem {
  tokens: string[];
  /** Several asks over the same sentence, each scored separately. */
  prompts?: TokenPrompt[];
  /** Single-answer form, used by the wrong-form drill. */
  a?: number[];
  tag?: string;
  why?: string;
}

export type Drill =
  | { id: string; name: string; kicker: string; blurb: string; window: number; ask: string; type: "choice"; items: ChoiceItem[] }
  | { id: string; name: string; kicker: string; blurb: string; window: number; ask: string; type: "shape"; items: ShapeItem[] }
  | { id: string; name: string; kicker: string; blurb: string; window: number; ask?: string; type: "token"; items: TokenItem[] };

/** The blank the choice drills fill. */
export const SLOT = "␣";

export const SHAPES: { key: ShapeKey; cap: string; path: string }[] = [
  {
    key: "ongoing",
    cap: "ongoing",
    // A wave: the event viewed from inside, still running.
    path: "M2 10q5-7 10 0t10 0 10 0 10 0",
  },
  {
    key: "bounded",
    cap: "one bounded event",
    // A dot: the whole event as a single point.
    path: "",
  },
  {
    key: "standing",
    cap: "done · still standing",
    // A dot with a line running on: it happened, and the result holds.
    path: "M20 10h24",
  },
];

export const DRILLS: Drill[] = [
  {
    id: "article",
    name: "Article Magnet",
    kicker: "case · number · gender",
    blurb:
      "The article is the densest parsing signal in Greek. Fill the slot and you have read the whole noun phrase.",
    window: 3500,
    ask: "Fill the slot",
    type: "choice",
    items: [
      { tokens: ["ἐν", "ἀρχῇ", "ἦν", SLOT, "λόγος"], slot: 3, opts: ["ὁ", "τόν", "τοῦ", "οἱ"], a: 0, tag: "nominative subject", why: "Subject of ἦν — nominative singular masculine." },
      { tokens: [SLOT, "λόγος", "ἦν", "πρὸς", "τὸν", "θεόν"], slot: 0, opts: ["τοῦ", "ὁ", "τῷ", "τήν"], a: 1, tag: "nominative subject", why: "πρός already took its accusative; this slot is the subject." },
      { tokens: ["ἡ", "μήτηρ", SLOT, "Ἰησοῦ"], slot: 2, opts: ["ὁ", "τοῦ", "τῷ", "τόν"], a: 1, tag: "genitive of relation", why: "A noun leaning on another noun — genitive." },
      { tokens: ["ἔδωκεν", SLOT, "ἀνθρώπῳ", "ἄρτον"], slot: 1, opts: ["ὁ", "τόν", "τῷ", "τοῦ"], a: 2, tag: "dative recipient", why: "-ῳ on the noun, and the role is recipient — dative." },
      { tokens: ["αἱ", "γυναῖκες", "ἦλθον", "εἰς", SLOT, "ἱερόν"], slot: 4, opts: ["τόν", "τό", "τοῦ", "τῷ"], a: 1, tag: "neuter accusative", why: "εἰς takes accusative; ἱερόν is neuter." },
      { tokens: ["ἡ", "φωνὴ", SLOT, "προφητῶν"], slot: 2, opts: ["τοῦ", "τῆς", "τῶν", "ταῖς"], a: 2, tag: "genitive plural", why: "-ων is plural. Genitive plural is one form for all genders." },
      { tokens: ["εἶδον", SLOT, "δόξαν", "αὐτοῦ"], slot: 1, opts: ["ἡ", "τήν", "τῆς", "τῇ"], a: 1, tag: "accusative object", why: "Direct object of εἶδον — accusative feminine." },
      { tokens: ["ἐν", SLOT, "ἡμέραις", "ἐκείναις"], slot: 1, opts: ["τάς", "ταῖς", "τῶν", "αἱ"], a: 1, tag: "dative after ἐν", why: "ἐν only ever takes the dative." },
      { tokens: ["ἀπέστειλεν", SLOT, "υἱὸν", "αὐτοῦ"], slot: 1, opts: ["ὁ", "τόν", "τῷ", "τοῦ"], a: 1, tag: "accusative object", why: "The one being sent — accusative." },
      { tokens: [SLOT, "ἔργα", "τοῦ", "πατρός", "ἐστιν", "καλά"], slot: 0, opts: ["τό", "τά", "τῶν", "τοῖς"], a: 1, tag: "neuter plural", why: "Neuter plural nominative — and it takes a singular verb." },
      { tokens: ["ἐγγὺς", SLOT, "θύραις"], slot: 1, opts: ["ταῖς", "τάς", "τῶν", "ἡ"], a: 0, tag: "dative after ἐγγύς", why: "ἐγγύς takes the dative here." },
      { tokens: ["ὁ", "δοῦλος", SLOT, "κυρίου", "μένει"], slot: 2, opts: ["ὁ", "τοῦ", "τῷ", "τόν"], a: 1, tag: "genitive of relation", why: "Whose slave — genitive." },
    ],
  },

  {
    id: "roles",
    name: "Who Did What to Whom",
    kicker: "case → role",
    blurb:
      "Word order is scrambled on purpose. Find the role by the ending, which is the only way Greek ever meant you to.",
    window: 5000,
    type: "token",
    items: [
      {
        tokens: ["τὸν", "ἄρτον", "ἔδωκεν", "ὁ", "πατὴρ", "τῷ", "τέκνῳ"],
        prompts: [
          { ask: "Tap the one who does it", a: [3, 4], tag: "nominative agent" },
          { ask: "Tap what it happens to", a: [0, 1], tag: "accusative patient" },
          { ask: "Tap who receives it", a: [5, 6], tag: "dative recipient" },
        ],
      },
      {
        tokens: ["τοὺς", "μαθητὰς", "ἐδίδασκεν", "ὁ", "Ἰησοῦς"],
        prompts: [
          { ask: "Tap the one who does it", a: [3, 4], tag: "nominative agent" },
          { ask: "Tap what it happens to", a: [0, 1], tag: "accusative patient" },
        ],
      },
      {
        tokens: ["ἔπεμψεν", "ὁ", "βασιλεὺς", "τοῖς", "δούλοις", "ἀγγέλους"],
        prompts: [
          { ask: "Tap the one who does it", a: [1, 2], tag: "nominative agent" },
          { ask: "Tap who receives it", a: [3, 4], tag: "dative recipient" },
          { ask: "Tap what it happens to", a: [5], tag: "accusative patient" },
        ],
      },
      {
        tokens: ["ταῦτα", "εἶπεν", "τοῖς", "ἀνθρώποις", "ὁ", "προφήτης"],
        prompts: [
          { ask: "Tap the one who does it", a: [4, 5], tag: "nominative agent" },
          { ask: "Tap who receives it", a: [2, 3], tag: "dative recipient" },
        ],
      },
      {
        tokens: ["τὴν", "ἐπιστολὴν", "ἔγραψεν", "ταῖς", "ἐκκλησίαις", "ὁ", "ἀπόστολος"],
        prompts: [
          { ask: "Tap the one who does it", a: [5, 6], tag: "nominative agent" },
          { ask: "Tap what it happens to", a: [0, 1], tag: "accusative patient" },
          { ask: "Tap who receives it", a: [3, 4], tag: "dative recipient" },
        ],
      },
      {
        tokens: ["τῷ", "ὄχλῳ", "παραβολὴν", "ἐλάλησεν", "ὁ", "διδάσκαλος"],
        prompts: [
          { ask: "Tap the one who does it", a: [4, 5], tag: "nominative agent" },
          { ask: "Tap who receives it", a: [0, 1], tag: "dative recipient" },
          { ask: "Tap what it happens to", a: [2], tag: "accusative patient" },
        ],
      },
      {
        tokens: ["τὸ", "βιβλίον", "ἔλαβεν", "ἡ", "γυνὴ", "ἀπὸ", "τοῦ", "παιδίου"],
        prompts: [
          { ask: "Tap the one who does it", a: [3, 4], tag: "nominative agent" },
          { ask: "Tap what it happens to", a: [0, 1], tag: "accusative patient" },
        ],
      },
      {
        tokens: ["ἡμᾶς", "ἠγάπησεν", "ὁ", "θεός"],
        prompts: [
          { ask: "Tap the one who does it", a: [2, 3], tag: "nominative agent" },
          { ask: "Tap what it happens to", a: [0], tag: "accusative patient" },
        ],
      },
    ],
  },

  {
    id: "aspect",
    name: "Aspect Shapes",
    kicker: "shape of the event",
    blurb:
      "Not what tense it is — what shape the event has. Aspect before tense is the unlock most courses teach backwards.",
    window: 4000,
    ask: "What shape is the marked verb?",
    type: "shape",
    items: [
      { tokens: ["ἐδίδασκεν", "αὐτοὺς", "ἐν", "τῷ", "ἱερῷ"], mark: 0, a: "ongoing", tag: "imperfect · ongoing", why: "Imperfect: the teaching is viewed from inside, still running." },
      { tokens: ["ἐδίδαξεν", "αὐτοὺς", "ἅπαξ"], mark: 0, a: "bounded", tag: "aorist · bounded", why: "Aorist: the whole event packed into a single point." },
      { tokens: ["γέγραπται", "ἐν", "τῷ", "νόμῳ"], mark: 0, a: "standing", tag: "perfect · standing result", why: "Perfect: it was written, and it stands written now." },
      { tokens: ["ἦλθεν", "εἰς", "τὴν", "πόλιν"], mark: 0, a: "bounded", tag: "aorist · bounded", why: "Aorist: arrival as one complete move." },
      { tokens: ["ἐλήλυθεν", "ἡ", "ὥρα"], mark: 0, a: "standing", tag: "perfect · standing result", why: "Perfect: the hour came and is here." },
      { tokens: ["ἐπορεύοντο", "πρὸς", "τὸ", "ὄρος"], mark: 0, a: "ongoing", tag: "imperfect · ongoing", why: "Imperfect: they were on the way, mid-journey." },
      { tokens: ["πεπιστεύκαμεν", "καὶ", "ἐγνώκαμεν"], mark: 0, a: "standing", tag: "perfect · standing result", why: "Perfect: came to believe, and believe still." },
      { tokens: ["ἔβαλλεν", "λίθους"], mark: 0, a: "ongoing", tag: "imperfect · ongoing", why: "Imperfect — one λ short of the aorist, and a whole different shape." },
      { tokens: ["ἔβαλεν", "λίθον"], mark: 0, a: "bounded", tag: "aorist · bounded", why: "Aorist: a single throw, closed." },
      { tokens: ["ὁ", "ὄχλος", "ἐκραύγαζεν"], mark: 2, a: "ongoing", tag: "imperfect · ongoing", why: "Imperfect: the shouting keeps going in the background." },
      { tokens: ["τετέλεσται"], mark: 0, a: "standing", tag: "perfect · standing result", why: "Perfect: finished, and the finishing holds." },
      { tokens: ["ἀπέστειλεν", "τοὺς", "ἀγγέλους"], mark: 0, a: "bounded", tag: "aorist · bounded", why: "Aorist: the sending as one bounded act." },
    ],
  },

  {
    id: "wrong",
    name: "Wrong-Form Detector",
    kicker: "agreement",
    blurb:
      "Exactly one form has been corrupted. You are not parsing — you are building the instinct that something feels wrong.",
    window: 5000,
    ask: "Tap the form that is wrong",
    type: "token",
    items: [
      { tokens: ["ὁ", "λόγος", "τοῦ", "θεοῦ", "μένει", "εἰς", "τῷ", "αἰῶνα"], a: [6], tag: "accusative after εἰς", why: "εἰς takes accusative — τόν, agreeing with αἰῶνα." },
      { tokens: ["ἐν", "τὰς", "ἡμέραις", "ἐκείναις"], a: [1], tag: "dative after ἐν", why: "ἐν takes dative: ταῖς." },
      { tokens: ["εἶδον", "τῆς", "δόξαν", "αὐτοῦ"], a: [1], tag: "article–noun agreement", why: "δόξαν is accusative; the article must be τήν." },
      { tokens: ["οἱ", "μαθηταὶ", "ἦλθον", "πρὸς", "τοῦ", "διδάσκαλον"], a: [4], tag: "accusative after πρός", why: "πρός + accusative: τόν." },
      { tokens: ["ἡ", "γυνὴ", "ἔλαβεν", "τὸν", "βιβλίον"], a: [3], tag: "neuter agreement", why: "βιβλίον is neuter — τό." },
      { tokens: ["αὕτη", "ἐστὶν", "ὁ", "ἐντολὴ", "ἡ", "ἐμή"], a: [2], tag: "gender agreement", why: "ἐντολή is feminine — ἡ." },
      { tokens: ["ἐδίδασκεν", "τοῖς", "ὄχλους"], a: [1], tag: "article–noun agreement", why: "ὄχλους is accusative plural — τούς." },
      { tokens: ["ἐν", "τὸν", "οἴκῳ", "τοῦ", "πατρός", "μου"], a: [1], tag: "dative after ἐν", why: "οἴκῳ is dative — τῷ." },
      { tokens: ["ὁ", "ἄνθρωποι", "ἦλθον", "εἰς", "τὴν", "πόλιν"], a: [0], tag: "number agreement", why: "ἄνθρωποι is plural — οἱ." },
      { tokens: ["ἀπέστειλεν", "τὸν", "ἀγγέλους", "αὐτοῦ"], a: [1], tag: "number agreement", why: "ἀγγέλους is plural — τούς." },
      { tokens: ["ἡ", "φωνὴ", "τῆς", "προφητῶν"], a: [2], tag: "genitive plural", why: "προφητῶν is plural — τῶν." },
      { tokens: ["ἔδωκεν", "τὸ", "τέκνῳ", "ἄρτον"], a: [1], tag: "article–noun agreement", why: "τέκνῳ is dative — τῷ." },
    ],
  },

  {
    id: "link",
    name: "Connective Prediction",
    kicker: "discourse",
    blurb: "Fluent readers are always predicting the next clause. Guess the particle before you see it.",
    window: 4500,
    ask: "Which particle links these?",
    type: "choice",
    items: [
      { tokens: ["οὐκ", "ἀπέθανεν", "τὸ", "κοράσιον", SLOT, "καθεύδει"], slot: 4, opts: ["ἀλλὰ", "γὰρ", "οὖν", "δὲ"], a: 0, tag: "contrast after negation", why: "Negation then correction — ἀλλά." },
      { tokens: ["οὕτως", SLOT, "ἠγάπησεν", "ὁ", "θεὸς", "τὸν", "κόσμον"], slot: 1, opts: ["δὲ", "γὰρ", "ἀλλὰ", "οὖν"], a: 1, tag: "ground or reason", why: "γάρ supplies the ground for what came before." },
      { tokens: ["Ἀβραὰμ", "ἐγέννησεν", "τὸν", "Ἰσαάκ", "Ἰσαὰκ", SLOT, "ἐγέννησεν", "τὸν", "Ἰακώβ"], slot: 5, opts: ["γὰρ", "οὖν", "δὲ", "ἀλλὰ"], a: 2, tag: "next step in sequence", why: "δέ moves the list to its next item." },
      { tokens: ["ὡς", SLOT, "ἤκουσεν", "ὅτι", "ἀσθενεῖ", "τότε", "ἔμεινεν"], slot: 1, opts: ["οὖν", "ἀλλὰ", "γὰρ", "μὲν"], a: 0, tag: "inference or resumption", why: "οὖν resumes the narrative off what was just said." },
      { tokens: ["ζητεῖτε", SLOT, "πρῶτον", "τὴν", "βασιλείαν"], slot: 1, opts: ["γὰρ", "δὲ", "ἀλλὰ", "οὖν"], a: 1, tag: "next step in sequence", why: "δέ turns to the positive instruction." },
      { tokens: ["οὐ", SLOT, "ἦλθον", "καλέσαι", "δικαίους"], slot: 1, opts: ["δὲ", "οὖν", "γὰρ", "ἀλλὰ"], a: 2, tag: "ground or reason", why: "γάρ explains the statement just made." },
      { tokens: ["οὐκ", "ἦν", "ἐκεῖνος", "τὸ", "φῶς", SLOT, "ἵνα", "μαρτυρήσῃ"], slot: 5, opts: ["ἀλλ᾽", "γὰρ", "οὖν", "δὲ"], a: 0, tag: "contrast after negation", why: "Not this — but that. ἀλλά." },
      { tokens: ["ἠρώτησαν", SLOT, "αὐτόν", "τί", "λέγεις"], slot: 1, opts: ["γὰρ", "οὖν", "ἀλλὰ", "μὲν"], a: 1, tag: "inference or resumption", why: "οὖν picks the story back up." },
      { tokens: ["εἰ", SLOT, "ἐγὼ", "ἔνιψα", "ὑμῶν", "τοὺς", "πόδας"], slot: 1, opts: ["δὲ", "γὰρ", "οὖν", "ἀλλὰ"], a: 2, tag: "inference or resumption", why: "οὖν draws the consequence from what preceded." },
      { tokens: ["ἐγὼ", SLOT, "βαπτίζω", "ὑμᾶς", "ἐν", "ὕδατι"], slot: 1, opts: ["μὲν", "γὰρ", "ἀλλὰ", "οὖν"], a: 0, tag: "μέν · half of a pair", why: "μέν flags this as one half — expect a δέ clause next." },
      { tokens: ["ἦν", SLOT, "ἄνθρωπος", "ἐκ", "τῶν", "Φαρισαίων"], slot: 1, opts: ["γὰρ", "δὲ", "ἀλλὰ", "μὲν"], a: 1, tag: "next step in sequence", why: "δέ opens a new scene without contrast." },
    ],
  },
];

export const drillById = (id: string): Drill | undefined => DRILLS.find((d) => d.id === id);

/** How many questions a round asks. A sentence with three prompts gives three. */
export const ROUND_LENGTH = 10;

/** Every question in a drill, flattened — a sentence with prompts yields one each. */
export function questionsOf(drill: Drill): { i: number; j: number }[] {
  const out: { i: number; j: number }[] = [];
  drill.items.forEach((item, i) => {
    const prompts = "prompts" in item ? item.prompts : undefined;
    if (prompts?.length) prompts.forEach((_, j) => out.push({ i, j }));
    else out.push({ i, j: 0 });
  });
  return out;
}
