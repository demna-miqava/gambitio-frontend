import { SettingRadioGroup } from "../components/SettingRadioGroup";
import { useSettings } from "../SettingsContext";
import type { MessagesAllowedFrom } from "../types";

const privacyOptions: { value: MessagesAllowedFrom; label: string }[] = [
  { value: "everyone", label: "Everyone" },
  { value: "only_friends", label: "Only friends" },
  { value: "nobody", label: "Nobody" },
];

export const SocialSettingsForm = () => {
  const { settings, updateSettings } = useSettings();

  return (
    <SettingRadioGroup
      id="messages-privacy"
      label="Who can send you direct messages"
      description="Choose who can start a private conversation with you"
      options={privacyOptions}
      value={settings?.messagesAllowedFrom ?? "everyone"}
      disabled={!settings}
      onValueChange={(value) =>
        updateSettings.mutate({ messagesAllowedFrom: value as MessagesAllowedFrom })
      }
    />
  );
};
