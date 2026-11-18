import { afterEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { SeriesSummary } from "../types";
import { recordServerDate, resetServerClock } from "@/utils/serverClock";
import { MatchClock } from "./MatchClock";

const timed = (endsInMs: number): SeriesSummary => ({
  id: 7,
  createdAt: "2026-01-01T00:00:00Z",
  bestOf: 0,
  matchMinutes: 15,
  endsAt: new Date(Date.now() + endsInMs).toISOString(),
  lastGameStartsBy: new Date(Date.now() + endsInMs - 60_000).toISOString(),
  time: 180,
  increment: 0,
  status: "active",
  endReason: null,
  endedAt: null,
  winnerId: null,
  gamesPlayed: 1,
  playerOne: { id: 1, username: "alice", avatarUrl: null, score: 2 },
  playerTwo: { id: 2, username: "bobby", avatarUrl: null, score: 0 },
  next: null,
});

describe("MatchClock", () => {
  afterEach(resetServerClock);

  it("counts down to the server's end of the match", () => {
    expect(renderToStaticMarkup(<MatchClock series={timed(10 * 60_000)} />)).toContain("10:00 left");
  });

  it("counts on the server's clock when this device's is off", () => {
    // This device is 5 minutes slow: the server is 5 minutes further on
    recordServerDate(new Date(Date.now() + 5 * 60_000).toUTCString());
    const html = renderToStaticMarkup(<MatchClock series={timed(10 * 60_000)} />);
    expect(html).toMatch(/[45]:\d\d left/);
  });

  it("says the time is up once it is", () => {
    expect(renderToStaticMarkup(<MatchClock series={timed(-1_000)} />)).toContain("Time&#x27;s up");
  });
});
