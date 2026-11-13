import { useMemo, type ReactNode } from "react";
import {
  GameModeContext,
  type GameModeContextValue,
} from "./GameModeContext";
import type { GameModeId } from "./types";

const emptyComponents = {};

export const SimpleGameModeProvider = ({
  children,
  mode,
}: {
  children: ReactNode;
  mode: GameModeId;
}) => {
  const value = useMemo<GameModeContextValue>(
    () => ({
      mode,
      components: emptyComponents,
    }),
    [mode]
  );

  return (
    <GameModeContext.Provider value={value}>
      {children}
    </GameModeContext.Provider>
  );
};
