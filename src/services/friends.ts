import { apiRequest } from ".";
import type { Friend, FriendStatus, PaginatedOpponentsResponse } from "@/types";
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

/**
 * A page of the signed-in user's friends in the order you'd pick an
 * opponent: online first, then playing, then most recently played, then by
 * name. `query`: page, limit and an optional q (username search).
 */
export const getFriendOpponents = (query: string): Promise<PaginatedOpponentsResponse> =>
  apiRequest("get", `/friends/opponents?${query}`);
