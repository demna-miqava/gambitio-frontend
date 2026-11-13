import { useMemo, type ReactNode } from "react";
import { AnalysisMovesList } from "@/features/archive-game/components/AnalysisMovesList";
import { AnalysisMoveControls } from "@/features/archive-game/components/AnalysisMoveControls";
import { useArchiveGame } from "@/features/archive-game/contexts/ArchiveGameContext";
import {
  GameModeContext,
  type GameModeContextValue,
} from "@/features/game/modes/GameModeContext";
import { GAME_MODES, type GameModeNavigation } from "@/features/game/modes/types";

type ArchiveMode = typeof GAME_MODES.ARCHIVE | typeof GAME_MODES.ANALYSIS;

export const ArchiveGameModeProvider = ({
  children,
  mode,
}: {
  children: ReactNode;
  mode: ArchiveMode;
}) => {
  const navigationState = useArchiveGame();

  const navigation = useMemo<GameModeNavigation>(
    () => ({
      goToStart: navigationState.goToStart,
      goToEnd: navigationState.goToEnd,
      goBack: navigationState.goBack,
      goForward: navigationState.goForward,
      isAtStart: navigationState.isAtStart,
      isAtEnd: navigationState.isAtEnd,
    }),
    [
      navigationState.goToStart,
      navigationState.goToEnd,
      navigationState.goBack,
      navigationState.goForward,
      navigationState.isAtStart,
      navigationState.isAtEnd,
    ]
  );

  const value = useMemo<GameModeContextValue>(
    () => ({
      mode,
      navigation,
      components: {
        MovesList: AnalysisMovesList,
        MoveControls: AnalysisMoveControls,
      },
    }),
    [mode, navigation]
  );

  return (
    <GameModeContext.Provider value={value}>
      {children}
    </GameModeContext.Provider>
  );
};
