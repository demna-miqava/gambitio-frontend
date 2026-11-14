import { describe, expect, test } from "vitest";
import { GIF_HEIGHT, GIF_WIDTH, isLightSquare, squareOrigin } from "./draw";

describe("board geometry", () => {
  test("white at the bottom", () => {
    expect(squareOrigin("a1", "white")).toEqual({ x: 0, y: 420 });
    expect(squareOrigin("h8", "white")).toEqual({ x: 420, y: 0 });
    expect(squareOrigin("e4", "white")).toEqual({ x: 240, y: 240 });
  });

  test("black at the bottom", () => {
    expect(squareOrigin("a1", "black")).toEqual({ x: 420, y: 0 });
    expect(squareOrigin("h8", "black")).toEqual({ x: 0, y: 420 });
  });

  test("square colors", () => {
    expect(isLightSquare("a1")).toBe(false);
    expect(isLightSquare("h1")).toBe(true);
    expect(isLightSquare("d1")).toBe(true);
    expect(isLightSquare("e1")).toBe(false);
  });

  test("480 px wide with a strip above and below the board", () => {
    expect(GIF_WIDTH).toBe(480);
    expect(GIF_HEIGHT).toBe(568);
  });
});
