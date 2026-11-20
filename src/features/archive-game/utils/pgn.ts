import { Chess, DEFAULT_POSITION } from "chess.js";
import type { AnalysisNode } from "../types/analysis.types";
import { createNode, createRoot, isWhiteMove, moveNumber } from "./analysisTree";

/**
 * PGN with variations. chess.js discards variations (RAV) when loading a
 * PGN, so the movetext is tokenized here and each move is validated with
 * chess.js against its own position.
 */

export interface ParsedPgn {
  headers: Record<string, string>;
  root: AnalysisNode;
}

export class PgnParseError extends Error {}

// Both are written so a pasted text can't take quadratic time (a tab frozen
// for seconds): the header's leading space stays on its own line (\s would
// re-scan every run of blank lines from each of its lines), and a comment
// that is never closed runs to the end of the text, once, where a required
// "}" would have every "{" scan to the end and fail.
const HEADER_RE = /^[ \t]*\[(\w+)\s+"((?:[^"\\]|\\.)*)"\]\s*$/gm;
// Comments, variation brackets, NAGs, results, move numbers, or a move token
const TOKEN_RE = /\{[^}]*\}?|;[^\n]*|\(|\)|\$\d+|1-0|0-1|1\/2-1\/2|\*|\d+\.(?:\.\.)?|[^\s(){};]+/g;
const MOVE_SUFFIX_RE = /[!?]+$/;

export function parsePgn(pgn: string): ParsedPgn {
  const headers: Record<string, string> = {};
  for (const match of pgn.matchAll(HEADER_RE)) {
    headers[match[1]!] = match[2]!.replace(/\\(.)/g, "$1");
  }
  const movetext = pgn.replace(HEADER_RE, " ");

  const startFen = headers.FEN ?? DEFAULT_POSITION;
  try {
    new Chess(startFen);
  } catch {
    throw new PgnParseError("Invalid FEN header");
  }

  // Built mutably, then handed out; nothing else holds references yet
  const root = createRoot(startFen);
  const parentOf = new Map<AnalysisNode, AnalysisNode>();
  let parent = root; // where the next move attaches
  let last: AnalysisNode | null = null; // the most recent move, which a "(" offers alternatives to
  const stack: { parent: AnalysisNode; last: AnalysisNode | null }[] = [];

  for (const [token] of movetext.matchAll(TOKEN_RE)) {
    if (token.startsWith("{") || token.startsWith(";") || token.startsWith("$")) continue;
    if (/^\d+\.(\.\.)?$/.test(token) || /^(1-0|0-1|1\/2-1\/2|\*)$/.test(token)) continue;

    if (token === "(") {
      if (!last) throw new PgnParseError("Variation before any move");
      stack.push({ parent, last });
      parent = parentOf.get(last)!;
      last = null;
      continue;
    }
    if (token === ")") {
      const saved = stack.pop();
      if (!saved) throw new PgnParseError("Unbalanced parentheses");
      ({ parent, last } = saved);
      continue;
    }

    const san = token.replace(MOVE_SUFFIX_RE, "");
    let move;
    try {
      move = new Chess(parent.fen).move(san);
    } catch {
      const number = Math.floor(parent.ply / 2) + 1;
      throw new PgnParseError(`Illegal move ${number}${parent.ply % 2 ? "..." : "."} ${san}`);
    }
    const uci = move.from + move.to + (move.promotion ?? "");
    let node = parent.children.find((c) => c.move?.uci === uci);
    if (!node) {
      node = createNode(parent, move);
      parent.children.push(node);
      parentOf.set(node, parent);
    }
    last = node;
    parent = node;
  }
  if (stack.length) throw new PgnParseError("Unbalanced parentheses");

  // The main line is the game; variations count as analysis
  for (let node = root.children[0]; node; node = node.children[0]) node.isGameMove = true;
  return { headers, root };
}

/** Movetext for one move, with its number when needed ("12." or "12..."). */
function moveText(node: AnalysisNode, forceNumber: boolean): string {
  const san = node.move!.san;
  if (isWhiteMove(node)) return `${moveNumber(node)}. ${san}`;
  return forceNumber ? `${moveNumber(node)}... ${san}` : san;
}

/** Writes the continuation after `parent`, with variations in parentheses. */
function writeLine(parent: AnalysisNode, forceNumber: boolean, out: string[]) {
  const [main, ...variations] = parent.children;
  if (!main) return;
  out.push(moveText(main, forceNumber));
  for (const variation of variations) {
    const inner: string[] = [moveText(variation, true)];
    writeLine(variation, false, inner);
    out.push(`(${inner.join(" ")})`);
  }
  // After a variation, black's reply needs its number again
  writeLine(main, variations.length > 0, out);
}

export function toPgn(root: AnalysisNode, headers: Record<string, string> = {}): string {
  const allHeaders = { ...headers };
  if (root.fen !== DEFAULT_POSITION) {
    allHeaders.SetUp = "1";
    allHeaders.FEN = root.fen;
  }
  const result = allHeaders.Result ?? "*";
  const headerText = Object.entries(allHeaders)
    .map(([key, value]) => `[${key} "${value.replace(/["\\]/g, "\\$&")}"]`)
    .join("\n");

  const moves: string[] = [];
  writeLine(root, true, moves);
  const movetext = [...moves, result].join(" ");
  return headerText ? `${headerText}\n\n${movetext}` : movetext;
}
