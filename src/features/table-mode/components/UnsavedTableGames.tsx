import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CloudOff, Loader2, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveTableGame } from "@/services/game";
import { QKEY_USER_GAMES } from "@/constants/queryKeys";
import { formatShortDate } from "@/lib/utils";
import { loadUnsaved, removeUnsaved, type UnsavedTableGame } from "../utils/tableStorage";

const errorText = (error: unknown) =>
  (error as { response?: { data?: { error?: string } } } | null)?.response?.data?.error ??
  "Couldn't save it. Check your connection and try again.";

/**
 * Finished table games the server doesn't have yet (saving failed at the
 * table): kept on this device until they're saved or discarded.
 */
export const UnsavedTableGames = () => {
  const queryClient = useQueryClient();
  const [games, setGames] = useState<UnsavedTableGame[]>(loadUnsaved);
  const [failed, setFailed] = useState<Record<string, string>>({});
  const refresh = () => setGames(loadUnsaved());

  const save = useMutation({
    mutationFn: (game: UnsavedTableGame) => saveTableGame(game.body),
    onSuccess: (_saved, game) => {
      removeUnsaved(game.id);
      refresh();
      toast.success("Game saved to your history");
      void queryClient.invalidateQueries({ queryKey: [QKEY_USER_GAMES] });
    },
    onError: (error, game) => setFailed((prev) => ({ ...prev, [game.id]: errorText(error) })),
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
                    onClick={() => {
                      removeUnsaved(game.id);
                      refresh();
                    }}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                  <Button size="sm" disabled={pending} onClick={() => save.mutate(game)}>
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
