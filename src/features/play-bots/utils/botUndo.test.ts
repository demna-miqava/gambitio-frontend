import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { botUndoPlies } from "./botUndo";
import { buildBotGamePgn } from "./botGamePgn";

const play = (...sans: string[]) => {
  const chess = new Chess();
  for (const san of sans) chess.move(san);
  return chess;
};

const undo = (chess: Chess, playerCode: "w" | "b") => {
  const plies = botUndoPlies(chess.history({ verbose: true }), playerCode);
  for (let i = 0; i < plies; i++) chess.undo();
  return plies;
};

describe("botUndoPlies", () => {
  it("is 0 before the player has moved", () => {
    expect(botUndoPlies([], "w")).toBe(0);
    // The bot opened as white
    expect(botUndoPlies(play("e4").history({ verbose: true }), "b")).toBe(0);
  });

  it("takes back the player's move and the bot's reply", () => {
    const chess = play("e4", "e5", "Nf3", "Nc6");
    expect(undo(chess, "w")).toBe(2);
    expect(chess.history()).toEqual(["e4", "e5"]);
    expect(chess.turn()).toBe("w");

    const asBlack = play("e4", "e5", "Nf3");
    expect(undo(asBlack, "b")).toBe(2);
    expect(asBlack.history()).toEqual(["e4"]);
    expect(asBlack.turn()).toBe("b");
  });

  it("takes back only the player's move while the bot is still thinking", () => {
    const chess = play("e4", "e5", "Nf3");
    expect(undo(chess, "w")).toBe(1);
    expect(chess.history()).toEqual(["e4", "e5"]);
    expect(chess.turn()).toBe("w");

    const first = play("e4");
    expect(undo(first, "w")).toBe(1);
    expect(first.history()).toEqual([]);
  });

  it("leaves the game saved as it was finally played", () => {
    const chess = play("f3", "e5", "g4");
    undo(chess, "w"); // 2.g4 was a blunder
    chess.move("Nc3");
    chess.move("d5");
    const pgn = buildBotGamePgn({
      moves: chess.history({ verbose: true }),
      playerColor: "white",
      playerName: "ann",
      botName: "Bot",
      result: { outcome: "loss", reason: "by resignation" },
    });
    const saved = new Chess();
    saved.loadPgn(pgn);
    expect(saved.history()).toEqual(["f3", "e5", "Nc3", "d5"]);
  });
});
