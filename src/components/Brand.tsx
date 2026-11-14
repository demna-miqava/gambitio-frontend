import { cn } from "@/lib/utils";

/** The app tile (pawn on a checkered square). It carries its own background,
 *  with a faint ring so it still separates from dark surfaces. */
export const BrandMark = ({ className }: { className?: string }) => (
  <span
    className={cn(
      "inline-flex size-8 shrink-0 overflow-hidden rounded-md dark:ring-1 dark:ring-white/15",
      className
    )}
  >
    <img src="/logo-mark.svg" alt="" className="size-full" />
  </span>
);

/** Mark + wordmark. The wordmark is text, set in the display serif in one
 *  colour, so it follows the theme. */
export const BrandLogo = ({
  className,
  markClassName,
  textClassName,
}: {
  className?: string;
  markClassName?: string;
  textClassName?: string;
}) => (
  <span className={cn("inline-flex items-center gap-2.5", className)}>
    <BrandMark className={markClassName} />
    <span
      className={cn(
        "font-display text-[1.375rem] leading-none text-foreground",
        textClassName
      )}
    >
      Gambitio
    </span>
  </span>
);
