import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { QKEY_CONVERSION_DRILLS } from "@/constants/queryKeys";
import { ReviewEngine } from "@/features/game-review/services/reviewEngine";
import { getScanCandidates, recordDrillScan } from "@/services/conversionDrills";
import { SCAN_LIMITS, findDrill, playerPositions } from "../utils/findDrill";

/** Games looked at per scan: a couple of minutes of engine work at most */
export const GAMES_PER_SCAN = 10;

export type DrillScanState =
  | { status: "idle" }
  | { status: "scanning"; done: number; total: number; found: number }
  | { status: "done"; scanned: number; found: number }
  | { status: "error"; scanned: number; found: number };

const isAbort = (error: unknown) => error instanceof Error && error.name === "AbortError";

/**
 * Looks for drills in the player's recent games they didn't win: each game
 * the server hands out is evaluated with Stockfish in the browser
 * (findDrill), and the result, a position or none, goes back to the server,
 * which keeps the game from being scanned again. Leaving the page stops the
 * scan; the games already reported stay done.
 */
export const useDrillScan = () => {
  const queryClient = useQueryClient();
  const [state, setState] = useState<DrillScanState>({ status: "idle" });
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const start = useCallback(async () => {
    if (controllerRef.current) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    const engine = new ReviewEngine();
    controller.signal.addEventListener("abort", () => engine.terminate());
    let scanned = 0;
    let found = 0;
    try {
      setState({ status: "scanning", done: 0, total: 0, found: 0 });
      const games = await getScanCandidates(GAMES_PER_SCAN);
      setState({ status: "scanning", done: 0, total: games.length, found: 0 });
      for (const game of games) {
        const drill = await findDrill(
          playerPositions(game.pgn, game.color),
          game.color,
          (fen) => engine.evaluate(fen, SCAN_LIMITS),
          controller.signal
        );
        const saved = await recordDrillScan(game.gameId, drill);
        scanned += 1;
        if (saved) {
          found += 1;
          void queryClient.invalidateQueries({ queryKey: [QKEY_CONVERSION_DRILLS] });
        }
        setState({ status: "scanning", done: scanned, total: games.length, found });
      }
      setState({ status: "done", scanned, found });
    } catch (error) {
      setState(isAbort(error) ? { status: "done", scanned, found } : { status: "error", scanned, found });
    } finally {
      engine.terminate();
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }, [queryClient]);

  const cancel = useCallback(() => controllerRef.current?.abort(), []);

  return { state, start, cancel };
};
