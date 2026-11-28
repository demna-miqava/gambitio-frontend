import { GAME_MESSAGE_TYPES } from "../constants/websocket-types";
import type { SeriesSummary } from "@/features/series/types";
import type { ChatMessage, ChatState } from "@/features/game-chat/types";
import type { SpectatorChatMessage, SpectatorChatState } from "@/features/spectator-chat/types";

export type DrawOfferMessage = {
  type: GAME_MESSAGE_TYPES.DRAW_OFFER;
};

export type DrawResponseMessage = {
  type: GAME_MESSAGE_TYPES.DRAW_RESPONSE;
  accepted: boolean;
  userId?: number;
};

/** To the requester's opponent: answer with a takeback_response */
export type TakebackRequestMessage = {
  type: GAME_MESSAGE_TYPES.TAKEBACK_REQUEST;
};

/** To the requester, when the opponent declined (an accept sends TakebackMessage) */
export type TakebackResponseMessage = {
  type: GAME_MESSAGE_TYPES.TAKEBACK_RESPONSE;
  accepted: boolean;
};

/**
 * A takeback was accepted; sent to both players and spectators. The game is
 * now this position, `moveNumber` half-moves in; the clocks as of now.
 */
export type TakebackMessage = {
  type: GAME_MESSAGE_TYPES.TAKEBACK;
  fen: string;
  pgn: string;
  moveNumber: number;
  clockRunning: boolean;
  whiteTimeLeft: number;
  blackTimeLeft: number;
};

export type RatingChanges = {
  whiteRatingChange: number;
  blackRatingChange: number;
  whiteNewRating: number;
  blackNewRating: number;
};

export type GameEndReason =
  | "resignation"
  /** The winner claimed the game after the other player left it */
  | "abandonment"
  | "draw_agreement"
  | "aborted"
  | "checkmate"
  | "timeout"
  | "timeout_vs_insufficient_material"
  | "stalemate"
  | "threefold_repetition"
  | "insufficient_material"
  | "fifty_move_rule";

export type GameResult = "white_win" | "black_win" | "draw" | "aborted";

export type GameEndedMessage = {
  type: GAME_MESSAGE_TYPES.GAME_ENDED;
  reason: GameEndReason;
  result: GameResult;
  winnerId: number | null;
  ratingChanges?: RatingChanges;
  /** The series score after this game, when it was a series game */
  series?: SeriesSummary;
};

export type MoveMessage = {
  type: GAME_MESSAGE_TYPES.MOVE;
  move: {
    lan: string;
    san: string;
    from: string;
    to: string;
    promotion?: string;
  };
  userId: number;
  /** Position after the move; a board that doesn't match it asks for a sync */
  fen: string;
  moveNumber: number;
  clockRunning: boolean;
  whiteTimeLeft: number;
  blackTimeLeft: number;
};

/** Sent only to the player whose move the server refused; resync to this position. */
export type MoveRejectedMessage = {
  type: GAME_MESSAGE_TYPES.MOVE_REJECTED;
  message: string;
  fen: string;
  pgn: string;
};

export type GamePlayer = {
  id: number;
  username: string;
  rating: number;
  provisional?: boolean;
  avatarUrl: string | null;
};

