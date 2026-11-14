/** "1 move", "12 moves" */
export const movesLabel = (n: number): string => `${n} ${n === 1 ? "move" : "moves"}`;

/** "1 attempt", "3 attempts" */
export const attemptsLabel = (n: number): string => `${n} ${n === 1 ? "attempt" : "attempts"}`;
