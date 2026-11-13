import { useEffect, useRef } from "react";
import { Chessground } from "@lichess-org/chessground";
import { BoardLayout } from "@/features/game/components/BoardLayout";
import { useUser } from "@/hooks/useUser";
import { PlayerAvatar } from "@/components/PlayerAvatar";

// A puzzle-like position for the decorative board: Black has just played
// ...Nf6?? and White to move mates with Qxf7#
const SAMPLE_PUZZLE = {
  fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
  lastMove: ["g8", "f6"] as const,
};

export const LandingBoard = () => {
  const boardRef = useRef<HTMLDivElement>(null);
  const { username, image } = useUser();

  useEffect(() => {
    if (!boardRef.current) return;
    const cg = Chessground(boardRef.current, {
      fen: SAMPLE_PUZZLE.fen,
      lastMove: [...SAMPLE_PUZZLE.lastMove],
      viewOnly: true,
      coordinates: true,
    });
    return () => cg.destroy();
  }, []);

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
