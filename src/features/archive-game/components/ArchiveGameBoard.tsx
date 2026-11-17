import { BoardLayout } from "@/features/game/components/BoardLayout";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { PlayerPopover } from "@/features/profile/components/PlayerPopover";
import { useChessBoardContext } from "@/features/game/contexts/ChessBoardContext";
import { AnalysisPromotion } from "./AnalysisPromotion";
import { BotAvatar } from "@/features/play-bots/components/BotAvatar";
import { useArchiveGame } from "../contexts/ArchiveGameContext";
import { boardLabel } from "../utils/announce";

interface ArchivePlayer {
  /** Missing for the computer and for imported games */
  id?: number | null;
  username: string;
  rating: number;
  avatarUrl?: string | null;
}

/** The avatar, opening the player's card when they have an account. */
const Avatar = ({ player }: { player: ArchivePlayer }) => {
  const avatar = (
    <PlayerAvatar username={player.username} avatarUrl={player.avatarUrl} size="sm" />
  );
  return player.id != null ? (
    <PlayerPopover player={{ ...player, id: player.id }}>{avatar}</PlayerPopover>
  ) : (
    avatar
  );
};

interface ArchiveGameBoardProps {
  whitePlayer: ArchivePlayer;
  blackPlayer: ArchivePlayer;
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
          <Avatar player={topPlayer} />
        ),
      }}
      bottomPlayer={{
        name: bottomPlayer.username,
        startingRating: bottomPlayer.rating,
        avatar: botSide === orientation ? (
          <BotAvatar rating={bottomPlayer.rating} className="size-8 rounded-lg" />
        ) : (
          <Avatar player={bottomPlayer} />
        ),
      }}
    >
      <AnalysisPromotion />
    </BoardLayout>
  );
};

export default ArchiveGameBoard;
