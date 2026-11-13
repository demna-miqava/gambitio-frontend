import { QKEY_USER_SETTINGS } from "@/constants/queryKeys";
import { updateSettings } from "@/services/settings";
import type { Settings } from "../types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type SettingsResponse = { data: Settings };

const MUTATION_KEY = ["update-settings"];

/**
 * Saves settings as soon as they change. The new value shows at once
 * (optimistic) and is put back if the server refuses it, so there's no Save
 * button and no "saved" toast for every switch; only failures are reported.
 */
export const useUpdateSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: MUTATION_KEY,
    mutationFn: (settings: Partial<Settings>) => updateSettings(settings),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: [QKEY_USER_SETTINGS] });
      const previous = queryClient.getQueryData<SettingsResponse>([QKEY_USER_SETTINGS]);
      if (previous) {
        queryClient.setQueryData<SettingsResponse>([QKEY_USER_SETTINGS], {
          ...previous,
          data: { ...previous.data, ...patch },
        });
      }
      return { previous };
    },
    onError: (error: Error, _patch, context) => {
      if (context?.previous) {
        queryClient.setQueryData([QKEY_USER_SETTINGS], context.previous);
      }
      toast.error("Couldn't save your settings", {
        description: error.message || "Check your connection and try again.",
      });
    },
    onSuccess: (response) => {
      // With several toggles in flight, an earlier response would undo the
      // later optimistic values; the last one to finish has them all
      if (queryClient.isMutating({ mutationKey: MUTATION_KEY }) <= 1) {
        queryClient.setQueryData([QKEY_USER_SETTINGS], response);
      }
    },
  });
};
