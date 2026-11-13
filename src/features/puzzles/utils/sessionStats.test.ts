import { describe, expect, it } from "vitest";
import { EMPTY_SESSION_STATS, recordSessionResult } from "./sessionStats";

describe("recordSessionResult", () => {
  it("counts solves and misses and tracks the streak", () => {
    let s = recordSessionResult(EMPTY_SESSION_STATS, "a", true);
    s = recordSessionResult(s, "b", true);
    expect(s).toMatchObject({ solved: 2, failed: 0, streak: 2 });
    s = recordSessionResult(s, "c", false);
    expect(s).toMatchObject({ solved: 2, failed: 1, streak: 0 });
    s = recordSessionResult(s, "d", true);
    expect(s).toMatchObject({ solved: 3, failed: 1, streak: 1 });
  });

  it("counts only the first result for a puzzle (a solve after Retry stays a miss)", () => {
    const missed = recordSessionResult(EMPTY_SESSION_STATS, "a", false);
    expect(recordSessionResult(missed, "a", true)).toBe(missed);
    expect(recordSessionResult(missed, "a", false)).toBe(missed);
  });
});
