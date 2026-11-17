import { describe, expect, it } from "vitest";
import { appendMessage, chatLength, countUnread, isChatShown, isLaterId, quickReplies } from "./chat";
import type { ChatMessage } from "../types";

const message = (id: string, userId: number): ChatMessage => ({ id, userId, text: "x", at: 0 });

describe("chat helpers", () => {
  it("counts characters the way the server does", () => {
    expect(chatLength("hello")).toBe(5);
    // One emoji is one character, though two UTF-16 units
    expect(chatLength(String.fromCodePoint(0x1f600))).toBe(1);
    expect(String.fromCodePoint(0x1f600).length).toBe(2);
  });

  it("orders ids as numbers, not as text", () => {
    expect(isLaterId("100", "99")).toBe(true);
    expect(isLaterId("99", "100")).toBe(false);
    expect(isLaterId("12", "11")).toBe(true);
    expect(isLaterId("11", "11")).toBe(false);
    expect(isLaterId("9007199254740993", "9007199254740992")).toBe(true);
  });

  it("doesn't add a message twice", () => {
    const messages = [message("1", 1)];
    expect(appendMessage(messages, message("1", 1))).toBe(messages);
    expect(appendMessage(messages, message("2", 2))).toHaveLength(2);
  });

  it("counts the opponent's messages after the last one seen", () => {
    const messages = [message("8", 2), message("9", 1), message("10", 2), message("11", 2)];
    expect(countUnread(messages, 1, null)).toBe(3);
    expect(countUnread(messages, 1, "8")).toBe(2);
    expect(countUnread(messages, 1, "10")).toBe(1);
    expect(countUnread(messages, 1, "11")).toBe(0);
    // Our own are never unread
    expect(countUnread([message("12", 1)], 1, "11")).toBe(0);
  });

  it("shows the chat to the opponent of a player who turned it off, not to that player", () => {
    const off = (reason: "off_by_you" | "off_by_opponent" | "closed") => ({ enabled: false, reason });
    expect(isChatShown(null, 0, false)).toBe(false); // a spectator
    expect(isChatShown({ enabled: true, reason: null }, 0, false)).toBe(true);
    // The opponent is told; the one who blocked chat has none, even with history
    expect(isChatShown(off("off_by_opponent"), 0, false)).toBe(true);
    expect(isChatShown(off("off_by_you"), 0, false)).toBe(false);
    expect(isChatShown(off("off_by_you"), 3, true)).toBe(false);
    // Closed after the game: only with something to read, or if it was open just now
    expect(isChatShown(off("closed"), 0, false)).toBe(false);
    expect(isChatShown(off("closed"), 2, false)).toBe(true);
    expect(isChatShown(off("closed"), 0, true)).toBe(true);
  });

  it("offers different quick replies once the game is over", () => {
    expect(quickReplies(false)).toContain("Good luck!");
    expect(quickReplies(true)).toContain("Good game!");
  });
});
