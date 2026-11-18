import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QKEY_CONVERSION_DRILLS } from "@/constants/queryKeys";
import { deleteConversionDrill, getConversionDrills, recordDrillAttempt } from "@/services/conversionDrills";
import type { ConversionDrill } from "../types";

/** Whether a drill is due for review at `now` */
export const isDue = (drill: Pick<ConversionDrill, "dueAt">, now = Date.now()) =>
  new Date(drill.dueAt).getTime() <= now;

/** The player's drills, due ones first (GET /conversion-drills) */
export const useConversionDrills = () =>
  useQuery({
    queryKey: [QKEY_CONVERSION_DRILLS],
    queryFn: getConversionDrills,
    staleTime: 30_000,
  });

const replace = (list: ConversionDrill[] | undefined, drill: ConversionDrill) =>
  list?.map((d) => (d.id === drill.id ? drill : d));

/** Saves a finished attempt; the server schedules the next review */
export const useRecordDrillAttempt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ drillId, success, moves }: { drillId: number; success: boolean; moves: number }) =>
      recordDrillAttempt(drillId, { success, moves }),
    onSuccess: (drill) => {
      queryClient.setQueryData<ConversionDrill[]>([QKEY_CONVERSION_DRILLS], (old) => replace(old, drill));
      void queryClient.invalidateQueries({ queryKey: [QKEY_CONVERSION_DRILLS] });
    },
  });
};

export const useDeleteDrill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (drillId: number) => deleteConversionDrill(drillId),
    onSuccess: (_, drillId) => {
      queryClient.setQueryData<ConversionDrill[]>([QKEY_CONVERSION_DRILLS], (old) =>
        old?.filter((d) => d.id !== drillId)
      );
    },
  });
};
