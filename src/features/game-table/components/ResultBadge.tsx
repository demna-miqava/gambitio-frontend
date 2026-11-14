import { cn } from "@/lib/utils";

interface ResultBadgeProps {
  result: "win" | "loss" | "draw" | "live" | string;
  className?: string;
}

const STYLES: Record<string, { label: string; className: string }> = {
  win: { label: "Won", className: "bg-win-bg text-win" },
  loss: { label: "Lost", className: "bg-loss-bg text-loss" },
  draw: { label: "Draw", className: "bg-draw-bg text-draw" },
  // A game still being played (the history lists those too)
  live: { label: "Playing", className: "bg-muted text-muted-foreground" },
};

export const ResultBadge = ({ result, className }: ResultBadgeProps) => {
  const style = STYLES[result] ?? STYLES.draw;
  return (
    <span
      className={cn(
        "inline-flex h-6 min-w-12 items-center justify-center rounded-full px-2.5 text-xs font-semibold",
        style.className,
        className
      )}
    >
      {style.label}
    </span>
  );
};
