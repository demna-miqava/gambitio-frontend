import { useState, type ReactNode } from "react";
import { Flag, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/features/settings/SettingsContext";
import { cn } from "@/lib/utils";
import { BAR_ITEM } from "./barItem";

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
  /** A timed match game: every game counts, so it can't be aborted either (takebacks are fine) */
  noAbort?: boolean;
}

/**
 * A quiet button of the action row: icon beside its label on the rail, icon
 * over a short name in the phone's bottom bar (`short`, when the label is
 * too long for a sixth of a phone's width).
 */
const Action = ({
  icon,
  short,
  children,
  ...props
}: { icon: ReactNode; short?: string } & React.ComponentProps<typeof Button>) => (
  <Button
    type="button"
    variant="ghost"
    size="md"
    className={cn("min-w-0 gap-1.5 px-2 text-[13px] font-semibold", BAR_ITEM)}
    {...props}
  >
    <span className="contents" aria-hidden="true">
      {icon}
    </span>
    <span className={cn("truncate", short && "max-md:hidden")}>{children}</span>
    {short && <span className="md:hidden">{short}</span>}
  </Button>
);

/**
 * Takeback, Offer draw and Resign while the game is on, as one row of quiet
 * buttons (in the phone's bottom bar: three of its evenly spaced buttons). Until both players have moved, Resign is Abort and there is no
 * draw to offer. Resigning (and, with the same setting, offering a draw)
 * asks first, in the row's own place, so nothing covers the board.
 */
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
  noAbort = false,
}: MatchActionsProps) => {
  const { settings } = useSettings();
  const confirmFirst = settings?.confirmDrawResignationEnabled ?? false;
  const [confirming, setConfirming] = useState<"resign" | "draw" | null>(null);
  const canAbort = !hasMoves && !tournament && !noAbort;

  if (confirming) {
    const resigning = confirming === "resign";
    const confirm = () => {
      setConfirming(null);
      if (resigning) onResign();
      else onOfferDraw();
    };
    return (
      <div
        role="group"
        aria-label={resigning ? "Confirm resignation" : "Confirm draw offer"}
        // On phones the question has the whole bar: the other buttons step aside (index.css)
        data-confirming
        className="flex min-h-10 items-center gap-2 pl-2 max-md:min-h-[52px] max-md:flex-1 max-md:px-2"
      >
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">
          {resigning ? "Resign this game?" : "Offer a draw?"}
        </span>
        <Button
          type="button"
          size="sm"
          variant={resigning ? "destructive" : "default"}
          className="max-md:h-11"
          disabled={disabled}
          onClick={confirm}
        >
          {resigning ? "Resign" : "Offer draw"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="max-md:h-11"
          // The button that was pressed is gone: keep the keyboard in the row
          autoFocus
          onClick={() => setConfirming(null)}
        >
          {resigning ? "Keep playing" : "Cancel"}
        </Button>
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label="Game actions"
      className={cn(
        // Phones: as many shares of the bar as it has buttons
        "grid gap-1 max-md:flex max-md:gap-0",
        tournament ? "grid-cols-2 max-md:flex-[2]" : "grid-cols-3 max-md:flex-[3]"
      )}
    >
      {!tournament && (
        <Action
          icon={<Undo2 />}
          onClick={onRequestTakeback}
          disabled={disabled || !canRequestTakeback}
          aria-label={takebackRequested ? "Takeback requested" : "Ask for a takeback"}
        >
          Takeback
        </Action>
      )}
      <Action
        icon={<span className="text-base leading-none font-bold max-md:text-[19px] max-md:leading-[22px]">½</span>}
        short="Draw"
        onClick={confirmFirst ? () => setConfirming("draw") : onOfferDraw}
        // No draw before both sides have moved: the game is aborted instead
        disabled={disabled || drawOfferSent || !canOfferDraw || canAbort}
      >
        {drawOfferSent ? "Draw offered" : "Offer draw"}
      </Action>
      {canAbort ? (
        <Action icon={<X />} onClick={onAbort} disabled={disabled} aria-label="Abort game">
          Abort
        </Action>
      ) : (
        <Action
          icon={<Flag />}
          onClick={confirmFirst ? () => setConfirming("resign") : onResign}
          disabled={disabled}
        >
          Resign
        </Action>
      )}
    </div>
  );
};

export default MatchActions;
