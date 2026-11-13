import { SettingList, SettingSwitch } from "../components/SettingSwitch";

export const NotificationsSettingsForm = () => (
  <SettingList>
    <SettingSwitch
      name="emailNotificationsEnabled"
      label="Email notifications"
      description="Receive notifications by email"
    />
  </SettingList>
);
