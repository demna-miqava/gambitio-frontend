import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { gameMessages, notificationMessages } from "@/services/websocketMessageDispatcher";
import { useMessageDispatcher } from "@/hooks/useMessageDispatcher";
import { GAME_MESSAGE_TYPES } from "@/features/game/constants/websocket-types";
import type {
  GameEndedMessage,
  InitialGameStateMessage,
} from "@/features/game/types/websocket-messages";
import { NOTIFICATION_MESSAGE_TYPES } from "@/features/notifications/constants/websocket-types";
import type { SeriesUpdatedNotification } from "@/features/notifications/types/websocket-messages";
import type { SeriesSummary } from "../types";
import { storeSeries, useSeries } from "./useSeries";

/**
 * The series a live game belongs to, kept current from the game socket: the
 * full state on (re)connect and the new score when the game ends. Until the
 * socket has spoken, falls back to the series fetched by id (from the
 * stored game), so the strip shows at once.
 */
export const useLiveSeries = (game: { seriesId?: number | null; seriesGame?: number | null }) => {
  const queryClient = useQueryClient();
  const [live, setLive] = useState<{ series: SeriesSummary | null; seriesGame: number | null } | null>(
    null
  );
  // The game the rematch (next series game) started, once it has
  const [rematchGameId, setRematchGameId] = useState<number | null>(null);
  const fallback = useSeries(live ? null : game.seriesId);

  const onInitialState = useCallback(
    ({ data }: InitialGameStateMessage) => {
      setLive({ series: data.series ?? null, seriesGame: data.seriesGame ?? null });
      setRematchGameId(data.rematchGameId ?? null);
      // A game of the series started since the series page was cached
      if (data.series) storeSeries(queryClient, data.series);
    },
    [queryClient]
  );

  const onGameEnded = useCallback(
    (message: GameEndedMessage) => {
      const series = message.series;
      if (!series) return;
      setLive((prev) => ({ series, seriesGame: prev?.seriesGame ?? null }));
      storeSeries(queryClient, series);
    },
    [queryClient]
  );

  // Resigned between games: no longer "Next game"
  const onSeriesUpdated = useCallback(({ data }: SeriesUpdatedNotification) => {
    setLive((prev) =>
      prev?.series?.id === data.series.id ? { ...prev, series: data.series } : prev
    );
  }, []);

  useMessageDispatcher<InitialGameStateMessage>(
    gameMessages,
    GAME_MESSAGE_TYPES.INITIAL_GAME_STATE,
    onInitialState
  );
  useMessageDispatcher<GameEndedMessage>(gameMessages, GAME_MESSAGE_TYPES.GAME_ENDED, onGameEnded);
  useMessageDispatcher<SeriesUpdatedNotification>(
    notificationMessages,
    NOTIFICATION_MESSAGE_TYPES.SERIES_UPDATED,
    onSeriesUpdated
  );

  return {
    series: live ? live.series : (fallback.data?.series ?? null),
    seriesGame: live?.seriesGame ?? game.seriesGame ?? null,
    rematchGameId,
  };
};
