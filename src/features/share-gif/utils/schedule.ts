/** How long the starting position is shown */
export const FIRST_FRAME_MS = 1000;
/** How long each move is shown in a game of normal length */
export const MOVE_FRAME_MS = 700;
/** How long the final position is held before the GIF loops */
export const LAST_FRAME_MS = 3000;

/**
 * Long games speed up so the moves take at most this long (about 85 plies
 * still play at the normal 700 ms; a 120-ply game plays at 500 ms).
 */
export const MOVES_BUDGET_MS = 60_000;
/** Never faster than this per move */
export const MIN_MOVE_FRAME_MS = 200;
/**
 * Frames beyond this (games over ~120 moves) are thinned out evenly, so
 * generation stays a few seconds and the file a few MB at most. With the
 * budget above this works out at ~250 ms per frame.
 */
export const MAX_GIF_FRAMES = 240;

/** GIF delays are stored in hundredths of a second */
const toCentis = (ms: number) => Math.round(ms / 10) * 10;

/** Display time of each move frame for a GIF with `frameCount` frames. */
export function moveFrameDelay(frameCount: number): number {
  const moveFrames = Math.max(0, frameCount - 2);
  if (moveFrames === 0) return MOVE_FRAME_MS;
  const fitted = toCentis(MOVES_BUDGET_MS / moveFrames);
  return Math.max(MIN_MOVE_FRAME_MS, Math.min(MOVE_FRAME_MS, fitted));
}

/**
 * Delay (ms) for each frame: the start a little longer, each move the same,
 * the final position held. A single frame is shown as a final position.
 */
export function frameDelays(frameCount: number): number[] {
  if (frameCount <= 0) return [];
  if (frameCount === 1) return [LAST_FRAME_MS];
  const move = moveFrameDelay(frameCount);
  return Array.from({ length: frameCount }, (_, i) =>
    i === 0 ? FIRST_FRAME_MS : i === frameCount - 1 ? LAST_FRAME_MS : move
  );
}
