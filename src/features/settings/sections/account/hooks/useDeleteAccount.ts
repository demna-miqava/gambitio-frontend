import { useClerk } from "@clerk/clerk-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { deleteMyAccount } from "@/services/user";
import { ROUTES } from "@/constants/routes";

export const useDeleteAccount = () => {
  const { signOut } = useClerk();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { mutate: deleteAccount, isPending: isLoading } = useMutation({
    // The server deletes both the chess profile and the Clerk user
    mutationFn: deleteMyAccount,
    onSuccess: async () => {
      try {
        // The session is already gone server-side; this clears it locally
        await signOut();
      } catch {
        // Nothing left to sign out of
      }
      queryClient.clear();
      navigate(ROUTES.LANDING, { replace: true });
      toast.success("Your account has been deleted");
    },
    onError: () => {
      toast.error("Couldn't delete your account. Please try again.");
    },
  });

  return { deleteAccount, isLoading };
};
