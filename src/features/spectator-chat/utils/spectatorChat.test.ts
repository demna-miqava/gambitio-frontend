import { describe, expect, it } from "vitest";
import { MAX_SHOWN_MESSAGES, addMessage, mergeHistory, refusalText, withoutBlocked } from "./spectatorChat";

const msg = (id: number, userId = 1) => ({ id: String(id), userId, username: `u${userId}`, text: `m${id}`, at: id });

describe("spectator chat", () => {
  it("adds a message once, and keeps only the latest", () => {
    const one = addMessage([], msg(1));
    expect(addMessage(one, msg(1))).toBe(one);
    let many = one;
    for (let i = 2; i <= MAX_SHOWN_MESSAGES + 5; i++) many = addMessage(many, msg(i));
    expect(many).toHaveLength(MAX_SHOWN_MESSAGES);
    expect(many[0].id).toBe("6");
  });

  it("keeps what was on screen when a reconnect brings the latest messages again", () => {
    const shown = [1, 2, 3, 4, 5].map((i) => msg(i));
    // The server's page starts at 4; 6 and 7 were missed while offline
    const merged = mergeHistory(shown, [4, 5, 6, 7].map((i) => msg(i)));
    expect(merged.map((m) => m.id)).toEqual(["1", "2", "3", "4", "5", "6", "7"]);
    // One that arrived live while the history was being read stays, after it
    expect(mergeHistory([msg(1), msg(9)], [msg(2), msg(3)]).map((m) => m.id)).toEqual(["1", "2", "3", "9"]);
    // The first sync is just the history; an empty one changes nothing
    expect(mergeHistory([], [msg(1)])).toEqual([msg(1)]);
    expect(mergeHistory(shown, [])).toBe(shown);
    // Still capped
    const many = Array.from({ length: MAX_SHOWN_MESSAGES }, (_, i) => msg(i + 1));
    expect(mergeHistory(many, [msg(MAX_SHOWN_MESSAGES + 1)])).toHaveLength(MAX_SHOWN_MESSAGES);
  });

  it("hides blocked players' messages", () => {
    const list = [msg(1, 1), msg(2, 2), msg(3, 1)];
    expect(withoutBlocked(list, new Set([1])).map((m) => m.id)).toEqual(["2"]);
    expect(withoutBlocked(list, new Set())).toBe(list);
  });

  it("words refusals for the reader", () => {
    expect(refusalText("CHAT_RATE_LIMITED", "x")).toMatch(/too fast/);
    expect(refusalText("CHAT_CLOSED", "x")).toBe("This chat has closed.");
    expect(refusalText("SOMETHING", "the server said so")).toBe("the server said so");
  });
});
