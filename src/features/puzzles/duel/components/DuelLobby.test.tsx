import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QKEY_USER_FRIENDS } from "@/constants/queryKeys";
import type { DuelInvite, DuelPerson } from "../types";
import { DuelLobby } from "./DuelLobby";

// The viewer is player 1; the invites are whatever a test puts here
const invites = vi.hoisted(() => ({
  incoming: [] as DuelInvite[],
  outgoing: [] as DuelInvite[],
  acceptPending: false,
  sendPending: false,
}));
vi.mock("@/hooks/useUser", () => ({ useUser: () => ({ id: 1, image: "" }) }));
vi.mock("@/hooks/useAvatarSrc", () => ({ useAvatarSrc: () => (_id: number, url: string | null) => url }));
vi.mock("@/components/UserAvatar", () => ({ UserAvatar: () => null }));
vi.mock("../hooks/useDuelInvites", () => ({
  useDuelInvites: () => ({
    incoming: invites.incoming,
    outgoing: invites.outgoing,
    accept: { isPending: invites.acceptPending, mutate: () => {} },
    send: { isPending: invites.sendPending, mutate: () => {} },
    decline: { mutate: () => {} },
    cancel: { mutate: () => {} },
  }),
}));

const NOW = new Date("2026-11-21T12:00:00Z").getTime();
const viewer: DuelPerson = { id: 1, username: "queenside", avatarUrl: null };
const person = (id: number, username: string): DuelPerson => ({ id, username, avatarUrl: null });
const invite = (id: number, from: DuelPerson, to: DuelPerson, over: Partial<DuelInvite> = {}): DuelInvite => ({
  id,
  createdAt: new Date(NOW).toISOString(),
  expiresAt: new Date(NOW + 149_000).toISOString(),
  from,
  to,
  rematchOf: null,
  ...over,
});

/** The lobby with the viewer's friends as the server listed them (none: still loading) */
const render = (friends?: DuelPerson[]) => {
  const queryClient = new QueryClient();
  if (friends) queryClient.setQueryData([QKEY_USER_FRIENDS, 1, "duel-picker", ""], { data: friends });
  return renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <DuelLobby onStarted={() => {}} />
    </QueryClientProvider>
  );
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  invites.incoming = [];
  invites.outgoing = [];
  invites.acceptPending = false;
  invites.sendPending = false;
});
afterEach(() => {
  vi.useRealTimers();
});

describe("the duel lobby", () => {
  it("explains the duel and lists friends to invite", () => {
    const html = render([person(2, "rook_lift"), person(3, "gambit_gal")]);
    expect(html).toContain("Race a friend through the same puzzles for three minutes.");
    expect(html).toContain('aria-label="Invite rook_lift to a puzzle duel"');
    expect(html).toContain('aria-label="Invite gambit_gal to a puzzle duel"');
    expect(html).not.toContain("Invites for you");
    expect(html).not.toContain("Waiting for an answer");
  });

  it("says duels are between friends when the player has none", () => {
    expect(render([])).toContain("Duels are between friends. Add friends to invite them.");
  });

  it("shows a placeholder while the friends load", () => {
    const html = render();
    expect(html).toContain('aria-label="Loading your friends"');
    expect(html).not.toContain("Duels are between friends");
  });

  it("lists invites for the player, each to accept or decline", () => {
    invites.incoming = [invite(31, person(2, "rook_lift"), viewer), invite(32, person(3, "gambit_gal"), viewer, { rematchOf: 12 })];
    const html = render([]);
    expect(html).toContain("Invites for you");
    expect(html).toContain("Wants a duel");
    expect(html).toContain("Wants a rematch");
    expect(html).toContain('aria-label="Decline rook_lift&#x27;s invite"');
    expect(html).toContain('aria-label="Decline gambit_gal&#x27;s invite"');
    expect(html.match(/>Accept</g)).toHaveLength(2);
  });

  it("lists the player's own invites with the time each has left and a way to take it back", () => {
    invites.outgoing = [invite(40, viewer, person(2, "rook_lift")), invite(41, viewer, person(3, "gambit_gal"), { rematchOf: 12 })];
    const html = render([person(2, "rook_lift"), person(4, "en_passant")]);
    expect(html).toContain("Waiting for an answer");
    expect(html).toContain("lapses in 2:29");
    expect(html).toContain("Rematch · lapses in 2:29");
    expect(html).toContain('aria-label="Cancel your invite to rook_lift"');
    expect(html).toContain("The duel starts here as soon as they accept.");
    // A friend already invited can't be invited again; the others can
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*aria-label="Invite rook_lift to a puzzle duel"[^>]*>.*?Invited<\/button>/);
    expect(html).toMatch(/<button(?![^>]*disabled="")[^>]*aria-label="Invite en_passant to a puzzle duel"[^>]*>.*?Invite<\/button>/);
  });

  it("holds every Accept while one is being sent, and every Invite while one is", () => {
    invites.incoming = [invite(31, person(2, "rook_lift"), viewer)];
    invites.acceptPending = true;
    expect(render([])).toMatch(/<button[^>]*disabled=""[^>]*>Accept<\/button>/);
    invites.acceptPending = false;
    invites.sendPending = true;
    expect(render([person(4, "en_passant")])).toMatch(/<button[^>]*disabled=""[^>]*aria-label="Invite en_passant to a puzzle duel"/);
  });
});
