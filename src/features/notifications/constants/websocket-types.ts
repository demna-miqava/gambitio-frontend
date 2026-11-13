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
  ERROR = "error",
}
