import { describe, expect, it } from "vitest";
import {
  INITIAL_TAKEBACK_STATE,
  TAKEBACK_DECLINED_CODE,
  canRequestTakeback,
  takebackPlies,
  takebackReducer,
  takebackRequestText,
  type TakebackEvent,
  type TakebackState,
} from "./takeback";

const run = (events: TakebackEvent[], from: TakebackState = INITIAL_TAKEBACK_STATE) =>
  events.reduce(takebackReducer, from);

describe("takebackPlies", () => {
  it("undoes the requester's move and the reply when it's their turn", () => {
    // 1.e4 e5 2.Nf3 Nc6: white to move asks, back to 1.e4 e5
    expect(takebackPlies(4, "white")).toBe(2);
    // 1.e4 e5 2.Nf3 Nc6 3.Bb5: black to move asks, back to 1.e4 e5 2.Nf3
    expect(takebackPlies(5, "black")).toBe(2);
  });

  it("undoes only the requester's move while the opponent is to move", () => {
    // 1.e4 e5 2.Nf3: white asks, back to 1.e4 e5
    expect(takebackPlies(3, "white")).toBe(1);
    expect(takebackPlies(4, "black")).toBe(1);
  });

  it("never goes back before both players have a move on the board", () => {
    expect(takebackPlies(0, "white")).toBeNull();
    expect(takebackPlies(1, "white")).toBeNull();
    expect(takebackPlies(2, "black")).toBeNull();
    expect(takebackPlies(2, "white")).toBeNull();
    expect(takebackPlies(3, "black")).toBeNull();
  });
});

describe("canRequestTakeback", () => {
  it("follows takebackPlies", () => {
    expect(canRequestTakeback(3, "white")).toBe(true);
    expect(canRequestTakeback(3, "black")).toBe(false);
    expect(canRequestTakeback(4, "white")).toBe(true);
    expect(canRequestTakeback(4, "black")).toBe(true);
  });
});

describe("takebackRequestText", () => {
  it("says when accepting also undoes this player's reply", () => {
    // 1.e4 e5 2.Nf3 Nc6, white (to move) asked: black's Nc6 goes too
    expect(takebackRequestText(4, "black")).toBe(
      "Your opponent asked to take back their last move and your reply"
    );
    // 1.e4 e5 2.Nf3, white asked: only Nf3
    expect(takebackRequestText(3, "black")).toBe("Your opponent asked to take back their last move");
    expect(takebackRequestText(5, "white")).toBe(
      "Your opponent asked to take back their last move and your reply"
    );
  });
});

describe("takebackReducer", () => {
  const sent = (ply: number): TakebackEvent => ({ type: "sent", ply });
  const move = (moveNumber: number, own = false): TakebackEvent => ({ type: "move", own, moveNumber });

  it("waits for an answer after asking, and is blocked at that ply after a decline", () => {
    expect(run([sent(6)])).toEqual({ incoming: false, sentAtPly: 6, declinedAtPly: null });
    expect(run([sent(7), { type: "declined", ply: 7 }])).toEqual({
      incoming: false,
      sentAtPly: null,
      declinedAtPly: 7,
    });
  });

  it("drops pending requests both ways and the decline's block on any move", () => {
    const pending = { incoming: true, sentAtPly: 5, declinedAtPly: 5 };
    expect(run([move(6)], pending)).toEqual(INITIAL_TAKEBACK_STATE);
    expect(run([move(6, true)], pending)).toEqual(INITIAL_TAKEBACK_STATE);
    expect(run([{ type: "takeback" }], pending)).toEqual(INITIAL_TAKEBACK_STATE);
  });

  it("keeps a request sent right after this player's own move, before the server confirmed it", () => {
    // Played the 7th half-move, asked at once, then the move came back
    expect(run([sent(7), move(7, true)])).toEqual({ incoming: false, sentAtPly: 7, declinedAtPly: null });
    // The opponent's reply drops it
    expect(run([sent(7), move(7, true), move(8)]).sentAtPly).toBeNull();
  });

  it("shows the opponent's request until it's answered", () => {
    expect(run([{ type: "incoming" }]).incoming).toBe(true);
    expect(run([{ type: "incoming" }, { type: "answered" }]).incoming).toBe(false);
    // e.g. the opponent moved first, so there was nothing left to answer
    expect(run([{ type: "incoming" }, { type: "answer_failed" }]).incoming).toBe(false);
  });

  it("takes a pending request from the server's state on (re)connect", () => {
    const state = (requestedBy: number | null, finished = false): TakebackEvent => ({
      type: "state",
      requestedBy,
      me: 1,
      finished,
      ply: 10,
    });
    expect(run([state(2)])).toMatchObject({ incoming: true, sentAtPly: null });
    expect(run([state(1)])).toMatchObject({ incoming: false, sentAtPly: 10 });
    expect(run([state(null)], { incoming: true, sentAtPly: 9, declinedAtPly: null })).toMatchObject({
      incoming: false,
      sentAtPly: null,
    });
    expect(run([state(2, true)])).toMatchObject({ incoming: false, sentAtPly: null });
    // A decline isn't in the server's state; it stays until the ply moves on
    expect(run([state(null)], { incoming: false, sentAtPly: null, declinedAtPly: 9 }).declinedAtPly).toBe(9);
  });

  it("stops waiting when the server refuses the request", () => {
    expect(run([sent(3), { type: "request_failed", code: "TAKEBACK_NOT_ALLOWED", ply: 3 }])).toEqual(
      INITIAL_TAKEBACK_STATE
    );
    // Asked again after a decline this device missed (e.g. it reloaded)
    expect(run([sent(6), { type: "request_failed", code: TAKEBACK_DECLINED_CODE, ply: 6 }])).toEqual({
      incoming: false,
      sentAtPly: null,
      declinedAtPly: 6,
    });
  });
});
