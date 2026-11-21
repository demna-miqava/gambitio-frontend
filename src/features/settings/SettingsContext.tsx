import { createContext, useContext, useEffect, useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";
import { isPaletteId } from "@/constants/palettes";
import { useGetSettings } from "./hooks/useGetSettings";
import { useUpdateSettings } from "./hooks/useUpdateSettings";
import type { Settings } from "./types";

type SettingsContextType = {
  settings: Settings | undefined;
  /** Only `mutate`: it's stable, unlike the rest of the mutation's state */
  updateSettings: Pick<ReturnType<typeof useUpdateSettings>, "mutate">;
};

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { data: settings } = useGetSettings();
  // useMutation returns a new object on every render (and its status changes
  // around each save), which would hand every settings reader (the live game
  // board included) a new context value each time. Its mutate is stable.
  const { mutate } = useUpdateSettings();

  // The palette is saved on the account; the device keeps a copy (in
  // ThemeContext) so the right colours show before settings load and on
  // signed-out pages. Follow the account once it's known: on load, after a
  // change (optimistic) and when a failed save is rolled back.
  const accountPalette = settings?.data?.colorPalette;
  const { palette, setPalette } = useTheme();
  useEffect(() => {
    if (isPaletteId(accountPalette) && accountPalette !== palette) {
      setPalette(accountPalette);
    }
  }, [accountPalette, palette, setPalette]);

  const value = useMemo(
    () => ({
      settings: settings?.data,
      updateSettings: { mutate },
    }),
    [settings?.data, mutate]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }

  return context;
}
