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

const describe = ({ captured, advantage }: SideMaterial) => {
  const parts = MATERIAL_PIECES.filter((piece) => captured[piece]).map((piece) => {
    const count = captured[piece]!;
    return `${count} ${PIECE_NAMES[piece]}${count === 1 ? "" : "s"}`;
  });
  const takes = parts.length ? `Captured ${parts.join(", ")}` : "";
  const ahead = advantage > 0 ? `up ${advantage} point${advantage === 1 ? "" : "s"}` : "";
  return [takes, ahead].filter(Boolean).join(", ");
};

interface MaterialDisplayProps {
  material: SideMaterial;
  /** Colour of the pieces this side captured (the opponent's) */
  capturedColor: PlayerColor;
  className?: string;
}

/**
 * The opponent pieces a player has taken, smallest first with each kind
 * stacked, and "+N" when they're ahead in material.
 */
export const MaterialDisplay = memo(
  ({ material, capturedColor, className }: MaterialDisplayProps) => {
    const { captured, advantage } = material;
    const label = describe(material);
    if (!label) return null;

    return (
      <span
        role="img"
        aria-label={label}
        className={cn("flex min-w-0 items-center gap-1 overflow-hidden", className)}
      >
        {MATERIAL_PIECES.map((piece) => {
          const count = captured[piece];
          if (!count) return null;
          return (
            <span key={piece} className="flex shrink-0 items-center" aria-hidden="true">
              {Array.from({ length: count }, (_, i) => (
                <img
                  key={i}
                  src={PIECE_IMAGES[capturedColor][piece]}
                  alt=""
                  draggable={false}
                  className={cn(
                    "size-4 select-none sm:size-[1.125rem]",
                    i > 0 && "-ml-2.5 sm:-ml-3",
                    // Black pieces get a light rim so they read on dark cards
                    capturedColor === "black" &&
                      "dark:drop-shadow-[0_0_1px_rgb(255_255_255/0.55)]"
                  )}
                />
              ))}
            </span>
          );
        })}
        {advantage > 0 && (
          <span
            className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground"
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
