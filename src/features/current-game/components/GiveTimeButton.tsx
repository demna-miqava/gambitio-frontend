import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLiveGame } from "../contexts/LiveGameContext";
import { GIVE_TIME_SECONDS } from "../constants/giveTime";

/**
 * "+" beside the opponent's clock: each click gives them GIVE_TIME_SECONDS.
 * Only while the game is on; disabled while disconnected. Not in a
 * tournament game, where a clock is part of the score.
 */
export const GiveTimeButton = () => {
  const { giveTime, gameEnded, spectating, isConnected, opponent, game } = useLiveGame();
  if (gameEnded || spectating || game.tournamentId != null) return null;

  const label = `Give ${opponent.username} ${GIVE_TIME_SECONDS} seconds`;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={giveTime}
          disabled={!isConnected}
          aria-label={label}
          className="size-8 text-muted-foreground hover:text-foreground sm:size-9"
        >
          <Plus aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={4}>
        +{GIVE_TIME_SECONDS} seconds
      </TooltipContent>
    </Tooltip>
  );
};
