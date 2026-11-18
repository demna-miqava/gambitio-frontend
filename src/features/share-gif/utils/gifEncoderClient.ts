/**
 * The page's side of the GIF encoder worker (gifEncoder.worker.ts), and the
 * interface generateGameGif encodes through. No gifenc here: it's only
 * loaded by the worker, or by the on-page fallback (gifEncoder.ts).
 */

// Messages between the page and the encoder worker. Each request gets
// exactly one reply, in order (or an error, after which nothing else).
export type EncoderRequest =
  | { type: "start"; width: number; height: number; samples: Uint8Array }
  | { type: "frame"; pixels: Uint8ClampedArray; delay: number }
  | { type: "finish" };

export type EncoderReply =
  | { type: "started" }
  | { type: "frame-done" }
  | { type: "done"; bytes: Uint8Array<ArrayBuffer> }
  | { type: "error"; message: string };

/** What generateGameGif needs from an encoder, wherever it runs. */
export interface GifEncoderBackend {
  /** Builds the palette from joined sample frames. May take the buffer. */
  start(width: number, height: number, samples: Uint8Array): Promise<void>;
  /**
   * Adds a frame. May take the buffer. Resolves once there's room for the
   * next one (at most one more frame waits behind the one being encoded).
   */
  addFrame(pixels: Uint8ClampedArray, delay: number): Promise<void>;
  finish(): Promise<Uint8Array<ArrayBuffer>>;
  /** Frees the encoder (also when the GIF was abandoned) */
  close(): void;
}

/** The worker didn't load or broke: encode on the page instead */
export class EncoderWorkerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EncoderWorkerError";
  }
}

/** The part of a Worker the backend uses (so tests can stand in for it). */
export interface EncoderPort {
  postMessage(message: EncoderRequest, transfer: Transferable[]): void;
  onmessage: ((event: { data: EncoderReply }) => void) | null;
  onerror: ((event: { message?: string }) => void) | null;
  terminate(): void;
}

/** Encodes in a worker. Pixel buffers are transferred, not copied. */
export function createWorkerBackend(port: EncoderPort): GifEncoderBackend {
  const waiting: { resolve: (reply: EncoderReply) => void; reject: (error: Error) => void }[] = [];
  let failure: Error | null = null;
  let closed = false;
  // The frame before the last one sent, to wait on (back-pressure)
  let inFlight: Promise<EncoderReply> | null = null;

  const fail = (error: Error) => {
    failure ??= error;
    for (const entry of waiting.splice(0)) entry.reject(failure);
  };
  port.onmessage = ({ data }) => {
    if (data.type === "error") fail(new EncoderWorkerError(data.message));
    else waiting.shift()?.resolve(data);
  };
  port.onerror = (event) => {
    fail(new EncoderWorkerError(`GIF encoder failed${event.message ? `: ${event.message}` : ""}`));
  };

  const request = (message: EncoderRequest, transfer: Transferable[] = []) => {
    if (failure) return Promise.reject(failure);
    if (closed) return Promise.reject(new EncoderWorkerError("GIF encoder closed"));
    const reply = new Promise<EncoderReply>((resolve, reject) => waiting.push({ resolve, reject }));
    try {
      port.postMessage(message, transfer);
    } catch (error) {
      fail(new EncoderWorkerError(error instanceof Error ? error.message : String(error)));
    }
    return reply;
  };

  return {
    async start(width, height, samples) {
      await request({ type: "start", width, height, samples }, [samples.buffer]);
    },
    async addFrame(pixels, delay) {
      const sent = request({ type: "frame", pixels, delay }, [pixels.buffer]);
      // Keeps an unhandled rejection off the frame nobody waits on yet
      sent.catch(() => undefined);
      const before = inFlight;
      inFlight = sent;
      if (before) await before;
    },
    async finish() {
      const reply = await request({ type: "finish" });
      if (reply.type !== "done") throw new EncoderWorkerError(`Unexpected reply: ${reply.type}`);
      return reply.bytes;
    },
    close() {
      if (closed) return;
      closed = true;
      port.onmessage = null;
      port.onerror = null;
      port.terminate();
      fail(new EncoderWorkerError("GIF encoder closed"));
    },
  };
}

