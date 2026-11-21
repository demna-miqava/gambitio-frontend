import { Chess, type Move } from "chess.js";
import type { PlayerColor } from "@/features/game/types/game.types";
import type { BotGameResult } from "../hooks/useBotGame";

interface BotGamePgnInput {
  moves: Pick<Move, "san">[];
  playerColor: PlayerColor;
  playerName: string;
  botName: string;
  result: Omit<BotGameResult, "endReason"> | null;
  /** Defaults to now */
  date?: Date;
  /** A position set up in the board editor (written as SetUp/FEN headers) */
  startFen?: string;
}

/** PGN result tag from the player's point of view. */
const resultTag = (result: Omit<BotGameResult, "endReason"> | null, playerColor: PlayerColor) => {
  if (!result) return "*";
  if (result.outcome === "draw") return "1/2-1/2";
  const whiteWon = (result.outcome === "win") === (playerColor === "white");
  return whiteWon ? "1-0" : "0-1";
};

/**
 * A finished bot game as PGN: what's sent to the server to save it, and what
 * the analysis board opens if saving failed.
 */
export const buildBotGamePgn = ({
  moves,
  playerColor,
  playerName,
  botName,
  result,
  date = new Date(),
  startFen,
}: BotGamePgnInput): string => {
  const chess = new Chess(startFen);
  for (const { san } of moves) chess.move(san);
  const white = playerColor === "white" ? playerName : botName;
  const black = playerColor === "white" ? botName : playerName;
  chess.setHeader("Event", `Game against ${botName}`);
  chess.setHeader("Site", "Gambitio");
  chess.setHeader("Date", date.toISOString().slice(0, 10).replace(/-/g, "."));
  chess.setHeader("White", white);
  chess.setHeader("Black", black);
  chess.setHeader("Result", resultTag(result, playerColor));
  return chess.pgn();
};
