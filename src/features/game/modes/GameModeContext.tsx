import { createContext, useContext, type ComponentType } from "react";
import type { GameModeId, GameModeNavigation } from "./types";

export interface GameModeComponents {
  MovesList?: ComponentType;
  MoveControls?: ComponentType;
}

export interface GameModeContextValue {
  mode: GameModeId;
  navigation?: GameModeNavigation;
  components: GameModeComponents;
}

/* eslint-disable-next-line */
export const GameModeContext = createContext<GameModeContextValue | null>(null);

/* eslint-disable-next-line */
export const useGameMode = () => {
  const context = useContext(GameModeContext);
  if (!context) {
    throw new Error("useGameMode must be used within GameModeProvider");
  }
  return context;
};

export const GameModeMovesList = () => {
  const { components } = useGameMode();
  const Component = components.MovesList;
  return Component ? <Component /> : null;
};

export const GameModeMoveControls = () => {
  const { components } = useGameMode();
  const Component = components.MoveControls;
  return Component ? <Component /> : null;
};
