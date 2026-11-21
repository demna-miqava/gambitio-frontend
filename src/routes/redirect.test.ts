import { describe, expect, it } from "vitest";
import { getSafeRedirect, withRedirect } from "./redirect";

describe("getSafeRedirect", () => {
  it("keeps same-origin relative paths with query and hash", () => {
    expect(getSafeRedirect("/game/12")).toBe("/game/12");
    expect(getSafeRedirect("/profile/3/stats?variant=blitz#top")).toBe(
      "/profile/3/stats?variant=blitz#top"
    );
  });

  it("falls back to home for missing or foreign destinations", () => {
    expect(getSafeRedirect(null)).toBe("/home");
    expect(getSafeRedirect("")).toBe("/home");
    expect(getSafeRedirect("https://evil.com/home")).toBe("/home");
    expect(getSafeRedirect("//evil.com")).toBe("/home");
    expect(getSafeRedirect("/\\evil.com")).toBe("/home");
    expect(getSafeRedirect("javascript:alert(1)")).toBe("/home");
    expect(getSafeRedirect("game/12")).toBe("/home");
  });

  it("refuses backslashes and control characters anywhere", () => {
    expect(getSafeRedirect("/\\/evil.com")).toBe("/home");
    expect(getSafeRedirect("/game\\..\\..\\x")).toBe("/home");
    expect(getSafeRedirect("/\t/evil.com")).toBe("/home");
    expect(getSafeRedirect("/\n/evil.com")).toBe("/home");
    expect(getSafeRedirect("/game/1\u0000")).toBe("/home");
    expect(getSafeRedirect("/game/1\u007f")).toBe("/home");
  });

  it("never sends the user back to an auth page", () => {
    expect(getSafeRedirect("/signin")).toBe("/home");
    expect(getSafeRedirect("/signup?x=1")).toBe("/home");
    expect(getSafeRedirect("/profile-setup")).toBe("/home");
    expect(getSafeRedirect("/")).toBe("/home");
    // However the router would still match them
    expect(getSafeRedirect("/SignIn")).toBe("/home");
    expect(getSafeRedirect("/signin/")).toBe("/home");
    expect(getSafeRedirect("/Profile-Setup/?x=1")).toBe("/home");
  });
});

describe("withRedirect", () => {
  it("adds an encoded redirect_url", () => {
    expect(withRedirect("/signin", "/game/12?x=1")).toBe(
      "/signin?redirect_url=%2Fgame%2F12%3Fx%3D1"
    );
  });

  it("leaves it out when the destination is home anyway", () => {
    expect(withRedirect("/signin", "/home")).toBe("/signin");
    expect(withRedirect("/signin", "//evil.com")).toBe("/signin");
  });
});
