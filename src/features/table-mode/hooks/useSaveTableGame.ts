import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QKEY_GAME_BY_ID, QKEY_USER_GAMES } from "@/constants/queryKeys";
import type { UnsavedTableGame } from "../utils/tableStorage";
import { saveUnsavedTableGame } from "../utils/tableSave";

export type TableSaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * A mutation that saves a finished table game (saveUnsavedTableGame) and
 * puts the stored game in the cache. Shared by the play screen and the
 * "Not saved yet" list, so both go through the same path.
 */
export const useTableGameSaver = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveUnsavedTableGame,
    onSuccess: (saved) => {
      queryClient.setQueryData([QKEY_GAME_BY_ID, String(saved.id)], saved);
      void queryClient.invalidateQueries({ queryKey: [QKEY_USER_GAMES] });
    },
  });
};

/**
 * Saves a finished table game once, as soon as `game` is set. It is already
 * kept on the device (queueUnsaved) before this runs, and only taken off
 * once the server has it: a failed save (no connection at the table) stays
 * there for a retry, here or later from the table mode page.
 */
export const useSaveTableGame = (game: UnsavedTableGame | null) => {
  const startedRef = useRef<string | null>(null);
  const mutation = useTableGameSaver();
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
