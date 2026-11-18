import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  removePushSubscription: vi.fn(),
  savePushSubscription: vi.fn(),
  getPushKey: vi.fn(),
}));
vi.mock("@/services/push", () => api);

import {
  detachPushFromAccount,
  forgetPushAttachment,
  releasePushAfterSessionEnd,
  syncPushSubscription,
} from "./pushClient";

const ATTACHED_KEY = "gambitio:push-attached";

/** A browser with push, notifications allowed and one subscription */
const setUpBrowser = () => {
  const items = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => items.set(key, value),
    removeItem: (key: string) => items.delete(key),
  });
  const subscription = {
    endpoint: "https://push.example/abc",
    unsubscribe: vi.fn().mockResolvedValue(true),
    toJSON: () => ({ endpoint: "https://push.example/abc", keys: { p256dh: "p", auth: "a" } }),
  };
  vi.stubGlobal("navigator", {
    userAgent: "Chrome",
    maxTouchPoints: 0,
    serviceWorker: {
      getRegistration: async () => ({ pushManager: { getSubscription: async () => subscription } }),
    },
  });
  vi.stubGlobal("window", { PushManager: {}, Notification: {} });
  vi.stubGlobal("Notification", { permission: "granted" });
  return { items, subscription };
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
