/**
 * Renders a game to an animated GIF in the browser. Loaded on demand (see
 * ShareGifContext), so the encoder and the piece images stay out of the main
 * bundle.
 */
import pieceSetCss from "@/assets/pieces/chessground.merida.css?raw";
import { capFrames, gameFrames } from "./utils/frames";
import { MAX_GIF_FRAMES, frameDelays } from "./utils/schedule";
import { GIF_HEIGHT, GIF_WIDTH, SQUARE_SIZE, drawFrame, type GifScene, type GifTheme } from "./utils/draw";
import { PIECE_KEYS, parsePieceSet, type PieceKey } from "./utils/pieceSet";
import { concatPixels, paletteSampleIndices } from "./utils/encode";
import {
  EncoderWorkerError,
  createWorkerBackend,
  type EncoderPort,
  type GifEncoderBackend,
} from "./utils/gifEncoderClient";
import { readGifTheme } from "./utils/theme";
import type { GifOrientation } from "./utils/gameInfo";

export interface GameGifInput {
  pgn: string;
  orientation: GifOrientation;
  /** Name and rating of each side ("magnus (2850)") */
  whiteLabel: string;
  blackLabel: string;
  /** Shown under the board ("1-0 · checkmate") */
  result: string;
  /** Defaults to the board colors on screen */
  theme?: GifTheme;
}

export interface GenerateOptions {
  /** 0..1 as frames are encoded */
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
}

type Sprites = Partial<Record<PieceKey, CanvasImageSource>>;

// Piece images, rasterized once at the GIF's square size
let spritesPromise: Promise<Sprites> | null = null;

function loadSprites(): Promise<Sprites> {
  spritesPromise ??= (async () => {
    const uris = parsePieceSet(pieceSetCss);
    const entries = await Promise.all(
      PIECE_KEYS.map(async (key) => {
        const uri = uris[key];
        if (!uri) throw new Error(`Missing piece image: ${key}`);
        const image = new Image();
        image.src = uri;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = SQUARE_SIZE;
        canvas.height = SQUARE_SIZE;
        canvas.getContext("2d")!.drawImage(image, 0, 0, SQUARE_SIZE, SQUARE_SIZE);
        return [key, canvas] as const;
      })
    );
    return Object.fromEntries(entries) as Sprites;
  })().catch((error) => {
    spritesPromise = null; // try again next time
    throw error;
  });
  return spritesPromise;
}

/** The app's fonts are usually loaded already; don't wait long if not. */
async function loadFonts(theme: GifTheme) {
  if (typeof document === "undefined" || !document.fonts?.load) return;
  await Promise.race([
    Promise.allSettled([
      document.fonts.load(`600 15px ${theme.fontSans}`),
      document.fonts.load(`600 16px ${theme.fontDisplay}`),
    ]),
    new Promise((resolve) => setTimeout(resolve, 1500)),
  ]);
}

const throwIfAborted = (signal?: AbortSignal) => {
  if (signal?.aborted) throw new DOMException("GIF generation was cancelled", "AbortError");
};

/**
 * The encoder worker, or null where workers aren't available. Written out in
 * full so Vite bundles the worker.
 */
function startEncoderWorker(): EncoderPort | null {
  if (typeof Worker === "undefined") return null;
  try {
    return new Worker(new URL("./utils/gifEncoder.worker.ts", import.meta.url), {
      type: "module",
    }) as unknown as EncoderPort;
  } catch {
    return null;
  }
}

/** Encodes in the worker; on the page if it can't start or breaks down. */
async function encodeFrames(encode: (backend: GifEncoderBackend) => Promise<Blob>): Promise<Blob> {
  const port = startEncoderWorker();
  if (port) {
    const backend = createWorkerBackend(port);
    try {
      return await encode(backend);
    } catch (error) {
      if (!(error instanceof EncoderWorkerError)) throw error;
      // e.g. a browser without module workers: start over on the page
    } finally {
      backend.close();
    }
  }
  const { createInlineBackend } = await import("./utils/gifEncoder");
  const backend = createInlineBackend();
  try {
    return await encode(backend);
  } finally {
    backend.close();
  }
}

export async function generateGameGif(
  input: GameGifInput,
  { onProgress, signal }: GenerateOptions = {}
): Promise<Blob> {
  const frames = capFrames(gameFrames(input.pgn), MAX_GIF_FRAMES);
  const delays = frameDelays(frames.length);
  const theme = input.theme ?? readGifTheme();
  const [sprites] = await Promise.all([loadSprites(), loadFonts(theme)]);
  throwIfAborted(signal);

  const white = { color: "white" as const, label: input.whiteLabel };
  const black = { color: "black" as const, label: input.blackLabel };
  const scene: GifScene = {
    theme,
    orientation: input.orientation,
    top: input.orientation === "white" ? black : white,
    bottom: input.orientation === "white" ? white : black,
    result: input.result,
    sprites,
  };

  const canvas = document.createElement("canvas");
  canvas.width = GIF_WIDTH;
  canvas.height = GIF_HEIGHT;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas is not available");

  // Drawing needs the canvas, so it stays on the page; each frame's pixels
  // go to the encoder (a fresh buffer per frame, so it can be transferred)
  const render = (index: number) => {
    drawFrame(ctx, frames[index]!, scene);
    return ctx.getImageData(0, 0, GIF_WIDTH, GIF_HEIGHT).data;
  };

  return encodeFrames(async (encoder) => {
    // One palette for the whole GIF (the board has few colors), built from
    // a few sample frames
    await encoder.start(GIF_WIDTH, GIF_HEIGHT, concatPixels(paletteSampleIndices(frames.length).map(render)));
    for (let i = 0; i < frames.length; i++) {
      throwIfAborted(signal);
      await encoder.addFrame(render(i), delays[i]!);
      onProgress?.((i + 1) / frames.length);
    }
    throwIfAborted(signal);
    return new Blob([await encoder.finish()], { type: "image/gif" });
  });
}
