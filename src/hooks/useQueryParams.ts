import { useSearchParams } from "react-router-dom";
import { useCallback, useMemo } from "react";

export const useQueryParams = (key: string, defaultValue: string = "") => {
  const [searchParams, setSearchParams] = useSearchParams();

  const value = useMemo(() => {
    return searchParams.get(key) || defaultValue;
  }, [searchParams, key, defaultValue]);

  // Changes a copy: the hook's searchParams is React Router's memoized object
  // for the current URL, which other readers of it still see
  const setValue = useCallback(
    (newValue: string | undefined) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        if (newValue === undefined || newValue === "") next.delete(key);
        else next.set(key, newValue);
        return next;
      });
    },
    [setSearchParams, key]
  );

  return [value, setValue] as const;
};
