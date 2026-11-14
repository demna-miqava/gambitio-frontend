import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** A short line above the title, in plain text */
  eyebrow?: ReactNode;
  actions?: ReactNode;
  className?: string;
  /** Use h2 when the page already has an h1 (e.g. inside a layout) */
  as?: "h1" | "h2";
}

/** One title style for every page. */
export const PageHeader = ({
  title,
  description,
  eyebrow,
  actions,
  className,
  as: Heading = "h1",
}: PageHeaderProps) => (
  <header
    className={cn(
      "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
      className
    )}
  >
    <div className="min-w-0 space-y-1.5">
      {eyebrow && (
        <p className="text-sm text-muted-foreground">{eyebrow}</p>
      )}
      <Heading className="font-display text-3xl leading-tight text-foreground sm:text-4xl">
        {title}
      </Heading>
      {description && (
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          {description}
        </p>
      )}
    </div>
    {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
  </header>
);

/** Section heading with an optional link/action on the right. */
export const SectionHeader = ({
  title,
  action,
  className,
}: {
  title: ReactNode;
  action?: ReactNode;
  className?: string;
}) => (
  <div className={cn("flex items-center justify-between gap-4", className)}>
    <h2 className="font-display text-xl text-foreground">
      {title}
    </h2>
    {action}
  </div>
);
