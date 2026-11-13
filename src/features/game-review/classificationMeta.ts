import type { MoveClassification } from "./types";

interface ClassificationMeta {
  label: string;
  /** Standard annotation glyph shown next to the move, if any */
  glyph?: string;
  /** Text colour, legible on cards in both themes */
  textClass: string;
  /** Fill for markers on the evaluation graph */
  dotClass: string;
}

/**
 * Inaccuracy / mistake / blunder use Lichess's blue / orange / red, which stay
 * distinguishable with colour-vision deficiencies, and always come with a
 * glyph (?! ? ??) and a text label so colour is never the only cue.
 */
export const CLASSIFICATION_META: Record<MoveClassification, ClassificationMeta> = {
  best: { label: "Best", textClass: "text-success", dotClass: "bg-success" },
  good: { label: "Good", textClass: "text-muted-foreground", dotClass: "bg-muted-foreground" },
  inaccuracy: {
    label: "Inaccuracy",
    glyph: "?!",
    textClass: "text-sky-700 dark:text-sky-400",
    dotClass: "bg-sky-500",
  },
  mistake: {
    label: "Mistake",
    glyph: "?",
    textClass: "text-amber-700 dark:text-amber-400",
    dotClass: "bg-amber-500",
  },
  blunder: {
    label: "Blunder",
    glyph: "??",
    textClass: "text-red-700 dark:text-red-400",
    dotClass: "bg-red-500",
  },
};

/** Classes worth flagging in move lists and on the graph */
export const isFlagged = (c: MoveClassification) => c === "inaccuracy" || c === "mistake" || c === "blunder";
