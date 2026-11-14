import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";
import type { Bot } from "../constants/bots";
import { BotAvatar } from "./BotAvatar";

/** One opponent in BotSelector's radio group (arrow keys move between them). */
export const BotCard = ({ bot }: { bot: Bot }) => {
  const descriptionId = `bot-${bot.id}-description`;
  return (
    <RadioGroupPrimitive.Item
      value={bot.id}
      aria-describedby={descriptionId}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl bg-card p-3 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "border-border hover:border-primary/40 hover:bg-accent/60",
        "data-[state=checked]:border-primary data-[state=checked]:bg-brand-soft data-[state=checked]:hover:bg-brand-soft"
      )}
    >
      <BotAvatar rating={bot.rating} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate font-medium text-foreground">{bot.name}</span>
          <span className="shrink-0 text-sm font-medium tabular-nums text-foreground/80">
            <span className="sr-only">rated </span>
            {bot.rating}
          </span>
        </span>
        <span id={descriptionId} className="line-clamp-2 text-xs text-muted-foreground">
          {bot.description}
        </span>
      </span>
    </RadioGroupPrimitive.Item>
  );
};
