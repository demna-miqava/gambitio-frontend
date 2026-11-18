import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatMessageTime } from "@/features/game-chat/utils/chat";
import type { StudyChatState, StudyMember } from "../types";

/** As the server allows after cleaning (backend src/game/chatText.ts) */
const MAX_LENGTH = 200;

interface StudyChatProps {
  chat: StudyChatState;
  members: StudyMember[];
  myId: number;
  connected: boolean;
  onSend: (text: string) => void;
  /** Why the last message was refused */
  error: string | null;
}

/**
 * Chat between the people watching the game in this room. The game's
 * players never see it. Message text is only ever a React text node.
 */
export const StudyChat = ({ chat, members, myId, connected, onSend, error }: StudyChatProps) => {
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const noteId = useId();
  const names = new Map(members.map((m) => [m.id, m.username]));
  const { messages, enabled } = chat;

  // Keep the latest message in view
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages.length]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !enabled || !connected) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <section aria-labelledby={`${inputId}-title`} className="flex flex-col gap-2 rounded-xl bg-card p-3 lg:rounded-none lg:bg-transparent lg:p-0">
      <h2 id={`${inputId}-title`} className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <MessageSquare className="size-4 text-muted-foreground" aria-hidden="true" />
        Room chat
      </h2>
      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-label="Room chat messages"
        className="flex max-h-48 min-h-16 flex-col gap-1 overflow-y-auto"
      >
        {messages.length === 0 ? (
          <p className="m-auto px-2 text-center text-xs text-muted-foreground">
            No messages yet. Only people in this room read them; the players can't.
          </p>
        ) : (
          messages.map((message, index) => {
            const own = message.userId === myId;
            const name = names.get(message.userId) ?? "Someone who left";
            const startsGroup = index === 0 || messages[index - 1].userId !== message.userId;
            return (
              <div key={message.id} className={cn("flex flex-col", own ? "items-end" : "items-start", startsGroup && index > 0 && "mt-1.5")}>
                {startsGroup && !own && (
                  <span className="px-1 text-[11px] text-muted-foreground" aria-hidden="true">
                    {name}
                  </span>
                )}
                <p
                  dir="auto"
                  title={formatMessageTime(message.at)}
                  className={cn(
                    "w-fit max-w-[85%] rounded-2xl px-3 py-1.5 text-sm leading-snug [overflow-wrap:anywhere]",
                    own ? "bg-primary/15 text-foreground" : "bg-muted text-foreground"
                  )}
                >
                  <span className="sr-only">{own ? "You: " : `${name}: `}</span>
                  {message.text}
                </p>
              </div>
            );
          })
        )}
      </div>
      {enabled ? (
        <form onSubmit={submit} className="flex gap-2">
          <label htmlFor={inputId} className="sr-only">
            Message the room
          </label>
          <Input
            id={inputId}
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={MAX_LENGTH}
            placeholder="Message the room"
            autoComplete="off"
            enterKeyHint="send"
            aria-describedby={noteId}
            aria-invalid={error ? true : undefined}
            disabled={!connected}
          />
          <Button type="submit" size="icon" aria-label="Send" disabled={!text.trim() || !connected}>
            <Send aria-hidden="true" />
          </Button>
        </form>
      ) : null}
      <p id={noteId} className={cn("text-xs", error ? "text-loss" : "text-muted-foreground")} aria-live="polite">
        {error ?? (enabled ? "" : "The chat closed after the game. Messages go an hour after it ended.")}
      </p>
    </section>
  );
};
