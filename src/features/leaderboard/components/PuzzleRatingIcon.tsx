import { Puzzle } from "lucide-react";
import { cn } from "@/lib/utils";

/** Puzzle rating, styled like the time-control icons (leaderboard tab). */
export const PuzzleRatingIcon = ({
  className,
  ...props
}: { className?: string } & React.ComponentProps<typeof Puzzle>) => (
  <Puzzle className={cn("text-primary", className)} {...props} />
);
