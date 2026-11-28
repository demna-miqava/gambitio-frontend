import { Chess } from "chess.js";
import type { StoredGameListItem } from "@/types";
import { findOpening, type Opening, type OpeningTable } from "@/features/openings/openings";
import { SPEED_LABEL } from "@/features/game/constants/speed";
import { formatCompactGameTime } from "@/utils/timeControl";

/** Half-moves read for the opening's name: every named line is shorter */
const OPENING_PLIES = 40;

/**
 * The opening a game went into, from its moves: the deepest named position
 * among its first moves. Null without moves, when none of its positions has
 * a name, or when the PGN doesn't load.
 */
export function openingOfGame(table: OpeningTable, pgn: string | null | undefined): Opening | null {
  if (!pgn) return null;
  try {
    const chess = new Chess();
    chess.loadPgn(pgn);
    const moves = chess.history({ verbose: true }).slice(0, OPENING_PLIES);
    if (moves.length === 0) return null;
    return findOpening(table, [moves[0].before, ...moves.map((move) => move.after)]);
  } catch {
    return null;
  }
}

/** Which side of the game `userId` had (White for a game with them on both sides) */
export const sideOf = (game: StoredGameListItem, userId: number | undefined): "white" | "black" | null =>
  userId === undefined
    ? null
    : game.whitePlayer.id === userId
      ? "white"
      : game.blackPlayer.id === userId
        ? "black"
        : null;

/** "Blitz 3+2", "Bullet 1+0 vs 0:30+0" with time odds; what an untimed game is instead */
export function formatOfGame(game: StoredGameListItem): string {
  if (game.tableGame) return "Table game";
  if (game.type === null || game.time === null) return game.botId !== null ? "Against a bot" : "Untimed";
  return `${SPEED_LABEL[game.type]} ${formatCompactGameTime({ ...game, time: game.time })}`;
}
