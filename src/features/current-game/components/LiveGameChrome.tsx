import { useLeaveGuard } from "@/hooks/useLeaveGuard";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { LeaveGameDialog } from "@/components/LeaveGameDialog";
import { useChessBoardContext } from "@/features/game/contexts/ChessBoardContext";
import { useLiveGame } from "../contexts/LiveGameContext";

/**
 * The parts of the live game page that aren't board or panel: the page
 * heading and live region for screen readers, the tab title, and the
 * "Leave the game?" prompt while the game is on.
 */
export const LiveGameChrome = () => {
  const { game, spectating, gameEnded, connectionStatus, announcement } =
    useLiveGame();
  const { turn, color } = useChessBoardContext();
  const matchup = `${game.whitePlayer.username} vs ${game.blackPlayer.username}`;

  useDocumentTitle(
    spectating
      ? `Watching ${matchup}`
      : !gameEnded && turn === color
        ? "Your move"
        : matchup
  );

  // No prompt once the connection is lost: Reload is the way back in.
  // Spectators have nothing to lose by leaving.
  const blocker = useLeaveGuard(
    !spectating && !gameEnded && connectionStatus !== "lost"
  );

  return (
    <>
      <h1 className="sr-only">
        {spectating ? `Watching: ${matchup}` : `Game: ${matchup}`}
      </h1>
      {/* Opponent moves and game events, read out politely */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
      <LeaveGameDialog
        blocker={blocker}
        description="Your clock keeps running while you're away. You can get back to the game from Home."
      />
    </>
  );
};
