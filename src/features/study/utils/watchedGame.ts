import { Chess } from "chess.js";
import { loadServerPgn } from "@/features/game/utils/loadServerPgn";
import type {
  GameEndReason,
  GamePlayer,
  GameResult,
  GameWebSocketMessage,
} from "@/features/game/types/websocket-messages";

/**
 * A study room's view of the game it watches, from the game socket (as a
 * spectator): who plays, the clocks and the latest position. The room's
 * move tree comes from the study socket; this only says how the game
 * stands right now.
 */
export interface WatchedGame {
  gameId: number;
  white: GamePlayer;
  black: GamePlayer;
  /** Starting clock in seconds */
  time: number;
  increment: number;
  fen: string;
  /** The latest move, for the board's highlight and the "Live" label */
  lastMove: { san: string; from: string; to: string } | null;
  /** Half-moves played */
  ply: number;
  inProgress: boolean;
  clockRunning: boolean;
  whiteTimeLeft: number | null;
  blackTimeLeft: number | null;
  result: GameResult | null;
  reason: GameEndReason | null;
}

/** The last move of a game's PGN (server format), or null. */
const lastMoveOf = (pgn: string): WatchedGame["lastMove"] => {
  const chess = new Chess();
  if (!pgn || !loadServerPgn(chess, pgn)) return null;
  const last = chess.history({ verbose: true }).at(-1);
  return last ? { san: last.san, from: last.from, to: last.to } : null;
};

export interface WatchedGameUpdate {
  game: WatchedGame | null;
  /** The game's moves or result changed: the room should catch up (sync_game) */
  changed: boolean;
}

/** Applies a game socket message. Messages for players only (chat, offers) are ignored. */
export function applyWatchedGameMessage(
  game: WatchedGame | null,
  message: GameWebSocketMessage
): WatchedGameUpdate {
  const keep = { game, changed: false };
  switch (message.type) {
    case "initial_game_state": {
      const { data } = message;
      const next: WatchedGame = {
        gameId: data.gameId,
        white: data.whitePlayer,
        black: data.blackPlayer,
        time: data.time,
        increment: data.increment,
        fen: data.fen,
        lastMove: lastMoveOf(data.pgn),
        ply: data.numMoves,
        inProgress: data.status === "in_progress",
        clockRunning: data.clockRunning,
        whiteTimeLeft: data.whiteTimeLeft,
        blackTimeLeft: data.blackTimeLeft,
        result: data.result ?? null,
        reason: data.reason ?? null,
      };
      return { game: next, changed: true };
    }
    case "move": {
      if (!game) return keep;
      const { move } = message;
      return {
        game: {
          ...game,
          fen: message.fen,
          lastMove: { san: move.san, from: move.from, to: move.to },
          ply: message.moveNumber,
          clockRunning: message.clockRunning,
          whiteTimeLeft: message.whiteTimeLeft,
          blackTimeLeft: message.blackTimeLeft,
        },
        changed: true,
      };
    }
    case "takeback": {
      if (!game) return keep;
      return {
        game: {
          ...game,
          fen: message.fen,
          lastMove: lastMoveOf(message.pgn),
          ply: message.moveNumber,
          clockRunning: message.clockRunning,
          whiteTimeLeft: message.whiteTimeLeft,
          blackTimeLeft: message.blackTimeLeft,
        },
        changed: true,
      };
    }
    case "time_added":
      return game
        ? { game: { ...game, whiteTimeLeft: message.whiteTimeLeft, blackTimeLeft: message.blackTimeLeft }, changed: false }
        : keep;
    case "game_ended":
      return game
        ? {
            game: { ...game, inProgress: false, clockRunning: false, result: message.result, reason: message.reason },
            changed: true,
          }
        : keep;
    default:
      return keep;
  }
}

const REASONS: Record<GameEndReason, string> = {
  resignation: "by resignation",
  draw_agreement: "by agreement",
  aborted: "",
  checkmate: "by checkmate",
  timeout: "on time",
  timeout_vs_insufficient_material: "timeout vs insufficient material",
  stalemate: "by stalemate",
  threefold_repetition: "by repetition",
  insufficient_material: "insufficient material",
  fifty_move_rule: "fifty-move rule",
};

/** "White won by checkmate", "Draw by repetition", "Game aborted". */
export function describeWatchedResult(game: Pick<WatchedGame, "result" | "reason" | "white" | "black">): string {
  if (game.result === "aborted") return "Game aborted";
  const how = game.reason ? REASONS[game.reason] : "";
  if (game.result === "draw") return how ? `Draw ${how.startsWith("by") || how.startsWith("on") ? how : `(${how})`}` : "Draw";
  if (game.result === "white_win" || game.result === "black_win") {
    const winner = game.result === "white_win" ? game.white.username : game.black.username;
    return `${winner} won${how ? ` ${how.startsWith("by") || how.startsWith("on") ? how : `(${how})`}` : ""}`;
  }
  return "Game over";
}
