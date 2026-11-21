import { useCallback, useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { ReadyState } from "react-use-websocket";

const TOKEN_ATTEMPTS = 4;
const TOKEN_RETRY_MS = 1_000;
/**
 * How often an open socket sends a fresh session token. The server closes a
 * socket that hasn't for 10 minutes (reauthTimings in the backend's
 * realtime/socket.ts).
 */
const REAUTH_EVERY_MS = 4 * 60_000;

/** Subprotocol the server agrees to; the token rides along as "auth.<token>". */
const WS_PROTOCOL = "gambitio";
const WS_TOKEN_PREFIX = "auth.";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Authentication for a react-use-websocket connection. The Clerk session
 * token goes in the WebSocket subprotocol list, not the URL, so it never
 * lands in request logs.
 *
 * - getUrl: pass as the url. react-use-websocket calls it on every connect,
 *   including reconnects, so a reconnect never reuses an expired token
 *   (Clerk tokens last about a minute). It fetches a token and puts it in
 *   `protocols` just before the socket is created: the library reads
 *   options.protocols at that moment, after awaiting getUrl.
 * - protocols: pass as the `protocols` option, unchanged (it is a stable
 *   array this hook fills in).
 *
 * Only the latest getUrl call fills in `protocols`. react-use-websocket
 * starts a new connect without cancelling the last one's (e.g. reconnecting
 * at once while a connect is still retrying for a token): the older one
 * stops asking and leaves the token alone.
 *
 * getUrl never throws: react-use-websocket treats a throwing URL function
 * as "give up for good" (no socket, no close event, no more retries). If a
 * token can't be had (e.g. still offline after a phone wakes up), it
 * connects without one; the server refuses the upgrade, and the normal
 * reconnect backoff (and eventually onReconnectStop) takes over.
 *
 * @param baseUrl - The WebSocket URL
 * @param enabled - Whether the connection should be enabled
 */
export const useAuthenticatedWebSocket = (
  baseUrl: string | null,
  enabled: boolean = true
): { getUrl: (() => Promise<string>) | null; protocols: string[] } => {
  const { getToken, isSignedIn } = useAuth();
  const protocols = useRef<string[]>([WS_PROTOCOL]).current;
  const latestCall = useRef(0);

  const getUrl = useCallback(async () => {
    const call = ++latestCall.current;
    let token: string | null = null;
    for (let attempt = 0; attempt < TOKEN_ATTEMPTS && !token; attempt++) {
      if (attempt > 0) await wait(TOKEN_RETRY_MS * attempt);
      if (call !== latestCall.current) return baseUrl ?? "";
      token = await getToken().catch(() => null);
    }
    if (call !== latestCall.current) return baseUrl ?? "";
    protocols.splice(0, protocols.length, WS_PROTOCOL, ...(token ? [`${WS_TOKEN_PREFIX}${token}`] : []));
    return baseUrl ?? "";
  }, [baseUrl, getToken, protocols]);

  return { getUrl: baseUrl && enabled && isSignedIn ? getUrl : null, protocols };
};

/**
 * Keeps an open socket's session fresh: sends { type: "auth", token } every
 * few minutes, which the server requires (a signed-out or revoked session
 * then loses its sockets too).
 */
export const useSocketReauth = (
  sendMessage: (message: string, keep?: boolean) => void,
  readyState: ReadyState
) => {
  const { getToken } = useAuth();
  const send = useRef(sendMessage);
  send.current = sendMessage;

  useEffect(() => {
    if (readyState !== ReadyState.OPEN) return;
    const timer = setInterval(() => {
      void getToken()
        .then((token) => {
          // Not queued (keep = false) if the socket closed meanwhile: sent
          // on the reconnect, a token that has expired by then would get
          // the new socket closed ("Invalid session"). It authenticates
          // with a fresh token of its own.
          if (token) send.current(JSON.stringify({ type: "auth", token }), false);
        })
        .catch(() => {
          // Offline for now; the next round (or a reconnect) tries again
        });
    }, REAUTH_EVERY_MS);
    return () => clearInterval(timer);
  }, [readyState, getToken]);
};
