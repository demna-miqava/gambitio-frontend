import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { FullScreenLoader } from "@/components/FullScreenLoader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useUser } from "@/hooks/useUser";
import { ROUTES } from "@/constants/routes";
import { TableSetupForm } from "@/features/table-mode/components/TableSetupForm";
import { UnsavedTableGames } from "@/features/table-mode/components/UnsavedTableGames";
import { isInProgress, newTableGame, newTableGameId } from "@/features/table-mode/utils/tableGame";
import { loadCurrentGame, storeCurrentGame } from "@/features/table-mode/utils/tableStorage";

/**
 * Table mode: one phone as the clock and move recorder for two people at a
 * real board. Set up a game here (or go back to the one on this device);
 * it's played on ROUTES.TABLE_GAME. While a game is in progress here, no
 * other can be set up: it has to be resumed, or abandoned (after asking).
 */
const TableMode = () => {
  useDocumentTitle("Table mode");
  const navigate = useNavigate();
  const { id, username } = useUser();
  const [current, setCurrent] = useState(loadCurrentGame);
  const [confirmAbandon, setConfirmAbandon] = useState(false);

  if (id === undefined) return <FullScreenLoader height="h-[60vh] w-full" />;

  const inPlay = isInProgress(current);
  const forget = () => {
    storeCurrentGame(null);
    setCurrent(null);
  };

  return (
    <PageContainer className="max-w-xl space-y-5 pb-10">
      <PageHeader
        title="Table mode"
        description="Playing at a real board? Use this phone as the chess clock and to record the moves, then review the game later."
      />

      {current && (
        <section aria-label="Game on this device" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card p-4">
          <p className="text-sm">
            {inPlay
              ? "A game is in progress on this device. Resume it, or abandon it to set up a new one."
              : "Your last table game is still open."}
          </p>
          <span className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (inPlay ? setConfirmAbandon(true) : forget())}
            >
              <Trash2 aria-hidden="true" /> {inPlay ? "Abandon" : "Close"}
            </Button>
            <Button size="sm" onClick={() => navigate(ROUTES.TABLE_GAME)}>
              <Play aria-hidden="true" /> {inPlay ? "Resume" : "Open"}
            </Button>
          </span>
        </section>
      )}

      <UnsavedTableGames />

      {!inPlay && (
        <TableSetupForm
          myId={id}
          myName={username || "You"}
          onStart={(setup) => {
            // One started meanwhile (in another tab) is never overwritten
            const stored = loadCurrentGame();
            if (isInProgress(stored)) return setCurrent(stored);
            storeCurrentGame(newTableGame(setup, Date.now(), newTableGameId()));
            navigate(ROUTES.TABLE_GAME);
          }}
        />
      )}

      <ConfirmDialog
        open={confirmAbandon}
        onOpenChange={setConfirmAbandon}
        title="Abandon the game in progress?"
        description="It ends here and isn't saved."
        confirmLabel="Abandon"
        destructive
        onConfirm={() => {
          setConfirmAbandon(false);
          forget();
        }}
      />
    </PageContainer>
  );
};

export default TableMode;
