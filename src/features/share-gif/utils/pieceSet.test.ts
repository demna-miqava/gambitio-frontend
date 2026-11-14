import { describe, expect, test } from "vitest";
import pieceSetCss from "@/assets/pieces/chessground.merida.css?raw";
import { PIECE_KEYS, parsePieceSet } from "./pieceSet";

describe("piece set", () => {
  test("every piece of the set is found as an SVG data URI", () => {
    const pieces = parsePieceSet(pieceSetCss);
    expect(Object.keys(pieces).sort()).toEqual([...PIECE_KEYS].sort());
    for (const uri of Object.values(pieces)) expect(uri).toMatch(/^data:image\/svg\+xml;base64,/);
    expect(pieces.wp).not.toBe(pieces.bp);
  });

  test("double quotes and unquoted urls work too", () => {
    const css = `.cg-wrap piece.queen.black { background-image: url(data:image/png;base64,AAA) }
.cg-wrap piece.king.white {background-image:url("data:image/svg+xml;base64,BBB")}`;
    expect(parsePieceSet(css)).toEqual({
      bq: "data:image/png;base64,AAA",
      wk: "data:image/svg+xml;base64,BBB",
    });
  });
});
