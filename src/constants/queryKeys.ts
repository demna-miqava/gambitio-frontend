export const QKEY_USER_PROFILE = "user-profile";
export const QKEY_USER_GAMES = "user-games";
export const QKEY_GAME_BY_ID = "game";
/** A shared game, by its link's token (no sign-in) */
export const QKEY_SHARED_GAME = "shared-game";
/** A game's share link, for its players */
export const QKEY_GAME_SHARE_LINK = "game-share-link";
export const QKEY_USER_FRIENDS = "user-friends";
export const QKEY_SUGGESTED_FRIENDS = "suggested-friends";
export const QKEY_PENDING_FRIEND_REQUESTS = "pending-friend-requests";
export const QKEY_USER_SETTINGS = "user-settings";
export const QKEY_CHALLENGES = "challenges";
export const QKEY_BLOCKED_USERS = "blocked-users";
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
/** The tournament lists (open, finished) */
export const QKEY_TOURNAMENTS = "tournaments";
/** One tournament's lobby: the tournament, standings, live games, own line */
export const QKEY_TOURNAMENT = "tournament";
/** A page of a tournament's standings past the first */
export const QKEY_TOURNAMENT_STANDINGS = "tournament-standings";
export const QKEY_LIVE_GAMES_FRIENDS = "live-games-friends";
export const QKEY_LIVE_GAMES_TOP = "live-games-top";
/** The signed-in user's friends who are online or playing */
export const QKEY_FRIEND_STATUSES = "friend-statuses";
export const QKEY_SERIES = "series";
export const QKEY_USER_SERIES = "user-series";
export const QKEY_HEAD_TO_HEAD = "head-to-head";
export const QKEY_REPERTOIRE = "repertoire";
export const QKEY_REPERTOIRE_CHECK = "repertoire-check";
export const QKEY_STUDY_ROOMS = "study-rooms";
export const QKEY_ENDGAME_PROGRESS = "endgame-progress";
/** The coordinates trainer's bests and latest runs */
export const QKEY_COORDINATE_SCORES = "coordinate-scores";
/** Puzzle duel invites to and from the signed-in player */
export const QKEY_DUEL_INVITES = "duel-invites";
/** One puzzle duel as the signed-in player sees it: [key, duelId] */
export const QKEY_DUEL = "duel";
/** The duel the signed-in player is in now, if any */
export const QKEY_ACTIVE_DUEL = "active-duel";
export const QKEY_ENDGAME_TABLEBASE = "endgame-tablebase";
export const QKEY_STARTING_OPENINGS = "starting-openings";
export const QKEY_CONVERSION_DRILLS = "conversion-drills";

/** Friends' table games waiting for the signed-in player to confirm */
export const QKEY_TABLE_GAME_REQUESTS = "table-game-requests";
/** Table mode's friend picker: [key, userId, search] */
export const QKEY_TABLE_FRIEND_PICKER = "table-friend-picker";
