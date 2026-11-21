import { BoardLayout } from "@/features/game/components/BoardLayout";
import { useChessground } from "@/features/game/hooks/useChessground";
import { useUser } from "@/hooks/useUser";
import { PlayerAvatar } from "@/components/PlayerAvatar";

// A puzzle-like position for the decorative board: Black has just played
// ...Nf6?? and White to move mates with Qxf7#
const SAMPLE_PUZZLE = {
  fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
  lastMove: ["g8", "f6"] as const,
};

export const LandingBoard = () => {
  const { username, image } = useUser();
  const { boardRef } = useChessground(() => ({
    fen: SAMPLE_PUZZLE.fen,
    lastMove: [...SAMPLE_PUZZLE.lastMove],
    viewOnly: true,
    coordinates: true,
  }));

  return (
    <BoardLayout
      boardRef={boardRef}
      bottomPlayer={{
        name: username,
        avatar: (
          <PlayerAvatar username={username} avatarUrl={image} size="sm" />
        ),
      }}
    />
  );
};
