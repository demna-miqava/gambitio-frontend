import type { DrawShape } from "@lichess-org/chessground/draw";
import type { Key } from "@lichess-org/chessground/types";

// Chessground custom SVGs use a 0-100 box per square, origin top-left. The
// board colours don't follow the site theme, so fixed colours are fine; the
// white ring keeps the badge visible on light and dark squares alike.
const WRONG_RED = "#dc2626";

/** Red tint over the square, drawn under the piece */
const TINT_SVG = `<rect width="100" height="100" fill="${WRONG_RED}" fill-opacity="0.45"/>`;

/** ✕ badge in the square's top-right corner, over the piece */
const BADGE_SVG =
  `<circle cx="78" cy="22" r="18" fill="${WRONG_RED}" stroke="#fff" stroke-width="4"/>` +
  `<path d="M71 15 L85 29 M85 15 L71 29" stroke="#fff" stroke-width="5.5" stroke-linecap="round" fill="none"/>`;

/** Auto shapes marking a wrong move's destination square: a tint and a ✕ badge. */
export const wrongMoveShapes = (square: Key): DrawShape[] => [
  { orig: square, customSvg: { html: TINT_SVG }, below: true },
  { orig: square, customSvg: { html: BADGE_SVG } },
];
