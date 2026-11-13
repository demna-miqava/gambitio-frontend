import { Outlet } from "react-router";
import { isAxiosError } from "axios";

import ProfileHeader from "@/features/profile/components/ProfileHeader";
import ProfileTabs from "@/features/profile/components/ProfileTabs";
import { useUserProfile } from "@/features/profile/hooks/useUserProfile";
import { NotFound } from "@/components/NotFound";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const PROFILE_NOT_FOUND = {
  title: "Player not found",
  description: "This profile doesn't exist or has been deleted.",
};

const Profile = () => {
  const { userId, profile, error, refetch } = useUserProfile();
  // userId is 0 when the URL id isn't a valid id (e.g. /profile/abc)
  const notFound =
    !userId || (isAxiosError(error) && error.response?.status === 404);
  useDocumentTitle(
    notFound ? PROFILE_NOT_FOUND.title : error ? "Profile" : profile?.username
  );

  if (notFound) {
    return <NotFound {...PROFILE_NOT_FOUND} />;
  }

  if (error) {
    return (
      <NotFound
        code=""
        title="Couldn't load this profile"
        description="Check your connection and try again."
        action={<Button onClick={() => refetch()}>Retry</Button>}
      />
    );
  }

  return (
    <PageContainer className="space-y-6 sm:space-y-8">
      <ProfileHeader />
      <ProfileTabs />
      <div className="space-y-8">
        <Outlet />
      </div>
    </PageContainer>
  );
};

export default Profile;
