// gifenc ships without types; only what features/share-gif uses
declare module "gifenc" {
  export type GifPalette = number[][];

  export interface GifFrameOptions {
    /** Required on the first frame (becomes the global color table) */
    palette?: GifPalette;
    /** Milliseconds (stored in hundredths of a second) */
    delay?: number;
    /** -1 once, 0 forever, n extra loops */
    repeat?: number;
    transparent?: boolean;
    transparentIndex?: number;
    /** GIF disposal method; 1 keeps the frame under the next one */
    dispose?: number;
    colorDepth?: number;
  }

  export interface GifEncoderInstance {
    writeFrame(index: Uint8Array, width: number, height: number, opts?: GifFrameOptions): void;
    finish(): void;
    bytes(): Uint8Array<ArrayBuffer>;
    bytesView(): Uint8Array;
  }

  export function GIFEncoder(opts?: { initialCapacity?: number; auto?: boolean }): GifEncoderInstance;

  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    opts?: { format?: "rgb565" | "rgb444" | "rgba4444"; oneBitAlpha?: boolean | number; clearAlpha?: boolean }
  ): GifPalette;

  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: GifPalette,
    format?: "rgb565" | "rgb444" | "rgba4444"
  ): Uint8Array;
}
