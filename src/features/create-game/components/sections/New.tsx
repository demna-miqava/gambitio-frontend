import { TimeControlsSection } from "../TimeControlsSection";
import { Challenges } from "../Challenges";
import { Actions } from "../Actions";
import { useGameSetup } from "@/features/create-game/GameSetupContext";

export const New = () => {
  const { isSearching } = useGameSetup();

  return (
    <div className="space-y-5">
      {/* Hidden (and locked) from the click until the search ends */}
      {!isSearching && <TimeControlsSection />}
      <Actions />
      <Challenges />
    </div>
  );
};
