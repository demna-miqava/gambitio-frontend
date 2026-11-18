import { describe, expect, it } from "vitest";
import {
  describeChallengeColor,
  describeChallengeOpening,
  describeChallengeTime,
  describeMatchFormat,
  isCasualChallenge,
} from "./challengeLabels";

describe("describeMatchFormat", () => {
  it("names series and leaves single games unlabelled", () => {
    expect(describeMatchFormat(3)).toBe("Best of 3");
    expect(describeMatchFormat(5)).toBe("Best of 5");
    expect(describeMatchFormat(1)).toBeNull();
    expect(describeMatchFormat(undefined)).toBeNull();
  });

  it("names the game a continued series goes on with", () => {
    expect(describeMatchFormat(3, 2)).toBe("Game 2 of 3");
    expect(describeMatchFormat(1, 2)).toBeNull();
  });
});

describe("describeChallengeColor", () => {
  it("describes the colour from the receiving player's side", () => {
    expect(describeChallengeColor("white")).toBe("You play white");
    expect(describeChallengeColor("black")).toBe("You play black");
    expect(describeChallengeColor("random")).toBe("Random colors");
  });
});

describe("describeChallengeTime", () => {
  it("shows the time control of an even game", () => {
    expect(describeChallengeTime({ time: 300, increment: 0 }, "alice")).toBe("5+0");
    expect(
      describeChallengeTime({ time: 180, increment: 2, ownTime: null, opponentTime: null }, "alice")
    ).toBe("3+2");
  });

  it("names each player's clock when there are time odds", () => {
    expect(
      describeChallengeTime({ time: 300, increment: 0, ownTime: 300, opponentTime: 60 }, "alice")
    ).toBe("Time odds: you 5 min, alice 1 min");
    expect(
      describeChallengeTime({ time: 300, increment: 2, ownTime: 30, opponentTime: 300 }, "alice")
    ).toBe("Time odds: you 30 sec, alice 5 min, +2 sec");
  });
});

describe("isCasualChallenge", () => {
  it("calls a challenge unrated only when it says so", () => {
    expect(isCasualChallenge({ rated: false })).toBe(true);
    expect(isCasualChallenge({ rated: true })).toBe(false);
    // From a server that predates casual challenges
    expect(isCasualChallenge({})).toBe(false);
  });

  it("leaves it to the clocks when there are time odds", () => {
    expect(isCasualChallenge({ rated: false, ownTime: 300, opponentTime: 60 })).toBe(false);
  });
});

describe("mirror matches and openings", () => {
  it("names a mirror match and the game a continued one goes on with", () => {
    expect(describeMatchFormat(2)).toBe("Mirror match");
    expect(describeMatchFormat(2, 2)).toBe("Mirror match, game 2");
  });

  it("names the opening a challenge starts from", () => {
    expect(describeChallengeOpening({ name: "Queen's Gambit" })).toBe("From the Queen's Gambit");
    expect(describeChallengeOpening(null)).toBeNull();
    expect(describeChallengeOpening(undefined)).toBeNull();
  });
});
