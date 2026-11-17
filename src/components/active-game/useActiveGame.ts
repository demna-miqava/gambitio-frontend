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
 * The signed-in player's unfinished live game, if any.
 *
 * Fetched when it's needed (mount, leaving a game page, coming back to the
 * tab); after that the server pushes changes over the notifications socket
 * (active_game when a game starts or ends), so there is no polling. The
 * socket refetches it after a reconnect, in case a message was missed.
 */
const useActiveGameQuery = (enabled: boolean) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [QKEY_ACTIVE_GAME],
    queryFn: getActiveGame,
    enabled,
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

  return query;
};

/**
 * The game to offer in the "Return to game" links. Not shown (or fetched)
 * while already on a game page.
 */
export const useActiveGame = () => {
  const { pathname } = useLocation();
  const onGamePage = isGameRoute(pathname);
  const { data } = useActiveGameQuery(!onGamePage);

  return onGamePage ? null : (data?.gameId ?? null);
};

export type ActiveGameStatus =
  /** Not known yet: the first answer hasn't arrived */
  | { state: "checking" }
  /** Couldn't be checked, and nothing is cached */
  | { state: "unknown"; retry: () => void }
  | { state: "playing"; gameId: number }
  | { state: "idle" };

/**
 * Whether the player is in a live game, for pages that must stay closed
 * during one (see FairPlayGate). Unlike useActiveGame it tells "not playing"
 * apart from "not known yet", and checks on every page.
 */
export const useActiveGameStatus = (): ActiveGameStatus => {
  const { data, isPending, refetch } = useActiveGameQuery(true);

  if (data) {
    return data.gameId === null ? { state: "idle" } : { state: "playing", gameId: data.gameId };
  }
  if (isPending) return { state: "checking" };
  return { state: "unknown", retry: () => void refetch() };
};
