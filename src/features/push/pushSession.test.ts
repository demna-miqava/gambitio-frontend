import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  removePushSubscription: vi.fn(),
  savePushSubscription: vi.fn(),
  getPushKey: vi.fn(),
}));
vi.mock("@/services/push", () => api);

import {
  applicationServerKey,
  detachPushFromAccount,
  enablePush,
  forgetPushAttachment,
  releasePushAfterSessionEnd,
  syncPushSubscription,
} from "./pushClient";

const ATTACHED_KEY = "gambitio:push-attached";
/** The server's VAPID key (base64url), and another one from before it changed */
const KEY = "AQI";
const OLD_KEY = "AwQ";

const fakeSubscription = (endpoint: string, key: string) => ({
  endpoint,
  options: { applicationServerKey: applicationServerKey(key).buffer },
  unsubscribe: vi.fn().mockResolvedValue(true),
  toJSON: () => ({ endpoint, keys: { p256dh: "p", auth: "a" } }),
});

/** A browser with push, notifications allowed and one subscription */
const setUpBrowser = () => {
  const items = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => items.set(key, value),
    removeItem: (key: string) => items.delete(key),
  });
  const subscription = fakeSubscription("https://push.example/abc", KEY);
  const fresh = fakeSubscription("https://push.example/new", KEY);
  const pushManager = {
    getSubscription: vi.fn(async () => subscription),
    subscribe: vi.fn(async () => fresh),
  };
  const registration = { pushManager };
  vi.stubGlobal("navigator", {
    userAgent: "Chrome",
    maxTouchPoints: 0,
    serviceWorker: {
      getRegistration: async () => registration,
      register: async () => registration,
      ready: Promise.resolve(registration),
    },
  });
  vi.stubGlobal("window", { PushManager: {}, Notification: {} });
  vi.stubGlobal("Notification", { permission: "granted", requestPermission: async () => "granted" });
  api.getPushKey.mockResolvedValue({ publicKey: KEY });
  return { items, subscription, fresh, pushManager };
};

describe("push after the session ends", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("remembers that a synced subscription is attached to the account", async () => {
    const { items } = setUpBrowser();
    api.savePushSubscription.mockResolvedValue(undefined);
    await syncPushSubscription();
    expect(items.get(ATTACHED_KEY)).toBe("1");
  });

  it("signing out detaches it on the server and keeps the browser's subscription", async () => {
    const { items, subscription } = setUpBrowser();
    items.set(ATTACHED_KEY, "1");
    api.removePushSubscription.mockResolvedValue(undefined);
    expect(await detachPushFromAccount()).toBe(true);
    expect(api.removePushSubscription).toHaveBeenCalledWith(subscription.endpoint);
    expect(items.has(ATTACHED_KEY)).toBe(false);
    // Nothing left to release when the session then ends
    await releasePushAfterSessionEnd();
    expect(subscription.unsubscribe).not.toHaveBeenCalled();
  });

  it("a failed detach doesn't throw and leaves it for releasePushAfterSessionEnd", async () => {
    const { items, subscription } = setUpBrowser();
    items.set(ATTACHED_KEY, "1");
    api.removePushSubscription.mockRejectedValue(new Error("401"));
    expect(await detachPushFromAccount()).toBe(false);
    expect(items.get(ATTACHED_KEY)).toBe("1");

    await releasePushAfterSessionEnd();
    expect(subscription.unsubscribe).toHaveBeenCalledOnce();
    expect(items.has(ATTACHED_KEY)).toBe(false);
  });

  it("a session that ended elsewhere cancels the browser's subscription without calling the API", async () => {
    const { items, subscription } = setUpBrowser();
    items.set(ATTACHED_KEY, "1");
    await releasePushAfterSessionEnd();
    expect(api.removePushSubscription).not.toHaveBeenCalled();
    expect(subscription.unsubscribe).toHaveBeenCalledOnce();
  });

  it("does nothing when nothing is attached (deleted account, never enabled)", async () => {
    const { items, subscription } = setUpBrowser();
    items.set(ATTACHED_KEY, "1");
    forgetPushAttachment();
    await releasePushAfterSessionEnd();
    expect(subscription.unsubscribe).not.toHaveBeenCalled();
  });

  it("never throws, even when the browser's push API fails", async () => {
    const { items, subscription } = setUpBrowser();
    items.set(ATTACHED_KEY, "1");
    subscription.unsubscribe.mockRejectedValue(new Error("InvalidStateError"));
    await expect(releasePushAfterSessionEnd()).resolves.toBeUndefined();
  });
});

describe("keeping the subscription usable", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("makes the subscription again after the server's key changed", async () => {
    const { items, subscription, fresh, pushManager } = setUpBrowser();
    const stale = fakeSubscription("https://push.example/abc", OLD_KEY);
    pushManager.getSubscription.mockResolvedValue(stale);
    api.savePushSubscription.mockResolvedValue(undefined);
    await syncPushSubscription();
    expect(stale.unsubscribe).toHaveBeenCalledOnce();
    expect(api.savePushSubscription).toHaveBeenCalledWith(fresh.toJSON());
    expect(subscription.unsubscribe).not.toHaveBeenCalled();
    expect(items.get(ATTACHED_KEY)).toBe("1");
  });

  it("drops a stale subscription it can't make again, so it shows as off", async () => {
    const { items, pushManager } = setUpBrowser();
    const stale = fakeSubscription("https://push.example/abc", OLD_KEY);
    pushManager.getSubscription.mockResolvedValue(stale);
    pushManager.subscribe.mockRejectedValue(new Error("NotAllowedError"));
    items.set(ATTACHED_KEY, "1");
    await syncPushSubscription();
    expect(stale.unsubscribe).toHaveBeenCalledOnce();
    expect(api.savePushSubscription).not.toHaveBeenCalled();
    expect(items.has(ATTACHED_KEY)).toBe(false);
  });

  it("re-saves a subscription made with the current key as it is", async () => {
    const { subscription, pushManager } = setUpBrowser();
    api.savePushSubscription.mockResolvedValue(undefined);
    await syncPushSubscription();
    expect(api.savePushSubscription).toHaveBeenCalledWith(subscription.toJSON());
    expect(subscription.unsubscribe).not.toHaveBeenCalled();
    expect(pushManager.subscribe).not.toHaveBeenCalled();
  });

  it("turning it on unsubscribes again when the server couldn't save it", async () => {
    const { items, fresh, pushManager } = setUpBrowser();
    pushManager.getSubscription.mockResolvedValue(null as never);
    api.savePushSubscription.mockRejectedValue(new Error("500"));
    await expect(enablePush()).rejects.toThrow("500");
    expect(fresh.unsubscribe).toHaveBeenCalledOnce();
    expect(items.has(ATTACHED_KEY)).toBe(false);
  });
});
