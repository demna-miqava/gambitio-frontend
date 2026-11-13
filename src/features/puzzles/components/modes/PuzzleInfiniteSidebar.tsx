import { useInfiniteMode } from "../../contexts";
import { PuzzleControls } from "../shared/PuzzleControls";
import { PuzzleRatingCard } from "../shared/PuzzleRatingCard";
import { PuzzleSessionStats } from "../shared/PuzzleSessionStats";
import { PuzzleThemePicker } from "../selectors/PuzzleThemePicker";

export const PuzzleInfiniteSidebar = () => {
  const { theme, onThemeChange, sessionStats } = useInfiniteMode();

  return (
    <div className="space-y-3">
      <PuzzleRatingCard />
      <PuzzleThemePicker value={theme} onChange={onThemeChange} />
      <PuzzleControls />
      <PuzzleSessionStats stats={sessionStats} />
    </div>
  );
};
