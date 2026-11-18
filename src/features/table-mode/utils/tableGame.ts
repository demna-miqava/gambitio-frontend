import { Chess } from "chess.js";

/**
 * Table mode: two people at a real board, one phone as the clock and the
 * move recorder. The game lives in the browser (this reducer, persisted to
 * localStorage so a reload keeps it) and is stored once over; the server
 * replays it and checks the result (backend src/game/tableGame.ts).
 *
 * Time is passed in (`now`, ms since the epoch) so the clocks follow the
 * wall clock (as rushRun does): a clock keeps running while the tab is in
 * the background or the page reloads.
 */
export type Side = "white" | "black";

export type TableOpponent =
  | { kind: "guest"; name: string }
  | { kind: "friend"; userId: number; username: string };

export interface TableSetup {
  /** Each side's starting clock in seconds (time odds when they differ) */
  whiteTime: number;
  blackTime: number;
  /** Seconds added after each move */
  increment: number;
  /** The signed-in player's side */
  recorderColor: Side;
  recorderName: string;
  opponent: TableOpponent;
  /** No board: each half is a button. Such a game isn't saved */
  clockOnly: boolean;
}

export type TableEndReason =
  | "checkmate"
  | "stalemate"
  | "insufficient_material"
  | "threefold_repetition"
  | "fifty_move_rule"
  | "resignation"
  | "draw_agreement"
  | "timeout"
  | "timeout_vs_insufficient_material";

export interface TableResult {
  result: "white_win" | "black_win" | "draw";
  endReason: TableEndReason;
}

/** ready: nobody has started the clock; running; paused; over */
export type TableStatus = "ready" | "running" | "paused" | "over";

export interface TableGameState {
  /** Bumped when the stored shape changes (see parseTableGame) */
  v: 1;
  id: string;
  createdAt: number;
  setup: TableSetup;
  /** The moves in SAN (empty in clock-only mode) */
  moves: string[];
  /** Turns ended in clock-only mode (moves stand for them otherwise) */
  turns: number;
  /** Whose clock is (or would be) running */
  turn: Side;
  /** Time left in ms, as of turnStartedAt for the side to move */
  remaining: Record<Side, number>;
  /** When the running clock started this stretch; null unless running */
  turnStartedAt: number | null;
  status: TableStatus;
  /** A draw offer waiting for the other side */
  drawOffer: Side | null;
  result: TableResult | null;
  endedAt: number | null;
  /** The stored game once the server has it, so a reload doesn't save it twice */
  savedGameId?: number;
}

export type TableAction =
  | { type: "start"; now: number }
  | { type: "move"; san: string; now: number }
  /** Clock only: the side to move ends their turn */
  | { type: "tap"; side: Side; now: number }
  | { type: "tick"; now: number }
  | { type: "pause"; now: number }
  | { type: "resume"; now: number }
  /** While paused: the last move goes, and its side is to move again */
  | { type: "takeback" }
  | { type: "resign"; side: Side; now: number }
  | { type: "offer_draw"; side: Side }
  | { type: "answer_draw"; side: Side; accept: boolean; now: number }
  /** The server stored the finished game */
  | { type: "saved"; gameId: number };

export const other = (side: Side): Side => (side === "white" ? "black" : "white");

/**
 * A new game's id. It is also the save's idempotency key (tableClientId),
 * so only letters, digits and "-": a UUID, or failing that the time and a
 * random part in base 36.
 */
export const newTableGameId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

export const newTableGame = (setup: TableSetup, now: number, id: string): TableGameState => ({
  v: 1,
  id,
  createdAt: now,
  setup,
  moves: [],
  turns: 0,
  turn: "white",
  remaining: { white: setup.whiteTime * 1000, black: setup.blackTime * 1000 },
  turnStartedAt: null,
  status: "ready",
  drawOffer: null,
  result: null,
  endedAt: null,
});

/**
 * A game on the device that isn't over yet (ready, running or paused): it
 * blocks setting up another, which would overwrite it.
 */
export const isInProgress = (state: TableGameState | null): state is TableGameState =>
  state !== null && state.status !== "over";

