import type { Square } from "chess.js";
import { piecesFromFen, type GifFrame } from "./frames";
import type { GifOrientation } from "./gameInfo";
import type { PieceKey } from "./pieceSet";

// 480 px wide: small enough to share, big enough to read the pieces
export const SQUARE_SIZE = 60;
export const BOARD_SIZE = SQUARE_SIZE * 8;
export const STRIP_HEIGHT = 44;
export const GIF_WIDTH = BOARD_SIZE;
export const GIF_HEIGHT = BOARD_SIZE + STRIP_HEIGHT * 2;

/** Colors of the user's board and page (see readGifTheme) */
export interface GifTheme {
  boardLight: string;
  boardDark: string;
  lastMove: string;
  coordOnLight: string;
  coordOnDark: string;
  background: string;
  text: string;
  muted: string;
  accent: string;
  fontSans: string;
  fontDisplay: string;
}

export interface GifSide {
  color: "white" | "black";
  /** Name with rating */
  label: string;
}

/** Everything that stays the same from frame to frame */
export interface GifScene {
  theme: GifTheme;
  orientation: GifOrientation;
  top: GifSide;
  bottom: GifSide;
  /** "1-0 · checkmate" */
  result: string;
  sprites: Partial<Record<PieceKey, CanvasImageSource>>;
}

const FILES = "abcdefgh";

/** Top-left corner of a square on the board, in pixels from the board's corner. */
export function squareOrigin(square: Square, orientation: GifOrientation, size = SQUARE_SIZE) {
  const file = FILES.indexOf(square[0]!);
  const rank = Number(square[1]) - 1;
  const col = orientation === "white" ? file : 7 - file;
  const row = orientation === "white" ? 7 - rank : rank;
  return { x: col * size, y: row * size };
}

export const isLightSquare = (square: Square) =>
  (FILES.indexOf(square[0]!) + Number(square[1])) % 2 === 0;

const SIDE_DOT = { white: "#f7f6f1", black: "#2a2c30" };

/** Shortens text with an ellipsis until it fits. */
function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1);
  return `${cut}…`;
}

function drawStrip(
  ctx: CanvasRenderingContext2D,
  y: number,
  side: GifSide,
  right: { text: string; font: string; color: string },
  scene: GifScene
) {
  const { theme } = scene;
  const mid = y + STRIP_HEIGHT / 2;
  ctx.fillStyle = theme.background;
  ctx.fillRect(0, y, GIF_WIDTH, STRIP_HEIGHT);

  // Whose side: a dot in the piece color, ringed so it shows on any page color
  ctx.beginPath();
  ctx.arc(20, mid, 6, 0, Math.PI * 2);
  ctx.fillStyle = SIDE_DOT[side.color];
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = theme.muted;
  ctx.stroke();

  ctx.textBaseline = "middle";
  ctx.font = right.font;
  const rightText = right.text;
  const rightWidth = rightText ? ctx.measureText(rightText).width : 0;
  if (rightText) {
    ctx.textAlign = "right";
    ctx.fillStyle = right.color;
    ctx.fillText(rightText, GIF_WIDTH - 14, mid + 1);
  }

  ctx.textAlign = "left";
  ctx.font = `600 15px ${theme.fontSans}`;
  ctx.fillStyle = theme.text;
  const maxName = GIF_WIDTH - 34 - 14 - (rightWidth ? rightWidth + 16 : 0);
  ctx.fillText(fitText(ctx, side.label, maxName), 34, mid + 1);
}

function drawCoordinates(ctx: CanvasRenderingContext2D, scene: GifScene, top: number) {
  const { theme, orientation } = scene;
  ctx.font = `600 10px ${theme.fontSans}`;
  const edgeFile = orientation === "white" ? "a" : "h";
  const edgeRank = orientation === "white" ? 1 : 8;
  // Ranks in the top-left of the left column, files in the bottom-right of
  // the bottom row, like the board in the app
  for (let rank = 1; rank <= 8; rank++) {
    const square = `${edgeFile}${rank}` as Square;
    const { x, y } = squareOrigin(square, orientation);
    ctx.fillStyle = isLightSquare(square) ? theme.coordOnLight : theme.coordOnDark;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(String(rank), x + 3, top + y + 3);
  }
  for (const file of FILES) {
    const square = `${file}${edgeRank}` as Square;
    const { x, y } = squareOrigin(square, orientation);
    ctx.fillStyle = isLightSquare(square) ? theme.coordOnLight : theme.coordOnDark;
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(file, x + SQUARE_SIZE - 3, top + y + SQUARE_SIZE - 2);
  }
}

/** Draws one frame of the GIF: both player strips and the board. */
export function drawFrame(ctx: CanvasRenderingContext2D, frame: GifFrame, scene: GifScene) {
  const { theme, orientation } = scene;
  const top = STRIP_HEIGHT;

  drawStrip(
    ctx,
    0,
    scene.top,
    { text: "gambitio", font: `600 16px ${theme.fontDisplay}`, color: theme.accent },
    scene
  );

  ctx.fillStyle = theme.boardLight;
  ctx.fillRect(0, top, BOARD_SIZE, BOARD_SIZE);
  ctx.fillStyle = theme.boardDark;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        ctx.fillRect(col * SQUARE_SIZE, top + row * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
      }
    }
  }

  if (frame.lastMove) {
    ctx.fillStyle = theme.lastMove;
    for (const square of frame.lastMove) {
      const { x, y } = squareOrigin(square, orientation);
      ctx.fillRect(x, top + y, SQUARE_SIZE, SQUARE_SIZE);
    }
  }

  drawCoordinates(ctx, scene, top);

  for (const piece of piecesFromFen(frame.fen)) {
    const sprite = scene.sprites[`${piece.color}${piece.type}`];
    if (!sprite) continue;
    const { x, y } = squareOrigin(piece.square, orientation);
    ctx.drawImage(sprite, x, top + y, SQUARE_SIZE, SQUARE_SIZE);
  }

  drawStrip(
    ctx,
    top + BOARD_SIZE,
    scene.bottom,
    { text: scene.result, font: `600 14px ${theme.fontSans}`, color: theme.text },
    scene
  );
}
