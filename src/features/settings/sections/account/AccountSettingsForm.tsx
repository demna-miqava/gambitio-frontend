import { useUser } from "@clerk/clerk-react";
import { ChangePasswordForm } from "./components/ChangePasswordForm";
import { DeleteAccountSection } from "./components/DeleteAccountSection";

export const AccountSettingsForm = () => {
  const { user } = useUser();
  // Accounts created with Google etc. have no password to change
  const hasPassword = user?.passwordEnabled ?? false;

  return (
    <div className="space-y-8">
      {hasPassword && <ChangePasswordForm />}

      <div className={hasPassword ? "border-t border-border/70 pt-6" : undefined}>
        <DeleteAccountSection />
      </div>
    </div>
  );
};
