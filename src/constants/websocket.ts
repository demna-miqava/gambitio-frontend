/**
 * Reconnect options for long-lived sockets (game, notifications). Auth is
 * checked before the upgrade, so a rejected token shows up as a failed
 * connect; each retry fetches a fresh token, which fixes expired ones.
 * 20 attempts at 1s, 2s, 4s ... capped at 10s is about three minutes; after
 * that the game page shows "Connection lost" with a Reload button.
 */
export const RECONNECT_OPTIONS = {
  shouldReconnect: () => true,
  reconnectAttempts: 20,
  reconnectInterval: (attempt: number) => Math.min(1000 * 2 ** attempt, 10_000),
};
