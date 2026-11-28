import { cn } from "@/lib/utils";

interface ClockFaceProps {
  children: React.ReactNode;
  active?: boolean;
  lowTime?: boolean;
  className?: string;
}

/**
 * The visual clock: large, fixed-width digits set to the right. Sunken and
 * muted while it waits, on ink while it runs, and red when the running
 * clock is short of time.
 */
export const ClockFace = ({ children, active, lowTime, className }: ClockFaceProps) => (
  <span
    role="timer"
    // Hooks for the live game's phone layout (index.css), where the clocks
    // are larger and the waiting one is plain figures
    data-active={active || undefined}
    className={cn(
      "clock-face inline-flex h-[38px] min-w-24 items-center justify-end rounded-md px-3 text-[22px] font-semibold tracking-[-0.01em] tabular-nums transition-colors duration-150 sm:h-[46px] sm:min-w-28 sm:px-3.5 sm:text-[26px]",
      active
        ? lowTime
          ? "bg-loss text-loss-foreground"
          : "bg-foreground text-background"
        : "bg-muted text-faint shadow-[inset_0_0_0_1px_var(--border)]",
      className
    )}
  >
    {children}
  </span>
);