/** Time left on a side's clock at `now` (ms, never below 0). */
export const timeLeft = (state: TableGameState, side: Side, now: number): number => {
  const base = state.remaining[side];
  if (state.status !== "running" || side !== state.turn || state.turnStartedAt === null) return Math.max(0, base);
  // A `now` read a moment before the clock started (a clock's last tick) counts as no time yet
  return Math.max(0, base - Math.max(0, now - state.turnStartedAt));
};

/** The game so far on a board (chess.js). */
export const boardOf = (state: Pick<TableGameState, "moves">): Chess => {
  const chess = new Chess();
  for (const san of state.moves) chess.move(san);
  return chess;
};

/**
 * Whether `side` could still mate: the server's rule (backend engine.ts
 * canStillMate, FIDE 6.9): not with a bare king, or a king and one minor piece.
 */
export const canStillMate = (chess: Chess, side: Side): boolean => {
  const color = side === "white" ? "w" : "b";
  const pieces = chess
    .board()
    .flat()
    .filter((sq) => sq !== null && sq.color === color && sq.type !== "k");
  if (pieces.length === 0) return false;
  return !(pieces.length === 1 && (pieces[0]!.type === "b" || pieces[0]!.type === "n"));
};

const winFor = (side: Side): "white_win" | "black_win" => (side === "white" ? "white_win" : "black_win");

/** The result when `flagged` runs out of time; without a board it is a plain loss. */
export const flagResult = (state: Pick<TableGameState, "moves" | "setup">, flagged: Side): TableResult => {
  if (!state.setup.clockOnly && !canStillMate(boardOf(state), other(flagged))) {
    return { result: "draw", endReason: "timeout_vs_insufficient_material" };
  }
  return { result: winFor(other(flagged)), endReason: "timeout" };
};

/** A result the position decides (the server's detectOutcome), or null. */
export const positionResult = (chess: Chess): TableResult | null => {
  if (chess.isCheckmate()) return { result: winFor(chess.turn() === "w" ? "black" : "white"), endReason: "checkmate" };
  if (chess.isStalemate()) return { result: "draw", endReason: "stalemate" };
  if (chess.isInsufficientMaterial()) return { result: "draw", endReason: "insufficient_material" };
  if (chess.isThreefoldRepetition()) return { result: "draw", endReason: "threefold_repetition" };
  if (chess.isDrawByFiftyMoves()) return { result: "draw", endReason: "fifty_move_rule" };
  return null;
};

const end = (state: TableGameState, result: TableResult, now: number): TableGameState => ({
  ...state,
  status: "over",
  result,
  endedAt: now,
  // Clocks as they stood at the end
  remaining: { white: timeLeft(state, "white", now), black: timeLeft(state, "black", now) },
  turnStartedAt: null,
  drawOffer: null,
});

/** The running side's flag has fallen: the game ends on time. */
const flagged = (state: TableGameState, now: number): TableGameState | null =>
  state.status === "running" && timeLeft(state, state.turn, now) <= 0 ? end(state, flagResult(state, state.turn), now) : null;

/** Ends the side to move's turn: their clock stops (plus the increment) and the other's starts. */
const switchClocks = (state: TableGameState, now: number): TableGameState => {
  const side = state.turn;
  return {
    ...state,
    remaining: { ...state.remaining, [side]: timeLeft(state, side, now) + state.setup.increment * 1000 },
    turn: other(side),
    turnStartedAt: now,
    drawOffer: null,
  };
};

