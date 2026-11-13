import { SettingList, SettingSwitch } from "../components/SettingSwitch";

export const GameplaySettingsForm = () => (
  <SettingList>
    <SettingSwitch
      name="premovesEnabled"
      label="Enable premoves"
      description="Make moves while waiting for your opponent"
    />
    <SettingSwitch
      name="autoPromoteToQueenEnabled"
      label="Always promote to queen"
      description="Automatically promote pawns to a queen without asking"
    />
    <SettingSwitch
      name="confirmDrawResignationEnabled"
      label="Confirm resigning and draw offers"
      description="Ask before resigning or offering a draw"
    />
    <SettingSwitch
      name="showLegalMovesEnabled"
      label="Show legal moves"
      description="Mark the squares a selected piece can move to"
    />
  </SettingList>
);
