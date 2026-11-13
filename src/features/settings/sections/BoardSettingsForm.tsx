import { SettingList, SettingSwitch } from "../components/SettingSwitch";

export const BoardSettingsForm = () => (
  <SettingList>
    <SettingSwitch
      name="boardCoordinatesEnabled"
      label="Show board coordinates"
      description="Display a–h and 1–8 along the edges of the board"
    />
    <SettingSwitch
      name="moveHighlightEnabled"
      label="Highlight moves"
      description="Highlight the last move played on the board"
    />
    <SettingSwitch
      name="soundsEnabled"
      label="Play sounds"
      description="Play sound effects for moves and game events"
    />
  </SettingList>
);
