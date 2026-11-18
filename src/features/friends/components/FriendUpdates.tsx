import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMessageDispatcher } from "@/hooks/useMessageDispatcher";
import { useUser } from "@/hooks/useUser";
import { notificationMessages } from "@/services/websocketMessageDispatcher";
import { NOTIFICATION_MESSAGE_TYPES } from "@/features/notifications/constants/websocket-types";
import type { FriendsUpdatedNotification } from "@/features/notifications/types/websocket-messages";
import {
  QKEY_FRIEND_STATUSES,
  QKEY_LIVE_GAMES_FRIENDS,
  QKEY_PENDING_FRIEND_REQUESTS,
  QKEY_SUGGESTED_FRIENDS,
  QKEY_USER_FRIENDS,
  QKEY_USER_PROFILE,
} from "@/constants/queryKeys";
import { getProfileFriendsRoute } from "@/constants/routes";

/**
 * Keeps friend lists and requests current when another player sends,
 * accepts, declines or cancels a request, or unfriends you, and tells you
 * about new requests and accepted ones. Renders nothing.
 */
export const FriendUpdates = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id: myId } = useUser();

  const onUpdate = useCallback(
    ({ data: { event, user } }: FriendsUpdatedNotification) => {
      void queryClient.invalidateQueries({ queryKey: [QKEY_PENDING_FRIEND_REQUESTS] });
      void queryClient.invalidateQueries({ queryKey: [QKEY_SUGGESTED_FRIENDS] });
      if (event === "request_accepted" || event === "removed") {
        void queryClient.invalidateQueries({ queryKey: [QKEY_USER_FRIENDS] });
        // Friend counts on profile headers
        void queryClient.invalidateQueries({ queryKey: [QKEY_USER_PROFILE] });
        void queryClient.invalidateQueries({ queryKey: [QKEY_LIVE_GAMES_FRIENDS] });
        // A new friend may be online right now; a removed one mustn't stay listed
        void queryClient.invalidateQueries({ queryKey: [QKEY_FRIEND_STATUSES] });
      }

      const name = user.username ?? "Someone";
      const viewRequests = myId
        ? { label: "View", onClick: () => navigate(getProfileFriendsRoute(myId)) }
        : undefined;
      if (event === "request_received") {
        toast(`${name} sent you a friend request`, {
          id: `friend-request:${user.id}`,
          action: viewRequests,
        });
      } else if (event === "request_accepted") {
        toast.success(`${name} accepted your friend request`, {
          id: `friend-accepted:${user.id}`,
        });
      }
    },
    [myId, navigate, queryClient]
  );

  useMessageDispatcher<FriendsUpdatedNotification>(
    notificationMessages,
    NOTIFICATION_MESSAGE_TYPES.FRIENDS_UPDATED,
    onUpdate
  );
  return null;
};
