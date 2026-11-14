import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { type PuzzleModeConfig } from "../../config/puzzleModes";
import { cn } from "@/lib/utils";

interface PuzzleModeItemProps {
  mode: PuzzleModeConfig;
}

export const PuzzleModeItem = ({ mode }: PuzzleModeItemProps) => {
  const content = (
    <>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted">
        <mode.icon className={cn("size-5", mode.iconColor)} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-foreground">{mode.title}</span>
        <span className="block text-sm text-muted-foreground">{mode.description}</span>
      </span>
      {!mode.disabled && (
        <ArrowRight
          className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
          aria-hidden="true"
        />
      )}
    </>
  );

  const className =
    "group flex items-center gap-4 rounded-xl bg-card p-4 text-left transition-colors";

  if (mode.disabled) {
    return (
      <div className={cn(className, "cursor-not-allowed opacity-50")} aria-disabled="true">
        {content}
      </div>
    );
  }

  return (
    <Link
      to={`/puzzles/${mode.url}`}
      className={cn(
        className,
        "hover:border-primary/40 hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
    >
      {content}
    </Link>
  );
};
