import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { planChallenge, type ChallengeForm } from "../../../utils/challengePlan";
import { RatingSection } from "./RatingSection";

const render = (overrides: Partial<ChallengeForm>) =>
  renderToStaticMarkup(
    <RatingSection
      plan={planChallenge({
        friendId: 12,
        color: "random",
        time: 300,
        increment: 0,
        format: "single",
        seriesLength: "3",
        matchMinutes: 15,
        odds: "even",
        pickedClock: null,
        rating: "rated",
        openingId: null,
        ...overrides,
      })}
      rating={overrides.rating ?? "rated"}
      onRatingChange={() => {}}
    />
  );

describe("RatingSection", () => {
  it("offers the choice for a game from the standard position", () => {
    const markup = render({});
    expect(markup).not.toContain("data-disabled");
    expect(markup).not.toContain("chosen opening");
  });

  it("locks a game from an opening on Unrated and says why", () => {
    const markup = render({ openingId: "sicilian" });
    expect(markup).toContain("data-disabled");
    expect(markup).toMatch(/value="unrated"[^>]*aria-checked="true"|aria-checked="true"[^>]*value="unrated"/);
    expect(markup).toContain("Games from a chosen opening are unrated, except mirror matches");
  });

  it("gives the choice back for a mirror match from an opening", () => {
    const markup = render({ format: "mirror", openingId: "sicilian" });
    expect(markup).not.toContain("data-disabled");
    expect(markup).not.toContain("chosen opening");
  });

  it("locks a game with time odds on Unrated and says why", () => {
    const markup = render({ odds: "me" });
    expect(markup).toContain("data-disabled");
    expect(markup).toContain("Games with time odds are unrated.");
  });
});
