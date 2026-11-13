import { DEFAULT_STOCKFISH_URL } from "@/features/engine-analysis/constants";
import { REVIEW_ENGINE } from "../constants";
import type { PositionEval } from "../types";
import { terminalEval } from "../utils/gameLine";
import { parseBestMove, parseInfoLine, pickFinalInfo, type UciInfo } from "../utils/uci";

/** The part of a Worker the engine uses (so tests can stand in for Stockfish). */
export interface EngineWorker {
  postMessage(message: string): void;
  terminate(): void;
  onmessage: ((event: { data: unknown }) => void) | null;
  onerror: ((event: { message?: string }) => void) | null;
}

export interface SearchLimits {
  depth: number;
  moveTimeMs: number;
}

export class ReviewAbortedError extends Error {
  constructor() {
    super("Review cancelled");
    this.name = "AbortError";
  }
}

const createStockfishWorker = (): EngineWorker => new Worker(DEFAULT_STOCKFISH_URL) as unknown as EngineWorker;

/**
 * A Stockfish worker of its own for reviewing a game.
 *
 * Deliberately separate from the live analysis engine (StockfishService):
 * that one restarts its search whenever the board moves, so sharing it would
 * mean the two cancelling each other's searches. Each instance runs one
 * search at a time and lives only as long as one review.
 */
export class ReviewEngine {
  private worker: EngineWorker | null = null;
  private started: Promise<void> | null = null;
  /** The one thing currently waiting on engine output */
  private pending: { onLine: (line: string) => void; reject: (error: Error) => void } | null = null;
  private terminated = false;
  private readonly createWorker: () => EngineWorker;

  constructor(createWorker: () => EngineWorker = createStockfishWorker) {
    this.createWorker = createWorker;
  }

  private send(command: string) {
    this.worker?.postMessage(command);
  }

  /** Resolves with the first line `accept` returns a value for. */
  private waitFor<T>(accept: (line: string) => T | undefined): Promise<T> {
    if (this.terminated) return Promise.reject(new ReviewAbortedError());
    return new Promise<T>((resolve, reject) => {
      this.pending = {
        onLine: (line) => {
          const result = accept(line);
          if (result === undefined) return;
          this.pending = null;
          resolve(result);
        },
        reject,
      };
    });
  }

  private start(): Promise<void> {
    if (!this.started) {
      this.started = (async () => {
        const worker = this.createWorker();
        this.worker = worker;
        worker.onmessage = (event) => {
          const text = typeof event.data === "string" ? event.data : String(event.data);
          // Some builds batch several lines into one message
          for (const line of text.split("\n")) this.pending?.onLine(line);
        };
        worker.onerror = (event) => {
          this.fail(new Error(`Stockfish failed${event.message ? `: ${event.message}` : ""}`));
        };

        const uciOk = this.waitFor((line) => (line.trim() === "uciok" ? true : undefined));
        this.send("uci");
        await uciOk;
        const readyOk = this.waitFor((line) => (line.trim() === "readyok" ? true : undefined));
        this.send("setoption name MultiPV value 1");
        this.send("ucinewgame");
        this.send("isready");
        await readyOk;
      })();
    }
    return this.started;
  }

  private fail(error: Error) {
    const pending = this.pending;
    this.pending = null;
    pending?.reject(error);
  }

  /** Evaluates one position, from white's point of view. */
  async evaluate(fen: string, limits: SearchLimits = REVIEW_ENGINE): Promise<PositionEval> {
    const over = terminalEval(fen);
    if (over) return over;

    await this.start();
    const infos: UciInfo[] = [];
    const done = this.waitFor((line) => {
      const info = parseInfoLine(line);
      if (info) infos.push(info);
      return parseBestMove(line) ?? undefined;
    });
    this.send(`position fen ${fen}`);
    this.send(`go depth ${limits.depth} movetime ${limits.moveTimeMs}`);
    const { move } = await done;

    return toWhiteEval(pickFinalInfo(infos), move, fen.split(" ")[1] === "b");
  }

  /** Stops the engine for good; anything waiting on it rejects with an AbortError. */
  terminate() {
    if (this.terminated) return;
    this.terminated = true;
    this.fail(new ReviewAbortedError());
    if (this.worker) {
      this.worker.onmessage = null;
      this.worker.onerror = null;
      this.worker.postMessage("quit");
      this.worker.terminate();
      this.worker = null;
    }
  }
}

/** Engine scores are for the side to move; reviews keep everything from white's view. */
export function toWhiteEval(
  info: UciInfo | undefined,
  bestMove: string | undefined,
  blackToMove: boolean
): PositionEval {
  const sign = blackToMove ? -1 : 1;
  const best = bestMove ? { bestMove } : {};
  if (!info) return { type: "cp", value: 0, ...best };
  const { type, value } = info.score;
  if (type === "mate" && value === 0) {
    // Side to move is mated (normally caught before searching)
    return { type: "over", result: blackToMove ? 1 : -1 };
  }
  // `|| 0` keeps -0 out of the cache
  return { type, value: sign * value || 0, ...best };
}
