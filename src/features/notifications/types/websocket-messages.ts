import type { PlayerColorOption } from "@/types/game.types";
import { NOTIFICATION_MESSAGE_TYPES } from "../constants/websocket-types";
import type { SeriesSummary } from "@/features/series/types";
import type { OpeningSummary } from "@/features/openings/startingOpenings";

/**
 * Games in a friend match: a single game, a best-of series, or (2) a mirror
 * match, one game with each colour scored as a pair
 */
export type BestOf = 1 | 2 | 3 | 5;

export type SendChallengeMessage = {
  type: NOTIFICATION_MESSAGE_TYPES.CHALLENGE_SENT;
  data: {
    challengedId: number;
    color: PlayerColorOption;
    /** The sender's own clock, in seconds */
    time: number;
    increment: number;
    /**
     * Time odds: the challenged player's clock, when it differs from the
     * sender's. Such a game is unrated.
     */
    opponentTime?: number;
    /** 3 or 5 plays a series, 2 a mirror match; 1 (the default) a single game */
    bestOf?: BestOf;
    /**
     * False plays a casual game (or series): no rating changes. Defaults to
     * rated. Ignored when continuing a series, which keeps its own setting.
     */
    rated?: boolean;
    /**
     * Start from this opening (GET /openings) instead of the initial
     * position; every game of a series does. Ignored when continuing a series.
     */
    openingId?: string;
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
    /**
     * The version of the challenge the player saw. The server refuses the
     * accept with CHALLENGE_CHANGED if the challenger changed the terms
     * since, and sends the new challenge.
     */
    version?: number;
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
    /** Time odds: the receiver's clock and the challenger's; null for an even game */
    ownTime?: number | null;
    opponentTime?: number | null;
    createdAt: string;
    /** Challenger's rating for this time control */
    rating?: number;
    bestOf?: BestOf;
    /** Set when accepting plays the next game of an existing series */
    seriesId?: number;
    seriesGame?: number;
    /** False for a casual game or series (always with time odds) */
    rated?: boolean;
    /** The opening the game starts from; null for the initial position */
    opening?: OpeningSummary | null;
    /** Changes whenever the challenger changes the terms; sent back when accepting */
    version?: number;
  };
};

/** The client message a reply answers, as echoed back by the server */
export type EchoedRequest = {
  type?: NOTIFICATION_MESSAGE_TYPES;
  data?: { challengedId?: number; challengerId?: number; version?: number };
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
    /** Time odds: this player's clock and the opponent's; null for an even game */
    ownTime?: number | null;
    opponentTime?: number | null;
    /** False for a game with time odds */
    rated?: boolean;
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
  /** The longer clock when the challenge has time odds */
  time: number;
  increment: number;
  /** Time odds: your clock and the challenger's; null or missing for an even game */
  ownTime?: number | null;
  opponentTime?: number | null;
  createdAt: string;
  /** Challenger's rating for this time control */
  rating?: number;
  bestOf?: BestOf;
  /** Set when accepting plays the next game of an existing series (null over REST) */
  seriesId?: number | null;
  seriesGame?: number | null;
  /** False for a casual game or series (always with time odds); missing means rated */
  rated?: boolean;
  /** The opening the game starts from; null or missing for the initial position */
  opening?: OpeningSummary | null;
  /**
   * Changes whenever the challenger changes the terms (REST and socket);
   * sent back when accepting, so the player only accepts what they saw
   */
  version?: number;
};

/** What accepting a challenge needs to name it */
export type ChallengeRef = Pick<Challenge, "challengerId" | "version">;

/** A challenge the signed-in user sent and is waiting on. */
export type OutgoingChallenge = {
  challengedId: number;
  username: string;
  color: PlayerColorOption;
  /** The longer clock when the challenge has time odds */
  time: number;
  increment: number;
  /** Time odds: your clock and the challenged player's; null or missing for an even game */
  ownTime?: number | null;
  opponentTime?: number | null;
  /** When it was sent (ms), for the client-side expiry */
  sentAt: number;
  bestOf?: BestOf;
  /** False for a casual game or series (always with time odds) */
  rated?: boolean;
  /** The opening the game starts from; null or missing for the initial position */
  opening?: OpeningSummary | null;
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

/** What the other user did, from the point of view of the one being told */
export type FriendsUpdatedEvent =
  | "request_received"
  | "request_accepted"
  | "request_declined"
  | "request_cancelled"
  | "removed";

/** A friend request or friendship with another player changed */
export type FriendsUpdatedNotification = {
  type: NOTIFICATION_MESSAGE_TYPES.FRIENDS_UPDATED;
  data: {
    event: FriendsUpdatedEvent;
    /** The other player; username is set for request_received and request_accepted */
    user: { id: number; username?: string; avatarUrl?: string | null };
  };
};

/** The signed-in player blocked or unblocked someone, here or in another tab */
export type BlocksUpdatedNotification = {
  type: NOTIFICATION_MESSAGE_TYPES.BLOCKS_UPDATED;
  data: Record<string, never>;
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
  | StudyInviteNotification
  | FriendsUpdatedNotification
  | BlocksUpdatedNotification;
