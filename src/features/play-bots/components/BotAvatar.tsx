import { Bot as BotIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Bots get a tinted tile whose depth follows their strength. */
export const BotAvatar = ({ rating, className }: { rating: number; className?: string }) => {
  const level = Math.min(4, Math.floor(rating / 800));
  const tones = [
    "bg-brand-soft text-primary",
    "bg-info-bg text-info",
    "bg-warning-bg text-warning-foreground dark:text-warning",
    "bg-loss-bg text-loss",
    "bg-foreground text-background",
  ];
  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl",
        tones[level],
        className
      )}
    >
      <BotIcon className="size-5" aria-hidden="true" />
    </span>
  );
};
