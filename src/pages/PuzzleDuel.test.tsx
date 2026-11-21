import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { QKEY_ACTIVE_DUEL } from "@/constants/queryKeys";
import PuzzleDuel from "./PuzzleDuel";

vi.mock("@/features/puzzles/components/layout/LandingBoard", () => ({ LandingBoard: () => null }));
vi.mock("@/features/puzzles/duel/components/DuelLobby", () => ({ DuelLobby: () => <p>the lobby</p> }));

/** The duels page as the server's answer to "is a duel on?" leaves it (none: not answered yet) */
const render = (active?: number | null) => {
  const queryClient = new QueryClient();
  if (active !== undefined) queryClient.setQueryData([QKEY_ACTIVE_DUEL], active);
  const html = renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/puzzles/duel"]}>
        <Routes>
          <Route path="/puzzles/duel" element={<PuzzleDuel />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
  return { html, queryClient };
};

describe("the puzzle duels page", () => {
  it("is the lobby for a player with no duel on", () => {
    expect(render(null).html).toContain("the lobby");
  });

  it("is the lobby while the server hasn't answered", () => {
    expect(render().html).toContain("the lobby");
  });

  it("sends a player with a duel on back to it instead", () => {
    expect(render(12).html).not.toContain("the lobby");
  });

  it("asks afresh on every visit: an answer kept from before would send a player back to a duel that has ended", () => {
    const { queryClient } = render(null);
    const options = queryClient.getQueryCache().find({ queryKey: [QKEY_ACTIVE_DUEL] })?.options;
    expect(options?.gcTime).toBe(0);
  });
});
