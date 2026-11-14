import type { PlayerColor } from "@/features/game/types/game.types";

/**
 * Least ply a takeback may go back to (the server's MIN_TAKEBACK_PLY): both
 * players keep a move on the board, so a takeback never reopens the abort
 * window.
 */
export const MIN_TAKEBACK_PLY = 2;

/**
 * Half-moves the server undoes when `requester` asks at `ply`: their own
 * last move, plus the opponent's reply when it's the requester's turn. Null
 * when that would go back before MIN_TAKEBACK_PLY (which also covers a
 * requester who hasn't moved yet), i.e. the server would refuse it.
 */
export const takebackPlies = (ply: number, requester: PlayerColor): number | null => {
  const toMove: PlayerColor = ply % 2 === 0 ? "white" : "black";
  const plies = toMove === requester ? 2 : 1;
  return ply - plies >= MIN_TAKEBACK_PLY ? plies : null;
};

/** Whether the board allows `requester` to ask for a takeback at `ply` */
export const canRequestTakeback = (ply: number, requester: PlayerColor): boolean =>
  takebackPlies(ply, requester) !== null;

const opponentOf = (color: PlayerColor): PlayerColor => (color === "white" ? "black" : "white");

/**
 * The prompt for the opponent's request, seen by `me` at `ply`: accepting
 * undoes the opponent's last move, and this player's reply too when the
 * opponent is to move (see takebackPlies).
 */
export const takebackRequestText = (ply: number, me: PlayerColor): string =>
  takebackPlies(ply, opponentOf(me)) === 2
    ? "Your opponent asked to take back their last move and your reply"
    : "Your opponent asked to take back their last move";

/** A player's view of takeback requests (see useTakeback) */
export interface TakebackState {
  /** The opponent is waiting for this player's answer */
  incoming: boolean;
  /**
   * This player's request is waiting for the opponent's answer: the ply on
   * this board when it was sent (null when there's none)
   */
  sentAtPly: number | null;
  /**
   * Ply at which the opponent declined this player's request: they can't ask
   * again until a move is made. Compared with the board's ply, so a move
   * missed while offline (then resynced) lifts it too.
   */
  declinedAtPly: number | null;
}

export const INITIAL_TAKEBACK_STATE: TakebackState = {
  incoming: false,
  sentAtPly: null,
  declinedAtPly: null,
};

export type TakebackEvent =
  /** This player asked, with `ply` half-moves on this board */
  | { type: "sent"; ply: number }
  /** The opponent asked */
  | { type: "incoming" }
  /** This player answered the opponent's request */
  | { type: "answered" }
  /** The opponent declined this player's request, at `ply` */
  | { type: "declined"; ply: number }
  /**
   * Either player moved (`own`: this player), `moveNumber` half-moves in. The
   * server drops a pending request and a decline's block, except a request
   * this player sent after their own move (the move was shown here before
   * the server confirmed it).
   */
  | { type: "move"; own: boolean; moveNumber: number }
  /** A takeback was accepted */
  | { type: "takeback" }
  /** The server's state (connect, reconnect, sync) */
  | {
      type: "state";
      requestedBy: number | null;
      me: number | undefined;
      finished: boolean;
      /** Half-moves in the server's position */
      ply: number;
    }
  /** The server refused this player's request (`code` says why) or answer, at `ply` */
  | { type: "request_failed"; code?: string; ply: number }
  | { type: "answer_failed" };

/** Server error code for asking again after a decline, before a move */
export const TAKEBACK_DECLINED_CODE = "TAKEBACK_DECLINED";

export const takebackReducer = (state: TakebackState, event: TakebackEvent): TakebackState => {
  switch (event.type) {
    case "sent":
      return { ...state, sentAtPly: event.ply, declinedAtPly: null };
    case "incoming":
      return { ...state, incoming: true };
    case "answered":
    case "answer_failed":
      return { ...state, incoming: false };
    case "declined":
      return { ...state, sentAtPly: null, declinedAtPly: event.ply };
    case "move": {
      const sentAfter =
        event.own && state.sentAtPly !== null && state.sentAtPly >= event.moveNumber;
      return { ...INITIAL_TAKEBACK_STATE, sentAtPly: sentAfter ? state.sentAtPly : null };
    }
    case "takeback":
      return INITIAL_TAKEBACK_STATE;
    case "state": {
      const pending = !event.finished && event.requestedBy !== null;
      return {
        ...state,
        incoming: pending && event.requestedBy !== event.me,
        sentAtPly: pending && event.requestedBy === event.me ? event.ply : null,
      };
    }
    case "request_failed":
      return {
        ...state,
        sentAtPly: null,
        declinedAtPly: event.code === TAKEBACK_DECLINED_CODE ? event.ply : state.declinedAtPly,
      };
  }
};
