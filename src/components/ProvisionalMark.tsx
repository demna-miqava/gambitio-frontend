import { cn } from "@/lib/utils";

/**
 * The "?" after a rating that is still settling: the player has too few
 * rated games in that time control, or none for a long time, so a game moves
 * it a lot. Renders nothing for a settled rating.
 */
export const ProvisionalMark = ({
  provisional,
  className,
}: {
  provisional: boolean | null | undefined;
  className?: string;
}) =>
  provisional ? (
    <span title="Provisional rating: still settling" className={cn("text-muted-foreground", className)}>
      <span aria-hidden="true">?</span>
      <span className="sr-only"> (provisional)</span>
    </span>
  ) : null;
