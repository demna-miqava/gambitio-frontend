import { useQuery } from "@tanstack/react-query";
import { Navigate, useNavigate } from "react-router-dom";
import { GameLayout } from "@/features/game/components/GameLayout";
import { LandingBoard } from "@/features/puzzles/components/layout/LandingBoard";
import { DuelLobby } from "@/features/puzzles/duel/components/DuelLobby";
import { getActiveDuel } from "@/services/puzzleDuels";
import { getPuzzleDuelRoute } from "@/constants/routes";
import { QKEY_ACTIVE_DUEL } from "@/constants/queryKeys";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

/** Puzzle duels: the lobby. A player with a duel on goes straight back to it. */
const PuzzleDuel = () => {
  useDocumentTitle("Puzzle duel");
  const navigate = useNavigate();
  const { data: activeDuelId } = useQuery({
    queryKey: [QKEY_ACTIVE_DUEL],
    queryFn: getActiveDuel,
    staleTime: 0,
    // Asked afresh on every visit: a kept answer would send a player whose
    // duel has ended back to it
    gcTime: 0,
  });
  if (activeDuelId) return <Navigate to={getPuzzleDuelRoute(activeDuelId)} replace />;
  return (
    <GameLayout
      boardIsDecorative
      board={<LandingBoard />}
      sidebar={
        <DuelLobby
          onStarted={(duelId) => {
            // The socket's "duel started" may have brought the player there already
            const route = getPuzzleDuelRoute(duelId);
            if (window.location.pathname !== route) navigate(route);
          }}
        />
      }
    />
  );
};

export default PuzzleDuel;
