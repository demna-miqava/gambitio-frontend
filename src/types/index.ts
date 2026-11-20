// User types
export type {
  User,
  AuthResponse,
  UserProfile,
  UserProfileResponse,
} from "./user.types";

// Game types
export type {
  Game,
  StoredGame,
  StoredGameListItem,
  StoredGamePlayer,
  PaginatedGamesResponse,
  GetUserGamesParams,
  TimeControlType,
  GameStatus,
  GamePlayerInfo,
  GameResult,
} from "./game.types";

// Friends types
export type {
  Friend,
  PaginatedFriendsResponse,
  FriendActionHandlers,
  FriendSuggestionActionHandlers,
  FriendsData,
  FriendStatus,
  FriendOpponent,
  PaginatedOpponentsResponse,
} from "./friends.types";

// UI types
export type { SidebarItem } from "./ui.types";