export type InitialGameStateMessage = {
  type: GAME_MESSAGE_TYPES.INITIAL_GAME_STATE;
  data: {
    gameId: number;
    fen: string;
    pgn: string;
    whitePlayer: GamePlayer;
    blackPlayer: GamePlayer;
    time: number;
    increment: number;
    status: "in_progress" | "finished";
    numMoves: number;
    isFinished: boolean;
    clockRunning: boolean;
    whiteTimeLeft: number | null;
    blackTimeLeft: number | null;
    drawOfferedBy: number | null;
    /** The player waiting for an answer to a takeback request (players only) */
    takebackRequestedBy?: number | null;
    rematchRequestedBy: number | null;
    /** The game the rematch started, once it has */
    rematchGameId?: number | null;
    /** The friend series this game is part of, as it stands now */
    series?: SeriesSummary | null;
    /** 1-based number of this game in its series */
    seriesGame?: number | null;
    /** The opening the game started from, and the half-moves it played (see Game.startPly) */
    opening?: { id: string; eco: string; name: string } | null;
    startPly?: number;
    /** People watching (not the players); only for games in progress */
    spectators?: number;
    /**
     * The players away from the board right now and for how long, and how
     * long a player must be away before the other may claim the win; only
     * for games in progress (absent from older servers)
     */
    away?: { userId: number; goneForMs: number }[];
    /** The number of the last connection change `away` reflects (see PlayerConnectionMessage) */
    awaySeq?: number;
    claimAfterMs?: number;
    /** The players' chat; absent for spectators */
    chat?: ChatState;
    /** The spectators' chat; absent for the players */
    spectatorChat?: SpectatorChatState;
    result?: GameResult;
    reason?: GameEndReason;
    winnerId?: number | null;
    ratingChanges?: RatingChanges;
  };
};

export type RematchRequestMessage = {
  type: GAME_MESSAGE_TYPES.REMATCH_REQUEST;
};

export type RematchResponseMessage = {
  type: GAME_MESSAGE_TYPES.REMATCH_RESPONSE;
  accepted: boolean;
};

export type CancelRematchMessage = {
  type: GAME_MESSAGE_TYPES.REMATCH_CANCELED;
};

/**
 * A player (`userId`) gave `color` time. The time lefts are both clocks as
 * of now, like a move's.
 */
export type TimeAddedMessage = {
  type: GAME_MESSAGE_TYPES.TIME_ADDED;
  userId: number;
  color: "white" | "black";
  addedMs: number;
  whiteTimeLeft: number;
  blackTimeLeft: number;
};

/** Spectator count changed; players aren't counted. */
export type SpectatorsMessage = {
  type: GAME_MESSAGE_TYPES.SPECTATORS;
  count: number;
};

/**
 * A player left the game (their last connection to it closed) or came back.
 * `seq` numbers the game's connection changes in the order they happened:
 * one that arrives after a newer one for the same player is dropped.
 */
export type PlayerConnectionMessage = {
  type: GAME_MESSAGE_TYPES.PLAYER_CONNECTION;
  data: {
    userId: number;
    connected: boolean;
    seq: number;
    /** For a player who left: how long ago, and the wait before the win can be claimed */
    goneForMs?: number;
    claimAfterMs?: number;
  };
};

export type GameErrorMessage = {
  type: GAME_MESSAGE_TYPES.ERROR;
  /** `request`: the client message the error answers (its type, at least) */
  data: { message: string; code?: string; request?: { type?: string; text?: string } };
};

/** A chat message was stored; sent to both players, the writer included */
export type ChatEventMessage = {
  type: GAME_MESSAGE_TYPES.CHAT;
  data: ChatMessage;
};

/**
 * A player changed their chat setting during the game: whether this player
 * can write now, why not, and the messages they may see.
 */
export type ChatStatusMessage = {
  type: GAME_MESSAGE_TYPES.CHAT_STATUS;
  data: ChatState;
};

/** A spectator chat message was stored; sent to the spectators (the writer included), never the players */
export type SpectatorChatEventMessage = {
  type: GAME_MESSAGE_TYPES.SPECTATOR_CHAT;
  data: SpectatorChatMessage;
};

export type GameWebSocketMessage =
  | DrawOfferMessage
  | DrawResponseMessage
  | TakebackRequestMessage
  | TakebackResponseMessage
  | TakebackMessage
  | GameEndedMessage
  | MoveMessage
  | MoveRejectedMessage
  | InitialGameStateMessage
  | RematchRequestMessage
  | RematchResponseMessage
  | CancelRematchMessage
  | SpectatorsMessage
  | TimeAddedMessage
  | PlayerConnectionMessage
  | ChatEventMessage
  | ChatStatusMessage
  | SpectatorChatEventMessage
  | GameErrorMessage;
