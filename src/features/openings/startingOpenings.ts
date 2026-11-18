/**
 * Openings a friend challenge can start from (GET /openings; the list is the
 * backend's src/game/openings.ts). A game from one starts with the opening's
 * moves already played: they are the first moves of its PGN, and the game's
 * `startPly` counts them.
 */

/** How a challenge, series or game names its opening */
export interface OpeningSummary {
  id: string;
  eco: string;
  name: string;
}

export interface StartingOpening extends OpeningSummary {
  /** The moves played for the players, in SAN */
  moves: string[];
  /** The position they hand over */
  fen: string;
}

export interface OpeningGroup {
  label: string;
  openings: StartingOpening[];
}

/** "1. d4 d5 2. c4" */
export const formatOpeningMoves = (moves: readonly string[]): string =>
  moves.map((san, i) => (i % 2 === 0 ? `${i / 2 + 1}. ${san}` : san)).join(" ");

const groupOf = (opening: StartingOpening) =>
  opening.moves[0] === "e4" ? "1. e4" : opening.moves[0] === "d4" ? "1. d4" : "Flank openings";

/** The list split by first move, in the server's order within each group */
export const groupStartingOpenings = (openings: readonly StartingOpening[]): OpeningGroup[] => {
  const groups = new Map<string, StartingOpening[]>();
  for (const opening of openings) {
    const label = groupOf(opening);
    groups.set(label, [...(groups.get(label) ?? []), opening]);
  }
  return [...groups].map(([label, list]) => ({ label, openings: list }));
};
