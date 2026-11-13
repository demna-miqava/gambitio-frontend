import { apiRequest } from ".";
import type { LeaderboardResponse, LeaderboardScope } from "@/features/leaderboard/types";
import type { LeaderboardVariant } from "@/features/leaderboard/variants";

export interface GetLeaderboardParams {
  variant: LeaderboardVariant;
  scope: LeaderboardScope;
  page: number;
  limit: number;
}

export const getLeaderboard = async (params: GetLeaderboardParams): Promise<LeaderboardResponse> =>
  apiRequest<LeaderboardResponse>("get", "/leaderboard", { params });
