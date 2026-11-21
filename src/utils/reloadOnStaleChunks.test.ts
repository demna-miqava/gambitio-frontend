import { afterEach, describe, expect, it, vi } from "vitest";
import { reloadOnStaleChunks } from "./reloadOnStaleChunks";

/** A browser that hands the preload error listener to the test */
const setUp = ({ onLine = true, storage = new Map<string, string>(), blocked = false } = {}) => {
  let listener: ((event: { preventDefault: () => void }) => void) | undefined;
  const reload = vi.fn();
  vi.stubGlobal("window", {
    addEventListener: (_type: string, fn: typeof listener) => (listener = fn),
    location: { reload },
  });
  vi.stubGlobal("navigator", { onLine });
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => {
      if (blocked) throw new DOMException("blocked", "SecurityError");
      return storage.get(key) ?? null;
    },
    setItem: (key: string, value: string) => storage.set(key, value),
  });
  reloadOnStaleChunks();
  const fire = () => {
    const event = { preventDefault: vi.fn() };
    listener!(event);
    return event;
  };
  return { fire, reload };
};

describe("reloadOnStaleChunks", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reloads once, then lets a second error through", () => {
    const { fire, reload } = setUp();
    expect(fire().preventDefault).toHaveBeenCalled();
    expect(fire().preventDefault).not.toHaveBeenCalled();
    expect(reload).toHaveBeenCalledOnce();
  });

  it("doesn't reload while offline", () => {
    const { fire, reload } = setUp({ onLine: false });
    expect(fire().preventDefault).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });

  it("doesn't throw or reload when storage is blocked", () => {
    const { fire, reload } = setUp({ blocked: true });
    expect(() => fire()).not.toThrow();
    expect(reload).not.toHaveBeenCalled();
  });
});
