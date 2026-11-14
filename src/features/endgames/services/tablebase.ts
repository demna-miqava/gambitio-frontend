/**
 * Lichess's public endgame tablebase (Syzygy up to seven pieces, with
 * distance to mate from Gaviota up to five). Only the position is sent.
 */
const TABLEBASE_URL = "https://tablebase.lichess.ovh/standard";

export const TABLEBASE_MAX_PIECES = 7;

/** For the side to move (for a move: for the side to move after it) */
export type TablebaseCategory =
  | "win"
  | "syzygy-win"
  | "maybe-win"
  | "cursed-win"
  | "draw"
  | "blessed-loss"
  | "maybe-loss"
  | "syzygy-loss"
  | "loss"
  | "unknown";

export interface TablebaseMove {
  uci: string;
  san: string;
  category: TablebaseCategory;
  /** Plies to mate, signed for the side to move after the move; null when unknown */
  dtm: number | null;
}

export interface TablebaseResult {
  category: TablebaseCategory;
  /** Plies to mate, signed for the side to move; null when unknown */
  dtm: number | null;
  /** Best first, as Lichess orders them */
  moves: TablebaseMove[];
}

export type Outcome = "win" | "draw" | "loss" | "unknown";

/** Pieces on the board, kings included. */
export const countPieces = (fen: string): number =>
  (fen.split(" ")[0] ?? "").replace(/[^a-zA-Z]/g, "").length;

export const inTablebase = (fen: string): boolean => {
  // Castling rights aren't in the tablebases (and never in these endgames)
  const castling = fen.split(" ")[2];
  return countPieces(fen) <= TABLEBASE_MAX_PIECES && (castling === undefined || castling === "-");
};

/**
 * The practical result for the side to move. A "cursed" win only wins past
 * the 50-move rule, which these exercises play by, so it counts as a draw
 * (and a blessed loss likewise).
 */
export const outcomeOf = (category: TablebaseCategory): Outcome => {
  switch (category) {
    case "win":
    case "syzygy-win":
    case "maybe-win":
      return "win";
    case "loss":
    case "syzygy-loss":
    case "maybe-loss":
      return "loss";
    case "draw":
    case "cursed-win":
    case "blessed-loss":
      return "draw";
    default:
      return "unknown";
  }
};

export const flipOutcome = (outcome: Outcome): Outcome =>
  outcome === "win" ? "loss" : outcome === "loss" ? "win" : outcome;

/** Plies to mate as the winner's own moves (mate in N). */
export const mateInMoves = (dtm: number | null): number | null =>
  dtm === null || dtm === 0 ? null : Math.ceil(Math.abs(dtm) / 2);

/** The moves that keep the best result for the side to move, best first. */
export const movesKeepingResult = (result: TablebaseResult): TablebaseMove[] => {
  const best = outcomeOf(result.category);
  if (best === "unknown") return [];
  return result.moves.filter((move) => flipOutcome(outcomeOf(move.category)) === best);
};

interface RawMove {
  uci: string;
  san: string;
  category?: TablebaseCategory;
  dtm?: number | null;
}

interface RawResult {
  category?: TablebaseCategory;
  dtm?: number | null;
  moves?: RawMove[];
}

export const fetchTablebase = async (fen: string, signal?: AbortSignal): Promise<TablebaseResult> => {
  const response = await fetch(`${TABLEBASE_URL}?fen=${encodeURIComponent(fen)}`, { signal });
  if (!response.ok) throw new Error(`Tablebase lookup failed (${response.status})`);
  const raw = (await response.json()) as RawResult;
  return {
    category: raw.category ?? "unknown",
    dtm: raw.dtm ?? null,
    moves: (raw.moves ?? []).map((move) => ({
      uci: move.uci,
      san: move.san,
      category: move.category ?? "unknown",
      dtm: move.dtm ?? null,
    })),
  };
};
