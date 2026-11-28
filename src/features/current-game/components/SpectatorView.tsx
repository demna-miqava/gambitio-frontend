import { Link } from "react-router-dom";
import { ArrowUpDown, Eye, Microscope, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { PlayerPopover } from "@/features/profile/components/PlayerPopover";
import Clock from "@/features/game/components/Clock";
import { BoardLayout } from "@/features/game/components/BoardLayout";
import { GameLayout } from "@/features/game/components/GameLayout";
import { useChessBoardContext } from "@/features/game/contexts/ChessBoardContext";
import { useFlipBoardKey } from "@/features/game/hooks/useFlipBoardKey";
import {
  GameModeMoveControls,
  GameModeMovesList,
} from "@/features/game/modes/GameModeContext";
import type { PlayerColor } from "@/features/game/types/game.types";
import { ROUTES, getGameReviewRoute } from "@/constants/routes";
import { formatGameTime, hasTimeOdds } from "@/utils/timeControl";
import { useLiveGame } from "../contexts/LiveGameContext";
import { useSpectatorState, type SpectatorFinish } from "../hooks/useSpectatorState";
import { ConnectionBanner } from "./ConnectionBanner";
import { DisconnectedMark } from "./DisconnectedMark";
import { usePlayerConnections } from "../hooks/useOpponentConnection";
import { cn } from "@/lib/utils";
import { OpeningName } from "@/features/openings";
import { useShownLine } from "@/features/game/hooks/useShownLine";
import { useLiveSeries } from "@/features/series/hooks/useLiveSeries";
import { SeriesStrip } from "@/features/series/components/SeriesStrip";
import { WatchTogetherButton } from "@/features/study/components/WatchTogetherButton";
import { SpectatorChatProvider } from "@/features/spectator-chat/SpectatorChatContext";
import {
  SpectatorChatSection,
  SpectatorChatSheetButton,
} from "@/features/spectator-chat/components/SpectatorChat";
import { useMediaQuery } from "@/hooks/use-mobile";

/**
 * Someone else's live game, read-only: the board (white at the bottom until
 * flipped), both clocks, the moves and, at the end, the result with a link
 * to the review, and the spectators' chat (beside the board from 1024px, in
 * a sheet below). Runs inside the same providers as the player's page, with
 * LiveGameProvider in spectating mode.
 */
export const SpectatorView = () => {
  // The board's own orientation (white, from the provider), so everything
  // reading it from the context turns with the board
  const { orientation, flipBoard: flip } = useChessBoardContext();
  const { spectatorCount, finish } = useSpectatorState();

  useFlipBoardKey(flip);

  return (
    <SpectatorChatProvider>
      <GameLayout
        board={<SpectatorBoard orientation={orientation} />}
        sidebar={
          <SpectatorPanel
            orientation={orientation}
            onFlip={flip}
            spectatorCount={spectatorCount}
            finish={finish}
          />
        }
      />
    </SpectatorChatProvider>
  );
};

const SpectatorBoard = ({ orientation }: { orientation: PlayerColor }) => {
  const { boardRef, turn } = useChessBoardContext();
  const {
    game,
    clockRunning,
    gameEnded,
    ratingChanges,
    whiteTimeLeft,
    blackTimeLeft,
    connectionStatus,
  } = useLiveGame();
  const shownLine = useShownLine();
  const { statusOf } = usePlayerConnections();

  const playerInfo = (side: PlayerColor) => {
    const player = side === "white" ? game.whitePlayer : game.blackPlayer;
    // Away from the board: their connection to the game has stayed closed
    const away = player.id !== null && statusOf(player.id).away;
    const change =
      side === "white"
        ? ratingChanges?.whiteRatingChange
        : ratingChanges?.blackRatingChange;
    const newRating =
      side === "white" ? ratingChanges?.whiteNewRating : ratingChanges?.blackNewRating;
    return {
      name: player.username,
      nameSlot: (
        <PlayerPopover player={player} trigger="name">
          {player.username}
        </PlayerPopover>
      ),
      startingRating: player.rating,
      provisional: player.provisional,
      newRating: newRating ?? player.rating,
      ratingChange: gameEnded ? change : undefined,
      status: away && <DisconnectedMark />,
      avatar: (
        <PlayerPopover player={player}>
          <span className={cn("flex transition-opacity", away && "opacity-50")}>
            <PlayerAvatar
              username={player.username}
              avatarUrl={player.avatarUrl}
              size="sm"
            />
          </span>
        </PlayerPopover>
      ),
    };
  };

  // No timeout reports from spectators: the players' clients and the
  // server's sweeper already settle a flag fall
  const clock = (side: PlayerColor) => (
    <Clock
      startingTime={(side === "white" ? game.whiteTime : game.blackTime) ?? game.time}
      isActive={clockRunning && turn === side}
      gameEnded={gameEnded}
      serverTimeLeft={side === "white" ? whiteTimeLeft : blackTimeLeft}
    />
  );

  const top: PlayerColor = orientation === "white" ? "black" : "white";

  return (
    <BoardLayout
      boardRef={boardRef}
      material={{ fen: shownLine[shownLine.length - 1], bottom: orientation }}
      topPlayer={playerInfo(top)}
      bottomPlayer={playerInfo(orientation)}
      topPlayerClock={clock(top)}
      bottomPlayerClock={clock(orientation)}
    >
      <ConnectionBanner status={connectionStatus} />
    </BoardLayout>
  );
};

interface SpectatorPanelProps {
  orientation: PlayerColor;
  onFlip: () => void;
  spectatorCount: number | null;
  finish: SpectatorFinish | null;
}

const SpectatorPanel = ({
  orientation,
  onFlip,
  spectatorCount,
  finish,
}: SpectatorPanelProps) => {
  const { game, gameEnded } = useLiveGame();
  // Watchers other than you
  const others = spectatorCount === null ? null : Math.max(0, spectatorCount - 1);
  const shownLine = useShownLine();
  const { series, seriesGame } = useLiveSeries(game);
  // The chat sits in the panel only when the panel is beside the board
  const wide = useMediaQuery("(min-width: 1024px)");

  return (
    <div className="flex flex-col gap-3 lg:rounded-2xl lg:bg-card lg:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-foreground">
          <Eye className="size-3.5" aria-hidden="true" />
          Spectating
          {!gameEnded && (
            <span className="relative flex size-2" aria-hidden="true">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-rating-up opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex size-2 rounded-full bg-rating-up" />
            </span>
          )}
          {!gameEnded && <span className="sr-only">, live</span>}
        </span>
        <span className="flex items-center gap-3 text-xs text-muted-foreground">
          {!gameEnded && others !== null && (
            <span className="flex items-center gap-1">
              <Users className="size-3.5" aria-hidden="true" />
              <span className="tabular-nums">
                {others === 0
                  ? "Only you watching"
                  : `${others} other${others === 1 ? "" : "s"} watching`}
              </span>
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="tabular-nums">
              {formatGameTime(game)}
            </span>
            <span className="capitalize">
              · {game.rated === false || hasTimeOdds(game.whiteTime, game.blackTime) ? "unrated" : game.type}
            </span>
          </span>
        </span>
      </div>

      {series && <SeriesStrip series={series} seriesGame={seriesGame} />}

      <div className="rounded-xl bg-card px-1 py-1.5 lg:rounded-none lg:bg-transparent lg:p-0">
        <OpeningName fens={shownLine} className="px-1.5 pb-1 lg:px-0 lg:pb-2" />
        <GameModeMovesList />
      </div>

      <div className="space-y-3 lg:border-t lg:border-border lg:pt-3">
        <GameModeMoveControls />

        {finish && (
          <div className="space-y-1 pt-1 text-center">
            <p className="font-display text-lg text-foreground">
              {finish.title}
            </p>
            <p className="text-sm text-muted-foreground">{finish.description}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {gameEnded && (
            <Button asChild size="sm" className="flex-1">
              <Link to={getGameReviewRoute(game.id)}>
                <Microscope aria-hidden="true" />
                Review game
              </Link>
            </Button>
          )}
          {!gameEnded && (
            <WatchTogetherButton
              gameId={game.id}
              white={game.whitePlayer.username}
              black={game.blackPlayer.username}
              className="w-full"
            />
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onFlip}
            aria-label={`Flip board (now ${orientation} at the bottom)`}
            aria-keyshortcuts="F"
            title="Flip board (F)"
          >
            <ArrowUpDown aria-hidden="true" />
            Flip board
          </Button>
          <Button asChild variant="ghost" size="sm" className="flex-1">
            <Link to={ROUTES.WATCH}>
              <Eye aria-hidden="true" />
              More live games
            </Link>
          </Button>
          {!wide && <SpectatorChatSheetButton gameId={game.id} className="flex-1" />}
        </div>
      </div>

      {wide && <SpectatorChatSection gameId={game.id} className="border-t border-border pt-3" />}
    </div>
  );
};
