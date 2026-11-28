import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface UpNextRowProps extends Omit<ComponentProps<"li">, "title"> {
  /** What the 44px tile holds: an icon */
  icon: ReactNode;
  /** The tile in the accent's tint: the thing to do first */
  accent?: boolean;
  title: ReactNode;
  /** One line (it wraps on phones) */
  description: ReactNode;
  /** Buttons on the right (under the text on phones) */
  actions: ReactNode;
}

/**
 * One thing waiting on the player, as a row of Home's "Up next" list: an
 * icon tile, a title and a line about it, and the buttons that act on it.
 * The list (a <ul>) and its heading are Home's; when no row renders, Home
 * hides both.
 */
export const UpNextRow = ({
  icon,
  accent = false,
  title,
  description,
  actions,
  className,
  ...props
}: UpNextRowProps) => (
  <li
    className={cn(
      "flex flex-wrap items-center gap-x-4 gap-y-2.5 border-border px-4 py-3.5 not-first:border-t sm:flex-nowrap sm:px-5",
      className
    )}
    {...props}
  >
    <span
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-[10px]",
        accent
          ? "bg-primary-soft text-primary"
          : "bg-muted text-muted-foreground shadow-[inset_0_0_0_1px_var(--border)]"
      )}
    >
      {icon}
    </span>
    <div className="min-w-0 flex-1 basis-[calc(100%-3.75rem)] leading-[1.35] sm:basis-auto">
      <p className="font-semibold">{title}</p>
      <p className="text-[13px] text-muted-foreground sm:truncate">{description}</p>
    </div>
    <div className="flex w-full gap-2 pl-15 sm:w-auto sm:pl-0 [&>*]:max-sm:flex-1">{actions}</div>
  </li>
);
