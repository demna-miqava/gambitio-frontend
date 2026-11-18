/**
 * The GIF encoding steps that don't need a canvas: building the shared
 * palette, mapping each frame onto it and LZW-compressing it. They're the
 * long tasks of a GIF, so they run in a worker (gifEncoder.worker.ts) when
 * the browser has one, and here on the page otherwise.
 */
import { GIFEncoder, applyPalette, quantize, type GifPalette } from "gifenc";
import { maskUnchanged, yieldToBrowser } from "./encode";
import type { EncoderReply, EncoderRequest, GifEncoderBackend } from "./gifEncoderClient";

/** Encodes frames of one size into a GIF with one shared palette. */
export class GifFrameEncoder {
  private readonly width: number;
  private readonly height: number;
  private readonly gif = GIFEncoder();
  private palette: GifPalette | null = null;
  private transparentIndex = 0;
  private previous: Uint8Array | null = null;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  /**
   * Builds the palette from sample frames' pixels (joined), with the last
   * slot left free for "unchanged since the previous frame"
   */
  setPalette(samples: Uint8Array | Uint8ClampedArray) {
    this.palette = quantize(samples, 255);
    this.transparentIndex = this.palette.length;
  }

  /** Adds the next frame (RGBA pixels), shown for `delay` ms */
  addFrame(rgba: Uint8Array | Uint8ClampedArray, delay: number) {
    const palette = this.palette;
    if (!palette) throw new Error("The GIF palette must be set before adding frames");
    const indexed = applyPalette(rgba, palette);
    const previous = this.previous;
    this.gif.writeFrame(
      previous ? maskUnchanged(previous, indexed, this.transparentIndex) : indexed,
      this.width,
      this.height,
      {
        palette: previous ? undefined : [...palette, [0, 0, 0]],
        delay,
        repeat: 0,
        // Keep each frame under the next, which only draws what changed
        dispose: 1,
        transparent: previous !== null,
        transparentIndex: this.transparentIndex,
      }
    );
    this.previous = indexed;
  }

  /** The finished file */
  finish(): Uint8Array<ArrayBuffer> {
    this.gif.finish();
    return this.gif.bytes();
  }
}

type Post = (reply: EncoderReply, transfer?: Transferable[]) => void;

/** The worker's side: runs each request on one encoder and replies. */
export function createEncoderHandler(post: Post) {
  let encoder: GifFrameEncoder | null = null;
  let failed = false;
  return (request: EncoderRequest) => {
    if (failed) return;
    try {
      switch (request.type) {
        case "start":
          encoder = new GifFrameEncoder(request.width, request.height);
          encoder.setPalette(request.samples);
          post({ type: "started" });
          break;
        case "frame":
          if (!encoder) throw new Error("The encoder wasn't started");
          encoder.addFrame(request.pixels, request.delay);
          post({ type: "frame-done" });
          break;
        case "finish": {
          if (!encoder) throw new Error("The encoder wasn't started");
          const bytes = encoder.finish();
          encoder = null;
          post({ type: "done", bytes }, [bytes.buffer]);
          break;
        }
      }
    } catch (error) {
      failed = true;
      post({ type: "error", message: error instanceof Error ? error.message : String(error) });
    }
  };
}

/** Encodes on the page, yielding to the browser between steps (the fallback). */
export function createInlineBackend(): GifEncoderBackend {
  let encoder: GifFrameEncoder | null = null;
  return {
    async start(width, height, samples) {
      encoder = new GifFrameEncoder(width, height);
      encoder.setPalette(samples);
      await yieldToBrowser();
    },
    async addFrame(pixels, delay) {
      if (!encoder) throw new Error("The encoder wasn't started");
      encoder.addFrame(pixels, delay);
      await yieldToBrowser();
    },
    async finish() {
      if (!encoder) throw new Error("The encoder wasn't started");
      return encoder.finish();
    },
    close() {
      encoder = null;
    },
  };
}
