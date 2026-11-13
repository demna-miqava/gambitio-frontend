import type { Piece, Square } from "chess.js";
import type { PlayerColor } from "@/features/game/types/game.types";

// Constants for chess board calculations
const FILE_OFFSET = 97; // ASCII code for 'a'
const BOARD_SIZE = 8;
const PROMOTION_RANKS = { white: "8", black: "1" } as const;

/**
 * Check if a move is a pawn promotion
 */
export const isPromotionMove = (toSquare: Square, piece?: Piece): boolean => {
  if (!piece || piece.type !== "p") return false;

  const toRank = toSquare[1];
  return (
    (piece.color === "w" && toRank === PROMOTION_RANKS.white) ||
    (piece.color === "b" && toRank === PROMOTION_RANKS.black)
  );
};

/**
 * Calculate position of promotion selector on the board. The picker is
 * anchored to the promotion square and extends toward the board's centre:
 * downward from a top-edge square, upward from a bottom-edge square.
 */
export const calculatePromotionPosition = (
  square: string,
  orientation: PlayerColor
): { left: string; top?: string; bottom?: string } => {
  const file = square.charCodeAt(0) - FILE_OFFSET;
  const rank = parseInt(square[1]) - 1;

  const displayFile = orientation === "white" ? file : BOARD_SIZE - 1 - file;
  const displayRank = orientation === "white" ? BOARD_SIZE - 1 - rank : rank;
  const left = `${(displayFile / BOARD_SIZE) * 100}%`;

  return displayRank === 0 ? { left, top: "0%" } : { left, bottom: "0%" };
};

/**
 * Whether the picker should list pieces bottom-to-top. Pieces are ordered
 * queen-first, and the queen must sit on the promotion square: at the top
 * edge (promoting toward the far side) that means normal order, at the
 * bottom edge (board flipped relative to the promoting side) reversed.
 */
export const shouldReversePromotionOrder = (
  playerColor: PlayerColor,
  boardOrientation: PlayerColor
): boolean => {
  return playerColor !== boardOrientation;
};
