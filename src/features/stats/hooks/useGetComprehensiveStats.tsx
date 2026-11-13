import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useQueryParams } from "@/hooks/useQueryParams";
import { useProfileUserId } from "@/hooks/useProfileUserId";
import { apiRequest } from "@/services";
import { QKEY_USER_STATS } from "@/constants/queryKeys";

// Types for comprehensive stats data
export interface RatingDataPoint {
  date: string;
  rating: number;
}

export interface WinLossData {
  percent: number;
  count: number;
}

export interface ComprehensiveStatsData {
  currentRating: number;
  ratingGain: number;
  friendsRank: number;
  friendsCount: number;
  globalRank: number;
  percentile: number;
  highestRating: number;
  totalGames: number;
  wins: number;
  draws: number;
  losses: number;
  ratingHistory: RatingDataPoint[];
  // Additional data for comprehensive stats components
  averageRating: number;
  bestWin: number;
  winStreak: number;
  // Computed win/loss data for WinRatePill
  winData: WinLossData;
  drawData: WinLossData;
  lossData: WinLossData;
}

// Helper function to calculate win/loss percentages and counts
const calculateWinLossData = (
  wins: number,
  draws: number,
  losses: number,
  totalGames: number
) => {
  const winPercent = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
  const drawPercent =
    totalGames > 0 ? Math.round((draws / totalGames) * 100) : 0;
  const lossPercent =
    totalGames > 0 ? Math.round((losses / totalGames) * 100) : 0;

  return {
    winData: { percent: winPercent, count: wins },
    drawData: { percent: drawPercent, count: draws },
    lossData: { percent: lossPercent, count: losses },
  };
};

type ComprehensiveStatsResponse = Omit<
  ComprehensiveStatsData,
  "winData" | "drawData" | "lossData"
>;

const EMPTY: ComprehensiveStatsResponse = {
  currentRating: 0,
  ratingGain: 0,
  friendsRank: 0,
  friendsCount: 0,
  globalRank: 0,
  percentile: 0,
  highestRating: 0,
  totalGames: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  ratingHistory: [],
  averageRating: 0,
  bestWin: 0,
  winStreak: 0,
};

export const useGetComprehensiveStats = () => {
  const [selectedDays] = useQueryParams("days", "all-time");
  const [selectedVariant] = useQueryParams("variant", "all");
  const userId = useProfileUserId();

  const { data, isPending, isError, isPlaceholderData, refetch } = useQuery({
    queryKey: [QKEY_USER_STATS, userId, selectedDays, selectedVariant],
    queryFn: () =>
      apiRequest<ComprehensiveStatsResponse>("get", `/users/${userId}/stats`, {
        params: { days: selectedDays, variant: selectedVariant },
      }),
    enabled: userId > 0,
    // Changing the period or variant keeps the current numbers on screen
    // (dimmed) instead of flashing back to skeletons
    placeholderData: keepPreviousData,
  });

  const raw = data ?? EMPTY;
  const statsData: ComprehensiveStatsData = {
    ...raw,
    ...calculateWinLossData(raw.wins, raw.draws, raw.losses, raw.totalGames),
  };

  return {
    selectedDays,
    selectedVariant,
    statsData,
    isPending,
    isError,
    /** Showing the previous filter's numbers while the new ones load */
    isUpdating: isPlaceholderData,
    refetch,
  };
};
