import { describe, expect, test } from "vitest";
import { concatPixels, maskUnchanged, paletteSampleIndices } from "./encode";

describe("GIF encoding helpers", () => {
  test("unchanged pixels become transparent", () => {
    const prev = Uint8Array.from([1, 2, 3, 4]);
    const next = Uint8Array.from([1, 5, 3, 6]);
    expect([...maskUnchanged(prev, next, 255)]).toEqual([255, 5, 255, 6]);
    // The input is left alone (it's the next frame's "previous")
    expect([...next]).toEqual([1, 5, 3, 6]);
  });

  test("palette samples cover start, early moves, middle and end", () => {
    expect(paletteSampleIndices(100)).toEqual([0, 1, 2, 3, 50, 99]);
    expect(paletteSampleIndices(3)).toEqual([0, 1, 2]);
    expect(paletteSampleIndices(1)).toEqual([0]);
    expect(paletteSampleIndices(0)).toEqual([]);
  });

  test("pixel buffers are joined in order", () => {
    expect([...concatPixels([Uint8ClampedArray.from([1, 2]), Uint8Array.from([3])])]).toEqual([1, 2, 3]);
  });
});
