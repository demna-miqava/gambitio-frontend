import { GameModeMoveControls } from "@/features/game/modes/GameModeContext";
import { MovesList } from "@/features/game/components/MovesList";
import { AwayPrompt, OfferPrompt, RailNote } from "./OfferPrompt";
import { useOpponentConnection } from "../hooks/useOpponentConnection";
import { formatCountdown } from "../utils/connection";
import { useMatchmaking } from "@/features/matchmaking/hooks/useMatchmaking";
import MatchActions from "./MatchActions";
import PostGameActions from "./PostGameActions";
import { GameOutcome } from "./GameOutcome";
import { TypeMoveInput } from "./TypeMoveInput";
import { useLiveGame } from "../contexts/LiveGameContext";
import { useDrawOffer } from "../hooks/useDrawOffer";
import { useTakeback } from "../hooks/useTakeback";
import { useGameActions } from "../hooks/useGameActions";
import { useRematch } from "../hooks/useRematch";
import { formatCompactGameTime, formatGameTime, formatTimeControl, hasTimeOdds } from "@/utils/timeControl";
import { useOpening } from "@/features/openings";
import { useShownLine } from "@/features/game/hooks/useShownLine";
import { useLiveSeries } from "@/features/series/hooks/useLiveSeries";
import { SeriesStrip } from "@/features/series/components/SeriesStrip";
import { useUser } from "@/hooks/useUser";
import { useChessBoardContext } from "@/features/game/contexts/ChessBoardContext";
import { useGameNavigation } from "@/features/game/contexts/GameNavigationContext";
import { FlipBoardButton } from "@/features/game/components/FlipBoardButton";
import { useFlipBoardKey } from "@/features/game/hooks/useFlipBoardKey";
import { SPEED_ICON, SPEED_LABEL } from "@/features/game/constants/speed";
import { SIDE_BY_SIDE_QUERY } from "@/features/game/constants/layout";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BAR_ITEM } from "./barItem";
import { TopBarSlot, useGameShell } from "@/context/GameShellContext";
import { useIsMobile, useMediaQuery } from "@/hooks/use-mobile";
import { useGameChat } from "@/features/game-chat/GameChatContext";
import { ChatMuteButton, ChatPanel } from "@/features/game-chat/components/ChatPanel";
import { ChatSheetButton } from "@/features/game-chat/components/ChatSheetButton";
import { GameSettingsButton } from "@/features/game-tools/GameSettingsButton";
import { FocusModeButton } from "@/features/game-tools/FocusModeButton";
import { useFocusMode } from "@/features/game-tools/useFocusMode";
import { useTournament } from "@/features/tournaments/hooks/useTournament";
import { TournamentPostGame, TournamentStrip } from "@/features/tournaments/components/TournamentGamePanel";

/**
 * The live game's side rail, one panel from top to bottom: what is being
 * played (speed, time control, kind of game, the opening) with the board's
 * tools, the result once the game is over, the moves, whatever needs an
 * answer (a draw offer, a takeback request) with the short notes about the
 * player's own offers and an opponent who has left (with the win to claim
 * once they have stayed away), the move navigation and game actions, and the chat.
 *
 * Beside the board (GameLayout's `rail`) the panel is as tall as the board
 * column: the moves take the room that is left and scroll inside. Under the
 * board on portrait tablets it is a panel of its own height, with the chat
 * in a sheet. On phones it has no box at all: its parts are laid out around
 * the board, which sits in the middle of the screen (the moves above it,
 * prompts under it, and along the bottom edge one bar with the game's
 * actions, chat and move navigation), and the board's tools sit in the top
 * bar with the kind of game.
 *
 * In focus mode only the prompts and the game actions are left; beside the
 * board the whole rail steps aside (see CurrentGame).
 */
