import { ImportGameForm } from "./ImportGameForm";
import { AnalysisSidebarContent } from "./AnalysisSidebarContent";

interface ImportGameSidebarProps {
  onLoadPgn: (pgn: string) => void;
  onNewGame: () => void;
  isGameLoaded: boolean;
}

const ImportGameSidebar = ({
  onLoadPgn,
  onNewGame,
  isGameLoaded,
}: ImportGameSidebarProps) => {
  return (
    // Fills the panel column once a game is loaded (GameLayout's fitPanel)
    <div className={isGameLoaded ? "w-full lg:h-full" : "w-full"}>
      {isGameLoaded ? (
        <AnalysisSidebarContent onNewGame={onNewGame} />
      ) : (
        <ImportGameForm onLoadPgn={onLoadPgn} />
      )}
    </div>
  );
};

export default ImportGameSidebar;
