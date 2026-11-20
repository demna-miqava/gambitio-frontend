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

describe("FriendCard challenge buttons, in the picker", () => {
  const pick = (props: Partial<Parameters<typeof FriendCard>[0]> = {}) =>
    renderToStaticMarkup(
      <MemoryRouter>
        <FriendCard friend={friend} mode="pick" onChallenge={() => {}} {...props} />
      </MemoryRouter>
    );

  it("opens the form before there is a challenge to repeat", () => {
    const markup = pick();
    expect(markup).toContain('aria-label="Challenge alice"');
    expect(markup).not.toContain("Other options");
  });

  it("sends the last challenge again in one tap, with the form a button away", () => {
    const markup = pick({ quickChallenge: { label: "5+0", onSend: () => {} } });
    expect(markup).toContain('aria-label="Challenge alice to 5+0"');
    expect(markup).toContain('aria-label="Other options for a challenge to alice"');
  });

  it("says so instead while a challenge to this friend is out", () => {
    const markup = pick({ quickChallenge: { label: "5+0", onSend: () => {} }, isChallenged: true });
    expect(markup).toContain("Challenge sent");
    expect(markup).not.toContain("<button");
  });
});
