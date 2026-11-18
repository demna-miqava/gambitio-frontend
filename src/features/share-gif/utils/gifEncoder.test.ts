import { describe, expect, test } from "vitest";
import { GIFEncoder, applyPalette, quantize } from "gifenc";
import { concatPixels, maskUnchanged } from "./encode";
import { GifFrameEncoder, createEncoderHandler, createInlineBackend } from "./gifEncoder";
import {
  EncoderWorkerError,
  createWorkerBackend,
  type EncoderPort,
  type EncoderReply,
  type EncoderRequest,
  type GifEncoderBackend,
} from "./gifEncoderClient";

const WIDTH = 8;
const HEIGHT = 6;

/** A small frame: a gradient with one moved "piece" */
function frame(n: number): Uint8ClampedArray {
  const pixels = new Uint8ClampedArray(WIDTH * HEIGHT * 4);
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const i = (y * WIDTH + x) * 4;
      const piece = x === n % WIDTH && y === 2;
      pixels[i] = piece ? 250 : x * 30;
      pixels[i + 1] = piece ? 10 : y * 40;
      pixels[i + 2] = 120;
      pixels[i + 3] = 255;
    }
  }
  return pixels;
}

const FRAMES = [0, 1, 2, 3, 4].map(frame);
const DELAYS = [1000, 600, 600, 600, 2500];
const SAMPLES = () => concatPixels([FRAMES[0]!, FRAMES[2]!, FRAMES[4]!]);

/** The encoding as generateGameGif did it on the page before the worker */
function referenceGif(): Uint8Array {
  const palette = quantize(SAMPLES(), 255);
  const transparentIndex = palette.length;
  const gif = GIFEncoder();
  let previous: Uint8Array | null = null;
  FRAMES.forEach((pixels, i) => {
    const indexed = applyPalette(pixels, palette);
    gif.writeFrame(previous ? maskUnchanged(previous, indexed, transparentIndex) : indexed, WIDTH, HEIGHT, {
      palette: i === 0 ? [...palette, [0, 0, 0]] : undefined,
      delay: DELAYS[i],
      repeat: 0,
      dispose: 1,
      transparent: previous !== null,
      transparentIndex,
    });
    previous = indexed;
  });
  gif.finish();
  return gif.bytes();
}

async function encodeWith(backend: GifEncoderBackend) {
  try {
    // Copies: the worker backend transfers (detaches) what it's given
    await backend.start(WIDTH, HEIGHT, SAMPLES());
    for (let i = 0; i < FRAMES.length; i++) await backend.addFrame(FRAMES[i]!.slice(), DELAYS[i]!);
    return await backend.finish();
  } finally {
    backend.close();
  }
}

/**
 * Stands in for the worker: delivers each request to the worker's handler
 * and its replies back, asynchronously like postMessage.
 */
function fakeWorker(options: { failOn?: EncoderRequest["type"]; loadError?: boolean } = {}) {
  const sent: EncoderRequest[] = [];
  const transferred: Transferable[][] = [];
  let terminated = false;
  const port: EncoderPort = {
    onmessage: null,
    onerror: null,
    postMessage(message, transfer) {
      sent.push(message);
      transferred.push(transfer);
      setTimeout(() => {
        if (terminated) return;
        if (options.loadError) return port.onerror?.({});
        if (message.type === options.failOn) {
          return port.onmessage?.({ data: { type: "error", message: "boom" } });
        }
        handle(message);
      }, 0);
    },
    terminate() {
      terminated = true;
    },
  };
  const handle = createEncoderHandler((reply: EncoderReply) => {
    setTimeout(() => !terminated && port.onmessage?.({ data: reply }), 0);
  });
  return { port, sent, transferred, isTerminated: () => terminated };
}

describe("GIF frame encoder", () => {
  test("encodes exactly as the page did before", () => {
    const encoder = new GifFrameEncoder(WIDTH, HEIGHT);
    encoder.setPalette(SAMPLES());
    FRAMES.forEach((pixels, i) => encoder.addFrame(pixels, DELAYS[i]!));
    const bytes = encoder.finish();
    expect(new TextDecoder().decode(bytes.slice(0, 6))).toBe("GIF89a");
    expect([...bytes]).toEqual([...referenceGif()]);
  });

  test("needs the palette first", () => {
    expect(() => new GifFrameEncoder(WIDTH, HEIGHT).addFrame(FRAMES[0]!, 100)).toThrow();
  });
});

describe("GIF encoder backends", () => {
  test("the worker gives the same file, and the pixels are transferred", async () => {
    const worker = fakeWorker();
    const bytes = await encodeWith(createWorkerBackend(worker.port));
    expect([...bytes]).toEqual([...referenceGif()]);
    expect(worker.sent.map((m) => m.type)).toEqual(["start", "frame", "frame", "frame", "frame", "frame", "finish"]);
    // Every pixel buffer moved to the worker
    expect(worker.transferred.slice(0, -1).every((list) => list.length === 1)).toBe(true);
    expect(worker.isTerminated()).toBe(true);
  });

  test("the page fallback gives the same file", async () => {
    const bytes = await encodeWith(createInlineBackend());
    expect([...bytes]).toEqual([...referenceGif()]);
  });

  test("at most one frame waits behind the one being encoded", async () => {
    const worker = fakeWorker();
    const backend = createWorkerBackend(worker.port);
    await backend.start(WIDTH, HEIGHT, SAMPLES());
    const before = worker.sent.length;
    await backend.addFrame(FRAMES[0]!.slice(), 100);
    // The first frame doesn't wait
    expect(worker.sent.length).toBe(before + 1);
    let second = false;
    const pending = backend.addFrame(FRAMES[1]!.slice(), 100).then(() => (second = true));
    expect(second).toBe(false);
    await pending;
    expect(second).toBe(true);
    backend.close();
  });

  test("a worker error rejects with EncoderWorkerError", async () => {
    await expect(encodeWith(createWorkerBackend(fakeWorker({ failOn: "frame" }).port))).rejects.toBeInstanceOf(
      EncoderWorkerError
    );
  });

  test("a worker that doesn't load rejects with EncoderWorkerError", async () => {
    await expect(encodeWith(createWorkerBackend(fakeWorker({ loadError: true }).port))).rejects.toBeInstanceOf(
      EncoderWorkerError
    );
  });

  test("nothing more is sent once closed", async () => {
    const worker = fakeWorker();
    const backend = createWorkerBackend(worker.port);
    backend.close();
    await expect(backend.start(WIDTH, HEIGHT, SAMPLES())).rejects.toBeInstanceOf(EncoderWorkerError);
    expect(worker.sent).toEqual([]);
  });
});
