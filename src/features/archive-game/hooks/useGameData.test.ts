import { describe, expect, test } from "vitest";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import type { StoredGame } from "@/types/game.types";
import { QKEY_GAME_BY_ID } from "@/constants/queryKeys";
import { refetchUnfinished } from "./useGameData";

const FIVE_MINUTES_MS = 5 * 60 * 1000;

/** Mounts the archive's query over a copy cached a moment ago; returns how often it fetched. */
async function fetchesOnMount(cached: Partial<StoredGame>) {
  // As in main.tsx: cached data counts as fresh for five minutes
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: FIVE_MINUTES_MS } } });
  const queryKey = [QKEY_GAME_BY_ID, "42"];
  client.setQueryData(queryKey, cached);
  let fetches = 0;
  const observer = new QueryObserver<StoredGame>(client, {
    queryKey,
    queryFn: async () => {
      fetches++;
      return { ...cached, status: "finished", pgn: "1. e4 e5" } as StoredGame;
    },
    retry: false,
    refetchOnMount: refetchUnfinished,
  });
  const unsubscribe = observer.subscribe(() => {});
  await new Promise((resolve) => setTimeout(resolve, 0));
  const data = observer.getCurrentResult().data;
  unsubscribe();
  client.clear();
  return { fetches, data };
}

describe("opening a game right after it ended", () => {
  test("a fresh copy cached while the game was on is fetched again", async () => {
    const { fetches, data } = await fetchesOnMount({ id: 42, status: "in_progress", pgn: null });
    expect(fetches).toBe(1);
    expect(data?.status).toBe("finished");
    expect(data?.pgn).toBe("1. e4 e5");
  });

  test("a finished game is not fetched again", async () => {
    const { fetches } = await fetchesOnMount({ id: 42, status: "finished", pgn: "1. e4 e5" });
    expect(fetches).toBe(0);
  });
});
