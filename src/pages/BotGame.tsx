import { useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Bot as BotIcon, Loader2, RotateCcw } from "lucide-react";
import { BoardLayout } from "@/features/game/components/BoardLayout";
import { GameLayout } from "@/features/game/components/GameLayout";
import { PromotionSelector } from "@/features/game/components/PromotionSelector";
import { MoveNavigationControls } from "@/features/game/components/MoveControls";
import { FlipBoardButton } from "@/features/game/components/FlipBoardButton";
import { useFlipBoardKey } from "@/features/game/hooks/useFlipBoardKey";
import { MovesListView } from "@/features/game/components/MovesList";
import { TypedMoveInput } from "@/features/game/components/TypedMoveInput";
import { ActionButton } from "@/features/current-game/components/ActionButton";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { LeaveGameDialog } from "@/components/LeaveGameDialog";
import { Button } from "@/components/ui/button";
import { getBotById, type Bot } from "@/features/play-bots/constants/bots";
import { BotAvatar } from "@/features/play-bots/components/BotAvatar";
import { useBotGame, type BotGameResult } from "@/features/play-bots/hooks/useBotGame";
import { useSaveBotGame } from "@/features/play-bots/hooks/useSaveBotGame";
import { describeMove } from "@/features/play-bots/utils/describeMove";
import type { PlayerColor } from "@/features/game/types/game.types";
import { useSettings } from "@/features/settings/SettingsContext";
import { useUser } from "@/hooks/useUser";
import { useLeaveGuard } from "@/hooks/useLeaveGuard";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ROUTES, getArchiveGameRoute, getGameReviewRoute } from "@/constants/routes";
import { ReviewGameLinks } from "@/features/game-review/components/ReviewGameLinks";
import type { ImportGameState } from "@/features/import-game/importGameState";
import { buildBotGamePgn } from "@/features/play-bots/utils/botGamePgn";
import { cn } from "@/lib/utils";
import { OpeningName } from "@/features/openings";
import { positionsAlong } from "@/features/game/utils/material";
import { GameSettingsButton } from "@/features/game-tools/GameSettingsButton";
import { TopBarSlot } from "@/context/GameShellContext";
import { useIsMobile } from "@/hooks/use-mobile";

const RESULT_TITLES: Record<BotGameResult["outcome"], string> = {
  win: "You won",
  loss: "You lost",
  draw: "Draw",
};

// Server default for confirmDrawResignationEnabled, used while settings load
const CONFIRM_RESIGN_DEFAULT = true;

