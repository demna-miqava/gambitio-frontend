import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { QKEY_DUEL_INVITES } from "@/constants/queryKeys";
import { NOTIFICATION_MESSAGE_TYPES } from "@/features/notifications/constants/websocket-types";
import { useMessageDispatcher } from "@/hooks/useMessageDispatcher";
import { useUser } from "@/hooks/useUser";
import { notificationMessages } from "@/services/websocketMessageDispatcher";
import {
  acceptDuelInvite,
  cancelDuelInvite,
  declineDuelInvite,
  getDuelInvites,
  sendDuelInvite,
} from "@/services/puzzleDuels";

/** The server's reason for a refused request, or a fallback */
export const duelErrorMessage = (error: unknown, fallback: string) =>
  isAxiosError<{ error?: string }>(error) && error.response?.data?.error ? error.response.data.error : fallback;

/**
 * Duel invites to and from the signed-in player, kept fresh by the
 * notifications socket, and the actions on them.
 */
export const useDuelInvites = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const { id: userId } = useUser();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: [QKEY_DUEL_INVITES, userId],
    queryFn: getDuelInvites,
    enabled: enabled && !!userId,
    // Invites lapse by themselves: drop the ones whose time is up
    select: (data) => {
      const now = Date.now();
      const open = (i: { expiresAt: string }) => new Date(i.expiresAt).getTime() > now;
      return { incoming: data.incoming.filter(open), outgoing: data.outgoing.filter(open) };
    },
    // No polling: the notifications socket says when invites change (and the
    // server sends a lapsed one's close too), so an open tab costs nothing
    staleTime: 60_000,
  });
  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: [QKEY_DUEL_INVITES] });
  }, [queryClient]);
  useMessageDispatcher(notificationMessages, NOTIFICATION_MESSAGE_TYPES.DUEL_INVITE, refresh);
  useMessageDispatcher(notificationMessages, NOTIFICATION_MESSAGE_TYPES.DUEL_INVITE_SENT, refresh);
  useMessageDispatcher(notificationMessages, NOTIFICATION_MESSAGE_TYPES.DUEL_INVITE_CLOSED, refresh);
  useMessageDispatcher(notificationMessages, NOTIFICATION_MESSAGE_TYPES.DUEL_STARTED, refresh);

  const send = useMutation({
    mutationFn: ({ recipientId, rematchOf }: { recipientId: number; rematchOf?: number }) =>
      sendDuelInvite(recipientId, rematchOf),
    onSuccess: (invite) => {
      toast.success(`Invite sent to ${invite.to.username}`);
      refresh();
    },
    onError: (error) => toast.error(duelErrorMessage(error, "Couldn't send the invite. Try again.")),
  });
  const accept = useMutation({
    mutationFn: (inviteId: number) => acceptDuelInvite(inviteId),
    onError: (error) => {
      toast.error(duelErrorMessage(error, "Couldn't start the duel. Try again."));
      refresh();
    },
    onSettled: refresh,
  });
  const decline = useMutation({
    mutationFn: (inviteId: number) => declineDuelInvite(inviteId),
    onSettled: refresh,
  });
  const cancel = useMutation({
    mutationFn: (inviteId: number) => cancelDuelInvite(inviteId),
    onSettled: refresh,
  });

  return {
    ...query,
    incoming: query.data?.incoming ?? [],
    outgoing: query.data?.outgoing ?? [],
    send,
    accept,
    decline,
    cancel,
  };
};
