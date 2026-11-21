import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { handleFriendRequestAction } from "@/services/friends";
import {
  QKEY_PENDING_FRIEND_REQUESTS,
  QKEY_USER_FRIENDS,
} from "@/constants/queryKeys";
import { getApiErrorMessage } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { invalidateAfterFriendshipChange } from "../../utils/friendshipQueries";

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
      if (action === "accept") {
        // A new friend: lists, counts, and whether they're online right now
        invalidateAfterFriendshipChange(queryClient);
      } else {
        queryClient.invalidateQueries({ queryKey: [QKEY_USER_FRIENDS] });
      }
    },
    onError: (error, { action }) => {
      toast.error(getApiErrorMessage(error, `Couldn't ${action} the friend request`));
    },
  });
};
