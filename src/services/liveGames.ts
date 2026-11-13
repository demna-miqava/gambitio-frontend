import { apiRequest } from ".";
import type { LiveGameSummary } from "@/types/liveGames.types";

/** The signed-in user's friends' games in progress, newest first. */
export const getFriendsLiveGames = async (): Promise<LiveGameSummary[]> =>
  (await apiRequest<{ data: LiveGameSummary[] }>("get", "/games/live/friends")).data;

/** Games in progress with the highest average rating. */
export const getTopLiveGames = async (limit = 12): Promise<LiveGameSummary[]> =>
  (await apiRequest<{ data: LiveGameSummary[] }>("get", `/games/live/top?limit=${limit}`)).data;
