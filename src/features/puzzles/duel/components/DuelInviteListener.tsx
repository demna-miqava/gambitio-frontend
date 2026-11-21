import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getPuzzleDuelRoute, ROUTES } from "@/constants/routes";
import { NOTIFICATION_MESSAGE_TYPES } from "@/features/notifications/constants/websocket-types";
import { useMessageDispatcher } from "@/hooks/useMessageDispatcher";
import { notificationMessages } from "@/services/websocketMessageDispatcher";
import { acceptDuelInvite } from "@/services/puzzleDuels";
import type { DuelInviteClosedMessage, DuelInviteMessage, DuelStartedMessage } from "../types";
import { duelErrorMessage } from "../hooks/useDuelInvites";

/**
 * App-wide: an incoming duel invite shows as a toast with Accept (it's also
 * in the inbox) until the invite is answered, withdrawn or lapses, and a
 * duel starting takes the player to it when they're on the duel pages, or
 * offers to otherwise.
 */
const inviteToastId = (inviteId: number) => `duel-invite-${inviteId}`;

export const DuelInviteListener = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const onDuelPages = pathname.startsWith(ROUTES.PUZZLE_DUEL);

  const handleInvite = useCallback(
    ({ data: invite }: DuelInviteMessage) => {
      // A rematch is answered on the result screen
      if (invite.rematchOf && onDuelPages) return;
      toast(`${invite.from.username} invited you to a puzzle duel`, {
        id: inviteToastId(invite.id),
        description: "Same puzzles, three minutes, highest score wins.",
        duration: Math.max(5_000, new Date(invite.expiresAt).getTime() - Date.now()),
        action: {
          label: "Accept",
          onClick: () => {
            acceptDuelInvite(invite.id)
              .then(({ duelId }) => {
                const route = getPuzzleDuelRoute(duelId);
                if (window.location.pathname !== route) navigate(route);
              })
              .catch((error) => toast.error(duelErrorMessage(error, "Couldn't start the duel.")));
          },
        },
      });
    },
    [navigate, onDuelPages]
  );
  useMessageDispatcher<DuelInviteMessage>(notificationMessages, NOTIFICATION_MESSAGE_TYPES.DUEL_INVITE, handleInvite);

  const handleClosed = useCallback(({ data }: DuelInviteClosedMessage) => {
    toast.dismiss(inviteToastId(data.inviteId));
  }, []);
  useMessageDispatcher<DuelInviteClosedMessage>(
    notificationMessages,
    NOTIFICATION_MESSAGE_TYPES.DUEL_INVITE_CLOSED,
    handleClosed
  );

  const handleStarted = useCallback(
    ({ data }: DuelStartedMessage) => {
      // Accepted (here, in the lobby or in another tab): its toast is done
      toast.dismiss(inviteToastId(data.inviteId));
      const route = getPuzzleDuelRoute(data.duelId);
      if (pathname === route) return;
      if (onDuelPages) {
        navigate(route);
        return;
      }
      toast("Your puzzle duel is starting", {
        id: `duel-started-${data.duelId}`,
        description: "The clock starts in a few seconds.",
        action: { label: "Go", onClick: () => navigate(route) },
      });
    },
    [navigate, onDuelPages, pathname]
  );
  useMessageDispatcher<DuelStartedMessage>(notificationMessages, NOTIFICATION_MESSAGE_TYPES.DUEL_STARTED, handleStarted);

  return null;
};
