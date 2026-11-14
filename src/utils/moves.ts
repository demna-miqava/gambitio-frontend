/**
 * The server counts half-moves (plies): after 1. e4 e5 2. Nf3 it says 3.
 * People count full moves, so that game is on move 2, and a game that
 * ended after 65 plies lasted 33 moves.
 */
export const fullMoves = (plies: number): number => Math.ceil(plies / 2);
