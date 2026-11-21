import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { GameLayout } from "@/features/game/components/GameLayout";
import { BotSelector } from "@/features/play-bots/components/BotSelector";
import { BotPreviewBoard } from "@/features/play-bots/components/BotPreviewBoard";
import { closestBot, type Bot } from "@/features/play-bots/constants/bots";
import type { PlayerColorOption } from "@/types/game.types";
import { useUser } from "@/hooks/useUser";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { FEN_PARAM } from "@/constants/routes";
import { playablePositionFromFen, toFen } from "@/features/board-editor/utils/editorPosition";

const PlayBots = () => {
  useDocumentTitle("Play the computer");
  const { blitzRating } = useUser();
  // A position from the board editor (?fen=); one that can't be played is ignored
  const [params] = useSearchParams();
  const position = playablePositionFromFen(params.get(FEN_PARAM));
  const startFen = position ? toFen(position) : undefined;
  const [selectedBot, setSelectedBot] = useState<Bot>(() => closestBot(blitzRating));
  // From a set-up position, the side to move is the natural one to take
  const naturalColor: PlayerColorOption = position ? (position.turn === "w" ? "white" : "black") : "random";
  const [selectedColor, setSelectedColor] = useState<PlayerColorOption>(naturalColor);
  // The page stays mounted when the position in the address changes or goes
  // (Play the computer in the sidebar, from a set-up position): the side
  // follows it, as the board does
  const [colorSetFor, setColorSetFor] = useState(startFen);
  if (colorSetFor !== startFen) {
    setColorSetFor(startFen);
    setSelectedColor(naturalColor);
  }

  return (
    <GameLayout
      board={<BotPreviewBoard bot={selectedBot} color={selectedColor} fen={startFen} />}
      sidebar={
        <BotSelector
          selectedBot={selectedBot}
          onSelectBot={setSelectedBot}
          selectedColor={selectedColor}
          onSelectColor={setSelectedColor}
          startFen={startFen}
        />
      }
      boardIsDecorative={!startFen}
    />
  );
};

export default PlayBots;
