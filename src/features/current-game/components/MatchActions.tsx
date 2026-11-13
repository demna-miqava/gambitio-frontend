import { Flag, HandshakeIcon, X } from "lucide-react";
import { ActionButton } from "./ActionButton";
import { useSettings } from "@/features/settings/SettingsContext";

interface MatchActionsProps {
  /** Both players have moved, so the game can't be aborted any more */
  hasMoves: boolean;
  onAbort: () => void;
  onResign: () => void;
  onOfferDraw: () => void;
  /** Our draw offer is waiting for an answer */
  drawOfferSent: boolean;
  /** Offline: nothing could be sent */
  disabled: boolean;
}

/** Abort, or Resign and Offer draw, while the game is on. */
const MatchActions = ({
  hasMoves,
  onAbort,
  onResign,
  onOfferDraw,
  drawOfferSent,
  disabled,
}: MatchActionsProps) => {
  const { settings } = useSettings();
  const confirmDrawResignationEnabled = settings?.confirmDrawResignationEnabled;

  if (!hasMoves) {
    return (
      <ActionButton
        variant="abort"
        onClick={onAbort}
        icon={<X className="size-4" aria-hidden="true" />}
        label="Abort game"
        disabled={disabled}
      />
    );
  }

  return (
    <div className="flex gap-2">
      <ActionButton
        variant="resign"
        onClick={onResign}
        icon={<Flag className="size-4" aria-hidden="true" />}
        label="Resign"
        disabled={disabled}
        confirmTitle={
          confirmDrawResignationEnabled ? "Resign this game?" : undefined
        }
      />
      <ActionButton
        variant="draw"
        onClick={onOfferDraw}
        icon={<HandshakeIcon className="size-4" aria-hidden="true" />}
        label={drawOfferSent ? "Draw offered…" : "Offer draw"}
        disabled={disabled || drawOfferSent}
        confirmTitle={
          confirmDrawResignationEnabled ? "Offer your opponent a draw?" : undefined
        }
      />
    </div>
  );
};

export default MatchActions;
