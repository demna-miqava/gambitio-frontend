import type { ReactNode } from "react";
import { CheckCircle2, Loader2, RotateCcw, XCircle } from "lucide-react";
import { BoardLayout } from "@/features/game/components/BoardLayout";
import { PromotionSelector } from "@/features/game/components/PromotionSelector";
import { MoveNavigationControls } from "@/features/game/components/MoveControls";
import { FlipBoardButton } from "@/features/game/components/FlipBoardButton";
import { SettingsMovesListView } from "@/features/game/components/MovesList";
import { TypedMoveInput } from "@/features/game/components/TypedMoveInput";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { Button } from "@/components/ui/button";
import { BotAvatar } from "@/features/play-bots/components/BotAvatar";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import { ENDGAME_ENGINE_RATING, type useEndgameExercise } from "../hooks/useEndgameExercise";
import type { PracticePosition } from "../types";
import { PRACTICE_ENGINE_NAME, shownFenOf } from "../utils/practiceText";

// The pieces shared by the endgame exercise and conversion drill pages,
// which both play a position out against Stockfish (useEndgameExercise)

/** A practice game in progress (useEndgameExercise) */
export type PracticeGame = ReturnType<typeof useEndgameExercise>;

/** The board against the engine, with both players' rows and the promotion picker. */
export const PracticeBoard = ({
  game,
  position,
  label,
}: {
  game: PracticeGame;
  position: PracticePosition;
  /** Accessible description (practiceText's boardLabel) */
  label: string;
}) => {
  const { username, image } = useUser();
  const { boardRef, orientation, thinking, pendingPromotion, selectPromotion, cancelPromotion } = game;

  const engineRow = {
    name: PRACTICE_ENGINE_NAME,
    startingRating: ENDGAME_ENGINE_RATING,
    avatar: <BotAvatar rating={ENDGAME_ENGINE_RATING} className="size-8 rounded-lg" />,
  };
  const engineStatus = thinking ? (
    <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Thinking" />
  ) : undefined;
  const playerRow = {
    name: username,
    avatar: <PlayerAvatar username={username} avatarUrl={image} size="sm" />,
  };

  return (
    <BoardLayout
      boardRef={boardRef}
      boardLabel={label}
      material={{ fen: shownFenOf(game), bottom: orientation }}
      // The player is at the bottom unless they flipped the board
      {...(orientation === position.playerColor
        ? { topPlayer: engineRow, topPlayerClock: engineStatus, bottomPlayer: playerRow }
        : { topPlayer: playerRow, bottomPlayer: engineRow, bottomPlayerClock: engineStatus })}
    >
      {pendingPromotion && (
        <PromotionSelector
          color={position.playerColor}
          square={pendingPromotion.to}
          onSelect={selectPromotion}
          onCancel={cancelPromotion}
          boardOrientation={orientation}
        />
      )}
    </BoardLayout>
  );
};

/** The attempt's status line: neutral while playing, green once won, red once failed. */
export const PracticeStatus = ({ game, children }: { game: PracticeGame; children: ReactNode }) => {
  const { result, engineError } = game;
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm font-medium",
        result?.status === "success" && "bg-win-bg text-win",
        (result?.status === "failure" || engineError) && "bg-loss-bg text-loss",
        !result && !engineError && "bg-muted text-foreground"
      )}
    >
      {result?.status === "success" && <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
      {result?.status === "failure" && <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
      <span>{children}</span>
    </div>
  );
};

/** Retry (shortcut R, which the page binds): the main action until the attempt is won. */
export const RetryButton = ({ game, onRetry }: { game: PracticeGame; onRetry: () => void }) => (
  <Button
    size="md"
    variant={game.result?.status === "success" ? "outline" : "default"}
    onClick={onRetry}
    aria-keyshortcuts="r"
    disabled={game.history.length === 0 && !game.result}
  >
    <RotateCcw aria-hidden="true" /> Retry
    <kbd className="ml-1 hidden rounded border border-current/30 px-1 text-[0.65rem] font-normal opacity-70 sm:inline">
      R
    </kbd>
  </Button>
);

/**
 * The moves played, with navigation, the flip button and typed-move input
 * (until the attempt is over). `children` go at the bottom.
 */
export const PracticeMoves = ({
  game,
  startPly,
  children,
}: {
  game: PracticeGame;
  /** The ply the position starts at, for the move numbers */
  startPly: number;
  children?: ReactNode;
}) => {
  const { history, navigation, flip, orientation, result, engineError, submitTypedMove } = game;
  return (
    <div className="space-y-2 lg:border-t lg:border-border lg:pt-3">
      <div className="rounded-xl bg-card px-1 py-1.5 lg:rounded-none lg:bg-transparent lg:p-0">
        <SettingsMovesListView
          moves={history}
          activeIndex={navigation.currentIndex - 1}
          onSelect={navigation.goToMove}
          startPly={startPly}
        />
      </div>
      <div className="flex gap-1.5">
        <div className="min-w-0 flex-1">
          <MoveNavigationControls {...navigation} />
        </div>
        <FlipBoardButton onFlip={flip} orientation={orientation} />
      </div>
      {!result && !engineError && <TypedMoveInput onSubmit={submitTypedMove} />}
      {children}
    </div>
  );
};
