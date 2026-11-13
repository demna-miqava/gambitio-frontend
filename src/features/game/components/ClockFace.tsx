import { cn } from "@/lib/utils";

interface ClockFaceProps {
  children: React.ReactNode;
  active?: boolean;
  lowTime?: boolean;
  className?: string;
}

/** The visual clock: large, fixed-width digits; filled when it's running. */
export const ClockFace = ({ children, active, lowTime, className }: ClockFaceProps) => (
  <span
    role="timer"
    className={cn(
      "inline-flex h-9 min-w-[5.75rem] items-center justify-center rounded-lg px-3 text-lg font-semibold tabular-nums tracking-tight transition-colors sm:h-11 sm:min-w-[7rem] sm:text-2xl",
      active
        ? lowTime
          ? "bg-loss text-loss-foreground"
          : "bg-foreground text-background"
        : "bg-muted text-muted-foreground",
      className
    )}
  >
    {children}
  </span>
);