const BotGameView = ({ bot, color }: { bot: Bot; color: PlayerColor }) => {
  const navigate = useNavigate();
  const { username, image } = useUser();
  const { settings } = useSettings();
  const isMobile = useIsMobile();
  const {
    boardRef,
    history,
    thinking,
    result,
    engineError,
    pendingPromotion,
    selectPromotion,
    cancelPromotion,
    resign,
    undo,
    canUndo,
    submitTypedMove,
    navigation,
    orientation,
    flip,
    isPlayerTurn,
  } = useBotGame(bot, color);
  // Said after an undo, until the next move: the move count it went back
  // to, and how many undos so far (repeated text isn't read out again, so
  // every other one gets a trailing no-break space)
  const [undone, setUndone] = useState<{ ply: number; count: number } | null>(null);
  const takeBack = () => {
    const ply = undo();
    if (ply !== null) setUndone((prev) => ({ ply, count: (prev?.count ?? 0) + 1 }));
  };
  useFlipBoardKey(flip);

  // Bot games run in the browser and are only saved once finished, so
  // leaving mid-game throws it away
  const inProgress = history.length > 0 && !result && !engineError;
  const blocker = useLeaveGuard(inProgress);

  const playAgain = () =>
    navigate(ROUTES.BOT_GAME, {
      replace: true,
      state: { botId: bot.id, color: color === "white" ? "black" : "white", gameKey: Date.now() },
    });

  const resultText = result ? `${RESULT_TITLES[result.outcome]} ${result.reason}` : undefined;
  const status = engineError
    ? "The engine couldn't start. Try reloading the page."
    : resultText
      ? resultText
      : thinking
        ? `${bot.name} is thinking…`
        : isPlayerTurn
          ? "Your move"
          : "Waiting…";

  useDocumentTitle(
    result
      ? `${RESULT_TITLES[result.outcome]} against ${bot.name}`
      : isPlayerTurn
        ? "Your move"
        : `Playing ${bot.name}`
  );

  // Screen readers hear the bot's moves and the end of the game (the
  // player's own moves aren't repeated back)
  const lastMove = history.at(-1);
  const playerCode = color === "white" ? "w" : "b";
  // Not once the game is over: resigning doesn't change the move count
  const undoAnnouncement =
    undone !== null && undone.ply === history.length && !result
      ? `Move taken back. ${
          lastMove
            ? `Last move: ${lastMove.color === playerCode ? "you" : bot.name} played ${describeMove(lastMove)}. `
            : ""
        }Your move.${undone.count % 2 ? "" : "\u00a0"}`
      : null;
  const announcement = engineError
    ? status
    : undoAnnouncement
      ? undoAnnouncement
      : resultText
      ? `${lastMove && lastMove.color !== playerCode ? `${bot.name} played ${describeMove(lastMove)}. ` : ""}${resultText}.`
      : lastMove && lastMove.color !== playerCode
        ? `${bot.name} played ${describeMove(lastMove)}. Your move.`
        : "";

  const confirmResign = settings?.confirmDrawResignationEnabled ?? CONFIRM_RESIGN_DEFAULT;

  const playerName = username || "You";
  const finishedPgn = useMemo(
    () =>
      result && history.length > 0
        ? buildBotGamePgn({ moves: history, playerColor: color, playerName, botName: bot.name, result })
        : null,
    [result, history, color, playerName, bot.name]
  );

  // Saved once it's over (unrated); review and analysis then open the stored
  // game. A game resigned before any move has nothing to save.
  const saveBody = useMemo(
    () =>
      result && finishedPgn
        ? { botId: bot.id, color, pgn: finishedPgn, endReason: result.endReason }
        : null,
    [result, finishedPgn, bot.id, color]
  );
  const save = useSaveBotGame(saveBody);
  // If saving failed, review/analysis get the game as PGN instead
  const importState = (review: boolean): ImportGameState | undefined =>
    finishedPgn ? { pgn: finishedPgn, review } : undefined;

  const boardLabel = [
    "Chess board",
    `You play ${color} against ${bot.name}`,
    lastMove &&
      `Last move: ${lastMove.color === playerCode ? "you" : bot.name} played ${describeMove(lastMove)}`,
    resultText ?? (isPlayerTurn ? "Your move" : undefined),
  ]
    .filter(Boolean)
    .join(". ");

  const shownLine = positionsAlong(history, navigation.currentIndex);

  const botRow = {
    name: bot.name,
    startingRating: bot.rating,
    avatar: <BotAvatar rating={bot.rating} className="size-8 rounded-lg" />,
  };
  const botStatus = thinking ? (
    <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Thinking" />
  ) : undefined;
  const playerRow = {
    name: username,
    avatar: <PlayerAvatar username={username} avatarUrl={image} size="sm" />,
  };

  const board = (
    <BoardLayout
      boardRef={boardRef}
      boardLabel={boardLabel}
      material={{ fen: shownLine[shownLine.length - 1], bottom: orientation }}
      // The player is at the bottom unless they flipped the board
      {...(orientation === color
        ? { topPlayer: botRow, topPlayerClock: botStatus, bottomPlayer: playerRow }
        : { topPlayer: playerRow, bottomPlayer: botRow, bottomPlayerClock: botStatus })}
    >
      {pendingPromotion && (
        <PromotionSelector
          color={color}
          square={pendingPromotion.to}
          onSelect={selectPromotion}
          onCancel={cancelPromotion}
          boardOrientation={orientation}
        />
      )}
    </BoardLayout>
  );

  const sidebar = (
    <div className="flex flex-col gap-3 lg:rounded-2xl lg:bg-card lg:p-4">
      <div
        className={cn(
          "rounded-xl px-4 py-3 text-sm font-medium",
          result?.outcome === "win" && "bg-win-bg text-win",
          result?.outcome === "loss" && "bg-loss-bg text-loss",
          (!result || result.outcome === "draw") && "bg-muted text-foreground",
          engineError && "bg-loss-bg text-loss"
        )}
      >
        {status}
      </div>

      {/* Phones: moves strip sits right under the board */}
      <div className="rounded-xl bg-card px-1 py-1.5 lg:rounded-none lg:bg-transparent lg:p-0">
        <OpeningName fens={shownLine} className="px-1.5 pb-1 lg:px-0 lg:pb-2" />
        <MovesListView
          moves={history}
          activeIndex={navigation.currentIndex - 1}
          onSelect={navigation.goToMove}
        />
      </div>

      {/* Keyboard play; shows up when it gets focus */}
      {!result && !engineError && (
        <TypedMoveInput onSubmit={submitTypedMove} />
      )}

      <div className="space-y-2 lg:border-t lg:border-border lg:pt-3">
        <div className="flex gap-1.5">
          <div className="min-w-0 flex-1">
            <MoveNavigationControls {...navigation} />
          </div>
          <FlipBoardButton onFlip={flip} orientation={orientation} />
          {/* Phones have it in the top bar */}
          {!isMobile && <GameSettingsButton />}
        </div>
        {!result ? (
          <div className="flex gap-2">
            <ActionButton
              variant="takeback"
              onClick={takeBack}
              label="Undo"
              ariaLabel="Undo your last move and the computer's reply"
              disabled={!canUndo}
            />
            <ActionButton
              variant="resign"
              onClick={resign}
              label="Resign"
              confirmTitle={confirmResign ? "Resign this game?" : undefined}
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Button size="md" onClick={playAgain}>
                <RotateCcw /> Play again
              </Button>
              <Button size="md" variant="outline" asChild>
                <Link to={ROUTES.PLAY_BOTS}>
                  <BotIcon aria-hidden="true" /> Other bots
                </Link>
              </Button>
            </div>
            {save.status === "saving" && (
              <p
                role="status"
                className="flex h-10 items-center justify-center gap-2 text-sm text-muted-foreground"
              >
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Saving game…
              </p>
            )}
            {save.status === "saved" && save.gameId !== null && (
              <ReviewGameLinks
                review={{ to: getGameReviewRoute(save.gameId) }}
                analysis={{ to: getArchiveGameRoute(save.gameId) }}
              />
            )}
            {save.status === "error" && finishedPgn && (
              <>
                <ReviewGameLinks
                  review={{ to: ROUTES.TOOLS.IMPORT_GAME, state: importState(true) }}
                  analysis={{ to: ROUTES.TOOLS.IMPORT_GAME, state: importState(false) }}
                />
                <p role="status" className="text-xs text-muted-foreground">
                  Couldn't save this game, so it won't be in your history.{" "}
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={save.retry}
                  >
                    Try again
                  </Button>
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      <h1 className="sr-only">Game against {bot.name}</h1>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
      {isMobile && (
        <TopBarSlot>
          <GameSettingsButton />
        </TopBarSlot>
      )}
      <GameLayout board={board} sidebar={sidebar} />
      <LeaveGameDialog
        blocker={blocker}
        description="Games against the computer are saved only once they're over, so this one will be lost."
      />
    </>
  );
};

/** Game against a Stockfish bot. Reached from Play the computer. */
const BotGame = () => {
  const location = useLocation();
  const state = location.state as
    | { botId?: string; color?: PlayerColor; gameKey?: number }
    | null;
  const bot = state?.botId ? getBotById(state.botId) : undefined;

  if (!bot || !state?.color) return <Navigate to={ROUTES.PLAY_BOTS} replace />;

  return <BotGameView key={state.gameKey} bot={bot} color={state.color} />;
};

export default BotGame;
