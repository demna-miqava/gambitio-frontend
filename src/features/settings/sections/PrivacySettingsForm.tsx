import { SettingRadioGroup } from "../components/SettingRadioGroup";
import { useSettings } from "../SettingsContext";
import type { AllowedFrom } from "../types";
import { BlockedPlayers } from "@/features/moderation/components/BlockedPlayers";

const OPTIONS: { value: AllowedFrom; label: string }[] = [
  { value: "everyone", label: "Anyone" },
  { value: "only_friends", label: "Friends only" },
  { value: "nobody", label: "No one" },
];

/** Who can reach the player: challenges to a game, chat during one, and who they've blocked. */
export const PrivacySettingsForm = () => {
  const { settings, updateSettings } = useSettings();

  return (
    <div>
      <SettingRadioGroup
        id="challenges-allowed-from"
        label="Who can challenge you"
        description="Challenges from anyone else are turned away before they reach you"
        options={OPTIONS}
        value={settings?.challengesAllowedFrom ?? "everyone"}
        disabled={!settings}
        onValueChange={(value) =>
          updateSettings.mutate({ challengesAllowedFrom: value as AllowedFrom })
        }
      />
      <SettingRadioGroup
        id="game-chat-allowed-from"
        label="Who can chat with you during games"
        description="When you don't chat with an opponent, they see that chat is off. Spectators never see chat."
        options={OPTIONS}
        value={settings?.gameChatAllowedFrom ?? "everyone"}
        disabled={!settings}
        onValueChange={(value) =>
          updateSettings.mutate({ gameChatAllowedFrom: value as AllowedFrom })
        }
      />
      <BlockedPlayers />
    </div>
  );
};
