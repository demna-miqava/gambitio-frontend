/**
 * Helpers for the frame encoder that don't need a canvas.
 */

/**
 * Frames whose pixels are sampled to build the GIF's one shared palette: the
 * start, the first moves (last-move highlights on both square colors), the
 * middle game and the final position.
 */
export function paletteSampleIndices(frameCount: number): number[] {
  if (frameCount <= 0) return [];
  const picks = [0, 1, 2, 3, Math.floor(frameCount / 2), frameCount - 1];
  return [...new Set(picks.filter((i) => i < frameCount))].sort((a, b) => a - b);
}

/** Joins RGBA buffers into one (to quantize several frames together). */
export function concatPixels(buffers: ArrayLike<number>[]): Uint8Array {
  const total = buffers.reduce((sum, b) => sum + b.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const buffer of buffers) {
    out.set(buffer, offset);
    offset += buffer.length;
  }
  return out;
}

/**
 * The next frame with every pixel that didn't change since `prev` replaced by
 * the transparent index. Drawn over the kept previous frame (GIF disposal 1)
 * it looks the same, and the long transparent runs compress to almost
 * nothing, so each move costs only the two squares that changed.
 */
export function maskUnchanged(
  prev: Uint8Array,
  next: Uint8Array,
  transparentIndex: number
): Uint8Array {
  const out = new Uint8Array(next.length);
  for (let i = 0; i < next.length; i++) {
    out[i] = next[i] === prev[i] ? transparentIndex : next[i]!;
  }
  return out;
}

/** Lets the browser paint and handle input between frames. */
export const yieldToBrowser = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
