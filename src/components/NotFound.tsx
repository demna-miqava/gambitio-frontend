import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { ROUTES } from "@/constants/routes";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

interface NotFoundProps {
  title?: string;
  description?: string;
  /** Replaces the default "Back to home" button, e.g. a Retry button */
  action?: ReactNode;
  /** The big label above the title. Defaults to "404" */
  code?: string;
}

/**
 * Shown for unknown routes, things (profiles, games) that don't exist, and
 * pages that couldn't load. Same title style as PageHeader, centred.
 */
export const NotFound = ({
  title = "Page not found",
  description = "The page you're looking for doesn't exist or has moved.",
  action,
  code = "404",
}: NotFoundProps) => {
  useDocumentTitle(title);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 p-6 text-center">
      {code && (
        <p
          aria-hidden="true"
          className="font-display text-6xl font-semibold text-muted-foreground/60 tabular-nums"
        >
          {code}
        </p>
      )}
      <div className="space-y-1.5">
        <h1 className="font-display text-3xl font-semibold text-foreground sm:text-[2.1rem]">
          {title}
        </h1>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground sm:text-[0.95rem]">
          {description}
        </p>
      </div>
      {action ?? (
        <Button asChild>
          <Link to={ROUTES.HOME}>Back to home</Link>
        </Button>
      )}
    </div>
  );
};
