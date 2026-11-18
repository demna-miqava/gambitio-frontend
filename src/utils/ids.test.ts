import { describe, expect, it } from "vitest";
import { parsePositiveId } from "./ids";

describe("parsePositiveId", () => {
  it("reads plain positive integers", () => {
    expect(parsePositiveId("1")).toBe(1);
    expect(parsePositiveId("42")).toBe(42);
    expect(parsePositiveId(String(Number.MAX_SAFE_INTEGER))).toBe(Number.MAX_SAFE_INTEGER);
  });

  it("refuses paths, other spellings and out-of-range numbers", () => {
    for (const raw of [
      "../users/5",
      "5/../../users",
      "5?x=1",
      "5#a",
      "%2F",
      "0",
      "-3",
      "007",
      "1.0",
      "1e3",
      "0x10",
      " 7",
      "7 ",
      "",
      "9007199254740993",
      "Infinity",
      "NaN",
    ]) {
      expect(parsePositiveId(raw)).toBeNull();
    }
    expect(parsePositiveId(null)).toBeNull();
    expect(parsePositiveId(undefined)).toBeNull();
  });
});
