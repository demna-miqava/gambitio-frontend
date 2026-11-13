import { MATCHMAKING_MESSAGE_TYPES } from "../constants/websocket-types";

export type PlayerColor = "white" | "black";

export type SearchingMessage = {
  type: MATCHMAKING_MESSAGE_TYPES.SEARCHING;
  data: {
    time: number;
    increment: number | null;
    rating: number;
  };
};

export type MatchFoundMessage = {
  type: MATCHMAKING_MESSAGE_TYPES.MATCH_FOUND;
  data: {
    gameId: number;
    color: PlayerColor;
    opponentId: number;
    opponentRating: number;
    opponentUsername: string;
    time: number;
    increment: number;
    rating: number;
  };
};

export type MatchmakingErrorMessage = {
  type: MATCHMAKING_MESSAGE_TYPES.ERROR;
  data: {
    message: string;
    code?: string;
  };
};

export type MatchmakingMessage =
  | SearchingMessage
  | MatchFoundMessage
  | MatchmakingErrorMessage;
