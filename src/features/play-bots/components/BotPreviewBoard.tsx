import { useEffect, useRef } from "react";
import { Chessground } from "@lichess-org/chessground";
import type { Api } from "@lichess-org/chessground/api";
import { BoardLayout } from "@/features/game/components/BoardLayout";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { useUser } from "@/hooks/useUser";
import type { PlayerColorOption } from "@/types/game.types";
import type { Bot } from "../constants/bots";
import { BotAvatar } from "./BotAvatar";

/**
 * View-only starting position next to the bot picker: shows the chosen
 * opponent and side, with no moves and no sound.
 */
export const BotPreviewBoard = ({
  bot,
  color,
}: {
  bot: Bot;
  color: PlayerColorOption;
}) => {
  const { username, image } = useUser();
  const boardRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);
  const orientation = color === "black" ? "black" : "white";

  useEffect(() => {
    if (!boardRef.current) return;
    const cg = Chessground(boardRef.current, { viewOnly: true, coordinates: true });
    cgRef.current = cg;
    return () => {
      cg.destroy();
      cgRef.current = null;
    };
  }, []);

  useEffect(() => {
    cgRef.current?.set({ orientation });
  }, [orientation]);

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
