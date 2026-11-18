import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { removeFriend } from "@/services/friends";
import { getApiErrorMessage } from "@/lib/utils";
import { invalidateAfterFriendshipChange } from "../utils/friendshipQueries";

export const useRemoveFriend = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeFriend,
    onSuccess: () => {
      toast.success("Friend removed");
      // Lists, counts, and the Online list the removed friend was on
      invalidateAfterFriendshipChange(queryClient);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Couldn't remove this friend"));
    },
  });
};
