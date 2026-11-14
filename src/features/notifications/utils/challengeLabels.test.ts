import { describe, expect, it } from "vitest";
import { describeChallengeColor, describeMatchFormat } from "./challengeLabels";

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
