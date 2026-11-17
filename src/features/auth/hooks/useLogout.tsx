import { useClerk } from "@clerk/clerk-react";
import { useMutation } from "@tanstack/react-query";
import { detachPushFromAccount } from "@/features/push/pushClient";

export const useLogout = () => {
  const { signOut } = useClerk();

  // The cache is dropped by ResetCacheOnUserChange once Clerk reports the
  // sign-out. Clearing it here first let still-mounted queries refetch with
  // the old session and cache the old account's data again.
  const { mutate: logout, isPending: isLoading } = useMutation({
    // While the session is still valid: this browser stops getting the
    // account's notifications. Signing out goes ahead even if that fails.
    mutationFn: async () => {
      await detachPushFromAccount().catch(() => {});
      await signOut();
    },
  });

  return { logout, isLoading };
};
