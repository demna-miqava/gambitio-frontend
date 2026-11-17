import { useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { useMoveNavigation } from "./useMoveNavigation";

type Navigation = ReturnType<typeof useMoveNavigation>;
type Action = "goToPreviousMove" | "goToNextMove";

// Server rendering lets us exercise the hook's state transitions without a DOM.
function navigate(totalMoves: number, actions: Action[]) {
  let result: Navigation;
  function Harness() {
    const navigation = useMoveNavigation(totalMoves);
    const [step, setStep] = useState(0);
    if (step < actions.length) {
      navigation[actions[step]]();
      setStep(step + 1);
    }
    result = navigation;
    return null;
  }
  renderToStaticMarkup(<Harness />);
  return result!;
}

describe("move navigation", () => {
  it("leaves history mode when Next returns to the latest move", () => {
    const navigation = navigate(4, ["goToPreviousMove", "goToNextMove"]);
    expect(navigation.currentIndex).toBe(4);
    expect(navigation.isAtEnd).toBe(true);
    expect(navigation.viewingIndex).toBeNull();
    expect(navigation.isViewingHistory).toBe(false);
  });

  it("keeps earlier positions in history mode", () => {
    const navigation = navigate(4, [
      "goToPreviousMove", "goToPreviousMove", "goToNextMove",
    ]);
    expect(navigation.currentIndex).toBe(3);
    expect(navigation.isViewingHistory).toBe(true);
    expect(navigation.isAtEnd).toBe(false);
  });

  it.each([0, 1, 4])("keeps Next at the live position with %i moves", (totalMoves) => {
    const navigation = navigate(totalMoves, ["goToNextMove"]);
    expect(navigation.currentIndex).toBe(totalMoves);
    expect(navigation.viewingIndex).toBeNull();
    expect(navigation.isViewingHistory).toBe(false);
  });
});
