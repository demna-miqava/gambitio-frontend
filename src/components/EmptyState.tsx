import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  /** e.g. a button that gets the user out of the empty state */
  action?: ReactNode;
  /**
   * "card" (default) draws its own dashed border, for empty lists on a page.
   * "plain" has no border, for inside a card or table that already has one.
   */
  variant?: "card" | "plain";
  /** Less padding, for sidebars and small panels */
  compact?: boolean;
  className?: string;
}

/** The one way the app says "nothing here yet": icon, title, hint, action. */
export const EmptyState = ({
  title,
  description,
  icon: Icon,
  action,
  variant = "card",
  compact = false,
  className,
}: EmptyStateProps) => (
  <div
    className={cn(
      "flex flex-col items-center gap-3 text-center",
      compact ? "px-4 py-6" : "px-6 py-10",
      variant === "card" && "rounded-xl border border-dashed border-cream-border",
      className
    )}
  >
    {Icon && (
      <span
        className={cn(
          "flex items-center justify-center rounded-full bg-brand-soft text-primary",
          compact ? "size-9" : "size-11"
        )}
      >
        <Icon className={compact ? "size-4" : "size-5"} aria-hidden="true" />
      </span>
    )}
    <div className="space-y-1">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="mx-auto max-w-xs text-sm text-muted-foreground">{description}</p>
      )}
    </div>
    {action}
  </div>
);
