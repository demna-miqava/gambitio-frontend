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
import { useRatedPreference } from "@/features/matchmaking/hooks/useRatedPreference";
import { closestBot, type Bot } from "@/features/play-bots/constants/bots";
import type { PlayerColorOption } from "@/types/game.types";
import { useUser } from "@/hooks/useUser";
import { getUserProfile } from "@/services/user";
import { QKEY_USER_PROFILE } from "@/constants/queryKeys";
import { ROUTES } from "@/constants/routes";
import type { StartingOpening } from "@/features/openings/startingOpenings";
import { NO_OPENING, startingOpeningFor, type OpeningChoice } from "./utils/openingChoice";
import { useLastChallenge } from "./utils/lastChallenge";
import { getTimeControlFormat } from "./constants/timeControls";
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
  /** Whether "Play online" looks for a rated game or a casual one */
  rated: boolean;
  setRated: (rated: boolean) => void;

  // Against the computer (the "A bot" tab): kept here for the board beside it
  bot: Bot;
  setBot: (bot: Bot) => void;
  botColor: PlayerColorOption;
  setBotColor: (color: PlayerColorOption) => void;
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

  // "Play online" and the challenge form each have a time control: the form
  // starts from the last challenge you sent (the terms one tap on a friend
  // sends), or from the online one before your first challenge
  const { timeControl: onlineTimeControl, updateTimeControl: setOnlineTimeControl } = useTimeControl();
  const [rated, setRatedPreference] = useRatedPreference();
  const { isSearching, isConnecting, setShouldConnect } = useMatchmaking({
    time: onlineTimeControl.time,
    increment: onlineTimeControl.increment,
    rated,
  });
  // Like the time control, it can't change under a running search
  const setRated = useCallback(
    (next: boolean) => {
      if (!isSearching) setRatedPreference(next);
    },
    [isSearching, setRatedPreference]
  );
  const { blitzRating } = useUser();
  // The bot nearest the player's blitz rating until they pick one
  const [pickedBot, setBot] = useState<Bot | null>(null);
  const bot = pickedBot ?? closestBot(blitzRating);
  const [botColor, setBotColor] = useState<PlayerColorOption>("random");
  const lastChallenge = useLastChallenge();
  // Picked in the form. Like the opening it belongs to the friend it was
  // picked for: another friend's form starts over
  const [pickedTime, setPickedTime] = useState<{ friendId: number; timeControl: TimeControl } | null>(null);
  if (pickedTime !== null && pickedTime.friendId !== friendId) setPickedTime(null);
  const isChallengeForm = activeSection === "friend-invite-options" && friendId !== null;
  const challengeTimeControl = useMemo<TimeControl>(
    () =>
      pickedTime?.timeControl ??
      (lastChallenge
        ? {
            format: getTimeControlFormat(lastChallenge.time),
            time: lastChallenge.time,
            increment: lastChallenge.increment,
          }
        : onlineTimeControl),
    [pickedTime, lastChallenge, onlineTimeControl]
  );
  const timeControl = isChallengeForm ? challengeTimeControl : onlineTimeControl;

  const updateTimeControl = useCallback(
    (format: TimeControlType, time: number, increment: number = 0) => {
      if (isChallengeForm) {
        setPickedTime({ friendId, timeControl: { format, time, increment } });
        return;
      }
      // The time control can't change under a running search
      if (isSearching) return;
      setOnlineTimeControl(format, time, increment);
    },
    [friendId, isChallengeForm, isSearching, setOnlineTimeControl]
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

  const canGoBack = activeSection === "custom" || activeSection === "friend-invite-options";
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

  // The challenge form's opening, kept here for the board beside the form.
  // Like the form's other options it starts over for each challenge: it
  // belongs to the friend it was picked for, and leaving the form (back to
  // the friends list) clears it
  const [opening, setOpening] = useState<OpeningChoice>(NO_OPENING);
  if (opening.friendId !== null && opening.friendId !== friendId) setOpening(NO_OPENING);
  const startingOpening = startingOpeningFor(opening, friendId);
  const setStartingOpening = useCallback(
    (next: StartingOpening | null) =>
      setOpening(next && friendId ? { friendId, opening: next } : NO_OPENING),
    [friendId]
  );

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
      rated,
      setRated,
      bot,
      setBot,
      botColor,
      setBotColor,
    }),
    [
      rated,
      setRated,
      bot,
      botColor,
      startingOpening,
      setStartingOpening,
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
