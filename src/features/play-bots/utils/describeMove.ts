import type { Move, PieceSymbol } from "chess.js";

const PIECE_NAMES: Record<PieceSymbol, string> = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king",
};

/**
 * A move in words for screen readers ("knight takes pawn on e5, check"),
 * since SAN like "Nxe5+" is read out letter by letter.
 */
export const describeMove = (move: Move): string => {
  let text: string;
  if (move.isKingsideCastle()) text = "castles kingside";
  else if (move.isQueensideCastle()) text = "castles queenside";
  else {
    const piece = PIECE_NAMES[move.piece];
    text = move.captured
      ? `${piece} takes ${PIECE_NAMES[move.captured]} on ${move.to}`
      : `${piece} to ${move.to}`;
    if (move.isEnPassant()) text += " en passant";
    if (move.promotion) text += `, promotes to ${PIECE_NAMES[move.promotion]}`;
  }
  if (move.san.endsWith("#")) text += ", checkmate";
  else if (move.san.endsWith("+")) text += ", check";
  return text;
};
