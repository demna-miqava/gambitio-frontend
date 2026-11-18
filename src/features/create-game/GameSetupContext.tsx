import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  useState,
} from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTimeControl, type TimeControl } from "./hooks/useTimeControl";
import type { TimeControlType } from "@/types";
import type { Friend } from "@/types";
import { useMatchmaking } from "@/features/matchmaking/hooks/useMatchmaking";
import { getUserProfile } from "@/services/user";
import { QKEY_USER_PROFILE } from "@/constants/queryKeys";
import { ROUTES } from "@/constants/routes";
import type { StartingOpening } from "@/features/openings/startingOpenings";
import {
  getPlaySetupSearch,
  parsePlaySetup,
  type GameSection,
  type PlaySetupState,
} from "./utils/setupRoute";

export type { GameSection } from "./utils/setupRoute";

/** What the challenge form needs to know about the friend. */
export type ChallengeTarget = Pick<
  Friend,
  "id" | "username" | "blitzRating" | "bulletRating" | "rapidRating"
> & { avatarUrl: string | null };

interface GameSetupContextValue {
  // Navigation (kept in the URL: ?section=friends&friend=12)
  activeSection: GameSection;
  /** Switch between the top-level sections (replaces the history entry) */
  setActiveSection: (section: GameSection) => void;
  /** Open the custom time picker (adds a history entry) */
  openCustomTime: () => void;
  /** Open the challenge form for a friend (adds a history entry) */
  openFriendInvite: (friend: ChallengeTarget) => void;
  canGoBack: boolean;
  goBack: () => void;

  // Time Control
  timeControl: TimeControl;
  updateTimeControl: (
    format: TimeControlType,
    time: number,
    increment?: number
  ) => void;
  selectedFriend: ChallengeTarget | null;
  /** The friend is being loaded (opened from a link without navigation state) */
  isSelectedFriendLoading: boolean;
  /**
   * The opening the friend challenge starts from (null: the standard
   * position). Kept here so the board beside the form can show it.
   */
  startingOpening: StartingOpening | null;
  setStartingOpening: (opening: StartingOpening | null) => void;

  // Matchmaking
  isSearching: boolean;
  isConnecting: boolean;
  setShouldConnect: (shouldConnect: boolean) => void;
}

const GameSetupContext = createContext<GameSetupContextValue | null>(null);

const toChallengeTarget = (friend: ChallengeTarget): ChallengeTarget => ({
  id: friend.id,
  username: friend.username,
  avatarUrl: friend.avatarUrl,
  blitzRating: friend.blitzRating,
  bulletRating: friend.bulletRating,
  rapidRating: friend.rapidRating,
});

export const GameSetupProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const state = location.state as PlaySetupState | null;
  const { section: activeSection, friendId } = parsePlaySetup(searchParams, state);
  const isSetupStep = state?.setupStep === true;

  const { timeControl, updateTimeControl: setTimeControl } = useTimeControl();
  const [startingOpening, setStartingOpening] = useState<StartingOpening | null>(null);
  const { isSearching, isConnecting, setShouldConnect } = useMatchmaking({
    time: timeControl.time,
    increment: timeControl.increment,
  });

  // The time control can't change under a running search
  const updateTimeControl = useCallback(
    (format: TimeControlType, time: number, increment?: number) => {
      if (isSearching) return;
      setTimeControl(format, time, increment);
    },
    [isSearching, setTimeControl]
  );

  // Leaving "Play online" (e.g. via the sidebar) stops the search
  useEffect(() => {
    if (activeSection !== "new" && isSearching) setShouldConnect(false);
  }, [activeSection, isSearching, setShouldConnect]);

  const goTo = useCallback(
    (
      section: GameSection,
      { replace, friend }: { replace: boolean; friend?: ChallengeTarget }
    ) => {
      const nextState: PlaySetupState = {
        setupStep: !replace,
        ...(friend && { selectedFriend: toChallengeTarget(friend) }),
      };
      navigate(
        { pathname: ROUTES.PLAY, search: getPlaySetupSearch(section, friend?.id) },
        { replace, state: nextState }
      );
    },
    [navigate]
  );

  const setActiveSection = useCallback(
    (section: GameSection) => goTo(section, { replace: true }),
    [goTo]
  );
  const openCustomTime = useCallback(
    () => goTo("custom", { replace: false }),
    [goTo]
  );
  const openFriendInvite = useCallback(
    (friend: ChallengeTarget) =>
      goTo("friend-invite-options", { replace: false, friend }),
    [goTo]
  );

  const canGoBack = activeSection !== "new" && activeSection !== "friends";
  const goBack = useCallback(() => {
    // Pop the entry we pushed, so the browser's Back and ours agree
    if (isSetupStep) {
      navigate(-1);
      return;
    }
    goTo(activeSection === "friend-invite-options" ? "friends" : "new", {
      replace: true,
    });
  }, [activeSection, goTo, isSetupStep, navigate]);

  // The friend comes from navigation state when we have it (it survives a
  // reload), otherwise from their profile (e.g. a shared link).
  const stateFriend = state?.selectedFriend as ChallengeTarget | undefined;
  const friendFromState =
    friendId && stateFriend?.id === friendId ? stateFriend : null;
  const friendQuery = useQuery({
    queryKey: [QKEY_USER_PROFILE, friendId],
    queryFn: () => getUserProfile(friendId!),
    enabled: !!friendId && !friendFromState,
  });
  const selectedFriend = useMemo<ChallengeTarget | null>(() => {
    if (!friendId) return null;
    if (friendFromState) return toChallengeTarget(friendFromState);
    return friendQuery.data ? toChallengeTarget(friendQuery.data.user) : null;
  }, [friendFromState, friendId, friendQuery.data]);
  const isSelectedFriendLoading =
    !!friendId && !friendFromState && friendQuery.isPending;

  const value = useMemo(
    () => ({
      activeSection,
      setActiveSection,
      openCustomTime,
      openFriendInvite,
      canGoBack,
      goBack,
      timeControl,
      updateTimeControl,
      selectedFriend,
      isSelectedFriendLoading,
      startingOpening,
      setStartingOpening,
      isSearching,
      isConnecting,
      setShouldConnect,
    }),
    [
      startingOpening,
      activeSection,
      setActiveSection,
      openCustomTime,
      openFriendInvite,
      canGoBack,
      goBack,
      timeControl,
      updateTimeControl,
      selectedFriend,
      isSelectedFriendLoading,
      isSearching,
      isConnecting,
      setShouldConnect,
    ]
  );
  return (
    <GameSetupContext.Provider value={value}>
      {children}
    </GameSetupContext.Provider>
  );
};

/* eslint-disable-next-line */
export const useGameSetup = () => {
  const context = useContext(GameSetupContext);
  if (!context) {
    throw new Error("useGameSetup must be used within GameSetupProvider");
  }
  return context;
};
