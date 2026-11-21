import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NOTIFICATION_MESSAGE_TYPES } from "@/features/notifications/constants/websocket-types";
import type { DuelInvite } from "../types";
import { DuelInviteListener } from "./DuelInviteListener";

// The listener's handlers, captured while it renders (subscribing is an
// effect, which server rendering doesn't run)
const handlers = new Map<string, (message: unknown) => void>();
const mocks = vi.hoisted(() => ({
  pathname: "/home",
  navigate: vi.fn(),
  toast: Object.assign(vi.fn(), { error: vi.fn(), dismiss: vi.fn() }),
  acceptDuelInvite: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ pathname: mocks.pathname }),
}));
vi.mock("sonner", () => ({ toast: mocks.toast }));
vi.mock("@/hooks/useMessageDispatcher", () => ({
  useMessageDispatcher: (_dispatcher: unknown, type: string, handler: (message: unknown) => void) => {
    handlers.set(type, handler);
  },
}));
vi.mock("@/services/websocketMessageDispatcher", () => ({ notificationMessages: {} }));
vi.mock("@/services/puzzleDuels", () => ({ acceptDuelInvite: mocks.acceptDuelInvite }));
vi.mock("../hooks/useDuelInvites", () => ({
  duelErrorMessage: (error: { says?: string }, fallback: string) => error.says ?? fallback,
}));

const NOW = new Date("2026-11-21T12:00:00Z").getTime();
const invite = (over: Partial<DuelInvite> = {}): DuelInvite => ({
  id: 31,
  createdAt: new Date(NOW).toISOString(),
  expiresAt: new Date(NOW + 180_000).toISOString(),
  from: { id: 2, username: "rook_lift", avatarUrl: null },
  to: { id: 1, username: "queenside", avatarUrl: null },
  rematchOf: null,
  ...over,
});

/** The listener on a page, and a way to send it socket messages */
const listenOn = (pathname: string) => {
  mocks.pathname = pathname;
  // Where the browser is: read when deciding whether there's anywhere to go
  vi.stubGlobal("window", { location: { pathname } });
  handlers.clear();
  renderToStaticMarkup(<DuelInviteListener />);
  return (type: string, data: object) => handlers.get(type)!({ type, data });
};
const started = (duelId: number, inviteId = 31) => ({ duelId, inviteId, startsAt: "", endsAt: "" });

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  for (const mock of [mocks.navigate, mocks.toast, mocks.toast.error, mocks.toast.dismiss, mocks.acceptDuelInvite]) {
    mock.mockReset();
  }
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("a duel invite arriving", () => {
  it("shows a toast with Accept that lasts as long as the invite", () => {
    const send = listenOn("/home");
    send(NOTIFICATION_MESSAGE_TYPES.DUEL_INVITE, invite());
    expect(mocks.toast).toHaveBeenCalledTimes(1);
    const [title, options] = mocks.toast.mock.calls[0]!;
    expect(title).toBe("rook_lift invited you to a puzzle duel");
    expect(options.id).toBe("duel-invite-31");
    expect(options.duration).toBe(180_000);
    expect(options.action.label).toBe("Accept");
  });

  it("is answered on the result screen when it is a rematch and the player is on the duel pages", () => {
    const send = listenOn("/puzzles/duel/12");
    send(NOTIFICATION_MESSAGE_TYPES.DUEL_INVITE, invite({ rematchOf: 12 }));
    expect(mocks.toast).not.toHaveBeenCalled();
    // Anywhere else a rematch is an invite like any other
    listenOn("/home")(NOTIFICATION_MESSAGE_TYPES.DUEL_INVITE, invite({ rematchOf: 12 }));
    expect(mocks.toast).toHaveBeenCalledTimes(1);
  });

  it("Accept starts the duel and goes to it", async () => {
    mocks.acceptDuelInvite.mockResolvedValue({ duelId: 44 });
    const send = listenOn("/home");
    send(NOTIFICATION_MESSAGE_TYPES.DUEL_INVITE, invite());
    mocks.toast.mock.calls[0]![1].action.onClick();
    await vi.advanceTimersByTimeAsync(0);
    expect(mocks.acceptDuelInvite).toHaveBeenCalledWith(31);
    expect(mocks.navigate).toHaveBeenCalledWith("/puzzles/duel/44");
  });

  it("Accept doesn't go to the duel a second time when the socket already took the player there", async () => {
    mocks.acceptDuelInvite.mockResolvedValue({ duelId: 44 });
    const send = listenOn("/home");
    send(NOTIFICATION_MESSAGE_TYPES.DUEL_INVITE, invite());
    mocks.toast.mock.calls[0]![1].action.onClick();
    vi.stubGlobal("window", { location: { pathname: "/puzzles/duel/44" } });
    await vi.advanceTimersByTimeAsync(0);
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("Accept says why when the server refuses", async () => {
    mocks.acceptDuelInvite.mockRejectedValue({ says: "Finish your game first" });
    const send = listenOn("/home");
    send(NOTIFICATION_MESSAGE_TYPES.DUEL_INVITE, invite());
    mocks.toast.mock.calls[0]![1].action.onClick();
    await vi.advanceTimersByTimeAsync(0);
    expect(mocks.toast.error).toHaveBeenCalledWith("Finish your game first");
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});

describe("an invite that is no longer open", () => {
  it.each(["declined", "cancelled", "expired"])("takes its toast away when it is %s", (status) => {
    const send = listenOn("/home");
    send(NOTIFICATION_MESSAGE_TYPES.DUEL_INVITE_CLOSED, { inviteId: 31, status });
    expect(mocks.toast.dismiss).toHaveBeenCalledWith("duel-invite-31");
  });

  it("takes its toast away when it was accepted somewhere else (the lobby, another tab)", () => {
    const send = listenOn("/puzzles/duel");
    send(NOTIFICATION_MESSAGE_TYPES.DUEL_STARTED, started(44));
    expect(mocks.toast.dismiss).toHaveBeenCalledWith("duel-invite-31");
  });
});

describe("a duel starting", () => {
  it("takes a player on the duel pages straight to it", () => {
    const send = listenOn("/puzzles/duel");
    send(NOTIFICATION_MESSAGE_TYPES.DUEL_STARTED, started(44));
    expect(mocks.navigate).toHaveBeenCalledWith("/puzzles/duel/44");
    expect(mocks.toast).not.toHaveBeenCalled();
  });

  it("takes a player on an earlier duel's result to the rematch", () => {
    const send = listenOn("/puzzles/duel/12");
    send(NOTIFICATION_MESSAGE_TYPES.DUEL_STARTED, started(44));
    expect(mocks.navigate).toHaveBeenCalledWith("/puzzles/duel/44");
  });

  it("does nothing for a player already on it", () => {
    const send = listenOn("/puzzles/duel/44");
    send(NOTIFICATION_MESSAGE_TYPES.DUEL_STARTED, started(44));
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(mocks.toast).not.toHaveBeenCalled();
  });

  it("offers to go there from anywhere else, without leaving the page for them", () => {
    const send = listenOn("/analysis");
    send(NOTIFICATION_MESSAGE_TYPES.DUEL_STARTED, started(44));
    expect(mocks.navigate).not.toHaveBeenCalled();
    const [title, options] = mocks.toast.mock.calls[0]!;
    expect(title).toBe("Your puzzle duel is starting");
    expect(options.id).toBe("duel-started-44");
    options.action.onClick();
    expect(mocks.navigate).toHaveBeenCalledWith("/puzzles/duel/44");
  });
});
