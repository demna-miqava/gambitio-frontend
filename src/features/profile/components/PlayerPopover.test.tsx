import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { QKEY_HEAD_TO_HEAD, QKEY_USER_PROFILE } from "@/constants/queryKeys";
import { PlayerCard } from "./PlayerPopover";

// The viewer is player 1
vi.mock("@/hooks/useUser", () => ({ useUser: () => ({ id: 1, image: "" }) }));
vi.mock("../hooks/useFriendship", () => ({ useFriendship: () => ({ kind: "none" }) }));

const profile = (id: number, username: string) => ({
  user: {
    id,
    username,
    avatarUrl: null,
    createdAt: "2025-03-09T12:00:00Z",
    bulletRating: 1401,
    blitzRating: 1534,
    rapidRating: 1434,
    friendCount: 3,
  },
});

const render = (
  player: { id: number; username: string },
  props: { showRatings?: boolean; profileInNewTab?: boolean; record?: [number, number, number] } = {}
) => {
  const queryClient = new QueryClient();
  queryClient.setQueryData([QKEY_USER_PROFILE, player.id], profile(player.id, player.username));
  const [wins, draws, losses] = props.record ?? [4, 1, 2];
  queryClient.setQueryData([QKEY_HEAD_TO_HEAD, player.id], {
    opponent: { ...player, avatarUrl: null },
    wins,
    draws,
    losses,
    series: { won: 0, lost: 0, drawn: 0, active: 0 },
    recentGames: [],
    recentSeries: [],
  });
  return renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PlayerCard
          player={player}
          showRatings={props.showRatings ?? true}
          profileInNewTab={props.profileInNewTab ?? false}
        />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

const opponent = { id: 2, username: "gambit_gal" };

describe("PlayerCard", () => {
  it("shows when the player joined, their ratings and your record against them", () => {
    const html = render(opponent);
    expect(html).toContain("gambit_gal");
    expect(html).toContain("Joined Mar 9, 2025");
    expect(html).toContain("1534");
    expect(html).toContain("7 games");
    expect(html).toContain('aria-label="4 won, 1 drawn, 2 lost"');
    expect(html).toContain("Add friend");
    expect(html).toContain('href="/profile/2"');
  });

  it("says so when you haven't finished a game against them", () => {
    const html = render(opponent, { record: [0, 0, 0] });
    expect(html).toContain("No finished games against gambit_gal yet.");
  });

  it("leaves the ratings out while they're hidden during a game", () => {
    const html = render(opponent, { showRatings: false });
    expect(html).not.toContain("1534");
    expect(html).toContain("Head to head");
  });

  it("opens the profile in a new tab during a game", () => {
    expect(render(opponent, { profileInNewTab: true })).toContain('target="_blank"');
    expect(render(opponent)).not.toContain('target="_blank"');
  });

  it("has no record or friend request on your own card", () => {
    const html = render({ id: 1, username: "queenside" });
    expect(html).toContain("Joined Mar 9, 2025");
    expect(html).not.toContain("Head to head");
    expect(html).not.toContain("Add friend");
  });
});
