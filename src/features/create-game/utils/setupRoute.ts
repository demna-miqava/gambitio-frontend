import { ROUTES } from "@/constants/routes";
import { parsePositiveId } from "@/utils/ids";

export type GameSection =
  | "new"
  | "friends"
  /** Against the computer: strength and side, picked on the same page */
  | "bot"
  | "friend-invite-options"
  | "custom";

/** Navigation state the /play page understands (all optional). */
export type PlaySetupState = {
  /** Legacy way of picking the section (sidebar links still use it) */
  section?: GameSection;
  /** The friend shown on "Send a challenge", so it renders without a fetch */
  selectedFriend?: { id: number } & Record<string, unknown>;
  /** Set on entries the setup page pushed itself, so Back can pop them */
  setupStep?: boolean;
};

const URL_SECTIONS: GameSection[] = ["new", "friends", "bot", "custom"];

const parseId = parsePositiveId;

/**
 * The query string for a setup step: "" for the default section,
 * "?section=custom", "?section=bot", "?section=friends" or
 * "?section=friends&friend=12".
 */
export const getPlaySetupSearch = (
  section: GameSection,
  friendId?: number | null
): string => {
  const params = new URLSearchParams();
  if (section === "friend-invite-options") {
    params.set("section", "friends");
    if (friendId) params.set("friend", String(friendId));
  } else if (section !== "new") {
    params.set("section", section);
  }
  const search = params.toString();
  return search ? `?${search}` : "";
};

/** /play URL that opens the challenge form for a friend. */
export const getChallengeFriendRoute = (friendId: number) =>
  `${ROUTES.PLAY}${getPlaySetupSearch("friend-invite-options", friendId)}`;

/**
 * Which setup step to show. The URL wins; navigation state is the fallback
 * for links that only pass { section }.
 */
export const parsePlaySetup = (
  searchParams: URLSearchParams,
  state: PlaySetupState | null | undefined
): { section: GameSection; friendId: number | null } => {
  const param = searchParams.get("section") as GameSection | null;

  if (param === "friends") {
    const friendId = parseId(searchParams.get("friend"));
    return friendId
      ? { section: "friend-invite-options", friendId }
      : { section: "friends", friendId: null };
  }
  if (param && URL_SECTIONS.includes(param)) {
    return { section: param, friendId: null };
  }

  const stateSection = state?.section;
  if (stateSection === "friend-invite-options") {
    const friendId = parseId(String(state?.selectedFriend?.id ?? ""));
    return friendId
      ? { section: "friend-invite-options", friendId }
      : { section: "friends", friendId: null };
  }
  if (stateSection && URL_SECTIONS.includes(stateSection)) {
    return { section: stateSection, friendId: null };
  }
  return { section: "new", friendId: null };
};
