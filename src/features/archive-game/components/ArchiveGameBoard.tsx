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
  // Rows follow the board when it's flipped
  const { boardRef, orientation } = useChessBoardContext();
  const { currentNode } = useArchiveGame();

  const topSide = orientation === "white" ? "black" : "white";
  const topPlayer = topSide === "white" ? whitePlayer : blackPlayer;
  const bottomPlayer = topSide === "white" ? blackPlayer : whitePlayer;

  return (
    <BoardLayout
      boardRef={boardRef}
      boardLabel={boardLabel(currentNode)}
      material={{ fen: currentNode.fen, bottom: orientation }}
      topPlayer={{
        name: topPlayer.username,
        startingRating: topPlayer.rating,
        avatar: botSide === topSide ? (
          <BotAvatar rating={topPlayer.rating} className="size-8 rounded-lg" />
        ) : (
          <PlayerAvatar
            username={topPlayer.username}
            avatarUrl={topPlayer.avatarUrl}
            size="sm"
          />
        ),
      }}
      bottomPlayer={{
        name: bottomPlayer.username,
        startingRating: bottomPlayer.rating,
        avatar: botSide === orientation ? (
          <BotAvatar rating={bottomPlayer.rating} className="size-8 rounded-lg" />
        ) : (
          <PlayerAvatar
            username={bottomPlayer.username}
            avatarUrl={bottomPlayer.avatarUrl}
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
