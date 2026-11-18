import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMessageDispatcher } from "@/hooks/useMessageDispatcher";
import { notificationMessages } from "@/services/websocketMessageDispatcher";
import { NOTIFICATION_MESSAGE_TYPES } from "@/features/notifications/constants/websocket-types";
import type { BlocksUpdatedNotification } from "@/features/notifications/types/websocket-messages";
import { invalidateAfterBlockChange } from "../hooks/useBlocks";

/**
 * Keeps the blocked list (and what a block changes) current when the player
 * blocks or unblocks someone in another tab or on another device. Renders nothing.
 */
export const BlockUpdates = () => {
  const queryClient = useQueryClient();
  const onUpdate = useCallback(() => invalidateAfterBlockChange(queryClient), [queryClient]);
  useMessageDispatcher<BlocksUpdatedNotification>(
    notificationMessages,
    NOTIFICATION_MESSAGE_TYPES.BLOCKS_UPDATED,
    onUpdate
  );
  return null;
};
