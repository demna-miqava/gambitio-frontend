import { describe, expect, test } from "vitest";
import { ReviewEngine, toWhiteEval, type EngineWorker } from "./reviewEngine";
import { runReview } from "./runReview";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const AFTER_E4 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
const FOOLS_MATE = "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3";

/**
 * Stands in for the Stockfish worker: answers the UCI handshake and replays
 * canned search output per position, asynchronously like the real thing.
 */
class FakeStockfish implements EngineWorker {
  onmessage: EngineWorker["onmessage"] = null;
  onerror: EngineWorker["onerror"] = null;
  received: string[] = [];
  terminated = false;
  /** When false, "go" gets no answer (a search that's still running) */
  answerSearches = true;
  private fen = "";

  constructor(private readonly searches: Record<string, string[]>) {}

  private emit(lines: string[]) {
    setTimeout(() => {
      for (const line of lines) this.onmessage?.({ data: line });
    }, 0);
  }

  postMessage(message: string) {
    this.received.push(message);
    if (message === "uci") this.emit(["id name Fake", "uciok"]);
    else if (message === "isready") this.emit(["readyok"]);
    else if (message.startsWith("position fen ")) this.fen = message.slice("position fen ".length);
    else if (message.startsWith("go") && this.answerSearches) {
      this.emit(this.searches[this.fen] ?? ["bestmove (none)"]);
    }
  }

  terminate() {
    this.terminated = true;
  }
}

const searches = {
  [START]: [
    "info depth 1 multipv 1 score cp 50 pv d2d4",
    "info depth 12 multipv 1 score cp 25 nodes 10 pv e2e4 e7e5",
    "bestmove e2e4 ponder e7e5",
  ],
  // Black to move: -40 for black is +40 for white
  [AFTER_E4]: ["info depth 12 multipv 1 score cp -40 pv c7c5", "bestmove c7c5"],
};

describe("ReviewEngine", () => {
  test("does the handshake once, searches with the limits, and reports from white's view", async () => {
    const worker = new FakeStockfish(searches);
    const engine = new ReviewEngine(() => worker);

    expect(await engine.evaluate(START, { depth: 12, moveTimeMs: 400 })).toEqual({ type: "cp", value: 25, bestMove: "e2e4" });
    expect(await engine.evaluate(AFTER_E4, { depth: 12, moveTimeMs: 400 })).toEqual({ type: "cp", value: 40, bestMove: "c7c5" });

    expect(worker.received.filter((m) => m === "uci")).toHaveLength(1);
    expect(worker.received).toContain("go depth 12 movetime 400");
    expect(worker.received).toContain(`position fen ${AFTER_E4}`);
    engine.terminate();
    expect(worker.terminated).toBe(true);
    expect(worker.received.at(-1)).toBe("quit");
  });

  test("doesn't ask the engine about a finished game", async () => {
    let created = false;
    const engine = new ReviewEngine(() => {
      created = true;
      return new FakeStockfish({});
    });
    expect(await engine.evaluate(FOOLS_MATE)).toEqual({ type: "over", result: -1 });
    expect(created).toBe(false);
  });

  test("terminating rejects a running search with an AbortError", async () => {
    const worker = new FakeStockfish(searches);
    worker.answerSearches = false;
    const engine = new ReviewEngine(() => worker);
    const search = engine.evaluate(START);
    await new Promise((r) => setTimeout(r, 5)); // let the handshake finish
    engine.terminate();
    await expect(search).rejects.toMatchObject({ name: "AbortError" });
    expect(worker.terminated).toBe(true);
  });

  test("a worker error fails the search", async () => {
    const worker = new FakeStockfish(searches);
    worker.answerSearches = false;
    const engine = new ReviewEngine(() => worker);
    const search = engine.evaluate(START);
    await new Promise((r) => setTimeout(r, 5));
    worker.onerror?.({ message: "wasm failed" });
    await expect(search).rejects.toThrow("wasm failed");
  });
});

describe("runReview", () => {
  test("evaluates every position in order, reports progress, then frees the worker", async () => {
    const worker = new FakeStockfish(searches);
    const progress: number[] = [];
    const evals = await runReview([START, AFTER_E4], {
      engine: new ReviewEngine(() => worker),
      onProgress: (done) => progress.push(done),
    });
    expect(evals.map((e) => (e.type === "cp" ? e.value : null))).toEqual([25, 40]);
    expect(progress).toEqual([0, 1, 2]);
    expect(worker.terminated).toBe(true);
  });

  test("aborting stops the run and terminates the worker", async () => {
    const worker = new FakeStockfish(searches);
    worker.answerSearches = false;
    const controller = new AbortController();
    const run = runReview([START, AFTER_E4], { engine: new ReviewEngine(() => worker), signal: controller.signal });
    await new Promise((r) => setTimeout(r, 5));
    controller.abort();
    await expect(run).rejects.toMatchObject({ name: "AbortError" });
    expect(worker.terminated).toBe(true);
  });
});

describe("toWhiteEval", () => {
  test("flips black-to-move scores, keeps mates, and handles no output", () => {
    const info = { depth: 12, multipv: 1, bound: false, pv: [] };
    expect(toWhiteEval({ ...info, score: { type: "mate", value: 2 } }, "a1a8", true)).toEqual({
      type: "mate",
      value: -2,
      bestMove: "a1a8",
    });
    expect(toWhiteEval({ ...info, score: { type: "mate", value: 0 } }, undefined, true)).toEqual({ type: "over", result: 1 });
    expect(toWhiteEval({ ...info, score: { type: "cp", value: 0 } }, undefined, true)).toEqual({ type: "cp", value: 0 });
    expect(toWhiteEval(undefined, "e2e4", false)).toEqual({ type: "cp", value: 0, bestMove: "e2e4" });
  });
});
