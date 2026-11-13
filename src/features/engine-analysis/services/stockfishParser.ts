import type { EvaluationLine } from "@/features/engine-analysis/types";

// Helpers dedicated to parsing Stockfish "info" lines
export class StockfishParser {
  private parseNumber(value?: string): number | undefined {
    const num = value !== undefined ? parseInt(value, 10) : NaN;
    return Number.isNaN(num) ? undefined : num;
  }

  private parseScore(
    tokens: string[],
    startIndex: number
  ): {
    score?: number;
    mate?: number;
  } {
    if (!tokens[startIndex] || !tokens[startIndex + 1]) return {};
    const type = tokens[startIndex];
    const value = this.parseNumber(tokens[startIndex + 1]);

    if (type === "cp" && value !== undefined) {
      return { score: value };
    }

    if (type === "mate" && value !== undefined) {
      return { mate: value, score: value > 0 ? 100000 : -100000 };
    }

    return {};
  }

  /**
   * Accepts every completed line at any depth; the caller keeps the deepest
   * per multipv. Requiring the target depth dropped everything on slower
   * devices (phones), where the movetime limit ends the search first.
   * Bound scores are provisional (the search failed high/low and is
   * re-searching), so they're skipped.
   */
  private shouldParseLine(tokens: string[]): boolean {
    if (tokens[0] !== "info") return false;
    if (!tokens.includes("score") || !tokens.includes("pv")) return false;
    return !tokens.includes("lowerbound") && !tokens.includes("upperbound");
  }

  private parseInfoTokens(tokens: string[]): Partial<EvaluationLine> {
    const result: Partial<EvaluationLine> = {};

    let i = 0;
    while (i < tokens.length) {
      const token = tokens[i];

      switch (token) {
        case "depth": {
          const depth = this.parseNumber(tokens[i + 1]);
          if (depth !== undefined) result.depth = depth;
          i += 2;
          break;
        }
        case "multipv": {
          const multipv = this.parseNumber(tokens[i + 1]);
          if (multipv !== undefined) result.multipv = multipv;
          i += 2;
          break;
        }
        case "score": {
          const { score, mate } = this.parseScore(tokens, i + 1);
          if (score !== undefined) result.score = score;
          if (mate !== undefined) result.mate = mate;
          i += 3; // skip "score", type, and value
          break;
        }
        case "pv":
          result.pv = tokens.slice(i + 1);
          i = tokens.length; // remaining tokens belong to the PV
          break;
        default:
          i += 1;
      }
    }

    return result;
  }

  /**
    Parse a raw info message; returns null if the line should be ignored.
  */
  parseInfo(message: string): Partial<EvaluationLine> | null {
    const tokens = message.split(" ");

    if (!this.shouldParseLine(tokens)) return null;

    return this.parseInfoTokens(tokens);
  }
}
