import type { ReactNode } from "react";
import { X, Check } from "lucide-react";
import { ActionButton } from "./ActionButton";

interface OfferPromptProps {
  icon: ReactNode;
  /** "Your opponent offered a draw" */
  message: string;
  /** What's accepted or declined, for screen readers: "draw" → "Accept draw" */
  subject: string;
  onAccept: () => void;
  onDecline: () => void;
}

/**
 * The opponent's draw offer or takeback request in the side panel. Not a
 * live region: the toast with the same Accept/Decline buttons already
 * announces it.
 */
export const OfferPrompt = ({ icon, message, subject, onAccept, onDecline }: OfferPromptProps) => (
  <div className="w-full rounded-xl border border-border/70 bg-muted/50 p-4">
    <div className="mb-3 flex items-center gap-2">
      {icon}
      <p className="text-sm font-medium text-foreground">{message}</p>
    </div>
    <div className="flex gap-2">
      <ActionButton
        variant="accept"
        onClick={onAccept}
        icon={<Check className="size-4" aria-hidden="true" />}
        label="Accept"
        ariaLabel={`Accept ${subject}`}
      />
      <ActionButton
        variant="decline"
        onClick={onDecline}
        icon={<X className="size-4" aria-hidden="true" />}
        label="Decline"
        ariaLabel={`Decline ${subject}`}
      />
    </div>
  </div>
);

/** A one-line note in the side panel, e.g. "Your opponent declined the draw." */
export const OfferStatus = ({ children }: { children: ReactNode }) => (
  <div className="w-full rounded-xl border border-border/70 bg-muted/50 px-4 py-3" role="status">
    <p className="text-sm text-muted-foreground">{children}</p>
  </div>
);
