import { useState, useEffect } from "react";

/**
 * A value kept in localStorage under `key`, which is read once: the key is
 * meant to stay the same for the component's life.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(function () {
    // A corrupted or hand-edited value falls back to the default instead of crashing
    try {
      const storedValue = localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(
    function () {
      // Blocked or full storage: keep the value in memory only
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // ignore
      }
    },
    [value, key]
  );

  return [value, setValue] as const;
}
