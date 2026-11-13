import { Link, type To } from "react-router-dom";
import { ChartSpline, Microscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface GameLinkTarget {
  to: To;
  /** Router state (e.g. the PGN of a game that isn't stored on the server) */
  state?: unknown;
}

interface ReviewGameLinksProps {
  /** Opens the game with the computer review started */
  review: GameLinkTarget;
  /** Opens the game on the analysis board */
  analysis: GameLinkTarget;
  className?: string;
}

/** "Game review" and "Analysis" after a game ends. */
export const ReviewGameLinks = ({ review, analysis, className }: ReviewGameLinksProps) => (
  <div className={cn("flex w-full gap-2", className)}>
    <Button size="md" asChild variant="outline" className="flex-1">
      <Link to={review.to} state={review.state}>
        <ChartSpline aria-hidden="true" />
        Game review
      </Link>
    </Button>
    <Button size="md" asChild variant="outline" className="flex-1">
      <Link to={analysis.to} state={analysis.state}>
        <Microscope aria-hidden="true" />
        Analysis
      </Link>
    </Button>
  </div>
);
