import { useEffect } from "react";
import { BoardLayout } from "@/features/game/components/BoardLayout";
import { useChessground } from "@/features/game/hooks/useChessground";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { useUser } from "@/hooks/useUser";
import type { PlayerColorOption } from "@/types/game.types";
import type { Bot } from "../constants/bots";
import { BotAvatar } from "./BotAvatar";

const START_PLACEMENT = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";

/**
 * View-only starting position next to the bot picker: shows the chosen
 * opponent and side, with no moves and no sound. `fen`: a position set up
 * in the board editor, shown instead of the usual start.
 */
export const BotPreviewBoard = ({
  bot,
  color,
  fen,
}: {
  bot: Bot;
  color: PlayerColorOption;
  fen?: string;
}) => {
  const { username, image } = useUser();
  const orientation = color === "black" ? "black" : "white";
  const { boardRef, cgRef } = useChessground(() => ({ viewOnly: true, coordinates: true, ...(fen && { fen }) }));

  useEffect(() => {
    cgRef.current?.set({ orientation });
  }, [cgRef, orientation]);

  // Without a set-up position (also after leaving one, on the same page): the usual start
  useEffect(() => {
    cgRef.current?.set({ fen: fen ?? START_PLACEMENT });
  }, [cgRef, fen]);

  return (
    <BoardLayout
      boardRef={boardRef}
      topPlayer={{
        name: bot.name,
        startingRating: bot.rating,
        avatar: <BotAvatar rating={bot.rating} className="size-8 rounded-lg" />,
      }}
      bottomPlayer={{
        name: username,
        avatar: <PlayerAvatar username={username} avatarUrl={image} size="sm" />,
      }}
    />
  );
};
