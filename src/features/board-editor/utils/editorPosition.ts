import { Chess } from "chess.js";

/**
 * A position being set up in the board editor: where the pieces stand (the
 * first field of a FEN) and the rest of the FEN, kept separately so editing
 * the pieces never loses the side to move or the castling rights.
 */
export interface EditorPosition {
  /** FEN piece placement, e.g. "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR" */
  placement: string;
  turn: "w" | "b";
  /** Any of "K", "Q", "k", "q" (normalized to what the placement supports) */
  castling: CastlingRight[];
  /** A square like "e3", or null */
  enPassant: string | null;
  halfmove: number;
  fullmove: number;
}

export type CastlingRight = "K" | "Q" | "k" | "q";
export const CASTLING_RIGHTS: CastlingRight[] = ["K", "Q", "k", "q"];

export const START_PLACEMENT = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
export const EMPTY_PLACEMENT = "8/8/8/8/8/8/8/8";

export const STARTING_POSITION: EditorPosition = {
  placement: START_PLACEMENT,
  turn: "w",
  castling: ["K", "Q", "k", "q"],
  enPassant: null,
  halfmove: 0,
  fullmove: 1,
};

const FILES = "abcdefgh";
const PIECES = "pnbrqkPNBRQK";

/** The placement as an 8x8 grid, rank 8 first; null for an empty square */
export const placementGrid = (placement: string): (string | null)[][] =>
  placement.split("/").map((rank) => {
    const row: (string | null)[] = [];
    for (const ch of rank) {
      if (/\d/.test(ch)) for (let i = 0; i < Number(ch); i++) row.push(null);
      else row.push(ch);
    }
    return row;
  });

const pieceAt = (grid: (string | null)[][], square: string) => {
  const file = FILES.indexOf(square[0]!);
  const rank = Number(square[1]);
  return grid[8 - rank]?.[file] ?? null;
};

/** A well-formed placement: 8 ranks of 8 squares, known pieces only */
export const isValidPlacement = (placement: string) => {
  const ranks = placement.split("/");
  if (ranks.length !== 8) return false;
  return ranks.every((rank) => {
    let squares = 0;
    let lastWasDigit = false;
    for (const ch of rank) {
      if (/[1-8]/.test(ch)) {
        // "44" isn't a FEN way to write 8
        if (lastWasDigit) return false;
        squares += Number(ch);
        lastWasDigit = true;
      } else if (PIECES.includes(ch)) {
        squares += 1;
        lastWasDigit = false;
      } else return false;
    }
    return squares === 8;
  });
};

/** Castling rights the pieces allow: king and rook on their starting squares */
export const supportedCastling = (placement: string): CastlingRight[] => {
  const grid = placementGrid(placement);
  const at = (sq: string, piece: string) => pieceAt(grid, sq) === piece;
  return CASTLING_RIGHTS.filter((right) => {
    switch (right) {
      case "K":
        return at("e1", "K") && at("h1", "R");
      case "Q":
        return at("e1", "K") && at("a1", "R");
      case "k":
        return at("e8", "k") && at("h8", "r");
      case "q":
        return at("e8", "k") && at("a8", "r");
    }
  });
};

/**
 * Squares a pawn could be taken en passant on, with this side to move: just
 * behind an enemy pawn that could have advanced two squares (both squares
 * it passed are empty), next to one of the side to move's pawns.
 */
export const enPassantOptions = (placement: string, turn: "w" | "b"): string[] => {
  const grid = placementGrid(placement);
  // White to move: a black pawn on rank 5 that came from rank 7, square on rank 6
  const [pawnRank, targetRank, fromRank] = turn === "w" ? [5, 6, 7] : [4, 3, 2];
  const enemyPawn = turn === "w" ? "p" : "P";
  const ownPawn = turn === "w" ? "P" : "p";
  const options: string[] = [];
  for (let f = 0; f < 8; f++) {
    const file = FILES[f]!;
    if (pieceAt(grid, `${file}${pawnRank}`) !== enemyPawn) continue;
    if (pieceAt(grid, `${file}${targetRank}`) !== null) continue;
    if (pieceAt(grid, `${file}${fromRank}`) !== null) continue;
    const beside = [FILES[f - 1], FILES[f + 1]].filter(Boolean);
    if (beside.some((other) => pieceAt(grid, `${other}${pawnRank}`) === ownPawn)) {
      options.push(`${file}${targetRank}`);
    }
  }
  return options;
};

