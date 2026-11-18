import { getPushKey, removePushSubscription, savePushSubscription } from "@/services/push";

const SERVICE_WORKER_URL = "/sw.js";

/**
 * Set while the server has this browser's subscription under the signed-in
 * account, so a session that ends without "Sign out" (it expired, or the
 * user signed out in another tab) knows there's something to undo.
 */
const ATTACHED_KEY = "gambitio:push-attached";

const setAttached = (attached: boolean) => {
  try {
    if (attached) localStorage.setItem(ATTACHED_KEY, "1");
    else localStorage.removeItem(ATTACHED_KEY);
  } catch {
    // Storage disabled: releasePushAfterSessionEnd just has nothing to go on
  }
};

const isAttached = () => {
  try {
    return localStorage.getItem(ATTACHED_KEY) === "1";
  } catch {
    return false;
  }
};

/**
 * Why notifications can't be turned on here, or null if they can.
 * - "unsupported": the browser has no push
 * - "needs-install": iPhone and iPad only allow push for a site added to the Home Screen
 */
export type PushBlocker = "unsupported" | "needs-install";

const isIos = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  // iPadOS reports itself as a Mac
  (navigator.userAgent.includes("Mac") && navigator.maxTouchPoints > 1);

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

export function pushBlocker(): PushBlocker | null {
  const supported =
    "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  if (supported) return null;
  return isIos() && !isStandalone() ? "needs-install" : "unsupported";
}

/** The VAPID public key (base64url) as the bytes pushManager.subscribe wants */
export function applicationServerKey(base64url: string): Uint8Array<ArrayBuffer> {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

/** This browser's subscription, if notifications were turned on in it. */
export async function currentSubscription(): Promise<PushSubscription | null> {
  if (pushBlocker()) return null;
  const registration = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_URL);
  return (await registration?.pushManager.getSubscription()) ?? null;
}

export class PushPermissionDeniedError extends Error {
  constructor() {
    super("Notifications are blocked for this site");
  }
}
export class PushUnavailableError extends Error {
  constructor() {
    super("Push notifications aren't available right now");
  }
}

/**
 * Turns notifications on for this browser: asks permission (so call it from
 * a click), subscribes with the push service and tells the server.
 */
export async function enablePush(): Promise<void> {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new PushPermissionDeniedError();
  const { publicKey } = await getPushKey();
  if (!publicKey) throw new PushUnavailableError();

  await navigator.serviceWorker.register(SERVICE_WORKER_URL);
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  // A subscription made with another key (the server's keys changed) can't be delivered to
  if (subscription && !sameKey(subscription, publicKey)) {
    await subscription.unsubscribe();
    subscription = null;
  }
  subscription ??= await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: applicationServerKey(publicKey),
  });
  await savePushSubscription(subscription.toJSON());
  setAttached(true);
}

function sameKey(subscription: PushSubscription, publicKey: string): boolean {
  const key = subscription.options.applicationServerKey;
  if (!key) return true;
  const wanted = applicationServerKey(publicKey);
  const actual = new Uint8Array(key);
  return actual.length === wanted.length && actual.every((byte, i) => byte === wanted[i]);
}

/** Turns notifications off for this browser, here and on the server. */
export async function disablePush(): Promise<void> {
  const subscription = await currentSubscription();
  if (!subscription) return setAttached(false);
  await removePushSubscription(subscription.endpoint).catch(() => {});
  await subscription.unsubscribe();
  setAttached(false);
}

/**
 * Signing out: the server stops sending this browser the account's
 * notifications. The browser keeps its subscription, so the next sign-in
 * here picks it up again (syncPushSubscription). Needs the session (the
 * server only removes a subscription for its own account). Never throws;
 * true when nothing is left attached.
 */
export async function detachPushFromAccount(): Promise<boolean> {
  const subscription = await currentSubscription().catch(() => null);
  if (!subscription) {
    setAttached(false);
    return true;
  }
  const detached = await removePushSubscription(subscription.endpoint).then(
    () => true,
    () => false
  );
  if (detached) setAttached(false);
  return detached;
}

/** The account was deleted: the server dropped its subscriptions itself. */
export function forgetPushAttachment(): void {
  setAttached(false);
}

/**
 * The session ended without "Sign out" here (it expired, or the user signed
 * out in another tab or while the app was closed): the server would keep
 * sending this browser the account's notifications. It can't be told any
 * more (POST /push/unsubscribe needs the account's session), so the
 * browser's subscription is cancelled instead: the push service then refuses
 * further messages, and the server drops the subscription the next time it
 * tries one. Notifications have to be turned on again after signing back in.
 * Never throws.
 */
export async function releasePushAfterSessionEnd(): Promise<void> {
  if (!isAttached()) return;
  try {
    const subscription = await currentSubscription();
    if (subscription) await subscription.unsubscribe();
    setAttached(false);
  } catch {
    // Nothing more to do here; the next sign-in syncs the state again
  }
}

/**
 * After sign-in: if this browser has notifications on, make sure the server
 * has its subscription under the signed-in account.
 */
export async function syncPushSubscription(): Promise<void> {
  if (pushBlocker() || Notification.permission !== "granted") return;
  const subscription = await currentSubscription();
  if (!subscription) return;
  await savePushSubscription(subscription.toJSON());
  setAttached(true);
}
