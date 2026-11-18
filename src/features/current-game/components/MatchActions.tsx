import { ActionButton } from "./ActionButton";
import { GAME_BUTTON_STYLES } from "../constants/button-styles";
import { cn } from "@/lib/utils";
import { useSettings } from "@/features/settings/SettingsContext";

interface MatchActionsProps {
  /** Both players have moved, so the game can't be aborted any more */
  hasMoves: boolean;
  onAbort: () => void;
  onResign: () => void;
  onOfferDraw: () => void;
  /** Our draw offer is waiting for an answer */
  drawOfferSent: boolean;
  /** False after the opponent declined our offer, until we move again */
  canOfferDraw: boolean;
  onRequestTakeback: () => void;
  /** Our takeback request is waiting for an answer */
  takebackRequested: boolean;
  /**
   * The server would take a takeback request now (there's a move of ours to
   * take back, nothing pending, not just declined)
   */
  canRequestTakeback: boolean;
  /** Offline: nothing could be sent */
  disabled: boolean;
  /**
   * A tournament game: it can't be aborted (resigning is the way out, from
   * the first move) and has no takebacks
   */
  tournament?: boolean;
}

/** Abort, or Resign, Offer draw and Takeback, while the game is on. */
const MatchActions = ({
  hasMoves,
  onAbort,
  onResign,
  onOfferDraw,
  drawOfferSent,
  canOfferDraw,
  onRequestTakeback,
  takebackRequested,
  canRequestTakeback,
  disabled,
  tournament = false,
}: MatchActionsProps) => {
  const { settings } = useSettings();
  const confirmDrawResignationEnabled = settings?.confirmDrawResignationEnabled;

  if (!hasMoves && !tournament) {
    return (
      <ActionButton
        variant="abort"
        onClick={onAbort}
        label="Abort game"
        disabled={disabled}
      />
    );
  }

  // The panel is too narrow for three labelled buttons in a row
  return (
    <div className="grid grid-cols-2 gap-1">
      <ActionButton
        variant="resign"
        onClick={onResign}
        label="Resign"
        disabled={disabled}
        confirmTitle={
          confirmDrawResignationEnabled ? "Resign this game?" : undefined
        }
      />
      <ActionButton
        variant="draw"
        onClick={onOfferDraw}
        label={drawOfferSent ? "Draw offered…" : "Offer draw"}
        disabled={disabled || drawOfferSent || !canOfferDraw}
        confirmTitle={
          confirmDrawResignationEnabled ? "Offer your opponent a draw?" : undefined
        }
      />
      {!tournament && (
        <ActionButton
          variant="takeback"
          className={cn(GAME_BUTTON_STYLES.takeback, "col-span-2")}
          onClick={onRequestTakeback}
          label={takebackRequested ? "Takeback requested…" : "Ask for a takeback"}
          disabled={disabled || !canRequestTakeback}
        />
      )}
    </div>
  );
};

export default MatchActions;
