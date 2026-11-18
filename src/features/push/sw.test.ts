import { describe, expect, it } from "vitest";
import SOURCE from "../../../public/sw.js?raw";

const ORIGIN = "https://gambitio.example";

type Listener = (event: unknown) => void;

/** Runs public/sw.js against a fake worker scope; returns what a click opens. */
const openedForClick = async (url: unknown): Promise<string | undefined> => {
  const listeners: Record<string, Listener> = {};
  let opened: string | undefined;
  const self = {
    location: { origin: ORIGIN },
    addEventListener: (type: string, listener: Listener) => {
      listeners[type] = listener;
    },
    clients: {
      matchAll: async () => [],
      openWindow: async (path: string) => {
        opened = path;
      },
    },
  };
  // The worker script with its globals stubbed (it only uses self, navigator and URL)
  new Function("self", "navigator", SOURCE)(self, { userAgent: "Chrome" });
  let done: Promise<unknown> = Promise.resolve();
  listeners.notificationclick({
    notification: { close: () => {}, data: { url, tag: "" } },
    waitUntil: (promise: Promise<unknown>) => {
      done = promise;
    },
  });
  await done;
  return opened;
};

describe("service worker notification links", () => {
  it("opens paths inside the app", async () => {
    expect(await openedForClick("/game/12")).toBe("/game/12");
    expect(await openedForClick("/profile/3/stats?x=1#top")).toBe("/profile/3/stats?x=1#top");
  });

  it("sends anything else to the home page", async () => {
    for (const url of [
      "/\\evil.com",
      "/\\/evil.com",
      "//evil.com",
      "https://evil.com/",
      "javascript:alert(1)",
      "/\t/evil.com",
      "/\n/evil.com",
      "/game/1\u0000",
      "game/12",
      "",
      42,
      undefined,
    ]) {
      expect(await openedForClick(url)).toBe("/home");
    }
  });
});
