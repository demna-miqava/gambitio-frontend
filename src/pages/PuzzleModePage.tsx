import { Navigate, useParams } from "react-router-dom";
import { ChessBoardProvider } from "@/features/game/contexts/ChessBoardContext";
import {
  InfinitePuzzleProvider,
  RushPuzzleProvider,
  SurvivalPuzzleProvider,
  CalculatePuzzleProvider,
} from "@/features/puzzles/contexts";
import { PuzzleBoard } from "@/features/puzzles/components/layout/PuzzleBoard";
import { GameLayout } from "@/features/game/components/GameLayout";
import { ROUTES } from "@/constants/routes";
import type { PuzzleMode } from "@/features/puzzles/types/puzzle.types";
import type { ReactNode } from "react";
import { PuzzleSidebar } from "@/features/puzzles/components/layout/PuzzleSidebar";
import { GameModeProvider } from "@/features/game/modes/GameModeProvider";
import { GAME_MODES } from "@/features/game/modes/types";
import { EngineAnalysisProvider } from "@/features/engine-analysis";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { usePuzzleTheme } from "@/features/puzzles/hooks/usePuzzleTheme";

/** Infinite is the rated mode, with the theme filter (?theme=) */
const InfiniteWithTheme = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = usePuzzleTheme();
  return (
    <InfinitePuzzleProvider theme={theme} onThemeChange={setTheme}>
      {children}
    </InfinitePuzzleProvider>
  );
};

const PROVIDERS: Record<
  PuzzleMode,
  ({ children }: { children: ReactNode }) => ReactNode
> = {
  infinite: InfiniteWithTheme,
  rush: RushPuzzleProvider,
  survival: SurvivalPuzzleProvider,
  calculate: CalculatePuzzleProvider,
};

const MODE_TITLES: Record<PuzzleMode, string> = {
  infinite: "Puzzles",
  rush: "Puzzle Rush",
  survival: "Survival",
  calculate: "Calculate first",
};

const VALID_MODES = Object.keys(MODE_TITLES) as PuzzleMode[];

const PuzzleModePage = () => {
  const { mode } = useParams<{ mode: string }>();
  const isValidMode = VALID_MODES.includes(mode as PuzzleMode);
  const title = isValidMode ? MODE_TITLES[mode as PuzzleMode] : undefined;
  useDocumentTitle(title);

  if (!isValidMode) {
    return <Navigate to={ROUTES.PUZZLES} replace />;
  }

  const Provider = PROVIDERS[mode as PuzzleMode];

  return (
    <ChessBoardProvider color="white" key={mode}>
      <Provider>
        <EngineAnalysisProvider>
        <GameModeProvider mode={GAME_MODES.PUZZLE}>
          <h1 className="sr-only">{title}</h1>
          <GameLayout
            bareBoard
            board={<PuzzleBoard />}
            sidebar={<PuzzleSidebar />}
          />
        </GameModeProvider>
        </EngineAnalysisProvider>
      </Provider>
    </ChessBoardProvider>
  );
};

export default PuzzleModePage;
