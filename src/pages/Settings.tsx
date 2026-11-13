import { SettingsContainer } from "@/features/settings/SettingsContainer";
import { PageHeader } from "@/components/PageHeader";
import { PageContainer } from "@/components/PageContainer";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const Settings = () => {
  useDocumentTitle("Settings");
  return (
    <PageContainer className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Settings"
        description="Changes are saved as soon as you make them."
      />
      <SettingsContainer />
    </PageContainer>
  );
};

export default Settings;
