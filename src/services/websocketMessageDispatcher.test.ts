import { afterEach, describe, expect, it, vi } from "vitest";
import { WebSocketMessageDispatcher } from "./websocketMessageDispatcher";

describe("WebSocketMessageDispatcher", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("still delivers to the other subscribers when one throws, and rethrows its error later", () => {
    const later: (() => void)[] = [];
    vi.stubGlobal("queueMicrotask", (task: () => void) => later.push(task));
    const dispatcher = new WebSocketMessageDispatcher();
    const after = vi.fn();
    dispatcher.subscribe("move", () => {
      throw new Error("broken subscriber");
    });
    dispatcher.subscribe("move", after);

    dispatcher.dispatch({ type: "move" });
    expect(after).toHaveBeenCalledOnce();
    expect(later).toHaveLength(1);
    expect(() => later[0]!()).toThrow("broken subscriber");
  });

  it("only reaches subscribers of that message type, until they unsubscribe", () => {
    const dispatcher = new WebSocketMessageDispatcher();
    const onMove = vi.fn();
    const onChat = vi.fn();
    const stop = dispatcher.subscribe("move", onMove);
    dispatcher.subscribe("chat", onChat);
    dispatcher.dispatch({ type: "move" });
    stop();
    dispatcher.dispatch({ type: "move" });
    expect(onMove).toHaveBeenCalledOnce();
    expect(onChat).not.toHaveBeenCalled();
  });
});
