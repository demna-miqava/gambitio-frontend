import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { removeFriend } from "@/services/friends";
import { QKEY_USER_FRIENDS, QKEY_USER_PROFILE } from "@/constants/queryKeys";
import { getApiErrorMessage } from "@/lib/utils";

export const useRemoveFriend = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeFriend,
    onSuccess: () => {
      toast.success("Friend removed");
      queryClient.invalidateQueries({ queryKey: [QKEY_USER_FRIENDS] });
      // Friend counts on profile headers
      queryClient.invalidateQueries({ queryKey: [QKEY_USER_PROFILE] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Couldn't remove this friend"));
    },
  });
};
