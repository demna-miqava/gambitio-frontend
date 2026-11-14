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
  ERROR = "error",
}
