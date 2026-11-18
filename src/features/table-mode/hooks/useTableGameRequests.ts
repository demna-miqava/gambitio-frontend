import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { answerTableGameRequest, getTableGameRequests } from "@/services/game";
import { QKEY_TABLE_GAME_REQUESTS, QKEY_USER_GAMES } from "@/constants/queryKeys";
import { useMessageDispatcher } from "@/hooks/useMessageDispatcher";
import { notificationMessages } from "@/services/websocketMessageDispatcher";
import { NOTIFICATION_MESSAGE_TYPES } from "@/features/notifications/constants/websocket-types";

/**
 * Friends' table games waiting for the signed-in player to confirm, kept
 * fresh by the notifications socket (a new request, or one answered in
 * another tab), and the confirm / decline actions.
 */
export const useTableGameRequests = () => {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: [QKEY_TABLE_GAME_REQUESTS], queryFn: getTableGameRequests });

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: [QKEY_TABLE_GAME_REQUESTS] });
  }, [queryClient]);
  useMessageDispatcher(notificationMessages, NOTIFICATION_MESSAGE_TYPES.TABLE_GAME_REQUEST, refresh);
  const onAnswered = useCallback(() => {
    refresh();
    void queryClient.invalidateQueries({ queryKey: [QKEY_USER_GAMES] });
  }, [refresh, queryClient]);
  useMessageDispatcher(notificationMessages, NOTIFICATION_MESSAGE_TYPES.TABLE_GAME_ANSWERED, onAnswered);

  const answer = useMutation({
    mutationFn: ({ gameId, action }: { gameId: number; action: "confirm" | "decline" }) =>
      answerTableGameRequest(gameId, action),
    onSuccess: (_, { action }) => {
      toast.success(action === "confirm" ? "Added to your game history" : "Declined");
      onAnswered();
    },
    onError: () => {
      toast.error("Couldn't answer it. Try again.");
      refresh();
    },
  });

  return { ...query, requests: query.data ?? [], answer };
};
