import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { WatchedGame, WatchedGameStatus } from "../utils/watchedGame";
import { StudyLiveGamePanel } from "./StudyLiveGame";

const player = (id: number, username: string) => ({ id, username, rating: 1500, avatarUrl: null });
const game = (over: Partial<WatchedGame> = {}): WatchedGame => ({
  gameId: 7,
  white: player(1, "whitey"),
  black: player(2, "blacky"),
  time: 300,
  increment: 0,
  fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2",
  lastMove: { san: "e5", from: "e7", to: "e5" },
  ply: 2,
  inProgress: true,
  clockRunning: true,
  whiteTimeLeft: 290_000,
  blackTimeLeft: 295_000,
  result: null,
  reason: null,
  ...over,
});

const render = (props: {
  game: WatchedGame | null;
  status: WatchedGameStatus;
  canGoLive?: boolean;
  roomLiveLabel?: string | null;
}) =>
  renderToStaticMarkup(
    <StudyLiveGamePanel
      onRetry={() => {}}
      atLive={false}
      onGoLive={() => {}}
      canGoLive={props.canGoLive ?? true}
      roomLiveLabel={props.roomLiveLabel ?? null}
      game={props.game}
      status={props.status}
    />
  );

describe("StudyLiveGamePanel", () => {
  it("offers Retry when the connection is lost or the game was refused, without a spinner", () => {
    const lost = render({ game: null, status: "lost" });
    expect(lost).toContain("Lost the connection to the game");
    expect(lost).toContain("Retry");
    expect(lost).not.toContain("Connecting to the game");
    const refused = render({ game: null, status: "refused" });
    expect(refused).toContain("Couldn&#x27;t open the game");
    expect(refused).toContain("Retry");
    // While the game is shown too
    expect(render({ game: game(), status: "lost" })).toContain("Retry");
  });

  it("connects quietly, and says when it is reconnecting", () => {
    expect(render({ game: null, status: "connecting" })).toContain("Connecting to the game");
    expect(render({ game: game(), status: "reconnecting" })).toContain("Reconnecting");
  });

  it("shows the result of a game that ended, and the room's copy of its last move", () => {
    const html = render({
      game: game({ inProgress: false, result: "white_win", reason: "checkmate" }),
      status: "ended",
      roomLiveLabel: "1... e5",
    });
    expect(html).toContain("whitey won by checkmate");
    expect(html).not.toContain("Reconnecting");
    expect(html).toContain("Game&#x27;s last move");
    expect(html).toContain("1... e5");
    expect(html).not.toContain(">Live<");
  });

  it("says so when the game's moves were deleted from the room after it", () => {
    const html = render({ game: game({ inProgress: false, result: "draw" }), status: "ended", canGoLive: false });
    expect(html).toContain("The game&#x27;s moves were deleted from this room");
    expect(html).not.toContain("last move");
  });

  it("goes live during the game with the game's latest move", () => {
    const html = render({ game: game(), status: "open" });
    expect(html).toContain("Live");
    expect(html).toContain("1... e5");
  });
});
