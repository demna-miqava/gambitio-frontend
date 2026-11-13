import { apiRequest } from ".";
import type { Challenge } from "@/features/notifications/types/websocket-messages";
import type { PlayerColorOption } from "@/types/game.types";

export type SentChallenge = {
  id: number;
  createdAt: string;
  challengedId: number;
  username: string | null;
  time: number;
  increment: number;
  color: PlayerColorOption;
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
