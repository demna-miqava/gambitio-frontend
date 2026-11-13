import type { ReactNode } from "react";
import { ArchiveGameModeProvider } from "@/features/archive-game/modes/ArchiveGameModeProvider";
import { LiveGameModeProvider } from "@/features/current-game/modes/LiveGameModeProvider";
import { SimpleGameModeProvider } from "./SimpleGameModeProvider";
import { GAME_MODES, type GameModeId } from "./types";

export const GameModeProvider = ({
  mode,
  children,
}: {
  mode: GameModeId;
  children: ReactNode;
}) => {
  switch (mode) {
    case GAME_MODES.LIVE:
      return <LiveGameModeProvider>{children}</LiveGameModeProvider>;
    case GAME_MODES.ARCHIVE:
    case GAME_MODES.ANALYSIS:
      return (
        <ArchiveGameModeProvider mode={mode}>
          {children}
        </ArchiveGameModeProvider>
      );
    default:
      return (
        <SimpleGameModeProvider mode={mode}>
          {children}
        </SimpleGameModeProvider>
      );
  }
};