export const LiveGameRail = () => {
  const { game, gameEnded, isConnected, opponent } = useLiveGame();
  // One matchmaking connection and one rematch state for the whole page
  const search = useMatchmaking({
    time: game.time,
    increment: game.increment,
    // "New 3+2" after a casual game looks for another casual one
    rated: game.rated !== false,
  });
  const { finish, onResign, onAbort, hasMoves } = useGameActions();
  const rematch = useRematch();
  const {
    showDrawOffer,
    drawOfferSent,
    canOfferDraw,
    showOpponentDeclined,
    offerDraw,
    acceptDraw,
    declineDraw,
  } = useDrawOffer();
  const takeback = useTakeback();
  // The opponent away from the board, and the win that can be claimed for it
  const away = useOpponentConnection({ bothMoved: hasMoves });
  const shownLine = useShownLine();
  const opening = useOpening(shownLine);
  const { id: viewerId } = useUser();
  // A series game shows the series score; the rematch becomes "Next game"
  const { series, seriesGame, rematchGameId } = useLiveSeries(game);
  // A tournament game: the tournament pairs the next one, so there is no
  // rematch, takeback or abort. Keeping its lobby connected from here is
  // what lets the next game be paired without going back to the lobby.
  const tournamentId = game.tournamentId ?? null;
  const tournament = useTournament(tournamentId);
  const { orientation, flipBoard, ply } = useChessBoardContext();
  const { isViewingHistory, currentIndex, goToLastMove, goToPreviousMove, goToNextMove, isAtStart, isAtEnd } =
    useGameNavigation();
  useFlipBoardKey(flipBoard);

  const isMobile = useIsMobile();
  // Beside the board the rail has the height for the chat at its foot
  const sideBySide = useMediaQuery(SIDE_BY_SIDE_QUERY);
  const chat = useGameChat();
  const focus = useFocusMode(!gameEnded);
  const dockChat = sideBySide && chat.available && !focus.active;
  const { setCardDock } = useGameShell();

  const hasOdds = hasTimeOdds(game.whiteTime, game.blackTime);
  const kind = tournamentId !== null ? "Tournament" : game.rated === false || hasOdds ? "Casual" : "Rated";
  const SpeedIcon = SPEED_ICON[game.type];
  const openingLine = opening ? `${opening.eco} · ${opening.name}` : null;
  const timeControl = formatTimeControl(game.time, game.increment);
  const startPly = game.startPly ?? 0;

  const format = (
    <>
      <span className="flex items-center gap-2 font-semibold whitespace-nowrap">
        <SpeedIcon className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} aria-hidden="true" />
        <span title={hasOdds ? formatGameTime(game) : undefined}>
          {SPEED_LABEL[game.type]} <span className="tabular-nums">{formatCompactGameTime(game)}</span>
        </span>
        <span className="rounded-[4px] bg-muted px-[7px] py-px text-xs font-semibold text-muted-foreground shadow-[inset_0_0_0_1px_var(--border)]">
          {kind}
        </span>
      </span>
      <span className="truncate text-[13px] text-faint" title={openingLine ?? undefined}>
        {focus.active ? (
          "Focus mode"
        ) : openingLine ? (
          <>
            <span className="sr-only">Opening: </span>
            {openingLine}
          </>
        ) : game.opening ? (
          `${game.opening.eco} · ${game.opening.name}`
        ) : ply === 0 ? (
          "Starting position"
        ) : (
          // The table is still loading, or the line has left the book early
          " "
        )}
      </span>
    </>
  );

  const tools = (
    <div className="flex shrink-0 items-center gap-0.5">
      {/* On phones chat is a button of the bottom bar */}
      {!dockChat && !focus.active && !isMobile && <ChatSheetButton />}
      <FlipBoardButton onFlip={flipBoard} orientation={orientation} className="size-9" />
      {focus.canToggle && <FocusModeButton active={focus.active} onToggle={focus.toggle} />}
      <GameSettingsButton withFocusMode />
    </div>
  );

  const postGame =
    tournamentId !== null ? (
      <TournamentPostGame
        tournamentId={tournamentId}
        gameId={game.id}
        state={tournament.state}
        isConnected={tournament.isConnected}
      />
    ) : (
      <PostGameActions
        rematch={rematch}
        search={search}
        gameId={game.id}
        series={series}
        viewerId={viewerId}
        rematchGameId={rematchGameId}
        opponentName={opponent.username}
        timeControl={hasOdds ? undefined : timeControl}
        aborted={finish?.kind === "aborted"}
      />
    );

  // How far into the game the board is while an earlier position is shown
  const shownMove = Math.ceil((startPly + currentIndex) / 2);
  const lastMove = Math.ceil((startPly + ply) / 2);

  return (
    <div className="text-[15px] leading-[1.45] max-md:contents md:relative md:flex md:h-full md:min-h-0 md:flex-col md:overflow-hidden md:rounded-[10px] md:border md:border-border md:bg-card">
      {/* Beside the board, a player's card opens here, over the top of the
          rail (PlayerPopover), and the board stays clear */}
      {sideBySide && !focus.active && (
        <div ref={setCardDock} className="absolute inset-x-0 top-0 z-20 max-h-full empty:hidden" />
      )}
      {isMobile && (
        <TopBarSlot>
          <div data-topbar-title className="mr-auto grid min-w-0 content-center text-sm leading-[1.3]">
            {format}
          </div>
          {tools}
        </TopBarSlot>
      )}
      <header className="hidden items-center gap-0.5 border-b border-border py-3 pr-2 pl-5 md:flex">
        <h2 className="grid min-h-[38px] min-w-0 flex-1 content-center text-[15px] leading-[1.35] font-normal">
          {format}
        </h2>
        {tools}
      </header>

      {/* Not a live region: the result is read out once, through the game's
          announcer (useGameActions), and the buttons under it are not news */}
      {gameEnded && <GameOutcome finish={finish}>{postGame}</GameOutcome>}

      {!focus.active && (series || tournamentId !== null) && (
        <div className="space-y-2 px-3 pt-2 max-md:order-6">
          {series && <SeriesStrip series={series} seriesGame={seriesGame} viewerId={viewerId} />}
          {tournamentId !== null && (
            <TournamentStrip tournamentId={tournamentId} state={tournament.state} />
          )}
        </div>
      )}

      {!focus.active && (
        <div
          className={cn(
            "px-3 py-2 max-md:order-2 max-md:flex max-md:h-10 max-md:shrink-0 max-md:items-center max-md:px-2 max-md:py-0 max-md:[&_p]:px-2 max-md:[&_p]:py-0 max-md:[&_p]:text-left",
            sideBySide && "min-h-0 flex-1"
          )}
        >
          <div className="min-w-0 max-md:flex-1 md:h-full">
            <MovesList fill={sideBySide} />
          </div>
        </div>
      )}

      <div className="grid gap-2 px-3 empty:hidden max-md:order-6 max-md:mt-2 md:pb-2">
        {showDrawOffer && (
          <OfferPrompt
            acceptLabel="Accept draw"
            subject="draw"
            onAccept={acceptDraw}
            onDecline={declineDraw}
          >
            <b className="font-semibold">{opponent.username}</b> offers a draw.
          </OfferPrompt>
        )}
        {takeback.showTakebackRequest && (
          <OfferPrompt
            acceptLabel="Allow takeback"
            subject="takeback"
            onAccept={takeback.acceptTakeback}
            onDecline={takeback.declineTakeback}
          >
            <b className="font-semibold">{opponent.username}</b> {takeback.takebackRequestDetail}
          </OfferPrompt>
        )}
        {away.opponentAway && !gameEnded && (
          <AwayPrompt
            onClaim={away.claimInSeconds === 0 ? away.claimWin : undefined}
            claiming={away.claiming}
          >
            <b className="font-semibold">{opponent.username}</b> lost connection.{" "}
            {away.claimInSeconds === null ? (
              // Before both sides have moved no clock runs, and nothing can be claimed
              hasMoves && "Their clock keeps running."
            ) : away.claimInSeconds === 0 ? (
              "You can claim the win, or wait for them."
            ) : (
              <>
                You can claim the win in{" "}
                <span className="tabular-nums">{formatCountdown(away.claimInSeconds)}</span>.
              </>
            )}
          </AwayPrompt>
        )}
        {isViewingHistory && !gameEnded ? (
          <RailNote
            action={
              <button
                type="button"
                onClick={goToLastMove}
                className="relative touch-target shrink-0 font-semibold text-primary underline-offset-[3px] outline-none hover:underline focus-visible:underline"
              >
                Back to the game
              </button>
            }
          >
            {currentIndex === 0 ? (
              "Start of the game."
            ) : (
              <span className="tabular-nums">
                Move {shownMove} of {lastMove}.
              </span>
            )}
          </RailNote>
        ) : drawOfferSent ? (
          <RailNote>Draw offered. Waiting for {opponent.username}.</RailNote>
        ) : takeback.takebackRequested ? (
          <RailNote>Takeback requested. Waiting for {opponent.username}.</RailNote>
        ) : showOpponentDeclined ? (
          <RailNote>{opponent.username} declined the draw.</RailNote>
        ) : takeback.showTakebackDeclined ? (
          <RailNote>
            {opponent.username} declined the takeback. You can ask again after the next move.
          </RailNote>
        ) : null}
      </div>

      {/* Phones: one bar along the bottom edge, its buttons evenly spaced,
          each with its name: the game's actions, chat, and one move back or
          forward. A question (resign?) takes the whole bar while it is asked */}
      <div className="game-bar grid gap-1 border-border px-3 py-2 max-md:sticky max-md:bottom-0 max-md:z-10 max-md:order-9 max-md:mt-auto max-md:flex max-md:items-stretch max-md:gap-0 max-md:border-t max-md:bg-card max-md:px-1.5 max-md:pt-0 max-md:pb-[env(safe-area-inset-bottom)] md:border-t">
        {!focus.active && !isMobile && (
          <div className="min-w-0">
            <GameModeMoveControls />
          </div>
        )}
        <TypeMoveInput />
        {!gameEnded && (
          <MatchActions
            hasMoves={hasMoves}
            onAbort={onAbort}
            onResign={onResign}
            onOfferDraw={offerDraw}
            drawOfferSent={drawOfferSent}
            canOfferDraw={canOfferDraw}
            onRequestTakeback={takeback.requestTakeback}
            takebackRequested={takeback.takebackRequested}
            canRequestTakeback={takeback.canRequestTakeback}
            disabled={!isConnected}
            tournament={tournamentId !== null}
            noAbort={series?.matchMinutes != null && series.status === "active"}
          />
        )}
        {isMobile && !focus.active && (
          <>
            <ChatSheetButton labelled className={BAR_ITEM} />
            <Button
              type="button"
              variant="ghost"
              size="md"
              className={BAR_ITEM}
              onClick={goToPreviousMove}
              disabled={isAtStart}
              aria-label="Previous move"
            >
              <ChevronLeft aria-hidden="true" />
              <span aria-hidden="true">Back</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="md"
              className={BAR_ITEM}
              onClick={goToNextMove}
              disabled={isAtEnd}
              aria-label="Next move"
            >
              <ChevronRight aria-hidden="true" />
              <span aria-hidden="true">Forward</span>
            </Button>
          </>
        )}
      </div>

      {dockChat && (
        <section
          aria-labelledby="game-chat-title"
          className="flex h-44 shrink-0 flex-col border-t border-border [@media(max-height:780px)]:h-36"
        >
          <div className="flex h-8 shrink-0 items-center justify-between pr-2 pl-5">
            <h2 id="game-chat-title" className="truncate text-xs font-semibold text-faint">
              Chat with {opponent.username}
            </h2>
            <ChatMuteButton className="size-7" />
          </div>
          <ChatPanel compact className="min-h-0 flex-1 px-3 pb-3" />
        </section>
      )}
    </div>
  );
};
