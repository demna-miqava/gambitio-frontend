import {
  GameModeMoveControls,
  GameModeMovesList,
} from "@/features/game/modes/GameModeContext";
import { HandshakeIcon, Undo2 } from "lucide-react";
import { OfferPrompt, OfferStatus } from "./OfferPrompt";
import { useMatchmaking } from "@/features/matchmaking/hooks/useMatchmaking";
import MatchActions from "./MatchActions";
import PostGameActions from "./PostGameActions";
import GameResultDialog from "./GameResultDialog";
import { TypeMoveInput } from "./TypeMoveInput";
import { useLiveGame } from "../contexts/LiveGameContext";
import { useDrawOffer } from "../hooks/useDrawOffer";
import { useTakeback } from "../hooks/useTakeback";
import { useGameActions } from "../hooks/useGameActions";
import { useRematch } from "../hooks/useRematch";
import { formatTimeControl } from "@/utils/timeControl";
import { OpeningName } from "@/features/openings";
import { useShownLine } from "@/features/game/hooks/useShownLine";
import { useLiveSeries } from "@/features/series/hooks/useLiveSeries";
import { SeriesStrip } from "@/features/series/components/SeriesStrip";
import { useUser } from "@/hooks/useUser";
import { useChessBoardContext } from "@/features/game/contexts/ChessBoardContext";
import { FlipBoardButton } from "@/features/game/components/FlipBoardButton";
import { useFlipBoardKey } from "@/features/game/hooks/useFlipBoardKey";

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
  const takeback = useTakeback();
  const shownLine = useShownLine();
  const { id: viewerId } = useUser();
  // A series game shows the series score; the rematch becomes "Next game"
  const { series, seriesGame, rematchGameId } = useLiveSeries(game);
  const { orientation, flipBoard } = useChessBoardContext();
  useFlipBoardKey(flipBoard);

  return (
    <div className="flex flex-col gap-3 lg:rounded-2xl lg:border lg:border-border/70 lg:bg-card lg:p-4">
      <div className="hidden items-center justify-between lg:flex">
        <h2 className="text-sm font-semibold text-foreground">Moves</h2>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="tabular-nums">
            {formatTimeControl(game.time, game.increment)}
          </span>
          <span className="capitalize">· {game.type}</span>
        </span>
      </div>

      {series && <SeriesStrip series={series} seriesGame={seriesGame} viewerId={viewerId} />}

      {/* Phones: moves strip sits right under the board */}
      <div className="rounded-xl border border-border/70 bg-card px-1 py-1.5 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0">
        <OpeningName fens={shownLine} className="px-1.5 pb-1 lg:px-0 lg:pb-2" />
        <GameModeMovesList />
      </div>

      {showDrawOffer && (
        <OfferPrompt
          icon={<HandshakeIcon className="size-5 text-primary" aria-hidden="true" />}
          message="Your opponent offered a draw"
          subject="draw"
          onAccept={acceptDraw}
          onDecline={declineDraw}
        />
      )}
      {showOpponentDeclined && <OfferStatus>Your opponent declined the draw.</OfferStatus>}
      {takeback.showTakebackRequest && (
        <OfferPrompt
          icon={<Undo2 className="size-5 text-primary" aria-hidden="true" />}
          message="Your opponent asked to take back their last move"
          subject="takeback"
          onAccept={takeback.acceptTakeback}
          onDecline={takeback.declineTakeback}
        />
      )}
      {takeback.showTakebackDeclined && (
        <OfferStatus>
          Your opponent declined the takeback. You can ask again after the next move.
        </OfferStatus>
      )}

      <div className="space-y-2 lg:border-t lg:border-border/70 lg:pt-3">
        <div className="flex gap-1.5">
          <div className="min-w-0 flex-1">
            <GameModeMoveControls />
          </div>
          <FlipBoardButton onFlip={flipBoard} orientation={orientation} />
        </div>
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
            <PostGameActions
              rematch={rematch}
              search={search}
              gameId={game.id}
              series={series}
              viewerId={viewerId}
              rematchGameId={rematchGameId}
            />
          </div>
        ) : (
          <MatchActions
            hasMoves={hasMoves}
            onAbort={onAbort}
            onResign={onResign}
            onOfferDraw={offerDraw}
            drawOfferSent={drawOfferSent}
            onRequestTakeback={takeback.requestTakeback}
            takebackRequested={takeback.takebackRequested}
            canRequestTakeback={takeback.canRequestTakeback}
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
        <PostGameActions
          rematch={rematch}
          search={search}
          gameId={game.id}
          series={series}
          viewerId={viewerId}
          rematchGameId={rematchGameId}
        />
      </GameResultDialog>
    </div>
  );
};
