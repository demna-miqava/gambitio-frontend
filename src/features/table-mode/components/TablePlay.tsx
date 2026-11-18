import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeftRight, Check, CloudOff, Loader2, LogOut, Microscope, Play, RotateCcw, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { TypedMoveInput } from "@/features/game/components/TypedMoveInput";
import { parseTypedMove } from "@/features/game/utils/parseTypedMove";
import { useShortcutKey } from "@/features/game/hooks/useShortcutKey";
import { getArchiveGameRoute } from "@/constants/routes";
import { useTableGame } from "../hooks/useTableGame";
import { useWakeLock } from "../hooks/useWakeLock";
import { useSaveTableGame } from "../hooks/useSaveTableGame";
import { boardOf, describeEnd, other, type Side, type TableGameState } from "../utils/tableGame";
import { queueUnsaved } from "../utils/tableStorage";
import { toUnsaved } from "../utils/tableSave";
import { ClockHalf } from "./ClockHalf";
import { TableBoard } from "./TableBoard";

interface TablePlayProps {
  initial: TableGameState;
  /** Back to the table mode page; the game stays on the device */
  onLeave: () => void;
  /** The game is finished with (or abandoned): forget it and set up another */
  onDone: () => void;
}

const namesOf = (state: TableGameState): Record<Side, string> => {
  const { setup } = state;
  const opponent = setup.opponent.kind === "guest" ? setup.opponent.name : setup.opponent.username;
  return setup.recorderColor === "white"
    ? { white: setup.recorderName, black: opponent }
    : { white: opponent, black: setup.recorderName };
};

/**
 * The phone lying between the two players: the far player's clock turned
 * to face them, the board in the middle (or nothing, in clock-only mode)
 * and the near player's clock. Moving on the board ends that player's turn.
 * The screen stays awake while the game is on.
 */
