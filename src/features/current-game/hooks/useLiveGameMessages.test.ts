import { describe, expect, it } from "vitest";
import { errorMayHaveDroppedMove, gameErrorText } from "./useLiveGameMessages";

describe("errorMayHaveDroppedMove", () => {
  it("resyncs after an error about a move", () => {
    expect(
      errorMayHaveDroppedMove({
        message: "The game is over",
        code: "GAME_OVER",
        request: { type: "move", move: { from: "e2", to: "e4" } },
      } as never)
    ).toBe(true);
  });

  it("resyncs after a rate limit, which names no request", () => {
    expect(errorMayHaveDroppedMove({ message: "Too many messages", code: "RATE_LIMITED" })).toBe(true);
  });

  it("doesn't resync after errors for other actions, or for a sync", () => {
    expect(
      errorMayHaveDroppedMove({ message: "No draw offer", request: { type: "draw_response" } } as never)
    ).toBe(false);
    expect(errorMayHaveDroppedMove({ message: "Failed", request: { type: "sync" } } as never)).toBe(false);
    expect(
      errorMayHaveDroppedMove({ message: "Declined", request: { type: "takeback_request" } } as never)
    ).toBe(false);
  });
});

describe("gameErrorText", () => {
  it("names a dropped action so the player sends it again", () => {
    expect(gameErrorText({ message: "Too many messages", code: "RATE_LIMITED", request: { type: "resign" } })).toBe(
      "Too many messages: your resignation wasn't sent. Try again."
    );
    expect(gameErrorText({ message: "Too many messages", code: "RATE_LIMITED", request: { type: "move" } })).toBe(
      "Too many messages"
    );
    expect(
      gameErrorText({ message: "Too many messages", code: "RATE_LIMITED", request: { type: "takeback_request" } })
    ).toBe("Too many messages: your takeback request wasn't sent. Try again.");
    expect(gameErrorText({ message: "No draw offer", code: "NO_OFFER", request: { type: "draw_response" } })).toBe(
      "No draw offer"
    );
  });
});
