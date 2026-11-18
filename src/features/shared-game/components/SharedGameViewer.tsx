import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Chessground } from "@lichess-org/chessground";
import type { Api } from "@lichess-org/chessground/api";
import type { Key } from "@lichess-org/chessground/types";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Copy, Link2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { BoardLayout } from "@/features/game/components/BoardLayout";
import { GameLayout } from "@/features/game/components/GameLayout";
import { MovesListView } from "@/features/game/components/MovesList";
import { BaseMoveControls, type MoveControl } from "@/features/game/components/BaseMoveControls";
import { FlipBoardButton } from "@/features/game/components/FlipBoardButton";
import { useArrowKeyNavigation } from "@/features/game/hooks/useArrowKeyNavigation";
import { useFlipBoardKey } from "@/features/game/hooks/useFlipBoardKey";
import { describeMove } from "@/features/game/utils/describeMove";
import { BotAvatar } from "@/features/play-bots/components/BotAvatar";
import { OpeningName } from "@/features/openings";
import { formatGameTime } from "@/utils/timeControl";
import type { StoredGame, StoredGamePlayer } from "@/types";
import { outcomeText, replayGame, scoreText, sharedGamePgn } from "../sharedGame";

type Side = "white" | "black";

const DATE_FORMAT = new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" });

/** "Blitz 3+2 · Rated · Nov 18, 2026" */
const gameFacts = (game: StoredGame): string => {
  const kind =
    game.botId !== null
      ? "Against a bot"
      : game.time !== null
        ? `${game.type ? `${game.type[0].toUpperCase()}${game.type.slice(1)} ` : ""}${formatGameTime({ ...game, time: game.time })}`
        : null;
  const played = new Date(game.createdAt);
  return [
    kind,
    game.botId === null ? (game.rated ? "Rated" : "Unrated") : null,
    Number.isNaN(played.getTime()) ? null : DATE_FORMAT.format(played),
  ]
    .filter(Boolean)
    .join(" · ");
};

const copy = (text: string, done: string) =>
  navigator.clipboard
    .writeText(text)
    .then(() => toast.success(done))
    .catch(() => toast.error("Couldn't copy to the clipboard"));

interface SharedGameViewerProps {
  game: StoredGame;
  /** Where "Sign in" and "Create an account" go: back here afterwards */
  signInHref: string;
  signUpHref: string;
}

/**
 * A finished game for anyone with its link: the board, the players, the
 * moves to step through. Nothing here needs an account or talks to the API,
 * so it works signed out; the engine is what signing in adds (the page then
 * opens the game's full analysis instead of this).
 */
