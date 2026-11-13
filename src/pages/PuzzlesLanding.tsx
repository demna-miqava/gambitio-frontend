import { GameLayout } from "@/features/game/components/GameLayout";
import { LandingBoard } from "@/features/puzzles/components/layout/LandingBoard";
import { PuzzleModesList } from "@/features/puzzles/components/selectors/PuzzleModesList";
import { PageHeader } from "@/components/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const PuzzlesLanding = () => {
  useDocumentTitle("Puzzles");

  return (
    <GameLayout
      boardIsDecorative
      board={<LandingBoard />}
      sidebar={
        <div className="flex flex-col gap-6 rounded-2xl border border-border/70 bg-card p-5">
          <PageHeader
            title="Puzzles"
            description="Find the best move. Pick a mode to start training your tactics."
          />

          <PuzzleModesList />
        </div>
      }
    />
  );
};

export default PuzzlesLanding;