export const TablePlay = ({ initial, onLeave, onDone }: TablePlayProps) => {
  // Re-renders when the game changes, not on the clock's ticks (ClockHalf reads the time)
  const { state, dispatch } = useTableGame(initial);
  const [swapped, setSwapped] = useState(false);
  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const names = useMemo(() => namesOf(state), [state]);
  const { status, setup } = state;
  const over = status === "over";
  useWakeLock(!over);

  // Near (bottom) and far (top, turned round) players
  const near: Side = swapped ? "black" : "white";
  const far = other(near);

  const move = useCallback(
    (m: { from: string; to: string; promotion?: string }) => {
      const chess = boardOf(state);
      try {
        const played = chess.move({ from: m.from, to: m.to, ...(m.promotion ? { promotion: m.promotion } : {}) });
        dispatch({ type: "move", san: played.san, now: Date.now() });
      } catch {
        // Not legal: the board puts it back
      }
    },
    [state, dispatch]
  );

  const typed = useCallback(
    (text: string) => {
      if (status !== "running") return "Start the clock first.";
      const parsed = parseTypedMove(boardOf(state), text);
      if (!parsed) return `“${text.trim()}” isn't a legal move here.`;
      move(parsed);
      return null;
    },
    [state, status, move]
  );

  const togglePause = useCallback(() => {
    if (status === "running") dispatch({ type: "pause", now: Date.now() });
    else if (status === "paused") dispatch({ type: "resume", now: Date.now() });
  }, [status, dispatch]);
  useShortcutKey("p", togglePause, status === "running" || status === "paused");

  // Clock only: Space ends the turn of the side to move (or starts the clock)
  useEffect(() => {
    if (!setup.clockOnly) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== " " || event.repeat) return;
      if (event.target instanceof Element && event.target.closest("input, textarea, button, [role=dialog]")) return;
      event.preventDefault();
      dispatch({ type: "tap", side: status === "ready" ? "black" : state.turn, now: Date.now() });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setup.clockOnly, status, state.turn, dispatch]);

  // A finished game goes on the device first, then to the server; once
  // stored, the game remembers it (a reload doesn't save it again)
  const savedGameId = state.savedGameId ?? null;
  const unsaved = useMemo(() => (over ? toUnsaved(state, names) : null), [over, state, names]);
  const queuedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!unsaved || queuedRef.current === unsaved.id) return;
    queuedRef.current = unsaved.id;
    queueUnsaved(unsaved);
  }, [unsaved]);
  const save = useSaveTableGame(unsaved);
  useEffect(() => {
    if (save.gameId !== null) dispatch({ type: "saved", gameId: save.gameId });
  }, [save.gameId, dispatch]);
  const reviewId = savedGameId ?? save.gameId;

  const half = (side: Side, flipped: boolean) => (
    <ClockHalf
      side={side}
      name={names[side]}
      state={state}
      flipped={flipped}
      onTap={() => dispatch({ type: "tap", side, now: Date.now() })}
      onPause={togglePause}
      onResign={() => dispatch({ type: "resign", side, now: Date.now() })}
      onOfferDraw={() => dispatch({ type: "offer_draw", side })}
      onAnswerDraw={(accept) => dispatch({ type: "answer_draw", side, accept, now: Date.now() })}
    />
  );

  const toMove = state.turn === "white" ? "White" : "Black";
  const boardLabel = `Table board. ${toMove} to move${state.moves.length ? `. Last move ${state.moves.at(-1)}` : ""}.`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <h1 className="sr-only">Table game: {names.white} vs {names.black}</h1>
      {half(far, true)}

      {!setup.clockOnly && (
        <div className="relative mx-auto w-full max-w-[min(100vw,52svh)] shrink-0">
          <TableBoard
            moves={state.moves}
            enabled={status === "running"}
            orientation={near}
            onMove={move}
            label={boardLabel}
          />
        </div>
      )}
      {!setup.clockOnly && status === "running" && (
        <div className="sr-only focus-within:not-sr-only focus-within:px-3 focus-within:py-2">
          <TypedMoveInput onSubmit={typed} label="Type the move just played" />
        </div>
      )}

      {half(near, false)}

      {/* Middle of the screen, facing the near player */}
      {status === "ready" && (
        <Overlay>
          <p className="text-sm text-muted-foreground">
            {setup.clockOnly ? "Black taps their half to start White's clock, or:" : "Set up the board. White moves first."}
          </p>
          <Button size="lg" onClick={() => dispatch({ type: "start", now: Date.now() })} autoFocus>
            <Play aria-hidden="true" /> Start White's clock
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSwapped((s) => !s)}>
            <ArrowLeftRight aria-hidden="true" /> Swap ends
          </Button>
          <Button variant="ghost" size="sm" onClick={onDone}>
            Cancel
          </Button>
        </Overlay>
      )}

      {status === "paused" && (
        <Overlay>
          <p className="font-display text-2xl">Paused</p>
          <Button size="lg" onClick={togglePause} autoFocus aria-keyshortcuts="P">
            <Play aria-hidden="true" /> Resume
          </Button>
          {!setup.clockOnly && state.moves.length > 0 && (
            <Button variant="outline" onClick={() => dispatch({ type: "takeback" })}>
              <Undo2 aria-hidden="true" /> Take back {state.moves.at(-1)}
            </Button>
          )}
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSwapped((s) => !s)}>
              <ArrowLeftRight aria-hidden="true" /> Swap ends
            </Button>
            <Button variant="ghost" size="sm" onClick={onLeave}>
              <LogOut aria-hidden="true" /> Leave (kept on this phone)
            </Button>
            <Button variant="ghost" size="sm" className="text-loss" onClick={() => setConfirmAbandon(true)}>
              <Trash2 aria-hidden="true" /> Abandon
            </Button>
          </div>
        </Overlay>
      )}

      {over && state.result && (
        <Overlay>
          <p className="font-display text-2xl" role="status">
            {describeEnd(state.result, names)}
          </p>
          <SaveStatus
            clockOnly={setup.clockOnly}
            hasMoves={state.moves.length > 0}
            saved={reviewId !== null}
            save={save}
          />
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={onDone} autoFocus>
              <RotateCcw aria-hidden="true" /> New game
            </Button>
            {reviewId !== null && (
              <Button asChild variant="outline">
                <Link to={getArchiveGameRoute(reviewId)}>
                  <Microscope aria-hidden="true" /> Review
                </Link>
              </Button>
            )}
          </div>
        </Overlay>
      )}

      <ConfirmDialog
        open={confirmAbandon}
        onOpenChange={setConfirmAbandon}
        title="Abandon this game?"
        description="It ends here and isn't saved."
        confirmLabel="Abandon"
        destructive
        onConfirm={() => {
          setConfirmAbandon(false);
          onDone();
        }}
      />
    </div>
  );
};

const Overlay = ({ children }: { children: React.ReactNode }) => (
  <div className="absolute inset-x-3 top-1/2 z-10 mx-auto flex max-w-sm -translate-y-1/2 flex-col items-center gap-3 rounded-2xl bg-popover p-5 text-center shadow-lg ring-1 ring-border">
    {children}
  </div>
);

const SaveStatus = ({
  clockOnly,
  hasMoves,
  saved,
  save,
}: {
  clockOnly: boolean;
  hasMoves: boolean;
  saved: boolean;
  save: ReturnType<typeof useSaveTableGame>;
}) => {
  if (clockOnly) return <p className="text-sm text-muted-foreground">Clock-only games aren't saved.</p>;
  if (!hasMoves) return <p className="text-sm text-muted-foreground">No moves were played, so there's nothing to save.</p>;
  if (save.status === "saving") {
    return (
      <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Saving the game…
      </p>
    );
  }
  if (saved || save.status === "saved") {
    return (
      <p role="status" className="flex items-center gap-2 text-sm text-success">
        <Check className="size-4" aria-hidden="true" /> Saved to your history
      </p>
    );
  }
  const message = (save.error as { response?: { data?: { error?: string } } } | null)?.response?.data?.error;
  return (
    <div role="alert" className="space-y-2 text-sm">
      <p className="flex items-center justify-center gap-2 text-loss">
        <CloudOff className="size-4" aria-hidden="true" /> Couldn't save the game.
      </p>
      <p className="text-muted-foreground">
        {message ?? "It's kept on this phone. Try again when you're back online, here or from Table mode."}
      </p>
      <Button size="sm" variant="outline" onClick={save.retry}>
        Try again
      </Button>
    </div>
  );
};
