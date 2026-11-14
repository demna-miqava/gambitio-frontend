import { cn } from "@/lib/utils";

export type GameScore = "1–0" | "0–1" | "½–½";

interface ResultBadgeProps {
  result: "win" | "loss" | "draw" | "aborted" | "live" | string;
  /** The game's score as on a scoresheet (White first): shown instead of the word */
  score?: GameScore;
  className?: string;
}

const STYLES: Record<string, { label: string; className: string }> = {
  win: { label: "Won", className: "text-foreground" },
  loss: { label: "Lost", className: "text-loss" },
  draw: { label: "Draw", className: "text-muted-foreground" },
  // Called off before both players had moved: no score
  aborted: { label: "Aborted", className: "text-muted-foreground" },
  // A game still being played (the history lists those too)
  live: { label: "Playing", className: "italic text-muted-foreground" },
};

/**
 * How a game ended for the player the list belongs to, written the way a
 * scoresheet does: 1–0, 0–1, ½–½ (White's score first). Ink for a win, red
 * for a loss, grey for a draw; the word is kept for screen readers. Without
 * a score (or while the game is on) it is the plain word.
 */
export const ResultBadge = ({ result, score, className }: ResultBadgeProps) => {
  const style = STYLES[result] ?? STYLES.draw;
  const showScore = score && result !== "live";
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap",
        showScore ? "font-display-num text-base" : "text-sm",
        style.className,
        className
      )}
      title={showScore ? style.label : undefined}
    >
      {showScore ? (
        <>
          <span className="sr-only">{style.label}, </span>
          {score}
        </>
      ) : (
        style.label
      )}
    </span>
  );
};
