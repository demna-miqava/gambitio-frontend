import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { REDIRECT_PARAM, getSafeRedirect } from "@/routes/redirect";
import { toast } from "sonner";
import {
  syncProfile,
  checkUsernameAvailability,
  type ProfileStatusResponse,
} from "@/services/user";
import { useDebounce } from "@/hooks/useDebounce";
import type { SignupSkill } from "../types";
import {
  QKEY_USERNAME_AVAILABILITY,
  profileStatusKey,
} from "@/constants/queryKeys";

const profileSetupSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  skill: z.enum(["new", "beginner", "intermediate", "advanced"], {
    message: "Please select a skill level",
  }),
});

export type ProfileSetupForm = z.infer<typeof profileSetupSchema>;

type Step = "username" | "skill";

export const useProfileSetup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const [step, setStep] = useState<Step>("username");

  const form = useForm<ProfileSetupForm>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      username: "",
    },
    mode: "onChange",
  });

  const username = form.watch("username");
  const debouncedUsername = useDebounce(username, 500);

  const isValidFormat =
    username.length >= 3 &&
    username.length <= 20 &&
    /^[a-zA-Z0-9_]+$/.test(username);

  const {
    data: availabilityData,
    isLoading: isCheckingUsername,
    isFetched: isAvailabilityFetched,
    isError: isAvailabilityError,
    refetch: refetchAvailability,
  } = useQuery({
    queryKey: [QKEY_USERNAME_AVAILABILITY, debouncedUsername],
    queryFn: () => checkUsernameAvailability(debouncedUsername),
    enabled:
      isValidFormat &&
      debouncedUsername === username &&
      debouncedUsername.length > 0,
  });

  const isUsernameAvailable = availabilityData?.available ?? false;
  const isCurrentUsername = isValidFormat && debouncedUsername === username;
  // A failed request says nothing about the name, so it isn't shown as taken
  const availabilityCheckFailed = isCurrentUsername && isAvailabilityError;
  const showAvailabilityStatus =
    isAvailabilityFetched && isCurrentUsername && !isAvailabilityError;

  const { mutate: createProfile, isPending: isCreatingProfile } = useMutation({
    mutationFn: syncProfile,
    onSuccess: ({ user }) => {
      // Write the new profile straight into the cache: navigating before a
      // refetch finished made AuthGuard bounce /home → /profile-setup → /home
      queryClient.setQueryData<ProfileStatusResponse>(profileStatusKey(userId), {
        hasProfile: true,
        user,
      });
      toast.success("Profile created");
      // Back to where they were headed before signing up (e.g. a game link)
      navigate(getSafeRedirect(searchParams.get(REDIRECT_PARAM)), { replace: true });
    },
    onError: (error: Error & { response?: { status: number } }) => {
      if (error.response?.status === 409) {
        toast.error("That username was just taken. Choose another one.");
        setStep("username");
      } else {
        toast.error("Couldn't create your profile. Try again.");
      }
    },
  });

  const canProceedToSkill =
    isValidFormat && isUsernameAvailable && !isCheckingUsername;

  const goToSkillStep = () => {
    if (canProceedToSkill) {
      setStep("skill");
    }
  };

  const goToUsernameStep = () => {
    setStep("username");
  };

  const onSubmit = (data: ProfileSetupForm) => {
    createProfile({
      username: data.username,
      skill: data.skill as SignupSkill,
    });
  };

  const selectSkill = (skill: SignupSkill) => {
    form.setValue("skill", skill);
  };

  return {
    form,
    step,
    username,
    isCheckingUsername,
    isUsernameAvailable,
    showAvailabilityStatus,
    availabilityCheckFailed,
    retryAvailabilityCheck: () => void refetchAvailability(),
    canProceedToSkill,
    isCreatingProfile,
    goToSkillStep,
    goToUsernameStep,
    onSubmit: form.handleSubmit(onSubmit),
    selectSkill,
  };
};
