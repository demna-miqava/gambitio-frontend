import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import type { FriendStatus } from "@/types";
import { FriendCard, type FriendCardMode } from "./FriendCard";

vi.mock("@/hooks/useUser", () => ({ useUser: () => ({ id: 1, image: "" }) }));

const friend = {
  id: 2,
  username: "alice",
  avatarUrl: "",
  friendsSince: "2026-01-01T00:00:00.000Z",
  blitzRating: 1500,
  bulletRating: 1500,
  rapidRating: 1500,
};

const render = (presence: FriendStatus | null, mode: FriendCardMode = "pick") =>
  renderToStaticMarkup(
    <MemoryRouter>
      <FriendCard
        friend={friend}
        mode={mode}
        presence={presence}
        onChallenge={() => {}}
        secondaryText="Friends since Jan 1, 2026"
      />
    </MemoryRouter>
  );

describe("FriendCard presence", () => {
  it("says in words whom you can challenge now and who is busy, in the picker", () => {
    const online = render({ ...friend, status: "online", gameId: null, gameType: null });
    expect(online).toContain("Online");
    expect(online).toContain("Friends since Jan 1, 2026");
    const playing = render({ ...friend, status: "playing", gameId: 9, gameType: "blitz" });
    expect(playing).toContain("Playing blitz");
  });

  it("keeps the dot silent where the words are shown", () => {
    const markup = render({ ...friend, status: "online", gameId: null, gameType: null }, "manage");
    expect(markup).not.toContain('role="img"');
  });

  it("shows no status for an offline friend", () => {
    const markup = render(null);
    expect(markup).not.toContain("Online");
    expect(markup).not.toContain("Playing");
  });
});
