import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QKEY_ENDGAME_PROGRESS } from "@/constants/queryKeys";
import { getEndgameProgress, recordEndgameAttempt } from "@/services/endgames";
import type { EndgameProgress } from "../types";

/** Progress per exercise id, from GET /endgames/progress. */
export const useEndgameProgress = () => {
  const query = useQuery({
    queryKey: [QKEY_ENDGAME_PROGRESS],
    queryFn: getEndgameProgress,
    staleTime: 60_000,
  });
  const byId = useMemo(
    () => new Map<string, EndgameProgress>((query.data ?? []).map((p) => [p.exerciseId, p])),
    [query.data]
  );
  return { ...query, byId };
};

/** Saves a finished attempt and refreshes the progress (the server keeps the best result). */
export const useRecordEndgameAttempt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ exerciseId, success, moves }: { exerciseId: string; success: boolean; moves: number }) =>
      recordEndgameAttempt(exerciseId, { success, moves }),
    onSuccess: (progress) => {
      queryClient.setQueryData<EndgameProgress[]>([QKEY_ENDGAME_PROGRESS], (old) =>
        old ? [...old.filter((p) => p.exerciseId !== progress.exerciseId), progress] : old
      );
      void queryClient.invalidateQueries({ queryKey: [QKEY_ENDGAME_PROGRESS] });
    },
  });
};
