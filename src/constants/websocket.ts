/** How far a retry delay may stray from its nominal value, either way */
export const RECONNECT_JITTER = 0.3;

/**
 * `ms` moved by up to ±30% at random, so clients that lost their sockets at
 * the same moment (a redeploy, a server restart) don't all retry at the same
 * instant.
 */
export const withJitter = (ms: number, random: () => number = Math.random) =>
  Math.round(ms * (1 - RECONNECT_JITTER + 2 * RECONNECT_JITTER * random()));

/** 1s, 2s, 4s ... capped at `capMs`, then jittered. */
export const backoffDelay = (attempt: number, capMs: number, random: () => number = Math.random) =>
  withJitter(Math.min(1000 * 2 ** Math.max(0, attempt), capMs), random);

const GAME_RECONNECT_CAP_MS = 10_000;

/**
 * Reconnect options for long-lived sockets (game, study). Auth is checked
 * before the upgrade, so a rejected token shows up as a failed connect; each
 * retry fetches a fresh token, which fixes expired ones.
 * 20 attempts at about 1s, 2s, 4s ... capped at 10s is about three minutes;
 * after that the game page shows "Connection lost" with a Reload button.
 */
export const RECONNECT_OPTIONS = {
  shouldReconnect: () => true,
  reconnectAttempts: 20,
  reconnectInterval: (attempt: number) => backoffDelay(attempt, GAME_RECONNECT_CAP_MS),
};

const NOTIFICATIONS_RECONNECT_CAP_MS = 30_000;

/**
 * The notifications socket (challenges, friend requests, game starts) never
 * gives up: it keeps retrying every ~30s at most, and reconnects at once when
 * the browser comes back online or the tab is shown again (see
 * useNotificationWebSocket).
 */
export const NOTIFICATIONS_RECONNECT_OPTIONS = {
  shouldReconnect: () => true,
  reconnectAttempts: Number.POSITIVE_INFINITY,
  reconnectInterval: (attempt: number) => backoffDelay(attempt, NOTIFICATIONS_RECONNECT_CAP_MS),
};