export const SharedGameViewer = ({ game, signInHref, signUpHref }: SharedGameViewerProps) => {
  const line = useMemo(() => replayGame(game.pgn), [game.pgn]);
  const last = line.moves.length;
  // Opens on the final position, like the game's own page
  const [ply, setPly] = useState(last);
  const [orientation, setOrientation] = useState<Side>("white");
  const boardRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);

  const fen = line.fens[ply] ?? line.fens[0];
  const move = ply > 0 ? line.moves[ply - 1] : undefined;
  const toMove: Side = fen.split(" ")[1] === "b" ? "black" : "white";

  useEffect(() => {
    if (!boardRef.current) return;
    const cg = Chessground(boardRef.current, {
      viewOnly: true,
      coordinates: true,
      animation: { enabled: true, duration: 180 },
      highlight: { lastMove: true, check: true },
    });
    cgRef.current = cg;
    return () => {
      cg.destroy();
      cgRef.current = null;
    };
  }, []);

  useEffect(() => {
    cgRef.current?.set({
      fen,
      orientation,
      turnColor: toMove,
      lastMove: move ? [move.from as Key, move.to as Key] : undefined,
      // SAN marks a check ("+") or mate ("#") on the move that gives it
      check: move !== undefined && /[+#]$/.test(move.san),
    });
  }, [fen, orientation, toMove, move]);

  const goTo = useCallback((next: number) => setPly(Math.min(last, Math.max(0, next))), [last]);
  const goToStart = useCallback(() => setPly(0), []);
  const goBack = useCallback(() => setPly((p) => Math.max(0, p - 1)), []);
  const goForward = useCallback(() => setPly((p) => Math.min(last, p + 1)), [last]);
  const goToEnd = useCallback(() => setPly(last), [last]);
  const flip = useCallback(() => setOrientation((side) => (side === "white" ? "black" : "white")), []);
  useArrowKeyNavigation({ onLeft: goBack, onRight: goForward, onUp: goToStart, onDown: goToEnd });
  useFlipBoardKey(flip);

  const atStart = ply === 0;
  const atEnd = ply === last;
  const controls = useMemo<MoveControl[]>(
    () => [
      { id: "first", icon: ChevronsLeft, title: "Start position (Home)", onClick: goToStart, disabled: atStart },
      { id: "previous", icon: ChevronLeft, title: "Previous move (←)", onClick: goBack, disabled: atStart },
      { id: "next", icon: ChevronRight, title: "Next move (→)", onClick: goForward, disabled: atEnd },
      { id: "last", icon: ChevronsRight, title: "Last move (End)", onClick: goToEnd, disabled: atEnd },
    ],
    [goToStart, goBack, goForward, goToEnd, atStart, atEnd]
  );

  const playerRow = (side: Side) => {
    const player: StoredGamePlayer = side === "white" ? game.whitePlayer : game.blackPlayer;
    // In a bot game the computer is the side without a user id
    const isBot = game.botId !== null && player.id === null;
    return {
      name: player.username,
      startingRating: player.rating,
      provisional: player.provisional,
      avatar: isBot ? (
        <BotAvatar rating={player.rating} className="size-8 rounded-lg" />
      ) : (
        <PlayerAvatar username={player.username} avatarUrl={player.avatarUrl} size="sm" />
      ),
    };
  };
  const top: Side = orientation === "white" ? "black" : "white";

  const spoken = move
    ? `Move ${Math.ceil(ply / 2)}, ${ply % 2 === 1 ? "white" : "black"}: ${describeMove(move.san)}`
    : "Start position";
  const boardLabel = `Chess board. ${toMove === "white" ? "White" : "Black"} to move. ${move ? `Last move: ${spoken}` : spoken}`;
  const score = scoreText(game.result);
  const facts = gameFacts(game);
  const fensToHere = useMemo(() => line.fens.slice(0, ply + 1), [line.fens, ply]);

  return (
    <GameLayout
      board={
        <BoardLayout
          boardRef={boardRef}
          boardLabel={boardLabel}
          material={{ fen, bottom: orientation }}
          topPlayer={playerRow(top)}
          bottomPlayer={playerRow(orientation)}
        />
      }
      sidebar={
        <div className="flex w-full flex-col gap-3">
          <section className="flex flex-col gap-3 lg:rounded-2xl lg:bg-card lg:p-4">
            <header className="space-y-1">
              <h1 className="font-display text-xl leading-snug break-words text-foreground">
                {game.whitePlayer.username} <span className="text-muted-foreground">vs</span>{" "}
                {game.blackPlayer.username}
              </h1>
              <p className="text-sm text-foreground">
                {score && <span className="mr-2 font-medium tabular-nums">{score}</span>}
                {outcomeText(game)}
              </p>
              {facts && <p className="text-xs text-muted-foreground">{facts}</p>}
              <OpeningName fens={fensToHere} className="pt-1" />
            </header>

            <div className="rounded-xl bg-card px-1 lg:rounded-none lg:bg-transparent lg:px-0">
              {last > 0 ? (
                <MovesListView moves={line.moves} activeIndex={ply - 1} onSelect={goTo} />
              ) : (
                <p className="py-3 text-center text-sm text-muted-foreground">No moves were played.</p>
              )}
            </div>

            <div className="flex items-center gap-1">
              <BaseMoveControls controls={controls} className="min-w-0 flex-1" />
              <FlipBoardButton onFlip={flip} orientation={orientation} />
            </div>
            {/* Read out as the position changes; the board itself is one image */}
            <p className="sr-only" aria-live="polite">
              {spoken}
            </p>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="md"
                disabled={last === 0}
                onClick={() => void copy(sharedGamePgn(game, line.moves), "PGN copied")}
              >
                <Copy aria-hidden="true" /> Copy PGN
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => void copy(window.location.href.split(/[?#]/)[0], "Link copied")}
              >
                <Link2 aria-hidden="true" /> Copy link
              </Button>
            </div>
          </section>

          <aside
            aria-labelledby="shared-game-engine"
            className="flex flex-col gap-3 rounded-2xl border border-border p-4"
          >
            <div className="space-y-1">
              <h2 id="shared-game-engine" className="flex items-center gap-2 font-display text-base text-foreground">
                <Sparkles className="size-4 text-primary" aria-hidden="true" />
                See what the engine thinks
              </h2>
              <p className="text-sm text-muted-foreground">
                Sign in to analyze this game with Stockfish: the best move in every position, an
                evaluation graph, and each side's mistakes and blunders.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Button asChild size="md">
                <Link to={signUpHref}>Create a free account</Link>
              </Button>
              <Button asChild size="md" variant="outline">
                <Link to={signInHref}>Sign in</Link>
              </Button>
            </div>
          </aside>
        </div>
      }
    />
  );
};
