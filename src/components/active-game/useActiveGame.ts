import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { getActiveGame } from "@/services/game";
import { QKEY_ACTIVE_GAME } from "@/constants/queryKeys";
import { isGameRoute } from "@/config/shell";
import { useMessageDispatcher } from "@/hooks/useMessageDispatcher";
import { notificationMessages } from "@/services/websocketMessageDispatcher";
import { NOTIFICATION_MESSAGE_TYPES } from "@/features/notifications/constants/websocket-types";
import type { ActiveGameNotification } from "@/features/notifications/types/websocket-messages";

/**
 * The signed-in player's unfinished live game, if any, for the "Return to
 * game" links. Not shown (or fetched) while already on a game page.
 *
 * Fetched when it's needed (mount, leaving a game page, coming back to the
 * tab); after that the server pushes changes over the notifications socket
 * (active_game when a game starts or ends), so there is no polling. The
 * socket refetches it after a reconnect, in case a message was missed.
 */
export const useActiveGame = () => {
  const { pathname } = useLocation();
  const onGamePage = isGameRoute(pathname);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: [QKEY_ACTIVE_GAME],
    queryFn: getActiveGame,
    enabled: !onGamePage,
    // Always stale, so focus and remounts (e.g. leaving a game) re-check it
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const onActiveGame = useCallback(
    (message: ActiveGameNotification) => {
      queryClient.setQueryData([QKEY_ACTIVE_GAME], { gameId: message.data.gameId });
    },
    [queryClient]
  );
  useMessageDispatcher(notificationMessages, NOTIFICATION_MESSAGE_TYPES.ACTIVE_GAME, onActiveGame);

  return onGamePage ? null : (data?.gameId ?? null);
};
