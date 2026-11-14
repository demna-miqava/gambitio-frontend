import { Chess } from "chess.js";
import { parsePgn } from "@/features/archive-game/utils/pgn";

/** Moves a new room may start with (the server's MAX_START_MOVES). */
export const MAX_START_MOVES = 300;

export type StartInput =
  | { ok: true; fen?: string; moves?: string[] }
  | { ok: false; message: string };

/**
 * What a new room starts from, given what the user pasted: nothing (the
 * standard position), a FEN, or a PGN / move list (its main line; a FEN
 * header is kept).
 */
export function parseStartInput(text: string): StartInput {
  const input = text.trim();
  if (!input) return { ok: true };

  // A FEN has 6 space-separated fields and slashes in the first
  if (/^[1-8pnbrqkPNBRQK/]+ [wb] /.test(input)) {
    try {
      return { ok: true, fen: new Chess(input).fen() };
    } catch {
      return { ok: false, message: "That FEN isn't a legal position." };
    }
  }

  let parsed;
  try {
    parsed = parsePgn(input);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error && error.message ? `${error.message}.` : "That isn't a valid PGN.",
    };
  }
  const moves: string[] = [];
  for (let node = parsed.root.children[0]; node; node = node.children[0]) moves.push(node.move!.san);
  if (moves.length > MAX_START_MOVES) {
    return { ok: false, message: `A room can start with at most ${MAX_START_MOVES} moves.` };
  }
  if (moves.length === 0 && !parsed.headers.FEN) {
    return { ok: false, message: "No moves found. Paste a PGN, a list of moves or a FEN." };
  }
  return {
    ok: true,
    ...(parsed.headers.FEN && { fen: parsed.root.fen }),
    ...(moves.length > 0 && { moves }),
  };
}
