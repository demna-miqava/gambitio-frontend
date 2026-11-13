import { ProfileSetupContainer } from "@/features/auth/profile-setup/ProfileSetupContainer";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const ProfileSetup = () => {
  useDocumentTitle("Set up your profile");
  return <ProfileSetupContainer />;
};

export default ProfileSetup;
