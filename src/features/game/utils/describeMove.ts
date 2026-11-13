const PIECE_NAMES: Record<string, string> = {
  K: "King",
  Q: "Queen",
  R: "Rook",
  B: "Bishop",
  N: "Knight",
};

/**
 * Spells out a SAN move for screen readers: "Nxe5+" becomes
 * "Knight takes e5, check". Falls back to the SAN itself if it doesn't parse.
 */
export const describeMove = (san: string): string => {
  const suffix = san.endsWith("#") ? ", checkmate" : san.endsWith("+") ? ", check" : "";
  const move = san.replace(/[+#!?]+$/, "");

  if (move === "O-O") return `Short castle${suffix}`;
  if (move === "O-O-O") return `Long castle${suffix}`;

  const match = move.match(/^([KQRBN])?([a-h]?[1-8]?)(x)?([a-h][1-8])(?:=([QRBN]))?$/);
  if (!match) return san;
  const [, piece, from, capture, to, promotion] = match;

  const parts = [piece ? PIECE_NAMES[piece] : "Pawn"];
  if (from) parts.push(piece ? `from ${from}` : `on ${from}`);
  parts.push(capture ? `takes ${to}` : `to ${to}`);
  if (promotion) parts.push(`promotes to ${PIECE_NAMES[promotion].toLowerCase()}`);
  return parts.join(" ") + suffix;
};
