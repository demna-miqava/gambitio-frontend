import {
  GameModeMoveControls,
  GameModeMovesList,
} from "@/features/game/modes/GameModeContext";
import { HandshakeIcon, MessageCircleOff, Undo2 } from "lucide-react";
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
import { formatGameTime, hasTimeOdds } from "@/utils/timeControl";
import { OpeningName } from "@/features/openings";
import { useShownLine } from "@/features/game/hooks/useShownLine";
import { useLiveSeries } from "@/features/series/hooks/useLiveSeries";
import { SeriesStrip } from "@/features/series/components/SeriesStrip";
import { useUser } from "@/hooks/useUser";
import { useChessBoardContext } from "@/features/game/contexts/ChessBoardContext";
import { FlipBoardButton } from "@/features/game/components/FlipBoardButton";
import { useFlipBoardKey } from "@/features/game/hooks/useFlipBoardKey";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TopBarSlot } from "@/context/GameShellContext";
import { useIsMobile, useMediaQuery } from "@/hooks/use-mobile";
import { useGameChat } from "@/features/game-chat/GameChatContext";
import { ChatMuteButton, ChatPanel } from "@/features/game-chat/components/ChatPanel";
import { ChatSheetButton, UnreadBadge } from "@/features/game-chat/components/ChatSheetButton";
import { GameSettingsButton } from "@/features/game-tools/GameSettingsButton";
import { FocusModeButton } from "@/features/game-tools/FocusModeButton";
import { useFocusMode } from "@/features/game-tools/useFocusMode";
import { useTournament } from "@/features/tournaments/hooks/useTournament";
import { TournamentPostGame, TournamentStrip } from "@/features/tournaments/components/TournamentGamePanel";

type PanelView = "moves" | "chat";

/**
 * The live game's side panel: moves (or the chat, from 1024px, as a second
 * tab), offers from the opponent, move navigation and the game actions.
 *
 * The game's tools (chat below 1024px, focus mode, settings) sit in the
 * panel's heading from 768px and in the top bar on phones, where the panel
 * is below the board.
 *
 * In focus mode only the offers and the game actions are left.
 */
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
    canOfferDraw,
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
  // A tournament game: the tournament pairs the next one, so there is no
  // rematch, takeback or abort. Keeping its lobby connected from here is
  // what lets the next game be paired without going back to the lobby.
  const tournamentId = game.tournamentId ?? null;
  const tournament = useTournament(tournamentId);
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
      />
    );
  const { orientation, flipBoard } = useChessBoardContext();
  useFlipBoardKey(flipBoard);

  const isMobile = useIsMobile();
  // From here the panel is a card beside the board with room for the chat
  const isLarge = useMediaQuery("(min-width: 1024px)");
  const chat = useGameChat();
  const focus = useFocusMode(!gameEnded);
  const [view, setView] = useState<PanelView>("moves");
  const hasTabs = isLarge && chat.available && !focus.active;
  const showChat = hasTabs && view === "chat";
  const chatOffByOpponent = chat.offReason === "off_by_opponent";

  const tools = (
    <div className="flex items-center gap-0.5">
      {!isLarge && !focus.active && <ChatSheetButton />}
      {focus.canToggle && <FocusModeButton active={focus.active} onToggle={focus.toggle} />}
      <GameSettingsButton withFocusMode />
    </div>
  );

  const moves = (
    // Phones: moves strip sits right under the board
    <div className="rounded-xl bg-card px-1 py-1.5 lg:rounded-none lg:bg-transparent lg:p-0">
      <OpeningName fens={shownLine} className="px-1.5 pb-1 lg:px-0 lg:pb-2" />
      <GameModeMovesList />
    </div>
  );

  return (
    <Tabs
      value={showChat ? "chat" : "moves"}
      onValueChange={(value) => setView(value as PanelView)}
      className="gap-3 lg:rounded-2xl lg:bg-card lg:p-4"
    >
      {isMobile && <TopBarSlot>{tools}</TopBarSlot>}
      <div className="hidden min-h-9 items-center justify-between gap-2 md:flex">
        {focus.active ? (
          <p className="text-sm text-muted-foreground">Focus mode</p>
        ) : hasTabs ? (
          <TabsList aria-label="Side panel" className="h-9 gap-4 border-0">
            <TabsTrigger value="moves" className="flex-none font-display text-base font-normal">
              Moves
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="flex-none font-display text-base font-normal"
              aria-label={
                chatOffByOpponent
                  ? "Chat: your opponent has it turned off"
                  : chat.unread > 0
                    ? `Chat, ${chat.unread} new`
                    : undefined
              }
              title={chatOffByOpponent ? "Your opponent has chat turned off" : undefined}
            >
              Chat
              {chatOffByOpponent && (
                <MessageCircleOff
                  className="size-3.5 text-muted-foreground"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              )}
              <UnreadBadge count={chat.unread} />
            </TabsTrigger>
          </TabsList>
        ) : (
          <h2 className="text-base font-display text-foreground">Moves</h2>
        )}
        <div className="flex min-w-0 items-center gap-1.5">
          {showChat ? (
            <ChatMuteButton />
          ) : (
            !focus.active && (
              <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                <span className="tabular-nums">{formatGameTime(game)}</span>
                <span className="truncate capitalize">
                  · {tournamentId !== null ? "tournament" : hasTimeOdds(game.whiteTime, game.blackTime) ? "unrated" : game.type}
                </span>
              </span>
            )
          )}
          {!isMobile && tools}
        </div>
      </div>

      {!focus.active && series && (
        <SeriesStrip series={series} seriesGame={seriesGame} viewerId={viewerId} />
      )}
      {!focus.active && tournamentId !== null && (
        <TournamentStrip tournamentId={tournamentId} state={tournament.state} />
      )}

      {focus.active ? null : hasTabs ? (
        <>
          <TabsContent value="moves">{moves}</TabsContent>
          <TabsContent value="chat">
            {/* As tall as the move list it replaces, so the panel doesn't jump */}
            <ChatPanel className="h-[min(420px,calc(100svh-26rem))] min-h-56" />
          </TabsContent>
        </>
      ) : (
        moves
      )}

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
          message={takeback.takebackRequestMessage}
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

      <div className={cn("space-y-2", !focus.active && "lg:border-t lg:border-border lg:pt-3")}>
        {!focus.active && (
          <div className="flex gap-1.5">
            <div className="min-w-0 flex-1">
              <GameModeMoveControls />
            </div>
            <FlipBoardButton onFlip={flipBoard} orientation={orientation} />
          </div>
        )}
        <TypeMoveInput />
        {gameEnded ? (
          <div className="space-y-3 pt-1">
            {finish && (
              <div className="text-center">
                <p className="font-display text-lg text-foreground">
                  {finish.title}
                </p>
                {finish.description && (
                  <p className="text-sm text-muted-foreground">{finish.description}</p>
                )}
              </div>
            )}
            {postGame}
          </div>
        ) : (
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
          />
        )}
      </div>

      <GameResultDialog
        open={openGameResultDialog}
        onOpenChange={setOpenGameResultDialog}
        title={finish?.title}
        description={finish?.description}
      >
        {postGame}
      </GameResultDialog>
    </Tabs>
  );
};
