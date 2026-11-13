import { describe, expect, it } from "vitest";
import { formatTimeControl } from "./timeControl";

describe("formatTimeControl", () => {
  it("always shows minutes+increment", () => {
    expect(formatTimeControl(300)).toBe("5+0");
    expect(formatTimeControl(300, 0)).toBe("5+0");
    expect(formatTimeControl(180, 2)).toBe("3+2");
    expect(formatTimeControl(900, 10)).toBe("15+10");
    expect(formatTimeControl(5400, 30)).toBe("90+30");
  });

  it("treats a null increment as 0", () => {
    expect(formatTimeControl(600, null)).toBe("10+0");
  });

  it("uses fractions for sub-minute starting times", () => {
    expect(formatTimeControl(15)).toBe("¼+0");
    expect(formatTimeControl(30)).toBe("½+0");
    expect(formatTimeControl(45, 1)).toBe("¾+1");
  });

  it("falls back to a decimal for other times", () => {
    expect(formatTimeControl(90)).toBe("1.5+0");
    expect(formatTimeControl(20)).toBe("0.33+0");
  });
});
