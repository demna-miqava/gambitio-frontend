/**
 * Renders a game to an animated GIF in the browser. Loaded on demand (see
 * ShareGifContext), so the encoder and the piece images stay out of the main
 * bundle.
 */
import { GIFEncoder, applyPalette, quantize } from "gifenc";
import cburnettCss from "@lichess-org/chessground/assets/chessground.cburnett.css?raw";
import { capFrames, gameFrames } from "./utils/frames";
import { MAX_GIF_FRAMES, frameDelays } from "./utils/schedule";
import { GIF_HEIGHT, GIF_WIDTH, SQUARE_SIZE, drawFrame, type GifScene, type GifTheme } from "./utils/draw";
import { PIECE_KEYS, parsePieceSet, type PieceKey } from "./utils/pieceSet";
import { concatPixels, maskUnchanged, paletteSampleIndices, yieldToBrowser } from "./utils/encode";
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
    const uris = parsePieceSet(cburnettCss);
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

  const render = (index: number) => {
    drawFrame(ctx, frames[index]!, scene);
    return ctx.getImageData(0, 0, GIF_WIDTH, GIF_HEIGHT).data;
  };

  // One palette for the whole GIF (the board has few colors), with the last
  // slot left free for "unchanged since the previous frame"
  const palette = quantize(concatPixels(paletteSampleIndices(frames.length).map(render)), 255);
  const transparentIndex = palette.length;
  const globalPalette = [...palette, [0, 0, 0]];
  await yieldToBrowser();

  const gif = GIFEncoder();
  let previous: Uint8Array | null = null;
  for (let i = 0; i < frames.length; i++) {
    throwIfAborted(signal);
    const indexed = applyPalette(render(i), palette);
    gif.writeFrame(previous ? maskUnchanged(previous, indexed, transparentIndex) : indexed, GIF_WIDTH, GIF_HEIGHT, {
      palette: i === 0 ? globalPalette : undefined,
      delay: delays[i],
      repeat: 0,
      // Keep each frame under the next, which only draws what changed
      dispose: 1,
      transparent: previous !== null,
      transparentIndex,
    });
    previous = indexed;
    onProgress?.((i + 1) / frames.length);
    await yieldToBrowser();
  }
  gif.finish();
  return new Blob([gif.bytes()], { type: "image/gif" });
}
