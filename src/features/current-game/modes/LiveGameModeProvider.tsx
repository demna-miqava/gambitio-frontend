import { useMemo, type ReactNode } from "react";
import { MovesList } from "@/features/game/components/MovesList";
import MoveControls from "@/features/game/components/MoveControls";
import { useGameNavigation } from "@/features/game/contexts/GameNavigationContext";
import {
  GameModeContext,
  type GameModeContextValue,
} from "@/features/game/modes/GameModeContext";
import { GAME_MODES, type GameModeNavigation } from "@/features/game/modes/types";

export const LiveGameModeProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const navigationState = useGameNavigation();

  const navigation = useMemo<GameModeNavigation>(
    () => ({
      goToStart: navigationState.goToFirstMove,
      goToEnd: navigationState.goToLastMove,
      goBack: navigationState.goToPreviousMove,
      goForward: navigationState.goToNextMove,
      isAtStart: navigationState.isAtStart,
      isAtEnd: navigationState.isAtEnd,
      currentIndex: navigationState.currentIndex,
      viewingIndex: navigationState.viewingIndex,
      isViewingHistory: navigationState.isViewingHistory,
    }),
    [
      navigationState.goToFirstMove,
      navigationState.goToLastMove,
      navigationState.goToPreviousMove,
      navigationState.goToNextMove,
      navigationState.isAtStart,
      navigationState.isAtEnd,
      navigationState.currentIndex,
      navigationState.viewingIndex,
      navigationState.isViewingHistory,
    ]
  );

  const value = useMemo<GameModeContextValue>(
    () => ({
      mode: GAME_MODES.LIVE,
      navigation,
      components: {
        MovesList,
        MoveControls,
      },
    }),
    [navigation]
  );

  return (
    <GameModeContext.Provider value={value}>
      {children}
    </GameModeContext.Provider>
  );
};
