import { useCallback, useState } from "react";
import { userStore } from "@/utils/userStorage";
import { parseOptions } from "../utils/coordinates";
import type { CoordinateOptions } from "../types";

const store = userStore("coordinates", { maxEntries: 1 });
const KEY = "options";

/** The options picked last time, kept per account in this browser. */
export const useCoordinateOptions = () => {
  const [options, setOptionsState] = useState<CoordinateOptions>(() => parseOptions(store.get(KEY)));
  const setOptions = useCallback((change: Partial<CoordinateOptions>) => {
    setOptionsState((old) => {
      const next = { ...old, ...change };
      store.set(KEY, JSON.stringify(next));
      return next;
    });
  }, []);
  return [options, setOptions] as const;
};
