import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveBotGame, type SaveBotGameBody } from "@/services/game";
import { QKEY_GAME_BY_ID, QKEY_USER_GAMES } from "@/constants/queryKeys";

export type BotGameSaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Saves a finished bot game once, as soon as `game` is set (pass null while
 * the game is on, or when there's nothing to save). The server stores it
 * unrated; it then shows up in the game history and opens in the archive.
 * Games abandoned mid-way are never passed in, so they aren't saved.
 */
export const useSaveBotGame = (game: SaveBotGameBody | null) => {
  const queryClient = useQueryClient();
  // One save per game: the effect can run again (re-renders, StrictMode's
  // extra mount) but the ref survives those
  const startedRef = useRef(false);

  const mutation = useMutation({
    mutationFn: saveBotGame,
    onSuccess: (saved) => {
      // The archive opens straight from the cache
      queryClient.setQueryData([QKEY_GAME_BY_ID, String(saved.id)], saved);
      // Home and profile game lists
      void queryClient.invalidateQueries({ queryKey: [QKEY_USER_GAMES] });
    },
  });
  const { mutate } = mutation;

  useEffect(() => {
    if (!game || startedRef.current) return;
    startedRef.current = true;
    mutate(game);
  }, [game, mutate]);

  const status: BotGameSaveStatus = mutation.isSuccess
    ? "saved"
    : mutation.isError
      ? "error"
      : game
        ? "saving"
        : "idle";

  return {
    status,
    /** The stored game's id once saved */
    gameId: mutation.data?.id ?? null,
    /** Tries again after a failed save */
    retry: () => {
      if (game && mutation.isError) mutate(game);
    },
  };
};
