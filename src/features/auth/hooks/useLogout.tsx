import { useClerk } from "@clerk/clerk-react";
import { useMutation } from "@tanstack/react-query";

export const useLogout = () => {
  const { signOut } = useClerk();

  // The cache is dropped by ResetCacheOnUserChange once Clerk reports the
  // sign-out. Clearing it here first let still-mounted queries refetch with
  // the old session and cache the old account's data again.
  const { mutate: logout, isPending: isLoading } = useMutation({
    mutationFn: () => signOut(),
  });

  return { logout, isLoading };
};
