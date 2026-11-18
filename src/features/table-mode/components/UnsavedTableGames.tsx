import { useEffect, useState } from "react";
import { CloudOff, Loader2, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatShortDate } from "@/lib/utils";
import { UNSAVED_KEY, UNSAVED_CHANGED_EVENT, loadUnsaved, removeUnsaved, type UnsavedTableGame } from "../utils/tableStorage";
import { useTableGameSaver } from "../hooks/useSaveTableGame";

const errorText = (error: unknown) =>
  (error as { response?: { data?: { error?: string } } } | null)?.response?.data?.error ??
  "Couldn't save it. Check your connection and try again.";

/**
 * Finished table games the server doesn't have yet (saving failed at the
 * table): kept on this device until they're saved or discarded.
 */
export const UnsavedTableGames = () => {
  const [games, setGames] = useState<UnsavedTableGame[]>(loadUnsaved);
  const [failed, setFailed] = useState<Record<string, string>>({});

  // A save that finishes elsewhere (the play screen's, still on its way
  // after "New game", or another tab's) takes the game off this list too
  useEffect(() => {
    const refresh = () => setGames(loadUnsaved());
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === UNSAVED_KEY) refresh();
    };
    window.addEventListener(UNSAVED_CHANGED_EVENT, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(UNSAVED_CHANGED_EVENT, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const save = useTableGameSaver();
  const saveGame = (game: UnsavedTableGame) =>
    save.mutate(game, {
      onSuccess: () => toast.success("Game saved to your history"),
      onError: (error) => setFailed((prev) => ({ ...prev, [game.id]: errorText(error) })),
    });

  if (games.length === 0) return null;

  return (
    <section aria-labelledby="unsaved-table-games" className="space-y-3 rounded-2xl bg-card p-4 sm:p-5">
      <h2 id="unsaved-table-games" className="flex items-center gap-2 text-sm font-medium">
        <CloudOff className="size-4 text-loss" aria-hidden="true" /> Not saved yet
      </h2>
      <p className="text-xs text-muted-foreground">These games are only on this device until they're saved.</p>
      <ul className="space-y-2">
        {games.map((game) => {
          const pending = save.isPending && save.variables?.id === game.id;
          return (
            <li key={game.id} className="space-y-1 rounded-xl bg-muted px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{game.label}</span>
                  <span className="block text-xs text-muted-foreground">{formatShortDate(new Date(game.finishedAt).toISOString())}</span>
                </span>
                <span className="flex shrink-0 gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Discard ${game.label}`}
                    disabled={pending}
                    onClick={() => removeUnsaved(game.id)}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                  <Button size="sm" disabled={pending} onClick={() => saveGame(game)}>
                    {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <UploadCloud aria-hidden="true" />}
                    Save
                  </Button>
                </span>
              </div>
              {failed[game.id] && (
                <p role="alert" className="text-xs text-loss">
                  {failed[game.id]}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
};
