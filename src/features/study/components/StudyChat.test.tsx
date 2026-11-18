import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ChatMessage } from "@/features/game-chat/types";
import { StudyChatContext, type StudyChatContextValue } from "../hooks/useStudyChat";
import { StudyChat, StudyChatPanel } from "./StudyChat";

const members = [
  { id: 1, username: "me", avatarUrl: null },
  { id: 2, username: "bobby", avatarUrl: null },
];
const message = (id: string, userId: number, text: string): ChatMessage => ({ id, userId, text, at: 0 });

const panel = (over: Partial<Parameters<typeof StudyChatPanel>[0]> = {}) =>
  renderToStaticMarkup(
    <StudyChatPanel
      roomId={9}
      members={members}
      myId={1}
      connected
      messages={[message("1", 2, "hi"), message("2", 1, "hello"), message("3", 3, "bye")]}
      enabled
      error={null}
      onSend={() => {}}
      {...over}
    />
  );

describe("StudyChat", () => {
  it("renders nothing for a member with no chat in this room", () => {
    const withContext = (value: StudyChatContextValue | null) =>
      renderToStaticMarkup(
        <StudyChatContext.Provider value={value}>
          <StudyChat roomId={9} members={members} myId={1} connected />
        </StudyChatContext.Provider>
      );
    expect(withContext(null)).toBe("");
    expect(withContext({ chat: null, error: null, send: () => {} })).toBe("");
    expect(withContext({ chat: { enabled: true, messages: [] }, error: null, send: () => {} })).toContain("Room chat");
  });

  it("offers to report another member's message, never one's own or a former member's", () => {
    const html = panel();
    expect(html).toContain("Report bobby&#x27;s message");
    expect(html).not.toContain("Report me");
    expect(html.match(/Report /g)).toHaveLength(2); // aria-label and title of bobby's one button
  });

  it("shows messages as text", () => {
    const html = panel({ messages: [message("1", 2, `<img src=x onerror="alert(1)">`)] });
    expect(html).not.toMatch(/<img\b/);
    expect(html).toContain("&lt;img src=x");
  });

  it("replaces the input with a note once the chat has closed", () => {
    const html = panel({ enabled: false });
    expect(html).not.toContain("<form");
    expect(html).toContain("The chat closed after the game");
  });

  it("limits a message like the game chat", () => {
    expect(panel()).toContain('maxLength="200"');
  });
});
