import { useMemo } from "react";
import { fadeNiqqud, toLetterClusters } from "@/lib/hebrew";

interface Props {
  word: string;
  /** LETTER indices (not code-point indices) carrying the root consonants. */
  rootIndices?: readonly number[];
  size?: number;
  highlight?: boolean;
  /** 0 = full points, 6 = bare consonants. See lib/hebrew fade stages. */
  fadeStage?: number;
  className?: string;
  onClick?: () => void;
  /** Accessible label; defaults to the word itself. */
  label?: string;
}

/**
 * Renders a Hebrew word with its root consonants highlighted.
 *
 * The whole product rests on this being correct, so two things are deliberate:
 *
 *  1. Iteration is over LETTER CLUSTERS, not code points. Niqqud are combining
 *     marks; splitting them off their consonant misaligns every index and breaks
 *     mark rendering. `toLetterClusters` keeps each letter and its points intact.
 *  2. Direction is set with `dir="rtl"` and `unicode-bidi: isolate`, never
 *     `bidi-override`. The bidi algorithm already orders Hebrew correctly;
 *     overriding it forces visual order and corrupts any mixed-direction text.
 */
export function HebrewWord({
  word,
  rootIndices,
  size = 40,
  highlight = true,
  fadeStage = 0,
  className = "",
  onClick,
  label,
}: Props) {
  const letters = useMemo(
    () => toLetterClusters(fadeNiqqud(word, fadeStage)),
    [word, fadeStage],
  );

  const content = (
    <span
      className={`hebrew ${className}`}
      style={{ fontSize: size }}
      dir="rtl"
      lang="he"
      aria-label={label ?? word}
    >
      {letters.map((letter, i) => (
        <span
          key={i}
          className={`hebrew__letter${
            highlight && rootIndices?.includes(i) ? " hebrew__letter--root" : ""
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
