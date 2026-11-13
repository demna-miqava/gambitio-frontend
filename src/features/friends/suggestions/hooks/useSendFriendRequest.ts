import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { sendFriendRequest } from "@/services/friends";
import {
  QKEY_PENDING_FRIEND_REQUESTS,
  QKEY_SUGGESTED_FRIENDS,
} from "@/constants/queryKeys";
import { useUser } from "@/hooks/useUser";
import { getApiErrorMessage } from "@/lib/utils";

export const useSendFriendRequest = () => {
  const queryClient = useQueryClient();
  const { id: userId } = useUser();

  return useMutation({
    mutationFn: (receiverId: number) => {
      return sendFriendRequest({ receiverId });
    },
    onSuccess: () => {
      toast.success("Friend request sent");
      queryClient.invalidateQueries({ queryKey: [QKEY_SUGGESTED_FRIENDS] });
      queryClient.invalidateQueries({
        queryKey: [QKEY_PENDING_FRIEND_REQUESTS, userId],
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Couldn't send the friend request"));
    },
  });
};
