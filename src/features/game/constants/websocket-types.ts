export const enum GAME_MESSAGE_TYPES {
  // Game actions (client -> server)
  MOVE = "move",
  RESIGN = "resign",
  // Hint that a clock reached zero; the server checks its own clock
  TIMEOUT = "timeout",
  ABORT = "abort",
  // Adds GIVE_TIME_MS to the opponent's clock
  GIVE_TIME = "give_time",
  // Claims the win against an opponent who has left the game for long enough
  CLAIM_WIN = "claim_win",

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
  // A chat message. Goes both ways: { text } to the server, the stored
  // message back to both players (never to spectators)
  CHAT = "chat",
  // (server -> the two players) How the chat stands now: a player changed
  // who they chat with while the game was on
  CHAT_STATUS = "chat_status",
  // Spectator chat (everyone watching, never the players). Goes both ways:
  // { text } from a spectator to the server, the stored message back to the
  // spectators (the server never sends it to either player)
  SPECTATOR_CHAT = "spectator_chat",
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
  // A player left the game (no socket on it) or came back; sent to everyone on the game
  PLAYER_CONNECTION = "player_connection",
}
