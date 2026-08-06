import type { LanguageId } from "@/content/language";

/**
 * The games gallery.
 *
 * Games are DELIBERATELY OUTSIDE the learning loop. They are not gated on
 * lesson progress, they write no review events, and nothing a player does here
 * moves a card's due date. That is the whole point: somewhere to go that is not
 * another lesson.
 *
 * The cost of that separation is real and worth naming — a player can spend
 * twenty minutes here and leave their due queue untouched — so the gallery says
 * so on the card rather than letting anyone assume otherwise.
 *
 * WHERE THE CONTENT COMES FROM varies by game, and the registry records which,
 * because the two kinds age differently:
 *
 *   "corpus"   generated from the tracks — grows for free when a book is added,
 *              but can only ask what a real text contains.
 *   "authored" a hand-written bank, like the glossaries. Needed wherever a game
 *              must show something no critical text holds: a corrupted form, a
 *              scrambled word order, a minimal pair invented to isolate one
 *              feature.
 *
 * Games are grouped by LANGUAGE rather than by track, because a Greek drill on
 * the article is worth playing whether you came from Mark or from Attic prose.
 */
export interface GameMeta {
  id: string;
  /** Shown on the gallery card. */
  title: string;
  /** The Greek or Hebrew word the game is known by, if it has one. */
  scriptTitle?: string;
  /** One line, in the same register as a track subtitle. */
  blurb: string;
  language: LanguageId;
  /** Where its material comes from — see the header. */
  source: "corpus" | "authored";
  /** How much sits behind the card, and what to call it. Day One has five
   *  verses where the Greek game has five drills, and "5 drills" would be a
   *  lie about the Hebrew one.
   *
   *  OPTIONAL, because not every game is a fixed sequence. Cold Read draws from
   *  the whole corpus and never runs out, so any number here would be invented.
   *  A tile with no count says less and lies less. */
  count?: number;
  countUnit?: "drill" | "verse";
  icon: string;
  path: string;
}

export const GAMES: GameMeta[] = [
  {
    id: "hebrew-day-one",
    title: "Day One",
    scriptTitle: "יוֹם אֶחָד",
    blurb:
      "Read the opening of the Bible in Hebrew — Genesis 1:1–5, one verse at a time. No tense is ever named, and nothing is taken for a wrong guess.",
    language: "hebrew",
    // Text from the Genesis 1–11 track since Phase C; the teaching is still
    // entirely hand-written, as it is in every one of these.
    source: "corpus",
    count: 5,
    countUnit: "verse",
    icon: "🌅",
    path: "/games/hebrew-day-one",
  },
  {
    id: "greek-in-beginning",
    title: "In the Beginning",
    scriptTitle: "ἐν ἀρχῇ",
    blurb:
      "Read the opening of John in Greek — 1:1–5, one verse at a time. No case is ever named, and nothing is taken for a wrong guess.",
    language: "greek",
    // The first game built ON the corpus rather than beside it: the Greek is
    // SBLGNT's via the John track, and only the teaching is written here.
    source: "corpus",
    count: 5,
    countUnit: "verse",
    icon: "🕯️",
    path: "/games/greek-in-beginning",
  },
  {
    id: "cold-read",
    title: "Cold Read",
    blurb:
      "A verse from a book you have never opened, chosen because your vocabulary nearly covers it. Tap what you cannot read, and find out how close you were.",
    // Language is decided at play time from the active course, but the gallery
    // groups by language, so it is listed where the learner will look for it.
    language: "hebrew",
    source: "corpus",
    icon: "🧊",
    path: "/games/cold-read",
  },
  {
    id: "greek-reading-drills",
    title: "Reading Drills",
    scriptTitle: "ἀναγίγνωσκε",
    blurb:
      "Five drills for parsing Greek at speed. Nothing asks you for English — you answer in Greek, by role, or by shape.",
    language: "greek",
    source: "authored",
    count: 5,
    countUnit: "drill",
    icon: "⏱️",
    path: "/games/greek-reading-drills",
  },
];

export const gameById = (id: string): GameMeta | undefined => GAMES.find((g) => g.id === id);

/** Games grouped for the gallery, in the order languages appear in the app. */
export function gamesByLanguage(): { language: LanguageId; label: string; games: GameMeta[] }[] {
  const LABELS: Record<string, string> = { hebrew: "Hebrew", greek: "Greek", latin: "Latin" };
  const order: LanguageId[] = ["hebrew", "greek", "latin"];
  return order
    .map((language) => ({
      language,
      label: LABELS[language] ?? language,
      games: GAMES.filter((g) => g.language === language),
    }))
    .filter((g) => g.games.length > 0);
}
