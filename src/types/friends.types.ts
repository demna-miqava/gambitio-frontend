import type { TimeControlType } from "./game.types";

export interface Friend {
  id: number;
  username: string;
  avatarUrl: string;
  friendsSince: string;
  blitzRating: number;
  bulletRating: number;
  rapidRating: number;
}

export type PaginatedFriendsResponse = {
  data: Friend[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

/**
 * Base friend action handlers shared across all friend interactions
 */
interface BaseFriendActionHandlers {
  onChallenge?: (friend: Friend) => void;
}

export interface FriendActionHandlers extends BaseFriendActionHandlers {
  onRemove?: (friendId: number) => void;
}

export interface FriendSuggestionActionHandlers
  extends BaseFriendActionHandlers {
  onAddFriend?: (friendId: number) => void;
}

export interface FriendsData {
  friends: Friend[];
  suggestions: Friend[];
}

/**
 * A friend of the signed-in user who is online (has the site open, so they
 * can be challenged) or playing (has a live game in progress). Friends who
 * are neither aren't listed.
 */
export interface FriendStatus extends Friend {
  status: "online" | "playing";
  /** The game in progress, when playing */
  gameId: number | null;
  gameType: TimeControlType | null;
}

/**
 * A friend as someone to play: a friends list item, whether they are online
 * or playing now (null: neither), and when you last played them (null: not
 * recently, or never). The server lists them online first, then playing,
 * then most recently played, then by name.
 */
export interface FriendOpponent extends Friend {
  status: FriendStatus["status"] | null;
  /** The game in progress, when playing */
  gameId: number | null;
  gameType: TimeControlType | null;
  lastPlayedAt: string | null;
}

export type PaginatedOpponentsResponse = {
  data: FriendOpponent[];
  pagination: PaginatedFriendsResponse["pagination"];
};
