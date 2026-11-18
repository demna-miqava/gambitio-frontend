import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveTableGame } from "@/services/game";
import { QKEY_GAME_BY_ID, QKEY_USER_GAMES } from "@/constants/queryKeys";
import { removeUnsaved, type UnsavedTableGame } from "../utils/tableStorage";

export type TableSaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Saves a finished table game once, as soon as `game` is set. It is already
 * kept on the device (queueUnsaved) before this runs, and only taken off
 * once the server has it: a failed save (no connection at the table) stays
 * there for a retry, here or later from the table mode page.
 */
export const useSaveTableGame = (game: UnsavedTableGame | null) => {
  const queryClient = useQueryClient();
  const startedRef = useRef<string | null>(null);

  const mutation = useMutation({
    mutationFn: (item: UnsavedTableGame) => saveTableGame(item.body),
    onSuccess: (saved, item) => {
      removeUnsaved(item.id);
      queryClient.setQueryData([QKEY_GAME_BY_ID, String(saved.id)], saved);
      void queryClient.invalidateQueries({ queryKey: [QKEY_USER_GAMES] });
    },
  });
  const { mutate } = mutation;

  useEffect(() => {
    if (!game || startedRef.current === game.id) return;
    startedRef.current = game.id;
    mutate(game);
  }, [game, mutate]);

  const status: TableSaveStatus = mutation.isSuccess
    ? "saved"
    : mutation.isError
      ? "error"
      : game
        ? "saving"
        : "idle";

  return {
    status,
    error: mutation.error,
    gameId: mutation.data?.id ?? null,
    retry: () => {
      if (game && !mutation.isPending) mutate(game);
    },
  };
};
