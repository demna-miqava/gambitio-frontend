import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface GameShellValue {
  /** The right-hand end of the phone top bar on game pages, or null when there is no bar */
  topBarSlot: HTMLElement | null;
  setTopBarSlot: (element: HTMLElement | null) => void;
  /**
   * Where a player's card opens on a live game page: over the top of the
   * side rail, so it never covers the board. Null where there is no rail
   * beside the board (other pages, phones, the rail under the board).
   */
  cardDock: HTMLElement | null;
  setCardDock: (element: HTMLElement | null) => void;
  /** A game is being played in focus mode: the app's navigation steps aside */
  focusActive: boolean;
  setFocusActive: (active: boolean) => void;
}

const GameShellContext = createContext<GameShellValue | null>(null);

/**
 * What a game page shares with the app shell around it: a place in the
 * phone top bar for the game's tools, where a player's card opens, and
 * whether focus mode is on.
 */
export const GameShellProvider = ({ children }: { children: ReactNode }) => {
  const [topBarSlot, setTopBarSlot] = useState<HTMLElement | null>(null);
  const [cardDock, setCardDock] = useState<HTMLElement | null>(null);
  const [focusActive, setFocusActive] = useState(false);
  const value = useMemo(
    () => ({ topBarSlot, setTopBarSlot, cardDock, setCardDock, focusActive, setFocusActive }),
    [topBarSlot, cardDock, focusActive]
  );
  return <GameShellContext.Provider value={value}>{children}</GameShellContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useGameShell = () => {
  const context = useContext(GameShellContext);
  if (!context) throw new Error("useGameShell must be used within GameShellProvider");
  return context;
};

/**
 * The player card's dock on this page, if there is one (see cardDock). Null
 * too outside the app shell, e.g. on a shared game opened signed out.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const usePlayerCardDock = () => useContext(GameShellContext)?.cardDock ?? null;

/**
 * Renders its children in the phone top bar of a game page. Nothing where
 * there is no such bar (from 768px the tools sit in the game's side panel).
 */
export const TopBarSlot = ({ children }: { children: ReactNode }) => {
  const { topBarSlot } = useGameShell();
  return topBarSlot ? createPortal(children, topBarSlot) : null;
};
