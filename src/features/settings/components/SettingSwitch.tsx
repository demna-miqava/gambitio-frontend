import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "../SettingsContext";
import type { Settings } from "../types";

/** Settings that are on/off */
export type BooleanSettingKey = {
  [K in keyof Settings]: Settings[K] extends boolean ? K : never;
}[keyof Settings];

type SettingSwitchProps = {
  name: BooleanSettingKey;
  label: string;
  description: string;
};

/** One on/off setting. Saved as soon as it's flipped (see useUpdateSettings). */
export const SettingSwitch = ({ name, label, description }: SettingSwitchProps) => {
  const { settings, updateSettings } = useSettings();
  const id = `setting-${name}`;
  const descriptionId = `${id}-description`;

  return (
    <div className="flex items-center justify-between gap-6 border-b border-border py-4 first:pt-0 last:border-0 last:pb-0">
      <div className="space-y-0.5">
        <Label htmlFor={id}>{label}</Label>
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      <Switch
        id={id}
        aria-describedby={descriptionId}
        // Off and locked until the saved settings arrive, so a click can't
        // be lost to the first load
        checked={settings?.[name] ?? false}
        disabled={!settings}
        onCheckedChange={(checked) => updateSettings.mutate({ [name]: checked })}
      />
    </div>
  );
};

/** A group of switches with the spacing the settings panels use. */
export const SettingList = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
);
