import { useUser as useClerkUser } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { getProfileStatus } from "@/services/user";
import { DEFAULT_AVATAR_URL } from "@/constants/defaults";
import { profileStatusKey } from "@/constants/queryKeys";

const STARTUP_RETRIES = 1;
const STARTUP_RETRY_DELAY_MS = 1000;

export const useUser = () => {
  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useClerkUser();

  const {
    data: profileStatus,
    isFetched: profileFetched,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: profileStatusKey(clerkUser?.id),
    queryFn: getProfileStatus,
    enabled: clerkLoaded && isSignedIn,
    // The whole app waits on this call, so when the API is down give up fast
    // (one retry after 1s, so ~1-2s instead of the default ~7s of backoff)
    // and let AuthGuard show "Can't reach Gambitio" with a Retry button
    retry: STARTUP_RETRIES,
    retryDelay: STARTUP_RETRY_DELAY_MS,
  });

  const chessProfile = profileStatus?.user;

  const { blitzRating, rapidRating, bulletRating } = chessProfile || {};

  const hasProfile = profileStatus?.hasProfile ?? false;
  // Use chess profile data when available, fall back to Clerk data
  const id = chessProfile?.id;
  const username =
    chessProfile?.username || clerkUser?.username || clerkUser?.fullName || "";
  const image =
    chessProfile?.avatarUrl || clerkUser?.imageUrl || DEFAULT_AVATAR_URL;
  const email =
    chessProfile?.email || clerkUser?.primaryEmailAddress?.emailAddress;

  // isPending until Clerk loaded AND profile status fetched (when signed in)
  const isPending = !clerkLoaded || (isSignedIn && !profileFetched);
  const isAuthenticated = clerkLoaded && isSignedIn;

  return {
    id,
    username,
    image,
    email,
    rapidRating,
    blitzRating,
    bulletRating,
    isPending,
    isAuthenticated,
    hasProfile,
    chessProfile,
    // A failed status check is not the same as "no profile": the guard shows
    // a retry screen instead of sending the user to profile setup
    // A failed background refetch keeps the cached status; only a status we
    // never got is an error
    isError: isAuthenticated && isError && !profileStatus,
    error,
    refetch,
  };
};
