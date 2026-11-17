import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { SegmentedRadioGroup, type SegmentedOption } from "@/components/SegmentedRadioGroup";
import { useTheme, type ThemePreference } from "@/context/ThemeContext";
import { PALETTES, isPaletteId, type Palette } from "@/constants/palettes";
import { cn } from "@/lib/utils";
import { useSettings } from "../SettingsContext";
import { SettingList, SettingSwitch } from "../components/SettingSwitch";

const THEME_OPTIONS: SegmentedOption<ThemePreference>[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

/** Stored on this device (like the pre-paint script expects), not on the server */
const AppearanceSetting = () => {
  const { preference, setPreference } = useTheme();

  return (
    <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="space-y-0.5">
        <p className="text-sm font-medium leading-none">Theme</p>
        <p className="text-sm text-muted-foreground">
          System follows your device's light or dark mode
        </p>
      </div>
      <SegmentedRadioGroup
        label="Theme"
        value={preference}
        onValueChange={setPreference}
        options={THEME_OPTIONS}
        className="w-full sm:w-auto sm:min-w-72"
      />
    </div>
  );
};

/** A corner of the board plus the palette's two accents, in the current theme */
const PaletteSwatch = ({ palette }: { palette: Palette }) => {
  const { theme } = useTheme();
  const c = palette[theme];
  return (
    <span
      aria-hidden="true"
      className="flex h-16 w-full items-center justify-between rounded-md px-3 ring-1 ring-black/5 dark:ring-white/10"
      style={{ backgroundColor: c.background }}
    >
      <span className="grid size-10 grid-cols-2 overflow-hidden rounded-sm shadow-sm">
        <span style={{ backgroundColor: c.boardLight }} />
        <span style={{ backgroundColor: c.boardDark }} />
        <span style={{ backgroundColor: c.boardDark }} />
        <span style={{ backgroundColor: c.boardLight }} />
      </span>
      <span className="flex -space-x-1.5">
        <span
          className="size-5 rounded-full"
          style={{ backgroundColor: c.primary, boxShadow: `0 0 0 2px ${c.background}` }}
        />
        <span
          className="size-5 rounded-full"
          style={{ backgroundColor: c.gold, boxShadow: `0 0 0 2px ${c.background}` }}
        />
        {c.cream && (
          // A hairline inside, so the cream dot shows on the cream page
          <span
            className="size-5 rounded-full"
            style={{
              backgroundColor: c.cream,
              boxShadow: `inset 0 0 0 1px rgb(0 0 0 / 0.1), 0 0 0 2px ${c.background}`,
            }}
          />
        )}
      </span>
    </span>
  );
};

/**
 * Saved on the account (SettingsProvider applies it, and keeps a copy on the
 * device for the next page load). Locked until the saved settings arrive,
 * like the switches, so a pick can't be lost to the first load.
 */
const PaletteSetting = () => {
  const { palette: devicePalette } = useTheme();
  const { settings, updateSettings } = useSettings();
  const palette = settings?.colorPalette ?? devicePalette;

  return (
    <div className="space-y-3 border-b border-border pb-4">
      <div className="space-y-0.5">
        <p className="text-sm font-medium leading-none">Colours</p>
        <p className="text-sm text-muted-foreground">
          The palette for the app and the board, in light and dark
        </p>
      </div>
      <RadioGroupPrimitive.Root
        value={palette}
        onValueChange={(value) =>
          isPaletteId(value) && updateSettings.mutate({ colorPalette: value })
        }
        disabled={!settings}
        aria-label="Colours"
        className="grid grid-cols-2 gap-2.5 lg:grid-cols-3"
      >
        {PALETTES.map((option) => (
          <RadioGroupPrimitive.Item
            key={option.id}
            value={option.id}
            className={cn(
              "group relative flex flex-col gap-2.5 rounded-xl bg-background p-2 text-left transition-colors",
              "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "data-[state=checked]:ring-2 data-[state=checked]:ring-primary",
              "disabled:cursor-default disabled:opacity-60"
            )}
          >
            <PaletteSwatch palette={option} />
            <span className="px-1 pb-1">
              <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                {option.label}
                <Check
                  className="size-3.5 text-primary opacity-0 group-data-[state=checked]:opacity-100"
                  aria-hidden="true"
                />
              </span>
              <span className="block text-xs text-muted-foreground">{option.description}</span>
            </span>
          </RadioGroupPrimitive.Item>
        ))}
      </RadioGroupPrimitive.Root>
    </div>
  );
};

export const InterfaceSettingsForm = () => (
  <div className="space-y-4">
    <AppearanceSetting />
    <PaletteSetting />
    <SettingList>
      <SettingSwitch
        name="showRatingsDuringGameEnabled"
        label="Show ratings during games"
        description="Display player ratings next to names while you play"
      />
      <SettingSwitch
        name="focusModeEnabled"
        label="Focus mode"
        description="During a live game, show only the board, the clocks and the game actions. Press Z in a game to switch it."
      />
      <SettingSwitch
        name="pieceIconNotationEnabled"
        label="Show piece icons in move lists"
        description="Use piece symbols instead of letters (♘f3 instead of Nf3)"
      />
    </SettingList>
  </div>
);
