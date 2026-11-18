import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import type { StoredGame } from "@/types";
import { SharedGameViewer } from "./SharedGameViewer";
import { canShareGame } from "./ShareLinkContext";

const game = {
  id: 7,
  createdAt: new Date("2026-11-18T10:00:00Z"),
  pgn: "1. f3 e5 2. g4 Qh4# 0-1",
  fen: null,
  winnerId: 2,
  numMoves: 4,
  time: 180,
  increment: 2,
  type: "blitz",
  status: "finished",
  result: "black_win",
  endReason: "checkmate",
  rated: true,
  botId: null,
  whitePlayer: { id: 1, username: "alice", rating: 1500, provisional: true, avatarUrl: null, ratingChange: -7 },
  blackPlayer: { id: 2, username: "bob", rating: 1490, avatarUrl: null, ratingChange: 7 },
} as StoredGame;

const render = (shown: StoredGame = game) =>
  renderToStaticMarkup(
    <MemoryRouter>
      <SharedGameViewer
        game={shown}
        signInHref="/signin?redirect_url=%2Fshare%2FaB3dE6gH9jK2mN"
        signUpHref="/signup?redirect_url=%2Fshare%2FaB3dE6gH9jK2mN"
      />
    </MemoryRouter>
  );

// Rendered without a signed-in user, settings or a query client: none exist on this page
describe("SharedGameViewer", () => {
  it("shows who played, how it ended and the moves", () => {
    const html = render();
    expect(html).toContain("alice");
    expect(html).toContain("bob won by checkmate");
    expect(html).toContain("0-1");
    expect(html).toContain("Blitz 3+2 · Rated");
    for (const san of ["f3", "e5", "g4", "Qh4#"]) expect(html).toContain(`>${san}<`);
    // Both ratings, the provisional one marked
    expect(html).toMatch(/1500<span[^>]*title="Provisional rating/);
    expect(html).toContain("1490");
  });

  it("opens on the final position, with nothing further to step to", () => {
    const html = render();
    expect(html).toMatch(/aria-current="step"[^>]*>.*?Qh4#/s);
    expect(html).toMatch(/<button[^>]*aria-label="Next move \(→\)"[^>]*disabled=""/);
    expect(html).not.toMatch(/<button[^>]*aria-label="Previous move \(←\)"[^>]*disabled=""/);
  });

  it("invites visitors to sign in for the engine, and brings them back here", () => {
    const html = render();
    expect(html).toContain("See what the engine thinks");
    expect(html).toContain('href="/signin?redirect_url=%2Fshare%2FaB3dE6gH9jK2mN"');
    expect(html).toContain('href="/signup?redirect_url=%2Fshare%2FaB3dE6gH9jK2mN"');
    // No engine, review or account-only controls on the public page
    expect(html).not.toContain("Engine</label>");
    expect(html).not.toContain("Save line");
  });

  it("copes with a game that has no moves", () => {
    const html = render({ ...game, pgn: null, result: "draw", endReason: "draw_agreement" });
    expect(html).toContain("No moves were played.");
    expect(html).toContain("Draw by agreement");
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>.*?Copy PGN/s);
  });

  it("labels a bot game and gives the bot no profile picture of a person", () => {
    const html = render({
      ...game,
      botId: "casual-bot",
      time: null,
      type: null,
      rated: false,
      whitePlayer: { id: null, username: "Casual Carl", rating: 600, avatarUrl: null, ratingChange: null },
    });
    expect(html).toContain("Against a bot");
    expect(html).not.toContain("Rated");
    expect(html).toContain("Casual Carl");
  });
});

describe("canShareGame", () => {
  it("is for the two players, once the game was played to an end", () => {
    expect(canShareGame(game, 1)).toBe(true);
    expect(canShareGame(game, 2)).toBe(true);
    expect(canShareGame(game, 3)).toBe(false);
    expect(canShareGame(game, undefined)).toBe(false);
    expect(canShareGame(game, null)).toBe(false);
    expect(canShareGame({ ...game, status: "in_progress", result: null }, 1)).toBe(false);
    expect(canShareGame({ ...game, result: "aborted" }, 1)).toBe(false);
  });

  it("never for a table game (history and review only)", () => {
    expect(canShareGame({ ...game, tableGame: true }, 1)).toBe(false);
  });

  it("never matches the bot's empty side of a bot game", () => {
    const botGame = { ...game, botId: "casual-bot", whitePlayer: { ...game.whitePlayer, id: null } };
    expect(canShareGame(botGame, 2)).toBe(true);
    expect(canShareGame(botGame, null)).toBe(false);
    expect(canShareGame(botGame, undefined)).toBe(false);
  });
});
