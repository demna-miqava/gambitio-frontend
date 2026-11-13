import { HandshakeIcon, X, Check } from "lucide-react";
import { ActionButton } from "./ActionButton";

interface DrawOfferProps {
  onAccept: () => void;
  onDecline: () => void;
}

/**
 * The opponent's draw offer in the side panel. Not a live region: the toast
 * with the same Accept/Decline buttons already announces it.
 */
const DrawOffer = ({ onAccept, onDecline }: DrawOfferProps) => (
  <div className="w-full rounded-xl border border-border/70 bg-muted/50 p-4">
    <div className="mb-3 flex items-center gap-2">
      <HandshakeIcon className="size-5 text-primary" aria-hidden="true" />
      <p className="text-sm font-medium text-foreground">
        Your opponent offered a draw
      </p>
    </div>
    <div className="flex gap-2">
      <ActionButton
        variant="accept"
        onClick={onAccept}
        icon={<Check className="size-4" aria-hidden="true" />}
        label="Accept"
      />
      <ActionButton
        variant="decline"
        onClick={onDecline}
        icon={<X className="size-4" aria-hidden="true" />}
        label="Decline"
      />
    </div>
  </div>
);

export default DrawOffer;
