import { memo } from "react";
import { PIECE_NAMES, PIECE_SVGS } from "@/features/game/constants/promotion";
import type { PlayerColor } from "@/features/game/types/game.types";
import {
  MATERIAL_PIECES,
  type MaterialPiece,
  type SideMaterial,
} from "@/features/game/utils/material";
import { cn } from "@/lib/utils";
import WhitePawn from "@/assets/pieces/white_pawn.svg";
import BlackPawn from "@/assets/pieces/black_pawn.svg";

const PIECE_IMAGES: Record<PlayerColor, Record<MaterialPiece, string>> = {
  white: { ...PIECE_SVGS.white, p: WhitePawn },
  black: { ...PIECE_SVGS.black, p: BlackPawn },
};

const describe = ({ pieces, advantage }: SideMaterial) => {
  const parts = MATERIAL_PIECES.filter((piece) => pieces[piece]).map((piece) => {
    const count = pieces[piece]!;
    return `${count} ${PIECE_NAMES[piece]}${count === 1 ? "" : "s"}`;
  });
  const up = parts.length ? `Up ${parts.join(", ")}` : "";
  const ahead = advantage > 0 ? `${advantage} point${advantage === 1 ? "" : "s"} ahead` : "";
  return [up, ahead].filter(Boolean).join(", ");
};

interface MaterialDisplayProps {
  material: SideMaterial;
  /** Colour the pieces are drawn in: the opponent's, as this side took them */
  capturedColor: PlayerColor;
  className?: string;
}

/**
 * How far along the row the next piece starts, as a flex item that can
 * shrink: pieces of one kind overlap by half, a new kind starts after a small
 * gap. When the row is short of room (a phone, many captures) every step
 * shrinks towards its minimum, so the pieces fan in closer instead of being
 * cut off. The piece image itself keeps its size and spills over the next
 * steps; later pieces are drawn on top. Past the minimums (a near-bare
 * king facing a full army) the row is cut, never laid over the "+N".
 */
const STEP_SAME_KIND = "w-2.5 min-w-0.5";
const STEP_NEW_KIND = "w-6 min-w-1.5";

/**
 * The material difference, Lichess style: the pieces a player is up (taken,
 * net of what they lost), smallest first with each kind stacked, and "+N"
 * when they're ahead in points. Trades cancel out, so the row stays short.
 */
export const MaterialDisplay = memo(
  ({ material, capturedColor, className }: MaterialDisplayProps) => {
    const { pieces: counts, advantage } = material;
    const label = describe(material);
    if (!label) return null;

    const pieces = MATERIAL_PIECES.flatMap((piece) =>
      Array.from({ length: counts[piece] ?? 0 }, () => piece)
    );

    return (
      <span
        role="img"
        aria-label={label}
        className={cn("flex min-w-0 items-center gap-1 overflow-hidden rounded-md bg-(--board-light) px-1.5 py-0.5 ring-1 ring-(--board-frame)/15 ring-inset", className)}
      >
        {pieces.length > 0 && (
          <span className="flex min-w-0 items-center overflow-hidden" aria-hidden="true">
            {pieces.map((piece, i) => {
              const next = pieces[i + 1];
              return (
                <span
                  key={i}
                  className={cn(
                    "flex",
                    next === undefined
                      ? "w-5 shrink-0"
                      : next === piece
                        ? STEP_SAME_KIND
                        : STEP_NEW_KIND
                  )}
                >
                  <img
                    src={PIECE_IMAGES[capturedColor][piece]}
                    alt=""
                    draggable={false}
                    className="size-5 max-w-none select-none"
                  />
                </span>
              );
            })}
          </span>
        )}
        {advantage > 0 && (
          <span
            className="shrink-0 text-xs font-semibold tabular-nums text-(--board-frame)"
            aria-hidden="true"
          >
            +{advantage}
          </span>
        )}
      </span>
    );
  }
);
MaterialDisplay.displayName = "MaterialDisplay";
