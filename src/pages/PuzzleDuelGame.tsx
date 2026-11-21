import { Navigate, useParams } from "react-router-dom";
import { GameLayout } from "@/features/game/components/GameLayout";
import { DuelBoard } from "@/features/puzzles/duel/components/DuelBoard";
import { PuzzleDuelSidebar } from "@/features/puzzles/duel/components/PuzzleDuelSidebar";
import { useDuelGame } from "@/features/puzzles/duel/hooks/useDuelGame";
import { ROUTES } from "@/constants/routes";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { parsePositiveId } from "@/utils/ids";

const DuelView = ({ duelId }: { duelId: number }) => {
  const game = useDuelGame(duelId);
  useDocumentTitle(game.phase === "over" ? "Puzzle duel: result" : "Puzzle duel");
  return <GameLayout board={<DuelBoard game={game} />} sidebar={<PuzzleDuelSidebar game={game} />} />;
};

/** A puzzle duel being played (or its result). Coming back here rejoins it: the clock never stopped. */
const PuzzleDuelGame = () => {
  const { duelId } = useParams<{ duelId: string }>();
  const id = parsePositiveId(duelId ?? "");
  if (!id) return <Navigate to={ROUTES.PUZZLE_DUEL} replace />;
  return <DuelView key={id} duelId={id} />;
};

export default PuzzleDuelGame;
