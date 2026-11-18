import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface MoreOptionsSectionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The choices made inside that aren't the defaults (extraOptionsSummary), shown while it is closed */
  summary: string[];
  children: ReactNode;
}

/**
 * The options most challenges leave alone (time odds, the match format, the
 * starting position), folded away under one row so the form opens short.
 * Closed, the row says which of them are set, so nothing that changes the
 * challenge is ever out of sight.
 */
export const MoreOptionsSection = ({ open, onOpenChange, summary, children }: MoreOptionsSectionProps) => (
  <Collapsible open={open} onOpenChange={onOpenChange}>
    <CollapsibleTrigger className="group flex min-h-11 w-full items-center justify-between gap-3 rounded-lg text-left text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
      <span className="shrink-0">More options</span>
      <span className="flex min-w-0 items-center gap-2">
        {!open && summary.length > 0 && (
          <span className="truncate text-foreground">{summary.join(" · ")}</span>
        )}
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 transition-transform duration-300 ease-disclosure group-data-[state=open]:rotate-180"
        />
      </span>
    </CollapsibleTrigger>
    <CollapsibleContent>
      <div className="flex flex-col gap-6 pt-3">{children}</div>
    </CollapsibleContent>
  </Collapsible>
);
