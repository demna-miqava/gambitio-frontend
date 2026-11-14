import { Chess, type Square } from "chess.js";

/** One picture of the GIF: a position and the move that led to it. */
export interface GifFrame {
  fen: string;
  /** From and to squares of the move played into this position; null at the start */
  lastMove: [Square, Square] | null;
  /** Plies played to reach this position (0 = the start) */
  ply: number;
}

/**
 * The main line of a game as frames, one per ply, starting with the
 * starting position (a FEN header is honoured). Comments and variations are
 * ignored. Throws if the PGN can't be read.
 */
export function gameFrames(pgn: string): GifFrame[] {
  const chess = new Chess();
  chess.loadPgn(pgn);
  const moves = chess.history({ verbose: true });
  const start: GifFrame = { fen: moves[0]?.before ?? chess.fen(), lastMove: null, ply: 0 };
  return [
    start,
    ...moves.map((move, i) => ({
      fen: move.after,
      lastMove: [move.from, move.to] as [Square, Square],
      ply: i + 1,
    })),
  ];
}

/**
 * At most `max` frames, spread evenly over the game; the start and the final
 * position are always kept. Only very long games get thinned out (see
 * MAX_GIF_FRAMES), so generation stays quick and the file small.
 */
export function capFrames<T>(frames: T[], max: number): T[] {
  if (frames.length <= max || max < 2) return frames;
  const last = frames.length - 1;
  return Array.from({ length: max }, (_, i) => frames[Math.round((i * last) / (max - 1))]!);
}

export type FenPiece = { square: Square; color: "w" | "b"; type: "p" | "n" | "b" | "r" | "q" | "k" };

const FILES = "abcdefgh";

/** The pieces of a FEN's placement field, with their squares. */
export function piecesFromFen(fen: string): FenPiece[] {
  const placement = fen.split(" ")[0] ?? "";
  const pieces: FenPiece[] = [];
  placement.split("/").forEach((row, rowIndex) => {
    const rank = 8 - rowIndex;
    let file = 0;
    for (const char of row) {
      if (/\d/.test(char)) {
        file += Number(char);
        continue;
      }
      const lower = char.toLowerCase();
      if ("pnbrqk".includes(lower) && file < 8) {
        pieces.push({
          square: `${FILES[file]}${rank}` as Square,
          color: char === lower ? "b" : "w",
          type: lower as FenPiece["type"],
        });
      }
      file += 1;
    }
  });
  return pieces;
}
