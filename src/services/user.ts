import type { User, UserProfileResponse, PaginatedFriendsResponse } from "@/types";
import type { SignupSkill } from "@/features/auth/profile-setup/types";
import { apiRequest } from ".";

export type ProfileStatusResponse = {
  hasProfile: boolean;
  user: User | null;
};

// The app can't start without this call, so a hanging API should surface the
// "Can't reach Gambitio" screen quickly instead of waiting on the browser's
// own (minutes-long) timeout
const PROFILE_STATUS_TIMEOUT_MS = 5000;

export const getProfileStatus = async (): Promise<ProfileStatusResponse> => {
  return apiRequest<ProfileStatusResponse>("get", "/users/status", {
    timeout: PROFILE_STATUS_TIMEOUT_MS,
  });
};

export type SyncProfileData = {
  username: string;
  skill: SignupSkill;
};

export const syncProfile = async (data: SyncProfileData): Promise<{ message: string; user: User }> => {
  return apiRequest<{ message: string; user: User }>("post", "/users/sync", { data });
};

export const checkUsernameAvailability = async (username: string): Promise<{ available: boolean }> => {
  return apiRequest<{ available: boolean }>("get", "/users/check-username", {
    params: { username },
  });
};

export const getUserProfile = async (userId: number): Promise<UserProfileResponse> => {
  return apiRequest<UserProfileResponse>("get", `/users/${userId}`);
};

export const getUserFriends = async (userId: number, query: string): Promise<PaginatedFriendsResponse> => {
  return apiRequest<PaginatedFriendsResponse>("get", `/users/${userId}/friends?${query}`);
};

/** Deletes the chess profile and the Clerk account (server-side). */
export const deleteMyAccount = async (): Promise<void> => {
  await apiRequest<void>("delete", "/users/me");
};
