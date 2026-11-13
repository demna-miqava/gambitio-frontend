import { cn } from "@/lib/utils";

/** The app tile (pawn on a checkered square). It carries its own background,
 *  with a faint ring so it still separates from dark surfaces. */
export const BrandMark = ({ className }: { className?: string }) => (
  <span
    className={cn(
      "inline-flex size-8 shrink-0 overflow-hidden rounded-[23%] dark:ring-1 dark:ring-white/10",
      className
    )}
  >
    <img src="/logo-mark.svg" alt="" className="size-full" />
  </span>
);

/** Mark + wordmark. The wordmark is text so it follows the theme. */
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
        "text-[1.15rem] font-semibold tracking-tight text-foreground",
        textClassName
      )}
    >
      {/* The logo's bright green is too light for text on light surfaces
          (2.4:1); the darker primary green reads at 4.8:1 */}
      Gambit<span className="text-primary dark:text-brand">io</span>
    </span>
  </span>
);
