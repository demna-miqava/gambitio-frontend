import { cn } from "@/lib/utils";

interface ClockFaceProps {
  children: React.ReactNode;
  active?: boolean;
  lowTime?: boolean;
  className?: string;
}

/** The visual clock: large, fixed-width digits, plain while waiting and set
 *  on ink while it's running (red when time is short). */
export const ClockFace = ({ children, active, lowTime, className }: ClockFaceProps) => (
  <span
    role="timer"
    className={cn(
      "inline-flex h-9 min-w-[5.75rem] items-center justify-center rounded-md px-3 text-lg font-medium tabular-nums transition-colors sm:h-10 sm:min-w-[6.5rem] sm:text-xl",
      active
        ? lowTime
          ? "bg-loss text-loss-foreground"
          : "bg-foreground text-background"
        : "bg-muted text-foreground",
      className
    )}
  >
    {children}
  </span>
);
