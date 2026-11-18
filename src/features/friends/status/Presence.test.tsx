import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AvatarWithPresence } from "./Presence";
import { presenceLabel, statusWord } from "./presenceLabel";

describe("presenceLabel", () => {
  it("names the time control of a friend's game", () => {
    expect(presenceLabel({ status: "online", gameType: null })).toBe("Online");
    expect(presenceLabel({ status: "playing", gameType: "blitz" })).toBe("Playing blitz");
    expect(presenceLabel({ status: "playing", gameType: null })).toBe("Playing");
  });

  it("has one word for under a small avatar", () => {
    expect(statusWord("online")).toBe("Online");
    expect(statusWord("playing")).toBe("Playing");
  });
});

describe("AvatarWithPresence", () => {
  const dots = (presence: Parameters<typeof AvatarWithPresence>[0]["presence"], announce?: boolean) =>
    renderToStaticMarkup(
      <AvatarWithPresence presence={presence} announce={announce}>
        <img alt="" />
      </AvatarWithPresence>
    );

  it("marks online with a filled green dot, playing with a gold ring, and offline not at all", () => {
    const online = dots({ status: "online", gameType: null });
    const playing = dots({ status: "playing", gameType: "bullet" });
    expect(online).toContain("bg-success");
    expect(online).not.toContain("border-gold");
    // A different shape, not only a different colour
    expect(playing).toContain("border-gold");
    expect(playing).not.toContain("bg-success");
    expect(dots(null)).not.toContain("rounded-full");
  });

  it("names the status on the dot, unless the text is beside it", () => {
    expect(dots({ status: "playing", gameType: "blitz" })).toContain('aria-label="Playing blitz"');
    const silent = dots({ status: "online", gameType: null }, false);
    expect(silent).toContain('aria-hidden="true"');
    expect(silent).not.toContain("aria-label");
  });
});
