import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OfferPromptProps {
  /** "<b>ann</b> offers a draw." */
  children: ReactNode;
  /** Says what happens: "Accept draw", "Allow takeback" */
  acceptLabel: string;
  onAccept: () => void;
  onDecline: () => void;
  /** What's declined, for screen readers: "draw" → "Decline draw" */
  subject: string;
}

/**
 * Something the opponent asked that needs an answer (a draw offer, a
 * takeback request), in the side rail: beside the board, never over it. Not
 * a live region: the toast with the same answers already announces it.
 */
export const OfferPrompt = ({ children, acceptLabel, onAccept, onDecline, subject }: OfferPromptProps) => (
  <div className="grid gap-3 rounded-[10px] bg-primary-soft p-3 text-sm shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--primary)_30%,transparent)]">
    <p>{children}</p>
    <div className="grid auto-cols-fr grid-flow-col gap-2">
      <Button type="button" size="md" className="max-md:h-11" onClick={onAccept}>
        {acceptLabel}
      </Button>
      <Button
        type="button"
        size="md"
        variant="outline"
        className="bg-card max-md:h-11"
        onClick={onDecline}
        aria-label={`Decline ${subject}`}
      >
        Decline
      </Button>
    </div>
  </div>
);

/**
 * The opponent has left the game: who, and the time until the win can be
 * claimed, then the claim itself. Beside the board like an offer, but there
 * is nothing to decline: the game simply goes on if the player would rather
 * wait (the opponent's clock keeps running).
 */
export const AwayPrompt = ({
  children,
  onClaim,
  claiming,
}: {
  /** "<b>ann</b> lost connection. You can claim the win in 0:15." */
  children: ReactNode;
  /** Set once the win can be claimed */
  onClaim?: () => void;
  /** The claim has been sent and not yet answered */
  claiming?: boolean;
}) => (
  <div
    role="status"
    className="grid gap-3 rounded-[10px] bg-primary-soft p-3 text-sm shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--primary)_30%,transparent)]"
  >
    <p>{children}</p>
    {onClaim && (
      <Button type="button" size="md" className="max-md:h-11" onClick={onClaim} disabled={claiming}>
        Claim the win
      </Button>
    )}
  </div>
);

/** A one-line note in the side rail, e.g. "Draw offered. Waiting for ann." */
export const RailNote = ({
  children,
  action,
  className,
}: {
  children: ReactNode;
  /** A link-like button at the end of the line ("Back to the game") */
  action?: ReactNode;
  className?: string;
}) => (
  <div
    role="status"
    className={cn(
      "flex min-h-9 items-center justify-between gap-3 rounded-md bg-muted px-3 py-2 text-[13px] font-medium",
      className
    )}
  >
    <p className="min-w-0">{children}</p>
    {action}
  </div>
);
