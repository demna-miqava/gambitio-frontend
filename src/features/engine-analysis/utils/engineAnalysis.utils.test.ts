import { describe, expect, it } from "vitest";
import { formatScore } from "./engineAnalysis.utils";

const line = (score: number) => ({ score, pv: [], depth: 16, multipv: 1 });

describe("formatScore (analysis lines)", () => {
  it("never shows a negative zero", () => {
    expect(formatScore(line(-4), "white")).toBe("0.0");
    expect(formatScore(line(4), "black")).toBe("0.0");
    expect(formatScore(line(0), "black")).toBe("0.0");
  });

  it("keeps signs for real advantages", () => {
    expect(formatScore(line(130), "white")).toBe("+1.3");
    expect(formatScore(line(130), "black")).toBe("-1.3");
    expect(formatScore(line(-6), "white")).toBe("-0.1");
  });
});
