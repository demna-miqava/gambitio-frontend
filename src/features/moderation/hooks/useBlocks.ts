import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { blockUser, getBlockedUsers, reportUser, unblockUser } from "@/services/moderation";
import {
  QKEY_BLOCKED_USERS,
  QKEY_CHALLENGES,
  QKEY_LIVE_GAMES_FRIENDS,
  QKEY_PENDING_FRIEND_REQUESTS,
  QKEY_SUGGESTED_FRIENDS,
  QKEY_USER_FRIENDS,
  QKEY_USER_PROFILE,
} from "@/constants/queryKeys";
import { useUser } from "@/hooks/useUser";
import { getApiErrorMessage } from "@/lib/utils";
import type { ReportInput } from "../types";

/** The players the signed-in user has blocked. */
export const useBlockedUsers = () => {
  const { id: userId } = useUser();
  return useQuery({
    queryKey: [QKEY_BLOCKED_USERS, userId],
    queryFn: getBlockedUsers,
    enabled: !!userId,
    staleTime: 60_000,
  });
};

/** Whether the signed-in user has blocked a player (false while the list loads). */
export const useIsBlocked = (userId: number | undefined): boolean => {
  const { data } = useBlockedUsers();
  return userId !== undefined && !!data?.some((user) => user.id === userId);
};

/**
 * Everything a block or unblock can change: the list itself, and (a block
 * ends the friendship and withdraws requests and challenges between the
 * two) friends, requests, suggestions and open challenges.
 */
export const invalidateAfterBlockChange = (queryClient: QueryClient) => {
  for (const key of [
    QKEY_BLOCKED_USERS,
    QKEY_USER_FRIENDS,
    QKEY_PENDING_FRIEND_REQUESTS,
    QKEY_SUGGESTED_FRIENDS,
    QKEY_CHALLENGES,
    QKEY_USER_PROFILE,
    QKEY_LIVE_GAMES_FRIENDS,
  ]) {
    void queryClient.invalidateQueries({ queryKey: [key] });
  }
};

export const useBlockUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (player: { id: number; username: string }) => blockUser(player.id),
    onSuccess: (_, player) => {
      toast.success(`${player.username} is blocked`);
      invalidateAfterBlockChange(queryClient);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Couldn't block this player"));
    },
  });
};

export const useUnblockUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (player: { id: number; username: string }) => unblockUser(player.id),
    onSuccess: (_, player) => {
      toast.success(`${player.username} is unblocked`);
      invalidateAfterBlockChange(queryClient);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Couldn't unblock this player"));
    },
  });
};

export const useReportUser = () =>
  useMutation({
    mutationFn: (input: ReportInput) => reportUser(input),
    onSuccess: () => {
      toast.success("Report sent. Thanks for telling us.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Couldn't send the report"));
    },
  });
