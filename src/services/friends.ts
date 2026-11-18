import { apiRequest } from ".";
import type { Friend, FriendStatus } from "@/types";
import type {
  PendingFriendRequestsResponse,
  SendFriendRequestParams,
} from "@/features/friends/types";

export const getFriendSuggestions = (
  query: string
): Promise<{ data: Friend[] }> => {
  return apiRequest("get", `/friends/suggestions?${query}`);
};

export const sendFriendRequest = (
  data: SendFriendRequestParams
): Promise<void> => {
  return apiRequest("post", "/friend-requests", { data });
};

export const getPendingFriendRequests =
  (): Promise<PendingFriendRequestsResponse> => {
    return apiRequest("get", "/friend-requests/pending");
  };

export const removeFriend = (friendId: number): Promise<void> => {
  return apiRequest("delete", `/friends/${friendId}`);
};

/** The signed-in user's friends who are online or playing: available ones first. */
export const getFriendStatuses = async (): Promise<FriendStatus[]> =>
  (await apiRequest<{ data: FriendStatus[] }>("get", "/friends/status")).data;
