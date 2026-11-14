import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { REPERTOIRE_VIEWS, viewSearch, type RepertoireView } from "../utils/view";

/**
 * Lines / Practice / Your games. Links rather than tabs: practice is a
 * board page of its own, and each view has its own URL.
 */
export const RepertoireNav = ({ current, className }: { current: RepertoireView; className?: string }) => (
  <nav aria-label="Repertoire" className={className}>
    <ul className="inline-flex h-10 w-full items-center rounded-lg bg-cream-soft p-1 sm:w-fit">
      {REPERTOIRE_VIEWS.map((view) => (
        <li key={view.value} className="h-full flex-1 sm:flex-none">
          <Link
            to={`${ROUTES.REPERTOIRE}${viewSearch(view.value)}`}
            aria-current={current === view.value ? "page" : undefined}
            className={cn(
              "inline-flex h-full w-full items-center justify-center rounded-md px-3 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors",
              "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              current === view.value && "bg-background text-foreground shadow-sm dark:text-cream"
            )}
          >
            {view.label}
          </Link>
        </li>
      ))}
    </ul>
  </nav>
);
