import { useMemo } from "react";
import { getCourse, scriptOf, type Course } from "@/content/course";

interface Props {
  word: string;
  /** LETTER indices (not code-point indices) carrying the highlighted morpheme. */
  highlight?: readonly number[];
  size?: number;
  showHighlight?: boolean;
  /** 0 = all diacritics, script.stages = none. Ignored by scripts with no fade. */
  fadeStage?: number;
  className?: string;
  onClick?: () => void;
  /** Accessible label; defaults to the word itself. */
  label?: string;
  /** Defaults to the active course. */
  course?: Course;
}

/**
 * Renders a word with its taught morpheme highlighted — the root in Hebrew, the
 * ending in Greek.
 *
 * The whole product rests on this being correct, so two things are deliberate:
 *
 *  1. Iteration is over LETTER CLUSTERS, not code points. Combining marks must
 *     stay attached to their base letter or every index silently misaligns.
 *  2. Direction and language come from the course's script module, never from a
 *     hardcoded value here. `unicode-bidi: isolate` is used, never
 *     `bidi-override` — overriding forces visual order and corrupts any
 *     mixed-direction content.
 */
export function ScriptWord({
  word,
  highlight,
  size = 40,
  showHighlight = true,
  fadeStage = 0,
  className = "",
  onClick,
  label,
  course = getCourse(),
}: Props) {
  const script = scriptOf(course);
  const letters = useMemo(
    () => script.toLetterClusters(script.fade(word, fadeStage)),
    [script, word, fadeStage],
  );

  const content = (
    <span
      className={`script ${className}`}
      style={{ fontSize: size }}
      dir={script.direction}
      lang={script.lang}
      aria-label={label ?? word}
    >
      {letters.map((letter, i) => (
        <span
          key={i}
          className={`script__letter${
            showHighlight && highlight?.includes(i) ? " script__letter--highlight" : ""
          }`}
        >
          {letter.text}
        </span>
      ))}
    </span>
  );

  if (!onClick) return content;
  return (
    <button type="button" onClick={onClick} className="passage__token passage__token--tappable">
      {content}
    </button>
  );
}
