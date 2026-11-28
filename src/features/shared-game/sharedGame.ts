import { Chess, DEFAULT_POSITION, type Move } from "chess.js";
import type { StoredGame } from "@/types";

/** What a share link's token looks like (the server makes them: 14 letters and digits). */
const SHARE_TOKEN_PATTERN = /^[0-9A-Za-z]{14}$/;

/** The token from the route, or null for anything that can't be one (nothing is fetched). */
export const parseShareToken = (value: string | undefined): string | null =>
  value !== undefined && SHARE_TOKEN_PATTERN.test(value) ? value : null;

/** The address to send someone: the page that shows the game without signing in. */
export const sharedGameUrl = (token: string, origin: string = window.location.origin) =>
  `${origin}/share/${token}`;

export interface SharedGameLine {
  /** The game's moves, in order */
  moves: Move[];
  /** The position before the first move and after each move: moves.length + 1 of them */
  fens: string[];
}

/**
 * The game's moves and every position along them, from its PGN. A game
 * without moves (or with a PGN that doesn't load) is just the start position.
 */
export function replayGame(pgn: string | null | undefined): SharedGameLine {
  if (!pgn) return { moves: [], fens: [DEFAULT_POSITION] };
  try {
    const chess = new Chess();
    chess.loadPgn(pgn);
    const moves = chess.history({ verbose: true });
    return { moves, fens: [moves[0]?.before ?? chess.fen(), ...moves.map((move) => move.after)] };
  } catch {
    return { moves: [], fens: [DEFAULT_POSITION] };
  }
}

const HOW: Record<string, string> = {
  checkmate: "by checkmate",
  resignation: "by resignation",
  abandonment: "when the opponent left the game",
  timeout: "on time",
  timeout_vs_insufficient_material: "on time, with no way to checkmate",
  stalemate: "by stalemate",
  threefold_repetition: "by repetition",
  insufficient_material: "by insufficient material",
  fifty_move_rule: "by the fifty-move rule",
  draw_agreement: "by agreement",
};

/** "alice won by checkmate", "Draw by repetition": how the game ended, in words. */
export function outcomeText(
  game: Pick<StoredGame, "result" | "endReason"> & {
    whitePlayer: { username: string };
    blackPlayer: { username: string };
  }
): string {
  const how = game.endReason ? HOW[game.endReason] : undefined;
  const tail = how ? ` ${how}` : "";
  switch (game.result) {
    case "white_win":
      return `${game.whitePlayer.username} won${tail}`;
    case "black_win":
      return `${game.blackPlayer.username} won${tail}`;
    case "draw":
      return `Draw${tail}`;
    default:
      return "Game over";
  }
}

/** "1-0", "0-1", "½-½"; "" when there's no result to show. */
export const scoreText = (result: StoredGame["result"]): string =>
  result === "white_win" ? "1-0" : result === "black_win" ? "0-1" : result === "draw" ? "½-½" : "";

/** The game as a PGN with its headers, for "Copy PGN". */
export function sharedGamePgn(game: StoredGame, moves: readonly Move[]): string {
  const result =
    game.result === "white_win" ? "1-0" : game.result === "black_win" ? "0-1" : game.result === "draw" ? "1/2-1/2" : "*";
  const headers: [string, string][] = [
    ["Event", "Gambitio game"],
    ["Site", "Gambitio"],
    ["Date", new Date(game.createdAt).toISOString().slice(0, 10).replace(/-/g, ".")],
    ["White", game.whitePlayer.username],
    ["Black", game.blackPlayer.username],
    ["Result", result],
    ["WhiteElo", String(game.whitePlayer.rating)],
    ["BlackElo", String(game.blackPlayer.rating)],
    ...(game.time !== null ? ([["TimeControl", `${game.time}+${game.increment}`]] as [string, string][]) : []),
  ];
  const text = moves
    .map((move, index) => (index % 2 === 0 ? `${index / 2 + 1}. ${move.san}` : move.san))
    .join(" ");
  // A quote or backslash in a name would end the header's value early
  const escape = (value: string) => value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `${headers.map(([key, value]) => `[${key} "${escape(value)}"]`).join("\n")}\n\n${text}${text ? " " : ""}${result}\n`;
}