export const tableGameReducer = (state: TableGameState, action: TableAction): TableGameState => {
  switch (action.type) {
    case "start":
      return state.status === "ready" ? { ...state, status: "running", turnStartedAt: action.now } : state;

    case "move": {
      if (state.status !== "running" || state.setup.clockOnly) return state;
      const late = flagged(state, action.now);
      if (late) return late;
      const chess = boardOf(state);
      let san: string;
      try {
        san = chess.move(action.san).san;
      } catch {
        return state;
      }
      const next = { ...switchClocks(state, action.now), moves: [...state.moves, san], turns: state.turns + 1 };
      const decided = positionResult(chess);
      return decided ? end(next, decided, action.now) : next;
    }

    case "tap": {
      if (state.status === "ready" && state.setup.clockOnly && action.side === "black") {
        // As at a real clock: Black's press starts White's clock
        return { ...state, status: "running", turnStartedAt: action.now };
      }
      if (state.status !== "running" || !state.setup.clockOnly || action.side !== state.turn) return state;
      const late = flagged(state, action.now);
      if (late) return late;
      return { ...switchClocks(state, action.now), turns: state.turns + 1 };
    }

    case "tick":
      return flagged(state, action.now) ?? state;

    case "pause": {
      if (state.status !== "running") return state;
      const late = flagged(state, action.now);
      if (late) return late;
      return {
        ...state,
        status: "paused",
        remaining: { ...state.remaining, [state.turn]: timeLeft(state, state.turn, action.now) },
        turnStartedAt: null,
      };
    }

    case "resume":
      return state.status === "paused" ? { ...state, status: "running", turnStartedAt: action.now } : state;

    case "takeback": {
      if (state.status !== "paused" || state.setup.clockOnly || state.moves.length === 0) return state;
      const side = other(state.turn);
      return {
        ...state,
        moves: state.moves.slice(0, -1),
        turns: state.turns - 1,
        turn: side,
        // The increment that move earned goes back
        remaining: { ...state.remaining, [side]: Math.max(0, state.remaining[side] - state.setup.increment * 1000) },
        drawOffer: null,
      };
    }

    case "resign":
      if (state.status === "over" || state.status === "ready") return state;
      return end(state, { result: winFor(other(action.side)), endReason: "resignation" }, action.now);

    case "offer_draw":
      if (state.status === "over" || state.status === "ready" || state.drawOffer) return state;
      return { ...state, drawOffer: action.side };

    case "saved":
      return state.status === "over" && state.savedGameId === undefined ? { ...state, savedGameId: action.gameId } : state;

    case "answer_draw": {
      if (state.drawOffer === null || state.drawOffer === action.side || state.status === "over") return state;
      if (!action.accept) return { ...state, drawOffer: null };
      return end(state, { result: "draw", endReason: "draw_agreement" }, action.now);
    }
  }
};

/** The game as PGN, for saving (the server replays it) and for the analysis board. */
export const tableGamePgn = (state: TableGameState): string => {
  const chess = boardOf(state);
  const { setup } = state;
  const opponentName = setup.opponent.kind === "guest" ? setup.opponent.name : setup.opponent.username;
  const white = setup.recorderColor === "white" ? setup.recorderName : opponentName;
  const black = setup.recorderColor === "white" ? opponentName : setup.recorderName;
  chess.setHeader("Event", "Table game");
  chess.setHeader("Site", "Gambitio");
  chess.setHeader("Date", new Date(state.createdAt).toISOString().slice(0, 10).replace(/-/g, "."));
  chess.setHeader("White", white);
  chess.setHeader("Black", black);
  const result = state.result?.result;
  chess.setHeader("Result", result === "white_win" ? "1-0" : result === "black_win" ? "0-1" : result === "draw" ? "1/2-1/2" : "*");
  return chess.pgn();
};

/** "Checkmate", "Resignation", "Flag fell"... for the result screen */
export const describeEnd = (result: TableResult, names: Record<Side, string>): string => {
  const winner = result.result === "white_win" ? names.white : result.result === "black_win" ? names.black : null;
  const how: Record<TableEndReason, string> = {
    checkmate: "by checkmate",
    resignation: "by resignation",
    timeout: "on time",
    stalemate: "by stalemate",
    insufficient_material: "by insufficient material",
    threefold_repetition: "by repetition",
    fifty_move_rule: "by the fifty-move rule",
    draw_agreement: "by agreement",
    timeout_vs_insufficient_material: "on time: the other side can't mate",
  };
  return winner ? `${winner} won ${how[result.endReason]}` : `Draw ${how[result.endReason]}`;
};
