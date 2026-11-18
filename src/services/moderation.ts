import { apiRequest } from ".";
import type { BlockedUser, ReportInput } from "@/features/moderation/types";

/** The players the signed-in user has blocked, most recent first. */
export const getBlockedUsers = async (): Promise<BlockedUser[]> => {
  const response = await apiRequest<{ data: BlockedUser[] }>("get", "/blocks");
  return response.data;
};

export const blockUser = (userId: number): Promise<void> =>
  apiRequest("put", `/blocks/${userId}`);

export const unblockUser = (userId: number): Promise<void> =>
  apiRequest("delete", `/blocks/${userId}`);

export const reportUser = (data: ReportInput): Promise<void> =>
  apiRequest("post", "/reports", { data });
