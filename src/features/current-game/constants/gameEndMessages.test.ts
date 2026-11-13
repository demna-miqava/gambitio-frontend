import { describe, expect, it } from "vitest";
import { getSpectatorEndMessage } from "./gameEndMessages";

describe("getSpectatorEndMessage", () => {
  it("names the winner and how they won", () => {
    expect(getSpectatorEndMessage("white_win", "checkmate", "ann", "bob")).toEqual({
      title: "ann won",
      description: "ann won by checkmate.",
    });
    expect(getSpectatorEndMessage("black_win", "resignation", "ann", "bob")).toEqual({
      title: "bob won",
      description: "ann resigned.",
    });
    expect(getSpectatorEndMessage("white_win", "timeout", "ann", "bob").description).toBe(
      "bob ran out of time."
    );
  });

  it("describes draws and aborts without a winner", () => {
    expect(getSpectatorEndMessage("draw", "draw_agreement", "ann", "bob").title).toBe(
      "Draw agreed"
    );
    expect(getSpectatorEndMessage("draw", "stalemate", "ann", "bob")).toEqual({
      title: "Draw",
      description: "Stalemate: no legal moves, but not in check.",
    });
    expect(getSpectatorEndMessage("aborted", "aborted", "ann", "bob").title).toBe(
      "Game aborted"
    );
  });

  it("falls back for unknown reasons", () => {
    expect(getSpectatorEndMessage("draw", undefined, "ann", "bob").description).toBe(
      "The game ended in a draw."
    );
    expect(getSpectatorEndMessage("black_win", "something_new", "ann", "bob")).toEqual({
      title: "bob won",
      description: "The game is over.",
    });
  });
});
