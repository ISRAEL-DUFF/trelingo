import { isHapax, type Frequency } from "@/content/schema";
import { getCourse } from "@/content/course";

/**
 * How often a word occurs, and whether it is a hapax legomenon.
 *
 * WHY THE SECOND NUMBER IS NOT OPTIONAL DECORATION. A learner meeting a word
 * once wants to know whether it is rare. The in-book count cannot tell them:
 * Ruth has 133 lexemes occurring once in Ruth, and only EIGHT of those occur
 * once in the Hebrew Bible. אֹזֶן "ear" appears once in Ruth and 188 times in
 * the Bible — showing a bare "1×" would teach the opposite of the truth.
 *
 * So the two counts are always shown together where both exist, and the hapax
 * badge appears only when the corpus counted was complete (`isHapax`). Greek's
 * figures come from sampled corpora, so a Greek word occurring once is reported
 * as once in that sample and never awarded the badge — a word can be a hapax in
 * a 34,000-token sample and perfectly ordinary in Greek.
 */
export function WordFrequency({
  frequency,
  size = "small",
}: {
  frequency?: Frequency;
  size?: "small" | "inline";
}) {
  if (!frequency) return null;
  const { inTrack, inCorpus, corpus, corpusBooks } = frequency;
  const hapax = isHapax(frequency);
  const trackName = getCourse().name;

  return (
    <div
      className={size === "small" ? "small muted" : "translit"}
      style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, lineHeight: 1.5 }}
    >
      {hapax ? (
        // The whole point of the feature, so it gets the strongest treatment.
        // Term and explanation are split rather than run into one badge: the
        // single long badge wrapped to three lines, and "hapax legomenon" on
        // its own teaches nobody, so the label names it and the line beside it
        // says what it means.
        <>
          <span
            className="tag"
            style={{
              background: "var(--attention-wash)",
              color: "var(--attention)",
              borderColor: "var(--attention)",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            hapax legomenon
          </span>
          <span>its only occurrence in {corpus}</span>
        </>
      ) : (
        <>
          {/*
            The in-track count is absent for a word taught from a corpus wider
            than the verses on show — πᾶς is in the Attic glossary and in
            neither Attic passage. Then the corpus figure stands alone rather
            than being padded with an invented "1× here".
          */}
          {inTrack !== undefined && (
            <span>
              {inTrack}× in {trackName}
            </span>
          )}
          {inCorpus !== undefined && (
            <>
              {inTrack !== undefined && <span aria-hidden>·</span>}
              <span>
                {inCorpus.toLocaleString()}× in {corpus}
              </span>
            </>
          )}
          {/*
            Spread across books is a different fact from raw frequency: a word
            occurring 40 times in one book is specialist vocabulary, the same
            count across 25 books is ordinary language.
          */}
          {corpusBooks !== undefined && corpusBooks > 1 && (
            <>
              <span aria-hidden>·</span>
              <span>{corpusBooks} books</span>
            </>
          )}
        </>
      )}
    </div>
  );
}

/**
 * The one-line version, for a card that has no room for the full line.
 *
 * Returns null rather than an empty string when there is nothing to say, so a
 * caller can decide whether to render a separator.
 */
export function frequencySummary(frequency?: Frequency): string | null {
  if (!frequency) return null;
  if (isHapax(frequency)) return `hapax — only in ${frequency.corpus}`;
  const here = frequency.inTrack === undefined ? null : `${frequency.inTrack}× here`;
  const wider =
    frequency.inCorpus === undefined
      ? null
      : `${frequency.inCorpus.toLocaleString()}× in ${frequency.corpus}`;
  return [here, wider].filter(Boolean).join(" · ") || null;
}
