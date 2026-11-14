export const QKEY_USER_PROFILE = "user-profile";
export const QKEY_USER_GAMES = "user-games";
export const QKEY_GAME_BY_ID = "game";
export const QKEY_USER_FRIENDS = "user-friends";
export const QKEY_SUGGESTED_FRIENDS = "suggested-friends";
export const QKEY_PENDING_FRIEND_REQUESTS = "pending-friend-requests";
export const QKEY_USER_SETTINGS = "user-settings";
export const QKEY_CHALLENGES = "challenges";
export const QKEY_PROFILE_STATUS = "profile-status";
/**
 * The signed-in account's profile status. Keyed by Clerk user id so one
 * account never reads another's cached status (AuthGuard decides from it).
 */
export const profileStatusKey = (userId: string | null | undefined) =>
  [QKEY_PROFILE_STATUS, userId ?? null] as const;
export const QKEY_USERNAME_AVAILABILITY = "username-availability";
export const QKEY_USER_STATS = "user-stats";
export const QKEY_USER_STATS_SUMMARY = "user-stats-summary";
export const QKEY_ACTIVE_GAME = "active-game";
export const QKEY_LEADERBOARD = "leaderboard";
export const QKEY_GAME_REVIEW = "game-review";
export const QKEY_LIVE_GAMES_FRIENDS = "live-games-friends";
export const QKEY_LIVE_GAMES_TOP = "live-games-top";
export const QKEY_SERIES = "series";
export const QKEY_USER_SERIES = "user-series";
export const QKEY_HEAD_TO_HEAD = "head-to-head";
export const QKEY_REPERTOIRE = "repertoire";
export const QKEY_REPERTOIRE_CHECK = "repertoire-check";
export const QKEY_STUDY_ROOMS = "study-rooms";
export const QKEY_ENDGAME_PROGRESS = "endgame-progress";
export const QKEY_ENDGAME_TABLEBASE = "endgame-tablebase";
