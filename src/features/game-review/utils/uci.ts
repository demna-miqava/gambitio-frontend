/**
 * Minimal parsing of the Stockfish (UCI) output the review needs: the score
 * of the main line and the best move. Scores in UCI are from the side to
 * move's point of view; callers flip them.
 */

export interface UciInfo {
  depth: number;
  multipv: number;
  score: { type: "cp" | "mate"; value: number };
  /** Fail-high/low results are provisional and get replaced at the same depth */
  bound: boolean;
  pv: string[];
}

/** Parses an `info ... score ...` line; null for any other line. */
export function parseInfoLine(line: string): UciInfo | null {
  const tokens = line.trim().split(/\s+/);
  if (tokens[0] !== "info") return null;

  let depth: number | undefined;
  let multipv = 1;
  let score: UciInfo["score"] | undefined;
  let bound = false;
  let pv: string[] = [];

  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === "depth") depth = Number(tokens[++i]);
    else if (token === "multipv") multipv = Number(tokens[++i]);
    else if (token === "score") {
      const type = tokens[i + 1];
      const value = Number(tokens[i + 2]);
      if ((type === "cp" || type === "mate") && Number.isFinite(value)) score = { type, value };
      i += 2;
    } else if (token === "lowerbound" || token === "upperbound") bound = true;
    else if (token === "pv") {
      pv = tokens.slice(i + 1);
      break;
    } else if (token === "string") break; // free text follows
  }

  if (depth === undefined || !Number.isFinite(depth) || !score) return null;
  return { depth, multipv, score, bound, pv };
}

/** The move from a `bestmove` line; null for other lines, undefined for "(none)". */
export function parseBestMove(line: string): { move: string | undefined } | null {
  const tokens = line.trim().split(/\s+/);
  if (tokens[0] !== "bestmove") return null;
  const move = tokens[1];
  return { move: move && move !== "(none)" ? move : undefined };
}

/**
 * Picks the line to trust from a search's info lines: the deepest exact
 * (non-bound) score of the main line, falling back to the deepest of any.
 */
export function pickFinalInfo(infos: UciInfo[]): UciInfo | undefined {
  const main = infos.filter((info) => info.multipv === 1);
  const deepest = (list: UciInfo[]) =>
    list.reduce<UciInfo | undefined>((best, info) => (!best || info.depth >= best.depth ? info : best), undefined);
  return deepest(main.filter((info) => !info.bound)) ?? deepest(main);
}
