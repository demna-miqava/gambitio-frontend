import type { ReactNode } from "react";
import { SPEED_LABEL } from "@/features/game/constants/speed";
import { useChessBoardContext } from "@/features/game/contexts/ChessBoardContext";
import { cn } from "@/lib/utils";
import { useLiveGame } from "../contexts/LiveGameContext";
import type { FinishState } from "../hooks/useGameActions";

interface GameOutcomeProps {
  /** Null for a finished game whose ending the page doesn't know how to word */
  finish: FinishState | null;
  /** What to do next: rematch, new game, review */
  children: ReactNode;
}

/**
 * The result, at the top of the side rail once the game is over: who won
 * and how, the player's new rating with the change, and what to do next.
 * A win sits on the accent's tint; everything else on the sunken surface.
 */
export const GameOutcome = ({ finish, children }: GameOutcomeProps) => {
  const { game, ratingChanges } = useLiveGame();
  const { color } = useChessBoardContext();
  const rating = ratingChanges
    ? color === "white"
      ? { value: ratingChanges.whiteNewRating, change: ratingChanges.whiteRatingChange }
      : { value: ratingChanges.blackNewRating, change: ratingChanges.blackRatingChange }
    : null;
  const showRating = rating !== null && finish?.kind !== "aborted";

  return (
    <section
      aria-labelledby="game-outcome-title"
      className={cn(
        "border-b border-border p-5 max-md:order-6 max-md:mx-3 max-md:mt-2 max-md:rounded-[10px] max-md:border max-md:p-4",
        finish?.kind === "win" ? "bg-primary-soft" : "bg-muted"
      )}
    >
      <h2 id="game-outcome-title" className="font-display text-[22px] leading-tight">
        {finish?.title ?? "Game over"}
      </h2>
      {(finish || showRating) && (
        <p className="mt-0.5 text-sm text-muted-foreground">
          {finish?.description}
          {showRating && (
            <>
              {finish ? ". " : ""}
              {SPEED_LABEL[game.type]} rating{" "}
              <b className="font-semibold tabular-nums text-foreground">{rating.value}</b>{" "}
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  rating.change > 0 ? "text-rating-up" : rating.change < 0 ? "text-rating-down" : "text-faint"
                )}
              >
                {rating.change > 0 ? "+" : rating.change < 0 ? "−" : "±"}
                {Math.abs(rating.change)}
              </span>
            </>
          )}
        </p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
};
