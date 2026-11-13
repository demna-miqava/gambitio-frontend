import { describe, expect, it } from "vitest";
import { getPlaySetupSearch, parsePlaySetup } from "./setupRoute";

const parse = (search: string, state?: Parameters<typeof parsePlaySetup>[1]) =>
  parsePlaySetup(new URLSearchParams(search), state);

describe("getPlaySetupSearch", () => {
  it("builds the query string for each step", () => {
    expect(getPlaySetupSearch("new")).toBe("");
    expect(getPlaySetupSearch("friends")).toBe("?section=friends");
    expect(getPlaySetupSearch("custom")).toBe("?section=custom");
    expect(getPlaySetupSearch("friend-invite-options", 12)).toBe(
      "?section=friends&friend=12"
    );
  });
});

describe("parsePlaySetup", () => {
  it("defaults to the online section", () => {
    expect(parse("")).toEqual({ section: "new", friendId: null });
    expect(parse("?section=nope")).toEqual({ section: "new", friendId: null });
  });

  it("reads the section and friend from the URL", () => {
    expect(parse("?section=friends")).toEqual({ section: "friends", friendId: null });
    expect(parse("?section=custom")).toEqual({ section: "custom", friendId: null });
    expect(parse("?section=friends&friend=12")).toEqual({
      section: "friend-invite-options",
      friendId: 12,
    });
  });

  it("ignores invalid friend ids", () => {
    expect(parse("?section=friends&friend=abc")).toEqual({ section: "friends", friendId: null });
    expect(parse("?section=friends&friend=-3")).toEqual({ section: "friends", friendId: null });
  });

  it("round-trips with getPlaySetupSearch", () => {
    expect(parse(getPlaySetupSearch("friend-invite-options", 7))).toEqual({
      section: "friend-invite-options",
      friendId: 7,
    });
  });

  it("falls back to navigation state when the URL has no section", () => {
    expect(parse("", { section: "friends" })).toEqual({ section: "friends", friendId: null });
    expect(
      parse("", { section: "friend-invite-options", selectedFriend: { id: 4 } })
    ).toEqual({ section: "friend-invite-options", friendId: 4 });
    expect(parse("", { section: "friend-invite-options" })).toEqual({
      section: "friends",
      friendId: null,
    });
  });

  it("prefers the URL over navigation state", () => {
    expect(parse("?section=custom", { section: "friends" })).toEqual({
      section: "custom",
      friendId: null,
    });
  });
});
