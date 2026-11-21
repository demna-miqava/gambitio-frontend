export enum NOTIFICATION_MESSAGE_TYPES {
  // Outgoing challenge actions
  CHALLENGE_SENT = "challenge_sent",
  CHALLENGE_ACCEPTED = "challenge_accepted",
  CHALLENGE_DECLINED = "challenge_declined",
  /**
   * Withdraw a challenge you sent ({ challengedId }); the challenged player
   * receives the same type with { challengerId } (also when a challenge
   * expires or its sender goes offline).
   */
  CHALLENGE_CANCELLED = "challenge_cancelled",

  // Incoming challenge events
  CHALLENGE_RECEIVED = "challenge_received",
  OPPONENT_UNAVAILABLE = "opponent_unavailable",
  MATCH_CREATED = "match_created",
  /** The player started or finished a live game ({ gameId } or { gameId: null }) */
  ACTIVE_GAME = "active_game",
  /** A series changed outside a game (e.g. resigned): { series } */
  SERIES_UPDATED = "series_updated",
  /** A friend added you to a study room: { roomId, name, from } */
  STUDY_INVITE = "study_invite",
  /** A friend request or friendship with someone changed: { event, user } */
  FRIENDS_UPDATED = "friends_updated",
  /** A friend saved a table game naming you: confirm or decline it (TableGameRequest) */
  TABLE_GAME_REQUEST = "table_game_request",
  /** A table game request was confirmed or declined: { gameId, confirmed } */
  TABLE_GAME_ANSWERED = "table_game_answered",
  /** The player blocked or unblocked someone (in any tab): refresh the lists */
  BLOCKS_UPDATED = "blocks_updated",
  /** Puzzle duels: an invite came in or went out ({ invite }) */
  DUEL_INVITE = "duel_invite",
  DUEL_INVITE_SENT = "duel_invite_sent",
  /** An invite was declined, cancelled or lapsed ({ inviteId, status }) */
  DUEL_INVITE_CLOSED = "duel_invite_closed",
  /** A duel the player is in started ({ duelId, startsAt, endsAt }) */
  DUEL_STARTED = "duel_started",
  /** The other player's (or your own) score and strikes ({ duelId, userId, score, strikes, out }) */
  DUEL_PROGRESS = "duel_progress",
  /** A duel ended ({ duelId, winnerId, endReason, scores }) */
  DUEL_ENDED = "duel_ended",
  ERROR = "error",
}
