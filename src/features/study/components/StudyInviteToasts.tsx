import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMessageDispatcher } from "@/hooks/useMessageDispatcher";
import { notificationMessages } from "@/services/websocketMessageDispatcher";
import { NOTIFICATION_MESSAGE_TYPES } from "@/features/notifications/constants/websocket-types";
import type { StudyInviteNotification } from "@/features/notifications/types/websocket-messages";
import { QKEY_STUDY_ROOMS } from "@/constants/queryKeys";
import { getStudyRoomRoute } from "@/constants/routes";

/** Tells the player a friend added them to a study room, with a link to join. Renders nothing. */
export const StudyInviteToasts = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const onInvite = useCallback(
    (message: StudyInviteNotification) => {
      const { roomId, name, from } = message.data;
      void queryClient.invalidateQueries({ queryKey: [QKEY_STUDY_ROOMS] });
      toast(`${from.username} invited you to “${name}”`, {
        id: `study-invite:${roomId}`,
        description: "A shared study room",
        duration: 15_000,
        action: { label: "Join", onClick: () => navigate(getStudyRoomRoute(roomId)) },
      });
    },
    [navigate, queryClient]
  );

  useMessageDispatcher<StudyInviteNotification>(
    notificationMessages,
    NOTIFICATION_MESSAGE_TYPES.STUDY_INVITE,
    onInvite
  );
  return null;
};
