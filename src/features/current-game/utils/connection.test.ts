import { describe, expect, it } from "vitest";
import {
  AWAY_GRACE_MS,
  NOBODY_AWAY,
  awayAfterChange,
  awayFromState,
  awayStatus,
  formatCountdown,
} from "./connection";

const NOW = 1_000_000;
const left = (seq = 10, extra = {}) => ({ userId: 7, connected: false, seq, goneForMs: 0, claimAfterMs: 30_000, ...extra });

describe("away players", () => {
  it("a player who just left isn't shown as away until the grace has passed", () => {
    const players = awayAfterChange(NOBODY_AWAY, left(), NOW);
    expect(awayStatus(players, 7, NOW + AWAY_GRACE_MS - 1)).toEqual({ away: false, claimInSeconds: null });
    expect(awayStatus(players, 7, NOW + AWAY_GRACE_MS)).toEqual({ away: true, claimInSeconds: 27 });
    // The other player is unaffected
    expect(awayStatus(players, 8, NOW + 60_000)).toEqual({ away: false, claimInSeconds: null });
  });

  it("counts down to the claim and stops at zero", () => {
    const players = awayAfterChange(NOBODY_AWAY, left(), NOW);
    expect(awayStatus(players, 7, NOW + 14_100).claimInSeconds).toBe(16);
    expect(awayStatus(players, 7, NOW + 29_999).claimInSeconds).toBe(1);
    expect(awayStatus(players, 7, NOW + 30_000).claimInSeconds).toBe(0);
    expect(awayStatus(players, 7, NOW + 90_000).claimInSeconds).toBe(0);
  });

  it("coming back clears it", () => {
    const gone = awayAfterChange(NOBODY_AWAY, left(), NOW);
    const back = awayAfterChange(gone, { userId: 7, connected: true, seq: 20 }, NOW + 5_000);
    expect(awayStatus(back, 7, NOW + 60_000).away).toBe(false);
    // The wait is remembered for the next time they leave
    expect(back.claimAfterMs).toBe(30_000);
  });

  it("drops a change older than the last one taken for that player", () => {
    const back = awayAfterChange(NOBODY_AWAY, { userId: 7, connected: true, seq: 20 }, NOW);
    // "Left" from before they came back, arriving late
    expect(awayAfterChange(back, left(10), NOW + 100)).toBe(back);
    // A newer one counts
    expect(awayStatus(awayAfterChange(back, left(30), NOW + 100), 7, NOW + 10_000).away).toBe(true);
  });

  it("takes the server's state on connect, with how long each has been gone", () => {
    const players = awayFromState(
      NOBODY_AWAY,
      { away: [{ userId: 7, goneForMs: 20_000 }], awaySeq: 4, claimAfterMs: 30_000, isFinished: false },
      NOW
    );
    expect(awayStatus(players, 7, NOW)).toEqual({ away: true, claimInSeconds: 10 });
    expect(
      awayFromState(players, { away: [{ userId: 7, goneForMs: 20_000 }], isFinished: true }, NOW)
    ).toBe(NOBODY_AWAY);
    // An older server sends none of the fields
    expect(awayFromState(NOBODY_AWAY, { isFinished: false }, NOW)).toEqual(NOBODY_AWAY);
  });

  it("a state replaces what was known up to its number", () => {
    const gone = awayAfterChange(NOBODY_AWAY, left(3), NOW);
    // They came back, as the newer state knows: nobody is away
    const state = awayFromState(gone, { away: [], awaySeq: 4, claimAfterMs: 30_000, isFinished: false }, NOW + 9_000);
    expect(awayStatus(state, 7, NOW + 60_000).away).toBe(false);
    // And a change older than the state, arriving after it, is still dropped
    expect(awayStatus(awayAfterChange(state, left(3), NOW + 9_100), 7, NOW + 60_000).away).toBe(false);
  });

  it("keeps a change that overtook the state it is newer than", () => {
    // The player left (change 5) while the state (as of change 4) was being put together
    const gone = awayAfterChange(NOBODY_AWAY, left(5), NOW);
    const state = awayFromState(gone, { away: [], awaySeq: 4, claimAfterMs: 30_000, isFinished: false }, NOW + 200);
    expect(awayStatus(state, 7, NOW + 10_000)).toEqual({ away: true, claimInSeconds: 20 });
    // The other way round: back (change 5) before a state that still lists them as gone
    const back = awayAfterChange(NOBODY_AWAY, { userId: 7, connected: true, seq: 5 }, NOW);
    const stale = awayFromState(
      back,
      { away: [{ userId: 7, goneForMs: 40_000 }], awaySeq: 4, claimAfterMs: 30_000, isFinished: false },
      NOW + 200
    );
    expect(awayStatus(stale, 7, NOW + 10_000).away).toBe(false);
    // Another player in the same state is taken from it
    const both = awayFromState(
      back,
      { away: [{ userId: 8, goneForMs: 5_000 }], awaySeq: 4, claimAfterMs: 30_000, isFinished: false },
      NOW
    );
    expect(awayStatus(both, 8, NOW).away).toBe(true);
  });

  it("without a wait from the server the player shows as away but the win can't be claimed", () => {
    const players = awayAfterChange(NOBODY_AWAY, left(10, { claimAfterMs: undefined }), NOW);
    expect(awayStatus(players, 7, NOW + 60_000)).toEqual({ away: true, claimInSeconds: null });
  });

  it("formats the countdown", () => {
    expect(formatCountdown(15)).toBe("0:15");
    expect(formatCountdown(60)).toBe("1:00");
    expect(formatCountdown(0)).toBe("0:00");
  });
});
