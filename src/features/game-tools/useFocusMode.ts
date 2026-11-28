import { useCallback, useEffect } from "react";
import { useGameShell } from "@/context/GameShellContext";
import { useSettings } from "@/features/settings/SettingsContext";
import { useShortcutKey } from "@/features/game/hooks/useShortcutKey";

/**
 * Focus mode on a game page: with the setting on and a game under way
 * (`eligible`), the page shows only the board, the clocks and the game
 * actions, and the app's sidebar steps aside. "Z" switches it, and Escape
 * leaves it (when nothing else on the page had a use for the key).
 *
 * The setting is the account's; `active` is whether it applies right now. It
 * stops applying when the game ends, so the result and what comes after are
 * in view again.
 */
export const useFocusMode = (eligible: boolean) => {
  const { settings, updateSettings } = useSettings();
  const { setFocusActive } = useGameShell();
  const enabled = settings?.focusModeEnabled ?? false;
  const active = enabled && eligible;

  useEffect(() => {
    setFocusActive(active);
    return () => setFocusActive(false);
  }, [active, setFocusActive]);

  const { mutate } = updateSettings;
  const toggle = useCallback(() => {
    if (!settings) return;
    mutate({ focusModeEnabled: !enabled });
  }, [settings, enabled, mutate]);

  useShortcutKey("z", toggle, eligible);

  // Escape leaves focus mode. A dialog, a menu, the promotion picker or the
  // player's card that closed on the same press has claimed it
  // (preventDefault), and a field keeps it for itself
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || event.repeat) return;
      if (event.target instanceof Element && event.target.closest("input, textarea, select, [contenteditable='true']")) return;
      mutate({ focusModeEnabled: false });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, mutate]);

  return { active, enabled, toggle, canToggle: eligible && Boolean(settings) };
};
