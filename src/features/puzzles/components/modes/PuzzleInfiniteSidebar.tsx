import { useInfiniteMode } from "../../contexts";
import { PuzzleControls } from "../shared/PuzzleControls";
import { PuzzleRatingCard } from "../shared/PuzzleRatingCard";
import { PuzzleSessionStats } from "../shared/PuzzleSessionStats";
import { PuzzleThemePicker } from "../selectors/PuzzleThemePicker";

export const PuzzleInfiniteSidebar = () => {
  const { theme, onThemeChange, sessionStats } = useInfiniteMode();

  return (
    <div className="flex flex-col gap-3">
      <PuzzleRatingCard />
      <PuzzleThemePicker value={theme} onChange={onThemeChange} />
      {/* On phones it comes first, under the board: the result and Next button need no scrolling */}
      <div className="panel-first-stacked">
        <PuzzleControls />
      </div>
      <PuzzleSessionStats stats={sessionStats} />
    </div>
  );
};
