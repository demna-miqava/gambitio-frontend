import { apiRequest } from ".";
import type { BestOf, Challenge } from "@/features/notifications/types/websocket-messages";
import type { PlayerColorOption } from "@/types/game.types";
import type { OpeningSummary } from "@/features/openings/startingOpenings";

export type SentChallenge = {
  id: number;
  createdAt: string;
  challengedId: number;
  username: string | null;
  time: number;
  increment: number;
  /** Time odds: your clock and the challenged player's; null for an even game */
  ownTime?: number | null;
  opponentTime?: number | null;
  color: PlayerColorOption;
  /** 3 or 5 for a series, 2 for a mirror match */
  bestOf?: BestOf;
  /** Set when it continues a series, with the game it would start */
  seriesId?: number | null;
  seriesGame?: number | null;
  /** False for a casual game or series */
  rated?: boolean;
  /** The opening the game starts from; null for the initial position */
  opening?: OpeningSummary | null;
  /** A timed match of this many minutes; null otherwise */
  matchMinutes?: number | null;
};

export const getChallenges = async (): Promise<Challenge[]> => {
  const response = await apiRequest<{ challenges: Challenge[] }>(
    "get",
    "/challenges"
  );
  return response.challenges;
};

/** The challenge the signed-in user is waiting on, or null. */
export const getSentChallenge = async (): Promise<SentChallenge | null> => {
  const response = await apiRequest<{ challenge: SentChallenge | null }>(
    "get",
    "/challenges/sent"
  );
  return response.challenge;
};
