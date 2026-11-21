import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QKEY_COORDINATE_SCORES } from "@/constants/queryKeys";
import { getCoordinateScores, recordCoordinateRun } from "@/services/coordinates";
import type { CoordinateRunResult, CoordinateScores } from "../types";

/** The player's bests and latest runs (GET /coordinates/scores). */
export const useCoordinateScores = () =>
  useQuery({
    queryKey: [QKEY_COORDINATE_SCORES],
    queryFn: getCoordinateScores,
    staleTime: 60_000,
  });

/** Saves a finished run and puts it, and the best, into the cached scores. */
export const useRecordCoordinateRun = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (run: CoordinateRunResult) => recordCoordinateRun(run),
    onSuccess: ({ run, best }) => {
      queryClient.setQueryData<CoordinateScores>([QKEY_COORDINATE_SCORES], (old) =>
        old
          ? {
              bests: [
                ...old.bests.filter(
                  (b) => !(b.mode === best.mode && b.seconds === best.seconds && b.perspective === best.perspective)
                ),
                best,
              ],
              recent: [run, ...old.recent.filter((r) => r.id !== run.id)],
            }
          : old
      );
    },
  });
};
