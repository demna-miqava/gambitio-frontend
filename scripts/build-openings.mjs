#!/usr/bin/env node
/**
 * Builds src/features/openings/data/openings.json from the Lichess opening
 * tables (https://github.com/lichess-org/chess-openings, CC0).
 *
 *   git clone https://github.com/lichess-org/chess-openings /tmp/chess-openings
 *   node scripts/build-openings.mjs /tmp/chess-openings
 *
 * The output maps a position (piece placement and side to move, the first two
 * FEN fields) to "ECO<TAB>name". Castling and en passant rights are left out
 * so that move-order transpositions still find their name. When two lines
 * reach the same position, the shorter one wins.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Chess } from "chess.js";

const sourceDir = process.argv[2];
if (!sourceDir) {
  console.error("Usage: node scripts/build-openings.mjs <chess-openings dir>");
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const outFile = resolve(here, "../src/features/openings/data/openings.json");

/** @type {Map<string, { value: string, plies: number }>} */
const byPosition = new Map();

for (const letter of ["a", "b", "c", "d", "e"]) {
  const lines = readFileSync(join(sourceDir, `${letter}.tsv`), "utf8").trim().split("\n");
  for (const line of lines.slice(1)) {
    const [eco, name, pgn] = line.split("\t");
    const chess = new Chess();
    chess.loadPgn(pgn);
    const plies = chess.history().length;
    const key = chess.fen().split(" ").slice(0, 2).join(" ");
    const existing = byPosition.get(key);
    if (!existing || plies < existing.plies) {
      byPosition.set(key, { value: `${eco}\t${name}`, plies });
    }
  }
}

const out = Object.fromEntries(
  [...byPosition.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, v.value])
);
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify(out) + "\n");
console.log(`Wrote ${byPosition.size} positions to ${outFile}`);
