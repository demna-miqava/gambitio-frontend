import { useCallback, useEffect, useRef, useState } from "react";
import type { Key } from "@lichess-org/chessground/types";
import { GameLayout } from "@/features/game/components/GameLayout";
import { useChessSound } from "@/features/game/contexts/ChessSoundContext";
import { PageHeader } from "@/components/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { CoordinatesBoard } from "@/features/coordinates/components/CoordinatesBoard";
import { RunSetup } from "@/features/coordinates/components/RunSetup";
import { RunPanel } from "@/features/coordinates/components/RunPanel";
import { RunResult } from "@/features/coordinates/components/RunResult";
import { RecentScores } from "@/features/coordinates/components/RecentScores";
import { useCoordinateOptions } from "@/features/coordinates/hooks/useCoordinateOptions";
import { useCoordinateRun } from "@/features/coordinates/hooks/useCoordinateRun";
import {
  useCoordinateScores,
  useRecordCoordinateRun,
} from "@/features/coordinates/hooks/useCoordinateScores";
import { bestFor, isNewBest, recentFor } from "@/features/coordinates/utils/coordinates";
import type { CoordinateOptions, CoordinateRunResult } from "@/features/coordinates/types";

/**
 * Coordinates trainer: a square name appears and the player clicks that
 * square, as many as they can before the clock runs out. The drill is
 * pointer-only; everything around it (options, Start, Stop, Play again)
 * works from the keyboard, and each target is announced.
 */
const Coordinates = () => {
  useDocumentTitle("Coordinates");
  const [options, setOptions] = useCoordinateOptions();
  const { run, timeLeftMs, click, start, stop } = useCoordinateRun();
  const scores = useCoordinateScores();
  const record = useRecordCoordinateRun();
  const { playSound, playGameEndSound } = useChessSound();

  // The options a run was started with (the controls are hidden meanwhile),
  // and the best for them at that moment, for the new-best call-out when
  // the run can't be saved
  const [runOptions, setRunOptions] = useState<CoordinateOptions>(options);
  const bestBeforeRef = useRef<number | null>(null);
  const runPanelRef = useRef<HTMLDivElement>(null);
  const playAgainRef = useRef<HTMLButtonElement>(null);
  const startButtonFocusRef = useRef(false);

  const shownOptions = run ? runOptions : options;
  const best = bestFor(scores.data?.bests, shownOptions);

  const begin = useCallback(() => {
    setRunOptions(options);
    bestBeforeRef.current = bestFor(scores.data?.bests, options);
    record.reset();
    start(options.seconds);
    startButtonFocusRef.current = true;
  }, [options, record, scores.data?.bests, start]);

  // Start and Play again unmount with their panel: keep focus in the new
  // one. Without scrolling to it: on a phone the panel is below the board,
  // and the run is played on the board, so that is what comes into view
  // (the top of the page; on a wide screen it already is)
  useEffect(() => {
    if (run?.phase === "ready" && startButtonFocusRef.current) {
      startButtonFocusRef.current = false;
      runPanelRef.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [run?.phase]);

  // Record each run once, when its clock runs out
  const finished = run?.phase === "finished";
  const result: CoordinateRunResult | null =
    run && finished
      ? {
          mode: runOptions.mode,
          seconds: runOptions.seconds,
          perspective: runOptions.perspective,
          withPieces: runOptions.withPieces,
          score: run.score,
          misses: run.misses,
        }
      : null;
  const resultRef = useRef(result);
  // Read through a ref: the sound function changes when the sound setting
  // does, which mustn't record the run again
  const playGameEndSoundRef = useRef(playGameEndSound);
  useEffect(() => {
    resultRef.current = result;
    playGameEndSoundRef.current = playGameEndSound;
  });
  const { mutate } = record;
  useEffect(() => {
    if (!finished || !resultRef.current) return;
    playGameEndSoundRef.current();
    mutate(resultRef.current);
    // Focus doesn't scroll for a button that is in the window but under the
    // phone's bottom bar, so bring it clear of that (see its scroll margin)
    playAgainRef.current?.focus({ preventScroll: true });
    playAgainRef.current?.scrollIntoView({ block: "nearest" });
  }, [finished, mutate]);

  const onSquare = useCallback(
    (square: Key) => {
      if (!run || run.phase === "finished") return;
      playSound(square === run.target ? "move" : "capture");
      click(square);
    },
    [click, playSound, run]
  );

  // Escape stops a run (nothing is recorded)
  const running = run?.phase === "ready" || run?.phase === "running";
  useEffect(() => {
    if (!running) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) stop();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [running, stop]);

  const newBest = record.data
    ? isNewBest(record.data.run.score, record.data.previousBest)
    : finished && run
      ? isNewBest(run.score, bestBeforeRef.current)
      : false;
  const resultBest = record.data?.best.best ?? Math.max(best ?? 0, run?.score ?? 0);

  let panel;
  if (run && finished) {
    panel = (
      <RunResult
        ref={playAgainRef}
        options={runOptions}
        score={run.score}
        misses={run.misses}
        best={resultBest}
        newBest={newBest}
        saving={record.isPending}
        saveFailed={record.isError}
        onRetrySave={() => result && record.mutate(result)}
        onPlayAgain={begin}
        onChangeOptions={stop}
      />
    );
  } else if (run) {
    panel = <RunPanel ref={runPanelRef} run={run} timeLeftMs={timeLeftMs} onStop={stop} />;
  } else {
    panel = (
      <RunSetup
        options={options}
        onChange={setOptions}
        onStart={begin}
        best={best}
        bestPending={scores.isPending}
      />
    );
  }

  return (
    <GameLayout
      bareBoard
      // Before a run the board only previews the options: on a phone it
      // would push Start below the fold, so the controls come alone there
      // and the board appears with the run
      boardIsDecorative={!run}
      board={
        <CoordinatesBoard
          perspective={shownOptions.perspective}
          withPieces={shownOptions.withPieces}
          active={running}
          onSquare={onSquare}
          feedback={run?.feedback ?? null}
          target={running ? run?.target : undefined}
          next={running ? run?.next : undefined}
        />
      }
      sidebar={
        <div className="flex flex-col gap-6 rounded-2xl bg-card p-5">
          <PageHeader
            title="Coordinates"
            description={
              run
                ? undefined
                : "A square's name appears: click that square. Find as many as you can before the clock runs out. The clock starts with your first click."
            }
          />
          {/* One section the drill's controls swap in and out of */}
          <div>{panel}</div>
          {!running && (
            <RecentScores
              runs={recentFor(scores.data?.recent, shownOptions)}
              best={best}
              seconds={shownOptions.seconds}
              perspective={shownOptions.perspective}
              pending={scores.isPending}
              error={scores.isError}
            />
          )}
        </div>
      }
    />
  );
};

export default Coordinates;
