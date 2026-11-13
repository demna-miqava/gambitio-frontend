import { afterEach, describe, expect, test, vi } from "vitest";
import { StockfishService } from "./stockfish";
import { StockfishParser } from "./stockfishParser";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const AFTER_E4 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";

/** Canned "go" output, replayed asynchronously like the real worker. */
let searchOutput: string[] = [];

class FakeStockfishWorker {
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: ((event: { message: string }) => void) | null = null;

  private emit(lines: string[]) {
    setTimeout(() => {
      for (const line of lines) this.onmessage?.({ data: line });
    }, 0);
  }

  postMessage(message: string) {
    if (message === "uci") this.emit(["id name Fake", "uciok"]);
    else if (message === "isready") this.emit(["readyok"]);
    else if (message.startsWith("go")) this.emit(searchOutput);
  }

  terminate() {}
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("StockfishService.analyzeMultiPv", () => {
  test("returns the deepest lines when movetime ends the search before the target depth", async () => {
    vi.stubGlobal("Worker", FakeStockfishWorker);
    // A slow device (phone): depth 18 requested, time runs out at depth 14
    searchOutput = [
      "info depth 13 seldepth 17 multipv 1 score cp 30 nodes 900 pv e2e4 e7e5",
      "info depth 13 seldepth 16 multipv 2 score cp 22 nodes 900 pv d2d4 d7d5",
      "info depth 14 seldepth 18 multipv 1 score cp 41 lowerbound nodes 1200 pv e2e4",
      "info depth 14 seldepth 19 multipv 1 score cp 35 nodes 1500 pv e2e4 c7c5",
      "info depth 14 seldepth 18 multipv 2 score cp 20 nodes 1500 pv d2d4 g8f6",
      "bestmove e2e4 ponder c7c5",
    ];
    const engine = new StockfishService();
    await engine.init({ depth: 18, moveTime: 2000 });

    const result = await engine.analyzeMultiPv(START, 2);

    expect(result.depth).toBe(14);
    expect(result.lines).toEqual([
      { depth: 14, multipv: 1, score: 35, mate: undefined, pv: ["e2e4", "c7c5"] },
      { depth: 14, multipv: 2, score: 20, mate: undefined, pv: ["d2d4", "g8f6"] },
    ]);
    engine.destroy();
  });

  test("reports scores from white's view when black is to move", async () => {
    vi.stubGlobal("Worker", FakeStockfishWorker);
    searchOutput = ["info depth 10 multipv 1 score cp -40 pv c7c5", "bestmove c7c5"];
    const engine = new StockfishService();
    await engine.init({ depth: 18, moveTime: 2000 });

    const result = await engine.analyzeMultiPv(AFTER_E4, 1);

    expect(result.lines[0]).toMatchObject({ depth: 10, score: 40, pv: ["c7c5"] });
    engine.destroy();
  });
});

describe("StockfishParser.parseInfo", () => {
  const parser = new StockfishParser();

  test("parses a scored line at any depth", () => {
    expect(parser.parseInfo("info depth 7 seldepth 9 multipv 2 score cp -12 nodes 50 pv g1f3 d7d5")).toEqual({
      depth: 7,
      multipv: 2,
      score: -12,
      pv: ["g1f3", "d7d5"],
    });
  });

  test("turns mate scores into a large score plus the mate count", () => {
    expect(parser.parseInfo("info depth 5 multipv 1 score mate -2 pv h7h8")).toMatchObject({
      mate: -2,
      score: -100000,
    });
  });

  test("ignores provisional bound scores and lines without a score or pv", () => {
    expect(parser.parseInfo("info depth 9 multipv 1 score cp 80 upperbound pv a2a3")).toBeNull();
    expect(parser.parseInfo("info depth 9 multipv 1 score cp 80 lowerbound pv a2a3")).toBeNull();
    expect(parser.parseInfo("info depth 3 currmove e2e4 currmovenumber 1")).toBeNull();
    expect(parser.parseInfo("info string NNUE evaluation using nn.bin")).toBeNull();
    expect(parser.parseInfo("bestmove e2e4")).toBeNull();
  });
});
