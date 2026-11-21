import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { QKEY_BLOCKED_USERS, QKEY_HEAD_TO_HEAD, QKEY_USER_PROFILE } from "@/constants/queryKeys";
import { PlayerCard } from "./PlayerPopover";

// The viewer is player 1
vi.mock("@/hooks/useUser", () => ({ useUser: () => ({ id: 1, image: "" }) }));
// Strangers unless a test says otherwise
const friendship = vi.hoisted(() => ({ kind: "none", invited: [] as number[] }));
vi.mock("../hooks/useFriendship", () => ({ useFriendship: () => ({ kind: friendship.kind }) }));
vi.mock("@/features/puzzles/duel/hooks/useDuelInvites", () => ({
  useDuelInvites: () => ({
    outgoing: friendship.invited.map((id) => ({ to: { id } })),
    send: { isPending: false, mutate: () => {} },
  }),
}));

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
  props: {
    showRatings?: boolean;
    profileInNewTab?: boolean;
    record?: [number, number, number];
    /** Ids the viewer has blocked */
    blocked?: number[];
    /** Whether the card offers block and report (as the popover does) */
    moderation?: boolean;
  } = {}
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
  queryClient.setQueryData(
    [QKEY_BLOCKED_USERS, 1],
    (props.blocked ?? []).map((id) => ({ id, username: "x", avatarUrl: null, blockedAt: "2026-01-01" }))
  );
  return renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PlayerCard
          player={player}
          showRatings={props.showRatings ?? true}
          profileInNewTab={props.profileInNewTab ?? false}
          {...(props.moderation && { onModerate: () => {} })}
        />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

const opponent = { id: 2, username: "gambit_gal" };

afterEach(() => {
  friendship.kind = "none";
  friendship.invited = [];
});

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

  it("offers a friend a puzzle duel", () => {
    friendship.kind = "friends";
    const html = render(opponent);
    expect(html).toContain('aria-label="Invite gambit_gal to a puzzle duel"');
    expect(html).toContain("Duel");
    expect(html).not.toContain("Add friend");
  });

  it("shows a duel invite that is already waiting for the friend's answer", () => {
    friendship.kind = "friends";
    friendship.invited = [2];
    const html = render(opponent);
    expect(html).toContain('aria-label="Puzzle duel invite sent to gambit_gal"');
    expect(html).toContain("Invited");
  });

  it("offers no duel from a game being played: the friend is only named as one", () => {
    friendship.kind = "friends";
    // The card of the game's page, while the game is on
    const html = render(opponent, { profileInNewTab: true });
    expect(html).not.toContain("puzzle duel");
    expect(html).not.toContain("Duel");
    expect(html).toContain("Friends");
  });

  it("has no record, friend request or block menu on your own card", () => {
    const html = render({ id: 1, username: "queenside" }, { moderation: true });
    expect(html).toContain("Joined Mar 9, 2025");
    expect(html).not.toContain("Head to head");
    expect(html).not.toContain("Add friend");
    expect(html).not.toContain("More actions");
  });

  it("offers block and report on another player's card", () => {
    expect(render(opponent, { moderation: true })).toContain(
      'aria-label="More actions for gambit_gal"'
    );
    expect(render(opponent)).not.toContain("More actions");
  });

  it("offers Unblock instead of Add friend for a player you've blocked", () => {
    const html = render(opponent, { blocked: [2] });
    expect(html).toContain("Unblock");
    expect(html).not.toContain("Add friend");
    // Blocking someone else changes nothing here
    expect(render(opponent, { blocked: [3] })).toContain("Add friend");
  });
});
