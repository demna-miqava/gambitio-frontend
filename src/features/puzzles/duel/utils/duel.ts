import { Chess, type Square } from "chess.js";
import type { DuelPlayer } from "../types";

/**
 * How far this device's clock is from the server's (ms to add to
 * Date.now() to get the server's time), from a state's serverNow and when
 * the request was sent and answered. The duel's clock is the server's.
 */
export const clockOffset = (serverNow: number, sentAt: number, receivedAt: number) =>
  serverNow - (sentAt + receivedAt) / 2;

/** Whole seconds left, never below zero */
export const secondsLeft = (endsAt: number, now: number) => Math.max(0, Math.ceil((endsAt - now) / 1000));

/** m:ss */
export const formatDuelClock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/** Plays UCI moves on a position; stops at the first that doesn't fit */
export const positionAfter = (fen: string, moves: readonly string[]): Chess => {
  const chess = new Chess(fen);
  for (const uci of moves) {
    try {
      chess.move({ from: uci.slice(0, 2) as Square, to: uci.slice(2, 4) as Square, promotion: uci[4] });
    } catch {
      break;
    }
  }
  return chess;
};

/** The side solving a puzzle: whoever is to move in its position */
export const solverColor = (fen: string): "white" | "black" => (fen.split(" ")[1] === "b" ? "black" : "white");

/** The viewer and the other player, from a duel's players */
export const splitPlayers = (players: readonly DuelPlayer[], viewerId: number | undefined) => {
  const me = players.find((p) => p.userId === viewerId) ?? null;
  const opponent = players.find((p) => p.userId !== viewerId) ?? null;
  return { me, opponent };
};

/** How a finished duel reads for the viewer */
export const duelOutcome = (winnerId: number | null, viewerId: number | undefined) =>
  winnerId === null ? "draw" : winnerId === viewerId ? "win" : "loss";
