#!/usr/bin/env node
/**
 * Checks the endgame lab's exercises (src/features/endgames/data/exercises.ts)
 * against the Lichess Syzygy tablebase (https://tablebase.lichess.ovh).
 *
 *   npm run verify:endgames              # every exercise
 *   npm run verify:endgames -- rook-mate # only the ids given
 *
 * For each position with seven pieces or fewer it prints the result for the
 * side to move (White), DTZ, DTM when the tablebase has it, and the moves
 * that keep that result. It flags an exercise whose objective doesn't match:
 * a checkmate or promote exercise must be a win, a draw exercise a draw, and
 * a checkmate's move limit must leave room for the mate against best defence.
 * Exits with 1 if anything is flagged.
 *
 * Only the FEN is sent. Requests go one at a time with a short pause; on
 * HTTP 429 the script waits a minute and tries again.
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dataFile = resolve(here, "../src/features/endgames/data/exercises.ts");
// Needs Node's TypeScript type stripping (--experimental-strip-types on Node 22)
const { ENDGAME_EXERCISES } = await import(pathToFileURL(dataFile).href);

const ENDPOINT = "https://tablebase.lichess.ovh/standard";
const USER_AGENT = "endgame-exercise-verifier/1.0";
const PAUSE_MS = 1000;
const RETRY_AFTER_429_MS = 60_000;
const MAX_PIECES = 7;

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

const pieceCount = (fen) => fen.split(" ")[0].replace(/[^a-zA-Z]/g, "").length;

/** The tablebase entry for `fen`, retrying after a rate limit. */
const probe = async (fen) => {
  const url = `${ENDPOINT}?fen=${encodeURIComponent(fen)}`;
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (response.status === 429) {
      console.log(`  rate limited, waiting ${RETRY_AFTER_429_MS / 1000}s...`);
      await sleep(RETRY_AFTER_429_MS);
      continue;
    }
    if (!response.ok) {
      if (attempt < 3) {
        await sleep(PAUSE_MS * 5);
        continue;
      }
      throw new Error(`HTTP ${response.status} for ${fen}`);
    }
    return response.json();
  }
};

/** Plies to mate, as the mating side's own moves. */
const mateInMoves = (dtm) => Math.ceil(Math.abs(dtm) / 2);

/** The moves that keep the position's result for the side to move. */
const keepingMoves = (entry) => {
  // A move's category is from the opponent's side: "loss" for them is a win for us
  const wanted = { win: ["loss"], "cursed-win": ["blessed-loss"], draw: ["draw"] }[entry.category];
  if (!wanted) return [];
  return entry.moves.filter((move) => wanted.includes(move.category));
};

/** A move with how fast it wins; its figures are from the opponent's side, after the move. */
const describeMove = (move) => {
  if (move.category === "draw") return move.san;
  if (move.dtm != null) return `${move.san} (mate in ${1 + mateInMoves(move.dtm)})`;
  if (move.dtz != null) return `${move.san} (dtz ${Math.abs(move.dtz)})`;
  return move.san;
};

/** Problems with an exercise's objective given its tablebase entry. */
const problemsFor = (exercise, entry) => {
  const problems = [];
  const { objective } = exercise;
  if (objective.type === "checkmate" || objective.type === "promote") {
    if (entry.category !== "win") {
      problems.push(`objective is ${objective.type} but the tablebase says ${entry.category}`);
    }
  }
  if (objective.type === "draw" && entry.category !== "draw") {
    problems.push(`objective is draw but the tablebase says ${entry.category}`);
  }
  if (objective.type === "checkmate" && entry.dtm != null) {
    const mate = mateInMoves(entry.dtm);
    if (objective.maxMoves !== undefined && objective.maxMoves < mate) {
      problems.push(`maxMoves ${objective.maxMoves} is less than the mate distance (${mate} moves)`);
    }
    if (exercise.par !== undefined && exercise.par < mate) {
      problems.push(`par ${exercise.par} is less than the mate distance (${mate} moves)`);
    }
  }
  return problems;
};

const only = process.argv.slice(2);
const exercises = only.length
  ? ENDGAME_EXERCISES.filter((exercise) => only.includes(exercise.id))
  : ENDGAME_EXERCISES;
if (only.length && exercises.length !== only.length) {
  const known = new Set(exercises.map((exercise) => exercise.id));
  console.error(`Unknown id(s): ${only.filter((id) => !known.has(id)).join(", ")}`);
  process.exit(1);
}

let flagged = 0;
let skipped = 0;
for (const exercise of exercises) {
  const pieces = pieceCount(exercise.fen);
  const label = `${exercise.id} [${exercise.objective.type}]`;
  if (pieces > MAX_PIECES) {
    console.log(`- ${label}: ${pieces} pieces, not in the tablebase (skipped)`);
    skipped++;
    continue;
  }
  const entry = await probe(exercise.fen);
  // DTM is in plies from the side to move; a win in n plies is ceil(n / 2) of our moves
  const decided = entry.category !== "draw";
  const mate = decided && entry.dtm != null ? `, mate in ${mateInMoves(entry.dtm)} (dtm ${entry.dtm})` : "";
  const dtz = decided && entry.dtz != null ? `, dtz ${entry.dtz}` : "";
  const limit =
    exercise.objective.type === "checkmate"
      ? ` | maxMoves ${exercise.objective.maxMoves ?? "-"}, par ${exercise.par ?? "-"}`
      : exercise.objective.type === "draw"
        ? ` | surviveMoves ${exercise.objective.surviveMoves}`
        : "";
  const problems = problemsFor(exercise, entry);
  console.log(`${problems.length ? "!" : "+"} ${label}: ${entry.category}${dtz}${mate}${limit}`);
  const moves = keepingMoves(entry);
  if (moves.length) {
    const shown = moves.slice(0, 8).map(describeMove).join(", ");
    console.log(`    keeps the result: ${shown}${moves.length > 8 ? `, ... (${moves.length})` : ""}`);
  }
  for (const problem of problems) console.log(`    PROBLEM: ${problem}`);
  if (problems.length) flagged++;
  await sleep(PAUSE_MS);
}

console.log(
  `\n${exercises.length - skipped} checked, ${skipped} skipped (over ${MAX_PIECES} pieces), ${flagged} flagged`
);
process.exit(flagged ? 1 : 0);
