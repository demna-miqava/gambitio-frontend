import { QKEY_USER_SETTINGS } from "@/constants/queryKeys";
import { updateSettings } from "@/services/settings";
import type { Settings } from "../types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/utils";

type SettingsResponse = { data: Settings };

const MUTATION_KEY = ["update-settings"];

/**
 * The settings with one failed change undone: only the keys it set, and
 * only those no later change has set again, so another toggle saved (or on
 * its way) meanwhile still shows.
 */
export const undoPatch = (
  current: Settings,
  previous: Settings,
  patch: Partial<Settings>
): Settings => {
  const data: Record<string, unknown> = { ...current };
  for (const key of Object.keys(patch) as (keyof Settings)[]) {
    if (current[key] === patch[key]) data[key] = previous[key];
  }
  return data as Settings;
};

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
    onError: (error: Error, patch, context) => {
      const previous = context?.previous;
      if (previous) {
        queryClient.setQueryData<SettingsResponse>([QKEY_USER_SETTINGS], (current) =>
          current ? { ...current, data: undoPatch(current.data, previous.data, patch) } : previous
        );
      }
      // Then what the server has. Unless another change is still being
      // saved: a reload could answer before it lands and show it undone,
      // and its response (see onSuccess) has everything anyway
      if (queryClient.isMutating({ mutationKey: MUTATION_KEY }) <= 1) {
        void queryClient.invalidateQueries({ queryKey: [QKEY_USER_SETTINGS] });
      }
      toast.error("Couldn't save your settings", {
        description: getApiErrorMessage(error, "Check your connection and try again."),
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
