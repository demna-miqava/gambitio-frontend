export const enum GAME_MESSAGE_TYPES {
  // Game actions (client -> server)
  MOVE = "move",
  RESIGN = "resign",
  // Hint that a clock reached zero; the server checks its own clock
  TIMEOUT = "timeout",
  ABORT = "abort",
  // Adds GIVE_TIME_MS to the opponent's clock
  GIVE_TIME = "give_time",

  // Draw actions
  DRAW_OFFER = "draw_offer",
  DRAW_RESPONSE = "draw_response",

  // Takeback actions. TAKEBACK_REQUEST and TAKEBACK_RESPONSE go both ways
  // (the opponent gets the request; the requester gets a decline)
  TAKEBACK_REQUEST = "takeback_request",
  TAKEBACK_RESPONSE = "takeback_response",

  // Rematch actions
  REMATCH_REQUEST = "rematch_request",
  REMATCH_RESPONSE = "rematch_response",
  CANCEL_REMATCH = "cancel_rematch",
  // Ask for the full state again (answered with initial_game_state)
  SYNC = "sync",
  REMATCH_CANCELED = "rematch_canceled",
  MATCH_FOUND = "match_found",

  // Game state (server -> client)
  GAME_ENDED = "game_ended",
  INITIAL_GAME_STATE = "initial_game_state",
  MOVE_REJECTED = "move_rejected",
  ERROR = "error",
  // How many people are watching (non-players); sent to everyone on the game
  SPECTATORS = "spectators",
  // A player gave the other time; sent to everyone on the game
  TIME_ADDED = "time_added",
  // A takeback was accepted: the new position; sent to everyone on the game
  TAKEBACK = "takeback",
}
