import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AvatarWithPresence } from "./Presence";
import { presenceLabel } from "./presenceLabel";

describe("presenceLabel", () => {
  it("names the time control of a friend's game", () => {
    expect(presenceLabel({ status: "online", gameType: null })).toBe("Online");
    expect(presenceLabel({ status: "playing", gameType: "blitz" })).toBe("Playing blitz");
    expect(presenceLabel({ status: "playing", gameType: null })).toBe("Playing");
  });
});

describe("AvatarWithPresence", () => {
  const dots = (presence: Parameters<typeof AvatarWithPresence>[0]["presence"], announce?: boolean) =>
    renderToStaticMarkup(
      <AvatarWithPresence presence={presence} announce={announce}>
        <img alt="" />
      </AvatarWithPresence>
    );

  it("marks online green and playing gold, and offline not at all", () => {
    expect(dots({ status: "online", gameType: null })).toContain("bg-success");
    expect(dots({ status: "playing", gameType: "bullet" })).toContain("bg-gold");
    expect(dots(null)).not.toContain("rounded-full");
  });

  it("names the status on the dot, unless the text is beside it", () => {
    expect(dots({ status: "playing", gameType: "blitz" })).toContain('aria-label="Playing blitz"');
    const silent = dots({ status: "online", gameType: null }, false);
    expect(silent).toContain('aria-hidden="true"');
    expect(silent).not.toContain("aria-label");
  });
});
