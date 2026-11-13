import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { describeMove } from "./describeMove";

const lastMove = (fen: string, san: string) => {
  const chess = new Chess(fen);
  return chess.move(san);
};

describe("describeMove", () => {
  it("describes a quiet move", () => {
    expect(describeMove(new Chess().move("Nf3"))).toBe("knight to f3");
    expect(describeMove(new Chess().move("e4"))).toBe("pawn to e4");
  });

  it("describes captures and checks", () => {
    const chess = new Chess();
    for (const san of ["e4", "f5"]) chess.move(san);
    expect(describeMove(chess.move("exf5"))).toBe("pawn takes pawn on f5");
    chess.move("g5");
    expect(describeMove(chess.move("Qh5#"))).toBe("queen to h5, checkmate");
  });

  it("describes castling", () => {
    expect(
      describeMove(lastMove("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", "O-O"))
    ).toBe("castles kingside");
    expect(
      describeMove(lastMove("r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1", "O-O-O"))
    ).toBe("castles queenside");
  });

  it("describes promotion and en passant", () => {
    expect(describeMove(lastMove("8/P7/8/8/8/8/8/k6K w - - 0 1", "a8=Q+"))).toBe(
      "pawn to a8, promotes to queen, check"
    );
    expect(
      describeMove(lastMove("4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1", "exd6"))
    ).toBe("pawn takes pawn on d6 en passant");
  });
});
