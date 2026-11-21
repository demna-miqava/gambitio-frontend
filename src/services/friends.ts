import { apiRequest } from ".";
import type { Friend, FriendStatus, PaginatedOpponentsResponse } from "@/types";
import type {
  PendingFriendRequestsResponse,
  SendFriendRequestParams,
} from "@/features/friends/types";

/** Players whose username matches `q` who aren't the user's friends yet. */
export const getFriendSuggestions = (q: string): Promise<{ data: Friend[] }> => {
  return apiRequest("get", "/friends/suggestions", { params: { q } });
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

export type FriendRequestAction = "accept" | "decline" | "cancel";

export type FriendRequestActionParams = {
  requestId: string;
  action: FriendRequestAction;
};

const FRIEND_REQUEST_ACTIONS: Record<
  FriendRequestAction,
  { method: "post" | "delete"; path: string }
> = {
  accept: { method: "post", path: "accept" },
  decline: { method: "post", path: "decline" },
  cancel: { method: "delete", path: "" },
};

/** Accepts or declines a request sent to the user, or cancels one they sent. */
export const handleFriendRequestAction = async (
  params: FriendRequestActionParams
): Promise<void> => {
  const { requestId, action } = params;
  const config = FRIEND_REQUEST_ACTIONS[action];

  const endpoint = `/friend-requests/${requestId}${
    config.path ? `/${config.path}` : ""
  }`;
  return apiRequest(config.method, endpoint);
};

export const removeFriend = (friendId: number): Promise<void> => {
  return apiRequest("delete", `/friends/${friendId}`);
};

/** The signed-in user's friends who are online or playing: available ones first. */
export const getFriendStatuses = async (): Promise<FriendStatus[]> =>
  (await apiRequest<{ data: FriendStatus[] }>("get", "/friends/status")).data;

export type FriendOpponentsParams = {
  page: number;
  limit: number;
  /** Username search; left out of the request when empty */
  q?: string;
};

/**
 * A page of the signed-in user's friends in the order you'd pick an
 * opponent: online first, then playing, then most recently played, then by
 * name.
 */
export const getFriendOpponents = ({
  page,
  limit,
  q,
}: FriendOpponentsParams): Promise<PaginatedOpponentsResponse> =>
  apiRequest("get", "/friends/opponents", {
    params: { page, limit, ...(q && { q }) },
  });
