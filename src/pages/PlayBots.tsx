import { useState } from "react";
import { GameLayout } from "@/features/game/components/GameLayout";
import { BotSelector } from "@/features/play-bots/components/BotSelector";
import { BotPreviewBoard } from "@/features/play-bots/components/BotPreviewBoard";
import { closestBot, type Bot } from "@/features/play-bots/constants/bots";
import type { PlayerColorOption } from "@/types/game.types";
import { useUser } from "@/hooks/useUser";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const PlayBots = () => {
  useDocumentTitle("Play the computer");
  const { blitzRating } = useUser();
  const [selectedBot, setSelectedBot] = useState<Bot>(() => closestBot(blitzRating));
  const [selectedColor, setSelectedColor] = useState<PlayerColorOption>("random");

  return (
    <GameLayout
      board={<BotPreviewBoard bot={selectedBot} color={selectedColor} />}
      sidebar={
        <BotSelector
          selectedBot={selectedBot}
          onSelectBot={setSelectedBot}
          selectedColor={selectedColor}
          onSelectColor={setSelectedColor}
        />
      }
      boardIsDecorative
    />
  );
};

export default PlayBots;
