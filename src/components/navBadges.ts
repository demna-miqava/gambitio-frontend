const NONE: Record<string, number | undefined> = {};

/**
 * Counts shown on nav items, keyed by item title. None at the moment:
 * incoming challenges are counted once, on the notifications bell
 * (NotificationsInbox), not again on Play.
 */
export const useNavBadges = (): Record<string, number | undefined> => NONE;
