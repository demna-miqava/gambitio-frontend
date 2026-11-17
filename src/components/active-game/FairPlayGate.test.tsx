import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { QKEY_ACTIVE_GAME } from "@/constants/queryKeys";
import { FairPlayGate } from "./FairPlayGate";

const ENGINE_PAGE = "engine page";

/** The gated page as the server's answer (if any yet) leaves it */
const render = (activeGame?: { gameId: number | null }, failed = false) => {
  const queryClient = new QueryClient();
  if (activeGame) queryClient.setQueryData([QKEY_ACTIVE_GAME], activeGame);
  if (failed) {
    const query = queryClient.getQueryCache().build(queryClient, { queryKey: [QKEY_ACTIVE_GAME] });
    query.setState({ status: "error", error: new Error("offline"), fetchStatus: "idle" });
  }
  return renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/analysis"]}>
        <Routes>
          <Route element={<FairPlayGate />}>
            <Route path="/analysis" element={<p>{ENGINE_PAGE}</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("FairPlayGate", () => {
  it("opens the page when the player isn't in a game", () => {
    expect(render({ gameId: null })).toContain(ENGINE_PAGE);
  });

  it("closes the page during a live game and links back to it", () => {
    const html = render({ gameId: 42 });
    expect(html).not.toContain(ENGINE_PAGE);
    expect(html).toContain("Not available during a game");
    expect(html).toContain('href="/game/42"');
  });

  it("keeps the page closed until the server has answered", () => {
    const html = render();
    expect(html).not.toContain(ENGINE_PAGE);
    expect(html).toContain('role="status"');
  });

  it("keeps the page closed after a check that failed", () => {
    expect(render(undefined, true)).not.toContain(ENGINE_PAGE);
  });
});
