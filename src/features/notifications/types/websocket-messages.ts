import type { PlayerColorOption } from "@/types/game.types";
import { NOTIFICATION_MESSAGE_TYPES } from "../constants/websocket-types";
import type { SeriesSummary } from "@/features/series/types";

/** Games in a friend match: a single game, or a best-of series */
export type BestOf = 1 | 3 | 5;

export type SendChallengeMessage = {
  type: NOTIFICATION_MESSAGE_TYPES.CHALLENGE_SENT;
  data: {
    challengedId: number;
    color: PlayerColorOption;
    time: number;
    increment: number;
    /** 3 or 5 plays a series; 1 (the default) a single game */
    bestOf?: BestOf;
    /**
     * Continue this series instead: the server takes the time control,
     * length and colours from it, and the challenged player must be the opponent
     */
    seriesId?: number;
  };
};

export type AcceptChallengeMessage = {
  type: NOTIFICATION_MESSAGE_TYPES.CHALLENGE_ACCEPTED;
  data: {
    challengerId: number;
  };
};

export type DeclineChallengeMessage = {
  type: NOTIFICATION_MESSAGE_TYPES.CHALLENGE_DECLINED;
  data: {
    challengerId: number;
  };
};

export type CancelChallengeMessage = {
  type: NOTIFICATION_MESSAGE_TYPES.CHALLENGE_CANCELLED;
  data: {
    challengedId: number;
  };
};

export type ChallengeReceivedNotification = {
  type: NOTIFICATION_MESSAGE_TYPES.CHALLENGE_RECEIVED;
  data: {
    id: number;
    challengerId: number;
    username: string;
    avatarUrl: string | null;
    // The color the receiving player will play
    color: PlayerColorOption;
    time: number;
    increment: number;
    createdAt: string;
    /** Challenger's rating for this time control */
    rating?: number;
    bestOf?: BestOf;
    /** Set when accepting plays the next game of an existing series */
    seriesId?: number;
    seriesGame?: number;
  };
};

/** The client message a reply answers, as echoed back by the server */
export type EchoedRequest = {
  type?: NOTIFICATION_MESSAGE_TYPES;
  data?: { challengedId?: number; challengerId?: number };
};

export type OpponentUnavailableNotification = {
  type: NOTIFICATION_MESSAGE_TYPES.OPPONENT_UNAVAILABLE;
  data?: { request?: EchoedRequest };
};

export type ChallengeDeclinedNotification = {
  type: NOTIFICATION_MESSAGE_TYPES.CHALLENGE_DECLINED;
  /**
   * Who declined. `reason` is set when nobody declined: the challenge expired
   * unanswered, or was withdrawn because the sender went offline.
   */
  data?: {
    challengedId?: number;
    reason?: "expired" | "offline";
  };
};

/** The challenger withdrew a challenge sent to you */
export type ChallengeCancelledNotification = {
  type: NOTIFICATION_MESSAGE_TYPES.CHALLENGE_CANCELLED;
  data: {
    challengerId: number;
    /** "declined": you declined it (in another tab), so there's nothing to say */
    reason?: "declined";
  };
};

export type MatchCreatedNotification = {
  type: NOTIFICATION_MESSAGE_TYPES.MATCH_CREATED;
  data: {
    gameId: number;
    opponentId: number;
    opponentUsername: string;
    opponentRating: number;
    color: "white" | "black";
    time: number;
    increment: number;
  };
};

export type ChallengeErrorNotification = {
  type: NOTIFICATION_MESSAGE_TYPES.ERROR;
  data: {
    message: string;
    code?: string;
    request?: EchoedRequest;
  };
};

export type Challenge = {
  id: number;
  challengerId: number;
  username: string;
  avatarUrl: string | null;
  color: PlayerColorOption;
  time: number;
  increment: number;
  createdAt: string;
  /** Challenger's rating for this time control */
  rating?: number;
  bestOf?: BestOf;
  /** Set when accepting plays the next game of an existing series (null over REST) */
  seriesId?: number | null;
  seriesGame?: number | null;
};

/** A challenge the signed-in user sent and is waiting on. */
export type OutgoingChallenge = {
  challengedId: number;
  username: string;
  color: PlayerColorOption;
  time: number;
  increment: number;
  /** When it was sent (ms), for the client-side expiry */
  sentAt: number;
  bestOf?: BestOf;
  /** Set when it continues a series: the game it would start */
  seriesId?: number;
  seriesGame?: number;
};

export type ActiveGameNotification = {
  type: NOTIFICATION_MESSAGE_TYPES.ACTIVE_GAME;
  data: { gameId: number | null };
};

/** A series changed outside a game (resigned) */
export type SeriesUpdatedNotification = {
  type: NOTIFICATION_MESSAGE_TYPES.SERIES_UPDATED;
  data: { series: SeriesSummary };
};

/** A friend added you to their study room */
export type StudyInviteNotification = {
  type: NOTIFICATION_MESSAGE_TYPES.STUDY_INVITE;
  data: { roomId: number; name: string; from: { id: number; username: string } };
};

export type NotificationWebSocketMessage =
  | ActiveGameNotification
  | ChallengeReceivedNotification
  | OpponentUnavailableNotification
  | ChallengeDeclinedNotification
  | ChallengeCancelledNotification
  | MatchCreatedNotification
  | ChallengeErrorNotification
  | SeriesUpdatedNotification
  | StudyInviteNotification;