/** Drops castling rights and an en passant square the placement can't support */
export const normalizePosition = (position: EditorPosition): EditorPosition => {
  const castlingAllowed = supportedCastling(position.placement);
  const enPassant =
    position.enPassant && enPassantOptions(position.placement, position.turn).includes(position.enPassant)
      ? position.enPassant
      : null;
  return {
    ...position,
    castling: CASTLING_RIGHTS.filter((r) => position.castling.includes(r) && castlingAllowed.includes(r)),
    enPassant,
  };
};

export const toFen = (p: EditorPosition) =>
  [p.placement, p.turn, p.castling.join("") || "-", p.enPassant ?? "-", p.halfmove, p.fullmove].join(" ");

/**
 * Reads a FEN as typed or pasted. Only the placement is required; missing
 * fields take the usual defaults (white to move, no castling, no en
 * passant). Returns null when it isn't a FEN at all. Rights the placement
 * can't support are dropped (normalizePosition).
 */
export const parseFen = (text: string): EditorPosition | null => {
  const fields = text.trim().split(/\s+/);
  if (fields.length === 0 || fields.length > 6) return null;
  const [placement, turn = "w", castling = "-", enPassant = "-", halfmove = "0", fullmove = "1"] = fields;
  if (!placement || !isValidPlacement(placement)) return null;
  if (turn !== "w" && turn !== "b") return null;
  if (castling !== "-" && !/^(?!.*(.).*\1)[KQkq]{1,4}$/.test(castling)) return null;
  if (enPassant !== "-" && !/^[a-h][36]$/.test(enPassant)) return null;
  if (!/^\d{1,3}$/.test(halfmove) || !/^\d{1,4}$/.test(fullmove) || Number(fullmove) < 1) return null;
  return normalizePosition({
    placement,
    turn,
    castling: CASTLING_RIGHTS.filter((r) => castling.includes(r)),
    enPassant: enPassant === "-" ? null : enPassant,
    halfmove: Number(halfmove),
    fullmove: Number(fullmove),
  });
};

/**
 * Why the position can't be played or analysed, in plain words, or null
 * when it can. The rules: one king each, no pawn on the first or last rank,
 * and the side that isn't to move may not be in check.
 */
export const positionProblem = (p: EditorPosition): string | null => {
  const grid = placementGrid(p.placement);
  const all = grid.flat();
  const count = (piece: string) => all.filter((x) => x === piece).length;
  const kings = { white: count("K"), black: count("k") };
  for (const [side, n] of Object.entries(kings)) {
    if (n === 0) return `There's no ${side} king. Each side needs exactly one.`;
    if (n > 1) return `There are ${n} ${side} kings. Each side needs exactly one.`;
  }
  if ([...grid[0]!, ...grid[7]!].some((x) => x === "P" || x === "p")) {
    return "Pawns can't stand on the first or last rank.";
  }
  // Load it with the other side to move: if that side could take the king,
  // the side not to move is in check
  try {
    const other = new Chess(toFen({ ...p, turn: p.turn === "w" ? "b" : "w", enPassant: null }), {
      skipValidation: true,
    });
    if (other.inCheck()) {
      const notToMove = p.turn === "w" ? "Black" : "White";
      const toMove = p.turn === "w" ? "White" : "Black";
      return `${notToMove} is in check with ${toMove} to move. Change the side to move or the pieces.`;
    }
    // chess.js's own checks, as the analysis board and bots will load it
    new Chess(toFen(p));
  } catch {
    return "This position can't be played.";
  }
  return null;
};

/** A position from a URL's ?fen=, if it is a FEN of a legal position */
export const playablePositionFromFen = (fen: string | null | undefined): EditorPosition | null => {
  if (!fen) return null;
  const position = parseFen(fen);
  return position && !positionProblem(position) ? position : null;
};

/** The placement with one square changed (null empties it) */
export const withPieceAt = (placement: string, square: string, piece: string | null): string => {
  const grid = placementGrid(placement);
  grid[8 - Number(square[1])]![FILES.indexOf(square[0]!)] = piece;
  return grid
    .map((row) => {
      let out = "";
      let empty = 0;
      for (const x of row) {
        if (x === null) empty++;
        else {
          if (empty) out += empty;
          empty = 0;
          out += x;
        }
      }
      return out + (empty ? empty : "");
    })
    .join("/");
};

/** The usual starting position, move counters included */
export const isStandardStart = (p: EditorPosition) => toFen(p) === toFen(STARTING_POSITION);
