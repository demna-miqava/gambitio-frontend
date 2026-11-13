import {
  GameModeMoveControls,
  GameModeMovesList,
} from "@/features/game/modes/GameModeContext";
import DrawOffer from "./DrawOffer";
import { useMatchmaking } from "@/features/matchmaking/hooks/useMatchmaking";
import MatchActions from "./MatchActions";
import PostGameActions from "./PostGameActions";
import GameResultDialog from "./GameResultDialog";
import { TypeMoveInput } from "./TypeMoveInput";
import { useLiveGame } from "../contexts/LiveGameContext";
import { useDrawOffer } from "../hooks/useDrawOffer";
import { useGameActions } from "../hooks/useGameActions";
import { useRematch } from "../hooks/useRematch";
import { formatTimeControl, getTimeControlIcon } from "@/utils/timeControl";
import { OpeningName } from "@/features/openings";
import { useShownLine } from "@/features/game/hooks/useShownLine";

export const MovesContainer = () => {
  const { game, gameEnded, isConnected } = useLiveGame();
  // One matchmaking connection and one rematch state for the whole page:
  // the result dialog and this panel show the same buttons
  const search = useMatchmaking({
    time: game.time,
    increment: game.increment,
  });
  const {
    openGameResultDialog,
    setOpenGameResultDialog,
    finish,
    onResign,
    onAbort,
    hasMoves,
  } = useGameActions();
  const rematch = useRematch({ setOpenGameResultDialog });
  const {
    showDrawOffer,
    drawOfferSent,
    showOpponentDeclined,
    offerDraw,
    acceptDraw,
    declineDraw,
  } = useDrawOffer();
  const TypeIcon = getTimeControlIcon(game.type);
  const shownLine = useShownLine();

  return (
    <div className="flex flex-col gap-3 lg:rounded-2xl lg:border lg:border-border/70 lg:bg-card lg:p-4">
      <div className="hidden items-center justify-between lg:flex">
        <h2 className="text-sm font-semibold text-foreground">Moves</h2>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {TypeIcon && <TypeIcon className="size-3.5" aria-hidden="true" />}
          <span className="tabular-nums">
            {formatTimeControl(game.time, game.increment)}
          </span>
          <span className="capitalize">· {game.type}</span>
        </span>
      </div>

      {/* Phones: moves strip sits right under the board */}
      <div className="rounded-xl border border-border/70 bg-card px-1 py-1.5 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0">
        <OpeningName fens={shownLine} className="px-1.5 pb-1 lg:px-0 lg:pb-2" />
        <GameModeMovesList />
      </div>

      {showDrawOffer && <DrawOffer onAccept={acceptDraw} onDecline={declineDraw} />}
      {showOpponentDeclined && (
        <div
          className="w-full rounded-xl border border-border/70 bg-muted/50 px-4 py-3"
          role="status"
        >
          <p className="text-sm text-muted-foreground">
            Your opponent declined the draw.
          </p>
        </div>
      )}

      <div className="space-y-2 lg:border-t lg:border-border/70 lg:pt-3">
        <GameModeMoveControls />
        <TypeMoveInput />
        {gameEnded ? (
          <div className="space-y-3 pt-1">
            {finish && (
              <div className="text-center">
                <p className="font-display text-lg font-semibold text-foreground">
                  {finish.title}
                </p>
                {finish.description && (
                  <p className="text-sm text-muted-foreground">{finish.description}</p>
                )}
              </div>
            )}
            <PostGameActions rematch={rematch} search={search} gameId={game.id} />
          </div>
        ) : (
          <MatchActions
            hasMoves={hasMoves}
            onAbort={onAbort}
            onResign={onResign}
            onOfferDraw={offerDraw}
            drawOfferSent={drawOfferSent}
            disabled={!isConnected}
          />
        )}
      </div>

      <GameResultDialog
        open={openGameResultDialog}
        onOpenChange={setOpenGameResultDialog}
        title={finish?.title}
        description={finish?.description}
      >
        <PostGameActions rematch={rematch} search={search} gameId={game.id} />
      </GameResultDialog>
    </div>
  );
};
