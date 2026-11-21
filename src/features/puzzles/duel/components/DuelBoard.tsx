import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { BoardLayout } from "@/features/game/components/BoardLayout";
import { PromotionSelector } from "@/features/game/components/PromotionSelector";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { cn } from "@/lib/utils";
import type { DuelGame } from "../hooks/useDuelGame";
import type { DuelPlayer } from "../types";
import { secondsLeft } from "../utils/duel";

/** Score and strikes, where a clock would be: the other player's progress shows here, never their board */
const ScoreSlot = ({ player, maxStrikes }: { player: DuelPlayer; maxStrikes: number }) => (
  <span className="flex items-center gap-2">
    <span className="flex gap-1" aria-hidden="true">
      {Array.from({ length: maxStrikes }, (_, i) => (
        <span
          key={i}
          className={cn(
            "flex size-4 items-center justify-center rounded-full",
            i < player.strikes ? "bg-loss text-loss-foreground" : "border border-dashed border-muted-foreground/40"
          )}
        >
          {i < player.strikes && <X className="size-2.5" strokeWidth={3} />}
        </span>
      ))}
    </span>
    <span className="font-display-num text-2xl tabular-nums text-foreground">{player.score}</span>
    <span className="sr-only">{`${player.score} solved, ${player.strikes} of ${maxStrikes} strikes${player.out ? ", out" : ""}`}</span>
  </span>
);

/** Covers the board until the duel starts: the countdown to the first puzzle */
const Countdown = ({ seconds }: { seconds: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-background/85 p-6 text-center backdrop-blur-sm">
      <div ref={ref} tabIndex={-1} role="status" aria-live="assertive" className="flex flex-col items-center gap-2 outline-none">
        <span className="text-sm font-medium text-muted-foreground">Same puzzles for both. Get ready</span>
        <span key={seconds} className="font-display-num text-8xl text-foreground animate-in fade-in zoom-in-75 duration-300 motion-reduce:animate-none">
          {seconds}
        </span>
      </div>
    </div>
  );
};

/** The duel's board: your current puzzle, you at the bottom, the other player's score at the top. */
export const DuelBoard = ({ game }: { game: DuelGame }) => {
  const { boardRef, state, me, opponent, phase, serverNow, color, pendingPromotion, selectPromotion, cancelPromotion } =
    game;
  const maxStrikes = state?.maxStrikes ?? 3;
  const row = (player: DuelPlayer | null) =>
    player && {
      name: player.username,
      avatar: <PlayerAvatar username={player.username} avatarUrl={player.avatarUrl} size="sm" />,
    };
  const label =
    phase === "playing"
      ? `Puzzle board. Find the best move for ${color}.`
      : phase === "countdown"
        ? "Puzzle board. The duel is about to start."
        : "Puzzle board.";

  return (
    <BoardLayout
      boardRef={boardRef}
      boardLabel={label}
      {...(opponent && { topPlayer: row(opponent)!, topPlayerClock: <ScoreSlot player={opponent} maxStrikes={maxStrikes} /> })}
      {...(me && { bottomPlayer: row(me)!, bottomPlayerClock: <ScoreSlot player={me} maxStrikes={maxStrikes} /> })}
    >
      {phase === "countdown" && state && <Countdown seconds={secondsLeft(state.startsAt, serverNow)} />}
      {pendingPromotion && (
        <PromotionSelector
          color={color}
          square={pendingPromotion.to}
          onSelect={selectPromotion}
          onCancel={cancelPromotion}
          boardOrientation={color}
        />
      )}
    </BoardLayout>
  );
};
