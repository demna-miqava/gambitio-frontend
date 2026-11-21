import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import type { PracticePosition } from "../types";
import { practiceText, shownFenOf, type PracticeTextState } from "./practiceText";

const position: PracticePosition = {
  fen: "k7/8/2K5/8/8/8/8/7Q w - - 0 1",
  playerColor: "white",
  objective: { type: "checkmate" },
};

const movesFrom = (fen: string, sans: string[]) => {
  const chess = new Chess(fen);
  for (const san of sans) chess.move(san);
  return chess.history({ verbose: true });
};

const playing = { status: "playing", message: "" } as const;
const base: PracticeTextState = {
  history: [],
  evaluation: playing,
  result: null,
  thinking: false,
  engineError: false,
  isPlayerTurn: true,
};

describe("practiceText", () => {
  it("asks for the player's move at the start", () => {
    expect(practiceText(base, position)).toEqual({
      status: "Your move",
      announcement: "",
      boardLabel: "Chess board. You play white. Checkmate. Your move",
    });
  });

  it("says the engine is thinking after the player's move", () => {
    const text = practiceText(
      { ...base, history: movesFrom(position.fen, ["Qb1"]), thinking: true, isPlayerTurn: false },
      position
    );
    expect(text.status).toBe("Stockfish is thinking…");
    // Only the engine's own moves are announced
    expect(text.announcement).toBe("");
    expect(text.boardLabel).toBe("Chess board. You play white. Checkmate. Last move: you played queen to b1");
  });

  it("announces the engine's reply", () => {
    const text = practiceText({ ...base, history: movesFrom(position.fen, ["Qb1", "Ka7"]) }, position);
    expect(text.announcement).toBe("Stockfish played king to a7.");
    expect(text.boardLabel).toContain("Last move: Stockfish played king to a7");
  });

  it("puts the result first once the attempt is over", () => {
    const result = { status: "success", message: "Checkmate!" } as const;
    const text = practiceText(
      { ...base, history: movesFrom(position.fen, ["Qb1", "Ka7", "Qb7#"]), evaluation: result, result, isPlayerTurn: false },
      position
    );
    expect(text.status).toBe("Checkmate!");
    expect(text.announcement).toBe("Checkmate!");
    expect(text.boardLabel.endsWith(". Checkmate!")).toBe(true);
  });

  it("says when the engine failed to start", () => {
    const text = practiceText({ ...base, engineError: true }, position);
    expect(text.status).toBe("The engine couldn't start. Try reloading the page.");
    expect(text.announcement).toBe(text.status);
  });
});

describe("shownFenOf", () => {
  it("follows navigation, falling back to the starting position", () => {
    const positions = ["start", "after-1", "after-2"];
    expect(shownFenOf({ positions, navigation: { currentIndex: 1 } })).toBe("after-1");
    expect(shownFenOf({ positions, navigation: { currentIndex: 7 } })).toBe("start");
  });
});
