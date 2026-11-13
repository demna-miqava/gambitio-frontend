export const enum GAME_MESSAGE_TYPES {
  // Game actions (client -> server)
  MOVE = "move",
  RESIGN = "resign",
  // Hint that a clock reached zero; the server checks its own clock
  TIMEOUT = "timeout",
  ABORT = "abort",

  // Draw actions
  DRAW_OFFER = "draw_offer",
  DRAW_RESPONSE = "draw_response",

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
}
