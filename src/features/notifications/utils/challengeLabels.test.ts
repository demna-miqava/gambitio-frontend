import { describe, expect, it } from "vitest";
import { describeChallengeColor } from "./challengeLabels";

describe("describeChallengeColor", () => {
  it("describes the colour from the receiving player's side", () => {
    expect(describeChallengeColor("white")).toBe("You play white");
    expect(describeChallengeColor("black")).toBe("You play black");
    expect(describeChallengeColor("random")).toBe("Random colors");
  });
});
