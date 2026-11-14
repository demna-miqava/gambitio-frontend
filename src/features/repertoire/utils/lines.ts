import { Chess } from "chess.js";
import type { PlayerColor } from "@/features/game/types/game.types";
import type { RepertoireLine } from "@/services/repertoire";

/** Longest line the server accepts, in half-moves (MAX_LINE_PLIES). */
export const MAX_LINE_PLIES = 60;
/** Longest line name the server accepts. */
export const MAX_LINE_NAME = 80;

/** "1. e4 e5 2. Nf3", numbering from the standard start. */
export function formatMoves(moves: readonly string[]): string {
  return moves
    .map((san, i) => (i % 2 === 0 ? `${i / 2 + 1}. ${san}` : san))
    .join(" ");
}

/** The colour that played the last move of a line (white for an odd count). */
export function lastMoverColor(moves: readonly string[]): PlayerColor {
  return moves.length % 2 === 1 ? "white" : "black";
}

/** FENs from the start position through every move, for opening lookups. */
export function fensAlong(moves: readonly string[]): string[] {
  const chess = new Chess();
  const fens = [chess.fen()];
  for (const san of moves) {
    try {
      chess.move(san);
    } catch {
      break;
    }
    fens.push(chess.fen());
  }
  return fens;
}

export type ParsedLine = { ok: true; moves: string[] } | { ok: false; message: string };

/**
 * Reads a line typed or pasted as text: "1. e4 e5 2. Nf3", "e4 e5 Nf3", or
 * PGN movetext with comments, NAGs and a result. Moves are checked here so
 * the user sees which one is wrong before anything is sent (the server
 * checks again and normalises the notation).
 */
export function parseMoveText(text: string): ParsedLine {
  const tokens = text
    // Comments, variations and NAGs aren't part of the line
    .replace(/\{[^}]*\}/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\$\d+/g, " ")
    .split(/\s+/)
    .map((token) => token.replace(/^\d+\.(\.\.)?/, "").replace(/[!?]+$/, ""))
    .filter((token) => token && !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(token));

  if (tokens.length === 0) return { ok: false, message: "Type at least one move." };
  if (tokens.length > MAX_LINE_PLIES) {
    return { ok: false, message: `A line can have at most ${MAX_LINE_PLIES} moves (half-moves).` };
  }
  const chess = new Chess();
  const moves: string[] = [];
  for (const token of tokens) {
    try {
      moves.push(chess.move(token).san);
    } catch {
      const n = moves.length;
      const label = `${Math.floor(n / 2) + 1}${n % 2 === 0 ? "." : "..."} ${token}`;
      return { ok: false, message: `${label} isn't a legal move there.` };
    }
  }
  return { ok: true, moves };
}

/** Share of practice runs recalled correctly, or null before any. */
export function lineAccuracy(line: Pick<RepertoireLine, "practiceAttempts" | "practiceCorrect">): number | null {
  return line.practiceAttempts > 0 ? line.practiceCorrect / line.practiceAttempts : null;
}

export function isDue(line: Pick<RepertoireLine, "dueAt">, now: number): boolean {
  return new Date(line.dueAt).getTime() <= now;
}

/**
 * Practice order: due lines first (longest overdue first), then the rest by
 * how soon they're due; ties go to the least practised line.
 */
export function practiceOrder<T extends Pick<RepertoireLine, "dueAt" | "practiceAttempts" | "id">>(
  lines: readonly T[]
): T[] {
  return [...lines].sort(
    (a, b) =>
      new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime() ||
      a.practiceAttempts - b.practiceAttempts ||
      a.id - b.id
  );
}

export interface LineGroup<T> {
  /** e.g. "1. e4" for White, "Against 1. d4" for Black */
  title: string;
  lines: T[];
}

/**
 * Groups lines by the move that sets them apart first: White's lines by
 * White's first move, Black's by the opening move they answer. Groups and
 * lines keep a stable order (by move text).
 */
export function groupLines<T extends Pick<RepertoireLine, "color" | "moves">>(lines: readonly T[]): LineGroup<T>[] {
  const groups = new Map<string, T[]>();
  for (const line of lines) {
    const first = line.moves[0] ?? "";
    const title = line.color === "white" ? `1. ${first}` : `Against 1. ${first}`;
    const group = groups.get(title) ?? [];
    group.push(line);
    groups.set(title, group);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([title, grouped]) => ({
      title,
      lines: [...grouped].sort((a, b) => a.moves.join(" ").localeCompare(b.moves.join(" "))),
    }));
}

/** "Due now", "Due tomorrow", "Due in 5 days". */
export function dueLabel(dueAt: string, now: number): string {
  const days = Math.ceil((new Date(dueAt).getTime() - now) / (24 * 60 * 60_000));
  if (days <= 0) return "Due now";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}
