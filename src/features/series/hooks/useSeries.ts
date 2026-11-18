import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { QKEY_HEAD_TO_HEAD, QKEY_SERIES, QKEY_USER_SERIES } from "@/constants/queryKeys";
import { getSeriesRoute } from "@/constants/routes";
import { useUser } from "@/hooks/useUser";
import { getHeadToHead, getSeries, getUserSeries, resignSeries } from "@/services/series";
import { useMessageDispatcher } from "@/hooks/useMessageDispatcher";
import { notificationMessages } from "@/services/websocketMessageDispatcher";
import { NOTIFICATION_MESSAGE_TYPES } from "@/features/notifications/constants/websocket-types";
import type { SeriesUpdatedNotification } from "@/features/notifications/types/websocket-messages";
import type { SeriesDetail, SeriesSummary } from "../types";

export const seriesKey = (seriesId: number) => [QKEY_SERIES, seriesId] as const;

/** How often the page of a timed match in progress refreshes: its games come one after another */
const TIMED_MATCH_REFRESH_MS = 5_000;

/** A series with its games. */
export const useSeries = (seriesId: number | null | undefined) =>
  useQuery({
    queryKey: seriesKey(seriesId ?? 0),
    queryFn: () => getSeries(seriesId!),
    enabled: !!seriesId,
    refetchInterval: (query) => {
      const series = query.state.data?.series;
      return series && series.matchMinutes != null && series.status === "active"
        ? TIMED_MATCH_REFRESH_MS
        : false;
    },
  });

/** A player's series, newest first. */
export const useUserSeries = (userId: number | undefined, limit = 5) =>
  useQuery({
    queryKey: [QKEY_USER_SERIES, userId, limit],
    queryFn: () => getUserSeries(userId!, limit),
    enabled: userId !== undefined,
  });

/** The signed-in player's record against `userId` (not for their own profile). */
export const useHeadToHead = (userId: number | undefined, enabled = true) =>
  useQuery({
    queryKey: [QKEY_HEAD_TO_HEAD, userId],
    queryFn: () => getHeadToHead(userId!),
    enabled: enabled && userId !== undefined,
  });

/**
 * Puts a series the server just sent into the cache (keeping the cached
 * games, which only change when a game starts or ends) and marks the lists
 * that show it stale.
 */
export const storeSeries = (queryClient: QueryClient, series: SeriesSummary) => {
  queryClient.setQueryData<SeriesDetail>(seriesKey(series.id), (old) =>
    old ? { ...old, series } : old
  );
  void queryClient.invalidateQueries({ queryKey: seriesKey(series.id) });
  void queryClient.invalidateQueries({ queryKey: [QKEY_USER_SERIES] });
  void queryClient.invalidateQueries({ queryKey: [QKEY_HEAD_TO_HEAD] });
};

/**
 * Keeps series data fresh when the server says one changed outside a game
 * (a player resigned it), and tells the other player. Mounted once, app-wide
 * (ChallengesProvider).
 */
export const useSeriesUpdates = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { id: viewerId } = useUser();
  const onUpdate = useCallback(
    (message: SeriesUpdatedNotification) => {
      const { series } = message.data;
      storeSeries(queryClient, series);
      // The resigning player already saw their own confirmation
      if (series.endReason === "resignation" && series.winnerId === viewerId) {
        const opponent =
          series.playerOne.id === viewerId ? series.playerTwo : series.playerOne;
        toast(`${opponent.username} resigned the series. You win!`, {
          id: `series:${series.id}`,
          action: { label: "View", onClick: () => navigate(getSeriesRoute(series.id)) },
        });
      }
    },
    [queryClient, navigate, viewerId]
  );
  useMessageDispatcher<SeriesUpdatedNotification>(
    notificationMessages,
    NOTIFICATION_MESSAGE_TYPES.SERIES_UPDATED,
    onUpdate
  );
};

const errorMessage = (error: unknown) =>
  (isAxiosError(error) && (error.response?.data as { error?: string } | undefined)?.error) ||
  "Couldn't resign the series. Try again.";

export const useResignSeries = (seriesId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => resignSeries(seriesId),
    onSuccess: (series) => {
      storeSeries(queryClient, series);
      toast.success("You resigned the series");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
};
