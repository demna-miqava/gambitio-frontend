import { DEFAULT_STOCKFISH_URL } from "@/features/engine-analysis/constants";

/**
 * A dedicated Stockfish worker that plays moves at a target strength.
 * Kept separate from the analysis engine so the two never share settings.
 */

// Stockfish's UCI_Elo only goes down to 1320; below that we use Skill Level
// plus a shallow search to make the engine play like a weaker human.
const MIN_UCI_ELO = 1320;
const MAX_UCI_ELO = 3190;

interface StrengthSettings {
  options: Record<string, string | number | boolean>;
  depth?: number;
  moveTime: number;
}

export const getStrengthSettings = (rating: number): StrengthSettings => {
  if (rating >= MAX_UCI_ELO) {
    return { options: { UCI_LimitStrength: false, "Skill Level": 20 }, moveTime: 1200 };
  }
  if (rating >= MIN_UCI_ELO) {
    return {
      options: { UCI_LimitStrength: true, UCI_Elo: Math.round(rating) },
      moveTime: 800,
    };
  }
  // 300 → skill 0 / depth 1, ~1200 → skill 5 / depth 5
  const t = Math.max(0, Math.min(1, (rating - 300) / 900));
  return {
    options: { UCI_LimitStrength: false, "Skill Level": Math.round(t * 5) },
    depth: 1 + Math.round(t * 4),
    moveTime: 400,
  };
};

export class BotEngine {
  private worker: Worker;
  private listeners = new Set<(line: string) => void>();
  /** Rejecters of every pending waitFor, called if the worker fails. */
  private failers = new Set<(error: Error) => void>();
  private error: Error | null = null;
  private ready: Promise<void>;

  constructor() {
    this.worker = new Worker(DEFAULT_STOCKFISH_URL);
    this.worker.onmessage = (event: MessageEvent) => {
      const line = typeof event.data === "string" ? event.data : String(event.data);
      this.listeners.forEach((listener) => listener(line));
    };
    // A worker script or WASM that fails to load would otherwise leave every
    // caller waiting forever, with the bot silently never moving
    this.worker.onerror = (event) => {
      event.preventDefault();
      this.fail(new Error(`Stockfish error: ${event.message || "failed to load"}`));
    };
    this.worker.onmessageerror = () => this.fail(new Error("Stockfish message error"));
    this.ready = this.waitFor("uciok", () => this.send("uci")).then(() => undefined);
  }

  private fail(error: Error) {
    if (this.error) return;
    this.error = error;
    this.listeners.clear();
    this.failers.forEach((reject) => reject(error));
    this.failers.clear();
  }

  private send(command: string) {
    this.worker.postMessage(command);
  }

  private waitFor(prefix: string, start: () => void): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      if (this.error) {
        reject(this.error);
        return;
      }
      const listener = (line: string) => {
        if (line.startsWith(prefix)) {
          this.listeners.delete(listener);
          this.failers.delete(reject);
          resolve(line);
        }
      };
      this.listeners.add(listener);
      this.failers.add(reject);
      start();
    });
  }

  async newGame(rating: number) {
    await this.ready;
    const { options } = getStrengthSettings(rating);
    Object.entries(options).forEach(([name, value]) =>
      this.send(`setoption name ${name} value ${value}`)
    );
    this.send("ucinewgame");
    await this.waitFor("readyok", () => this.send("isready"));
  }

  /**
   * Returns the engine's move in UCI notation (e.g. "e2e4", "e7e8q").
   * `options.moveTime` replaces the think time the rating would give.
   */
  async bestMove(fen: string, rating: number, options: { moveTime?: number } = {}): Promise<string | null> {
    await this.ready;
    const strength = getStrengthSettings(rating);
    const { depth } = strength;
    const moveTime = options.moveTime ?? strength.moveTime;
    this.send(`position fen ${fen}`);
    const line = await this.waitFor("bestmove", () =>
      this.send(depth ? `go depth ${depth} movetime ${moveTime}` : `go movetime ${moveTime}`)
    );
    const move = line.split(" ")[1];
    return move && move !== "(none)" ? move : null;
  }

  /** Ends the current search early; its bestmove still arrives (and resolves bestMove). */
  stop() {
    if (!this.error) this.send("stop");
  }

  destroy() {
    this.listeners.clear();
    this.failers.clear();
    this.send("quit");
    this.worker.terminate();
  }
}
