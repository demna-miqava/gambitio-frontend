import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PuzzleDuelGame from "./PuzzleDuelGame";

const mocks = vi.hoisted(() => ({ phase: "playing", opened: [] as number[], titles: [] as string[] }));
vi.mock("@/features/puzzles/duel/hooks/useDuelGame", () => ({
  useDuelGame: (duelId: number) => {
    mocks.opened.push(duelId);
    return { phase: mocks.phase };
  },
}));
vi.mock("@/features/puzzles/duel/components/DuelBoard", () => ({ DuelBoard: () => <p>the board</p> }));
vi.mock("@/features/puzzles/duel/components/PuzzleDuelSidebar", () => ({ PuzzleDuelSidebar: () => <p>the panel</p> }));
vi.mock("@/hooks/useDocumentTitle", () => ({ useDocumentTitle: (title: string) => void mocks.titles.push(title) }));

const render = (path: string) =>
  renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/puzzles/duel/:duelId" element={<PuzzleDuelGame />} />
        <Route path="/puzzles/duel" element={<p>the lobby</p>} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  mocks.phase = "playing";
  mocks.opened = [];
  mocks.titles = [];
});

describe("a puzzle duel's page", () => {
  it("opens the duel in the address, with its board and panel", () => {
    const html = render("/puzzles/duel/12");
    expect(mocks.opened).toEqual([12]);
    expect(html).toContain("the board");
    expect(html).toContain("the panel");
    expect(mocks.titles.at(-1)).toBe("Puzzle duel");
  });

  it("is titled as the result once the duel is over", () => {
    mocks.phase = "over";
    render("/puzzles/duel/12");
    expect(mocks.titles.at(-1)).toBe("Puzzle duel: result");
  });

  it.each(["abc", "0", "-3", "1e3", "12.5", "..%2Fusers%2F5"])("asks the server for nothing when the address has %s for an id", (id) => {
    const html = render(`/puzzles/duel/${id}`);
    expect(mocks.opened).toEqual([]);
    expect(html).not.toContain("the board");
  });
});
