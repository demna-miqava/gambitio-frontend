import type { Chess, PieceSymbol, Square } from "chess.js";

export interface TypedMove {
  from: Square;
  to: Square;
  promotion?: PieceSymbol;
}

const stripSuffix = (san: string) => san.replace(/[+#!?]+$/, "");

/**
 * Finds the legal move a player typed, in SAN ("Nf3", "exd5", "O-O", "e8=Q")
 * or coordinates ("e2e4", "e2-e4", "e7e8q"). Check marks are optional, and a
 * lowercase SAN ("nf3") is accepted when it matches only one move.
 * Returns null when it isn't a legal move in the current position.
 */
export const parseTypedMove = (chess: Chess, input: string): TypedMove | null => {
  const text = input.trim().replace(/0/g, "O");
  if (!text) return null;
  const legal = chess.moves({ verbose: true });
  const toMove = (m: (typeof legal)[number]): TypedMove => ({
    from: m.from,
    to: m.to,
    ...(m.promotion && { promotion: m.promotion }),
  });

  // Coordinates: e2e4, e2-e4, e7e8q, e7e8=q
  const coords = text.toLowerCase().match(/^([a-h][1-8])[-\s]?([a-h][1-8])=?([qrbn])?$/);
  if (coords) {
    const [, from, to, promotion] = coords;
    // No piece given for a promotion: queen
    const found = legal.find(
      (m) =>
        m.from === from &&
        m.to === to &&
        (m.promotion ? m.promotion === (promotion ?? "q") : !promotion)
    );
    return found ? toMove(found) : null;
  }

  const san = stripSuffix(text);
  const exact = legal.find((m) => stripSuffix(m.san) === san);
  if (exact) return toMove(exact);

  // "e8q" or "e8Q" for a promotion
  const promo = san.match(/^(.*[1-8])=?([qrbnQRBN])$/);
  if (promo) {
    const withEquals = `${promo[1]}=${promo[2].toUpperCase()}`;
    const found = legal.find((m) => stripSuffix(m.san) === withEquals);
    if (found) return toMove(found);
  }

  const lower = san.toLowerCase();
  const loose = legal.filter((m) => stripSuffix(m.san).toLowerCase() === lower);
  return loose.length === 1 ? toMove(loose[0]) : null;
};
