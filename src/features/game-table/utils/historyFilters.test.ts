import { describe, expect, it } from "vitest";
import {
  countActiveFilters,
  historyFiltersToApi,
  isDateRangeInverted,
  parseHistoryFilters,
  withFilter,
  withoutFilters,
} from "./historyFilters";

const params = (query: string) => new URLSearchParams(query);

describe("game history filters", () => {
  it("reads the filters from the URL, ignoring values the page never writes", () => {
    expect(
      parseHistoryFilters(
        params("result=lost&color=black&timeControl=blitz&rated=rated&kind=bot&opponent=%20Bob_1%20&from=2026-11-01&to=2026-11-21&page=3")
      )
    ).toEqual({
      result: "lost",
      color: "black",
      timeControl: "blitz",
      rated: "rated",
      kind: "bot",
      opponent: "Bob_1",
      from: "2026-11-01",
      to: "2026-11-21",
    });
    expect(
      parseHistoryFilters(params("result=win&color=red&rated=yes&kind=live&opponent=a b&from=2026-13-45&to=yesterday"))
    ).toEqual({});
  });

  it("counts a date range once", () => {
    expect(countActiveFilters({})).toBe(0);
    expect(countActiveFilters({ result: "won", from: "2026-01-01", to: "2026-02-01" })).toBe(2);
    expect(countActiveFilters({ to: "2026-02-01" })).toBe(1);
  });

  it("sends the API its own names, and local days as instants", () => {
    const api = historyFiltersToApi({ rated: "unrated", opponent: "bob", from: "2026-11-01", to: "2026-11-21" });
    expect(api.rated).toBe("false");
    expect(api.opponent).toBe("bob");
    expect(new Date(api.since!).getTime()).toBe(new Date(2026, 10, 1).getTime());
    // The whole of the last day
    expect(new Date(api.before!).getTime()).toBe(new Date(2026, 10, 22).getTime());
    expect(historyFiltersToApi({ rated: "rated" }).rated).toBe("true");
  });

  it("sends no dates when the range runs backwards", () => {
    const f = { from: "2026-11-21", to: "2026-11-01" };
    expect(isDateRangeInverted(f)).toBe(true);
    expect(historyFiltersToApi(f)).toEqual({});
  });

  it("goes back to page 1 when a filter changes or all are cleared", () => {
    const next = withFilter(params("page=4&limit=20&result=won"), "color", "white");
    expect(next.get("page")).toBeNull();
    expect(next.get("limit")).toBe("20");
    expect(next.get("color")).toBe("white");
    expect(withFilter(next, "result", undefined).has("result")).toBe(false);
    const cleared = withoutFilters(params("page=2&limit=20&result=won&opponent=bob&from=2026-01-01"));
    expect(cleared.toString()).toBe("limit=20");
  });
});
