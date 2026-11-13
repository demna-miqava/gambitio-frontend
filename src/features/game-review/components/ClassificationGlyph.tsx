import { cn } from "@/lib/utils";
import type { MoveClassification } from "../types";
import { CLASSIFICATION_META, isFlagged } from "../classificationMeta";

interface ClassificationGlyphProps {
  classification: MoveClassification;
  /** On a highlighted (selected) move: inherit its text colour for contrast */
  inverted?: boolean;
  className?: string;
}

/**
 * "?!", "?" or "??" after a move. Decorative: the move's accessible label
 * carries the classification in words.
 */
export const ClassificationGlyph = ({ classification, inverted = false, className }: ClassificationGlyphProps) => {
  if (!isFlagged(classification)) return null;
  const meta = CLASSIFICATION_META[classification];
  return (
    <span
      aria-hidden="true"
      title={meta.label}
      className={cn("ml-0.5 font-bold", inverted ? "text-current" : meta.textClass, className)}
    >
      {meta.glyph}
    </span>
  );
};
