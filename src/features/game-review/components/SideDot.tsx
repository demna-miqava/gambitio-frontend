import { cn } from "@/lib/utils";
import type { Side } from "../types";

/** A small disc in the side's colour, next to a player's name. Decorative. */
export const SideDot = ({ side, className }: { side: Side; className?: string }) => (
  <span
    aria-hidden="true"
    className={cn(
      "size-2.5 shrink-0 rounded-full ring-1 ring-inset",
      side === "white"
        ? "bg-piece-white ring-foreground/35 dark:ring-transparent"
        : "bg-piece-black ring-foreground/25 dark:ring-foreground/60",
      className
    )}
  />
);
