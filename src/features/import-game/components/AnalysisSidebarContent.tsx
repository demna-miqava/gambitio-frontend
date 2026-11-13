import { AnalysisPanel } from "@/features/archive-game/components/AnalysisPanel";

interface AnalysisSidebarContentProps {
  onNewGame: () => void;
}

/** The analysis panel with "Load another PGN" (in the header menu on desktop). */
export const AnalysisSidebarContent = ({ onNewGame }: AnalysisSidebarContentProps) => (
  <AnalysisPanel onLoadAnotherPgn={onNewGame} />
);
