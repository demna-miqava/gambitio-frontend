// /**
//  * Stockfish Chess Engine Service
//  * Loads Stockfish from public folder as a Web Worker
//  */

export interface StockfishOptions {
  skillLevel?: number; // 0-20, maps to ~ELO 800-2850
  depth?: number; // Search depth (1-20+)
  moveTime?: number; // Time limit in ms
  multiPv?: number; // Number of lines to analyze (1-5)
}

import type { EvaluationLine } from "@/features/engine-analysis/types";
import { StockfishParser } from "./stockfishParser";
import {
  DEFAULT_ENGINE_OPTIONS,
  DEFAULT_STOCKFISH_URL,
} from "@/features/engine-analysis/constants";

export interface MultiPvResult {
  lines: EvaluationLine[];
  depth: number;
}

type MessageHandler = (data: string) => void;

class StockfishService {
  private worker: Worker | null = null;
  private isReady = false;
  private messageHandlers: Set<MessageHandler> = new Set();
  private readyPromise: Promise<void> | null = null;
  private parser = new StockfishParser();
  private options: StockfishOptions = { ...DEFAULT_ENGINE_OPTIONS };
  /** The search currently running (or queued), so searches never overlap */
  private currentSearch: Promise<MultiPvResult> | null = null;
  /** Bumped per request; a queued search that's been superseded is skipped */
  private searchGeneration = 0;
  /** Rejecters of everything waiting on engine output, for a crash or destroy */
  private failers = new Set<(error: Error) => void>();
  /** Set once the worker has crashed: it answers nothing any more */
  private crashed: Error | null = null;

  async init(options?: StockfishOptions): Promise<void> {
    if (this.worker && this.isReady) {
      if (options) await this.setOptions(options);
      return;
    }

    // Merge options before initializing
    if (options) {
      this.options = { ...this.options, ...options };
    }

    if (this.readyPromise) {
      await this.readyPromise;
      return;
    }

    this.readyPromise = new Promise<void>((resolve, reject) => {
      try {
        const workerUrl = DEFAULT_STOCKFISH_URL;

        this.crashed = null;
        this.worker = new Worker(workerUrl);
        this.worker.onmessage = (event: MessageEvent) => {
          const message =
            typeof event.data === "string" ? event.data : String(event.data);

          this.messageHandlers.forEach((handler) => handler(message));
          if (message === "uciok") {
            this.failers.delete(reject);
            this.applyOptions();
            this.isReady = true;
            resolve();
          }
        };
        this.worker.onerror = (e) => {
          const error = new Error(`Stockfish error: ${e.message}`);
          reject(error);
          // After start-up too: whatever waits on the dead worker fails
          // instead of waiting forever (and holding up every later search)
          this.crashed = error;
          this.fail(error);
        };

        // destroy() before "uciok" fails the start-up too
        this.failers.add(reject);
        // Sends the UCI (Universal Chess Interface) protocol initialization command to the Stockfish Web Worker.
        this.worker.postMessage("uci");
      } catch (error) {
        reject(error);
      }
    });

    try {
      await this.readyPromise;
    } finally {
      this.readyPromise = null;
    }
  }

  private fail(error: Error): void {
    this.messageHandlers.clear();
    this.failers.forEach((reject) => reject(error));
    this.failers.clear();
  }

  private send(command: string): void {
    if (!this.worker) throw new Error("Stockfish not initialized");
    this.worker.postMessage(command);
  }

  private applyOptions(): void {
    const { skillLevel, multiPv } = this.options;

    if (skillLevel !== undefined) {
      this.send(`setoption name Skill Level value ${skillLevel}`);
    }
    if (multiPv !== undefined) {
      this.send(`setoption name MultiPV value ${multiPv}`);
    }
  }

  async setOptions(options: StockfishOptions): Promise<void> {
    if (!this.worker || !this.isReady) {
      throw new Error("Stockfish not initialized");
    }
    this.options = { ...this.options, ...options };
    if (this.isReady) {
      this.applyOptions();
      await this.waitForReady();
    }
  }

