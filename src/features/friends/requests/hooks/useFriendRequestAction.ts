import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiRequest } from "@/services";
import {
  QKEY_PENDING_FRIEND_REQUESTS,
  QKEY_USER_FRIENDS,
  QKEY_USER_PROFILE,
} from "@/constants/queryKeys";
import { getApiErrorMessage } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";

export type FriendRequestAction = "accept" | "decline" | "cancel";

export type FriendRequestActionParams = {
  requestId: string;
  action: FriendRequestAction;
};

const ACTION_CONFIG: Record<
  FriendRequestAction,
  { method: "post" | "delete"; path: string }
> = {
  accept: { method: "post", path: "accept" },
  decline: { method: "post", path: "decline" },
  cancel: { method: "delete", path: "" },
};

const handleFriendRequestAction = async (
  params: FriendRequestActionParams
): Promise<void> => {
  const { requestId, action } = params;
  const config = ACTION_CONFIG[action];

  const endpoint = `/friend-requests/${requestId}${
    config.path ? `/${config.path}` : ""
  }`;
  return apiRequest(config.method, endpoint);
};

export const useFriendRequestAction = () => {
  const queryClient = useQueryClient();
  const { id: userId } = useUser();

  return useMutation({
    mutationFn: handleFriendRequestAction,
    onSuccess: (_data, { action }) => {
      if (action === "accept") toast.success("Friend request accepted");
      queryClient.invalidateQueries({
        queryKey: [QKEY_PENDING_FRIEND_REQUESTS, userId],
      });
      queryClient.invalidateQueries({ queryKey: [QKEY_USER_FRIENDS] });
      if (action === "accept") {
        queryClient.invalidateQueries({ queryKey: [QKEY_USER_PROFILE] });
      }
    },
    onError: (error, { action }) => {
      toast.error(getApiErrorMessage(error, `Couldn't ${action} the friend request`));
    },
  });
};
