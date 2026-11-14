import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QKEY_REPERTOIRE, QKEY_REPERTOIRE_CHECK } from "@/constants/queryKeys";
import {
  createRepertoireLine,
  deleteRepertoireLine,
  getRepertoire,
  getRepertoireCheck,
  recordLinePractice,
  updateRepertoireLine,
  type NewRepertoireLine,
  type RepertoireLine,
} from "@/services/repertoire";
import type { PlayerColor } from "@/features/game/types/game.types";

/** The signed-in player's lines, both colours. */
export const useRepertoire = () =>
  useQuery({ queryKey: [QKEY_REPERTOIRE], queryFn: getRepertoire, staleTime: 60_000 });

/** Recent games compared with the repertoire. */
export const useRepertoireCheck = (enabled = true) =>
  useQuery({
    queryKey: [QKEY_REPERTOIRE_CHECK],
    queryFn: () => getRepertoireCheck(20),
    enabled,
    staleTime: 60_000,
  });

/** Changes to lines also change how games compare with the repertoire. */
const useInvalidate = () => {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: [QKEY_REPERTOIRE] });
    void queryClient.invalidateQueries({ queryKey: [QKEY_REPERTOIRE_CHECK] });
  };
};

/** Replaces one line in the cached list, so the page updates before the refetch. */
const usePatchCache = () => {
  const queryClient = useQueryClient();
  return (line: RepertoireLine) =>
    queryClient.setQueryData<RepertoireLine[]>([QKEY_REPERTOIRE], (old) =>
      old?.map((l) => (l.id === line.id ? line : l))
    );
};

export const useCreateLine = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (line: NewRepertoireLine) => createRepertoireLine(line),
    onSuccess: invalidate,
  });
};

export const useUpdateLine = () => {
  const invalidate = useInvalidate();
  const patch = usePatchCache();
  return useMutation({
    mutationFn: ({ id, ...changes }: { id: number; name?: string; color?: PlayerColor }) =>
      updateRepertoireLine(id, changes),
    onSuccess: (line) => {
      patch(line);
      invalidate();
    },
  });
};

export const useDeleteLine = () => {
  const queryClient = useQueryClient();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: number) => deleteRepertoireLine(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<RepertoireLine[]>([QKEY_REPERTOIRE], (old) => old?.filter((l) => l.id !== id));
      invalidate();
    },
  });
};

/** Records a practice run; the list is patched in place (no refetch needed). */
export const useRecordPractice = () => {
  const patch = usePatchCache();
  return useMutation({
    mutationFn: ({ id, correct }: { id: number; correct: boolean }) => recordLinePractice(id, correct),
    onSuccess: patch,
  });
};
