import type { FenPiece } from "./frames";

/** "wp", "bk"...: a piece's color and type, as chess.js names them */
export type PieceKey = `${FenPiece["color"]}${FenPiece["type"]}`;

const TYPE_BY_NAME: Record<string, FenPiece["type"]> = {
  pawn: "p",
  knight: "n",
  bishop: "b",
  rook: "r",
  queen: "q",
  king: "k",
};

const RULE_RE =
  /piece\.(pawn|knight|bishop|rook|queen|king)\.(white|black)\s*\{[^}]*?background-image:\s*url\((['"]?)(data:[^'")]+)\3\)/g;

/**
 * The piece images of a chessground piece-set stylesheet (e.g.
 * chessground.merida.css, which embeds each piece as an SVG data URI),
 * keyed by piece.
 */
export function parsePieceSet(css: string): Partial<Record<PieceKey, string>> {
  const pieces: Partial<Record<PieceKey, string>> = {};
  for (const [, name, color, , uri] of css.matchAll(RULE_RE)) {
    pieces[`${color === "white" ? "w" : "b"}${TYPE_BY_NAME[name!]!}` as PieceKey] = uri;
  }
  return pieces;
}

export const PIECE_KEYS: PieceKey[] = (["w", "b"] as const).flatMap((color) =>
  (["p", "n", "b", "r", "q", "k"] as const).map((type) => `${color}${type}` as PieceKey)
);
