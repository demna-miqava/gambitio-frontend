import { BoardLayout } from "@/features/game/components/BoardLayout";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { useChessBoardContext } from "@/features/game/contexts/ChessBoardContext";
import { AnalysisPromotion } from "./AnalysisPromotion";
import { BotAvatar } from "@/features/play-bots/components/BotAvatar";
import { useArchiveGame } from "../contexts/ArchiveGameContext";
import { boardLabel } from "../utils/announce";

interface ArchiveGameBoardProps {
  whitePlayer: {
    username: string;
    rating: number;
    avatarUrl?: string | null;
  };
  blackPlayer: {
    username: string;
    rating: number;
    avatarUrl?: string | null;
  };
  /** Kept for callers; finished games don't show clocks */
  timeControl?: number;
  /** The computer's side in a bot game (gets a bot avatar) */
  botSide?: "white" | "black";
}

const ArchiveGameBoard = ({
  whitePlayer,
  blackPlayer,
  botSide,
}: ArchiveGameBoardProps) => {
  const { boardRef, color } = useChessBoardContext();
  const { currentNode } = useArchiveGame();

  const topPlayer = color === "white" ? blackPlayer : whitePlayer;
  const bottomPlayer = color === "white" ? whitePlayer : blackPlayer;

  return (
    <BoardLayout
      boardRef={boardRef}
      boardLabel={boardLabel(currentNode)}
      topPlayer={{
        name: topPlayer.username,
        startingRating: topPlayer.rating,
        avatar: botSide === (color === "white" ? "black" : "white") ? (
          <BotAvatar rating={topPlayer.rating} className="size-8 rounded-lg" />
        ) : (
          <PlayerAvatar
            username={topPlayer.username}
            avatarUrl={topPlayer.avatarUrl}
            isOpponent={color === "white"}
            size="sm"
          />
        ),
      }}
      bottomPlayer={{
        name: bottomPlayer.username,
        startingRating: bottomPlayer.rating,
        avatar: botSide === color ? (
          <BotAvatar rating={bottomPlayer.rating} className="size-8 rounded-lg" />
        ) : (
          <PlayerAvatar
            username={bottomPlayer.username}
            avatarUrl={bottomPlayer.avatarUrl}
            isOpponent={color === "black"}
            size="sm"
          />
        ),
      }}
    >
      <AnalysisPromotion />
    </BoardLayout>
  );
};

export default ArchiveGameBoard;
