import { describe, expect, it } from "vitest";
import { getInitials } from "./avatarInitials";

describe("getInitials", () => {
  it("uses the first two characters of a single word", () => {
    expect(getInitials("hikaru")).toBe("HI");
    expect(getInitials("a")).toBe("A");
  });

  it("uses the first letter of the first two words", () => {
    expect(getInitials("Magnus Carlsen")).toBe("MC");
    expect(getInitials("magnus_carlsen")).toBe("MC");
    expect(getInitials("anna-maria.k")).toBe("AM");
  });

  it("ignores surrounding separators and whitespace", () => {
    expect(getInitials("  _bobby  ")).toBe("BO");
  });

  it("falls back to ? without a name", () => {
    expect(getInitials("")).toBe("?");
    expect(getInitials(undefined)).toBe("?");
    expect(getInitials("___")).toBe("?");
  });
});
