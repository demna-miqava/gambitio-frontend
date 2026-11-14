import type { Move } from "chess.js";
import type { ReactNode } from "react";

// Figurine algebraic notation uses one set of figurines for both sides, as
// printed books do. U+FE0E asks for the text glyph, never an emoji.
const FIGURINES: Record<string, string> = {
  K: "\u2654\uFE0E",
  Q: "\u2655\uFE0E",
  R: "\u2656\uFE0E",
  B: "\u2657\uFE0E",
  N: "\u2658\uFE0E",
};
const NAMES: Record<string, string> = {
  K: "King",
  Q: "Queen",
  R: "Rook",
  B: "Bishop",
  N: "Knight",
};

/**
 * A move in SAN, or with `figurines` in figurine notation: the piece letter
 * (also in a promotion, "e8=Q") becomes the piece's figurine as a text glyph
 * that follows the text colour, "\u2658f3" for "Nf3". Pawn moves and castling
 * are unchanged.
 */
export const renderSan = (san: string, figurines: boolean): ReactNode => {
  if (!figurines || !/[KQRBN]/.test(san)) return san;
  return san.split(/([KQRBN])/).map((part, i) =>
    FIGURINES[part] ? (
      <span key={i} className="figurine" role="img" aria-label={NAMES[part]}>
        {FIGURINES[part]}
      </span>
    ) : (
      part
    )
  );
};

export const renderMoveNotation = (move: Move, showIcons: boolean): ReactNode =>
  renderSan(move.san, showIcons);
