/** "76.2%", or a dash when the player made no judged moves */
export const formatAccuracy = (accuracy: number | null) => (accuracy === null ? "–" : `${accuracy.toFixed(1)}%`);