  private waitForReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.crashed) {
        reject(this.crashed);
        return;
      }
      const handler = (message: string) => {
        if (message === "readyok") {
          this.messageHandlers.delete(handler);
          this.failers.delete(reject);
          resolve();
        }
      };
      this.messageHandlers.add(handler);
      this.failers.add(reject);
      this.send("isready");
    });
  }

  private normalizeValue(value: number, isBlackTurn: boolean): number {
    return isBlackTurn ? -value : value;
  }

  private updateLine(
    lines: Map<number, EvaluationLine>,
    parsed: Partial<EvaluationLine>,
    isBlackTurn: boolean
  ): number {
    const { multipv, depth, pv, score } = parsed;

    if (!multipv || !depth || !pv || score === undefined) return 0;

    const existing = lines.get(multipv);
    if (existing && existing.depth > depth) return existing.depth;

    const normalizedScore = this.normalizeValue(score, isBlackTurn);
    const normalizedMate =
      parsed.mate !== undefined
        ? this.normalizeValue(parsed.mate, isBlackTurn)
        : undefined;

    lines.set(multipv, {
      depth,
      multipv,
      pv,
      score: normalizedScore,
      mate: normalizedMate,
    });
    return depth;
  }

  /**
   * Analyzes one position. A running search is stopped and allowed to emit
   * its "bestmove" first; otherwise its late output would be read as this
   * position's result (wrong lines, wrong eval sign).
   */
  analyzeMultiPv(fen: string, numLines: number = 3): Promise<MultiPvResult> {
    const generation = ++this.searchGeneration;
    const previous = this.currentSearch;
    const search = (async () => {
      if (previous) {
        this.stop();
        await previous.catch(() => undefined);
      }
      // A newer request arrived while we waited: don't start a search for it
      if (generation !== this.searchGeneration) {
        return { lines: [], depth: 0 };
      }
      return this.runSearch(fen, numLines);
    })();
    this.currentSearch = search;
    void search.finally(() => {
      if (this.currentSearch === search) this.currentSearch = null;
    }).catch(() => undefined);
    return search;
  }

  private async runSearch(
    fen: string,
    numLines: number
  ): Promise<MultiPvResult> {
    if (this.crashed) throw this.crashed;
    if (!this.isReady) await this.init();
    const generation = this.searchGeneration;
    // Set MultiPV option
    this.send(`setoption name MultiPV value ${numLines}`);
    await this.waitForReady();
    // Superseded while the engine got ready: the newer request is waiting
    // on this one, so don't make it sit through a whole search
    if (generation !== this.searchGeneration) return { lines: [], depth: 0 };

    this.send(`position fen ${fen}`);

    // Snapshot options at start to avoid mid-analysis changes affecting parsing
    const targetDepth = this.options.depth;
    const moveTime = this.options.moveTime;

    // Determine if it's Black's turn (scores need to be negated for White's perspective)
    const isBlackTurn = fen.split(" ")[1] === "b";

    // Only the limits that are set ("go depth  movetime 2000" isn't UCI);
    // with neither, a bare "go" would search forever
    const limits = [
      ...(targetDepth !== undefined ? [`depth ${targetDepth}`] : []),
      ...(moveTime !== undefined ? [`movetime ${moveTime}`] : []),
    ];
    const go = `go ${limits.length ? limits.join(" ") : `depth ${DEFAULT_ENGINE_OPTIONS.depth}`}`;

    return new Promise((resolve, reject) => {
      const lines: Map<number, EvaluationLine> = new Map();
      let maxDepth = 0;

      const handler = (message: string) => {
        const parsed = this.parser.parseInfo(message);
        if (parsed) {
          const depth = this.updateLine(lines, parsed, isBlackTurn);
          if (depth > maxDepth) maxDepth = depth;
        }

        if (message.startsWith("bestmove")) {
          this.messageHandlers.delete(handler);
          this.failers.delete(reject);

          // Convert map to sorted array
          const sortedLines = Array.from(lines.values()).sort(
            (a, b) => a.multipv - b.multipv
          );
          resolve({
            lines: sortedLines,
            depth: maxDepth,
          });
        }
      };

      this.messageHandlers.add(handler);
      this.failers.add(reject);
      this.send(go);
    });
  }

  stop(): void {
    this.worker?.postMessage("stop");
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  destroy(): void {
    this.searchGeneration++;
    this.currentSearch = null;
    // Nothing answers once the worker is gone: settle whoever is waiting
    this.fail(new Error("Stockfish stopped"));
    this.crashed = null;
    if (this.worker) {
      this.send("quit");
      this.worker.terminate();
      this.worker = null;
      this.isReady = false;
      this.messageHandlers.clear();
    }
  }
}

export { StockfishService };
