import { LogOut } from "lucide-react";
import { useProfileSetup } from "./hooks/useProfileSetup";
import { UsernameStep } from "./components/UsernameStep";
import { SkillStep } from "./components/SkillStep";
import { BrandLogo } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/features/auth/hooks/useLogout";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export const ProfileSetupContainer = () => {
  const {
    form,
    step,
    isCheckingUsername,
    isUsernameAvailable,
    showAvailabilityStatus,
    availabilityCheckFailed,
    retryAvailabilityCheck,
    canProceedToSkill,
    isCreatingProfile,
    goToSkillStep,
    goToUsernameStep,
    onSubmit,
    selectSkill,
  } = useProfileSetup();
  const { logout, isLoading: isSigningOut } = useLogout();
  useDocumentTitle("Set up your profile");

  const selectedSkill = form.watch("skill");

  return (
    <div className="flex min-h-svh w-full flex-col bg-background px-5 py-6 sm:px-10">
      <header className="flex items-center justify-between gap-4">
        <BrandLogo />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => logout()}
          disabled={isSigningOut}
          className="text-muted-foreground"
        >
          <LogOut aria-hidden="true" />
          {isSigningOut ? "Signing out…" : "Sign out"}
        </Button>
      </header>
      <main className="flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-md">
          {step === "username" && (
            <UsernameStep
              form={form}
              isCheckingUsername={isCheckingUsername}
              isUsernameAvailable={isUsernameAvailable}
              showAvailabilityStatus={showAvailabilityStatus}
              availabilityCheckFailed={availabilityCheckFailed}
              onRetryAvailabilityCheck={retryAvailabilityCheck}
              canProceed={canProceedToSkill}
              onContinue={goToSkillStep}
            />
          )}
          {step === "skill" && (
            <SkillStep
              selectedSkill={selectedSkill}
              onSelectSkill={selectSkill}
              onContinue={onSubmit}
              onBack={goToUsernameStep}
              isLoading={isCreatingProfile}
            />
          )}
        </div>
      </main>
    </div>
  );
};
