import { describe, expect, it } from "vitest";
import { paramsForSearch } from "./searchParams";

describe("paramsForSearch", () => {
  it("sets the query and goes back to page 1, keeping other params", () => {
    const current = new URLSearchParams("page=3&show=online");
    expect(paramsForSearch(current, "ali").toString()).toBe("show=online&search=ali");
  });

  it("drops both the query and the page when the search is cleared", () => {
    const current = new URLSearchParams("search=ali&page=2");
    expect(paramsForSearch(current, "").toString()).toBe("");
  });

  it("leaves the params it was given alone", () => {
    const current = new URLSearchParams("page=2");
    paramsForSearch(current, "ali");
    expect(current.toString()).toBe("page=2");
  });
});
