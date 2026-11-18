import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ArrowDown, Flag, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CHAT_COUNTER_FROM, CHAT_MAX_LENGTH, chatLength } from "@/features/game-chat/utils/chat";
import { ChatBubble } from "@/features/game-chat/components/ChatMessages";
import { ReportDialog } from "@/features/moderation/components/ReportDialog";
import type { ChatMessage } from "@/features/game-chat/types";
import type { StudyMember } from "../types";
import { useStudyChat } from "../hooks/useStudyChat";
import { isNearBottom } from "../utils/chatScroll";

interface StudyChatProps {
  roomId: number;
  members: StudyMember[];
  myId: number;
  connected: boolean;
  className?: string;
}

/**
 * Chat between the people watching the game in this room, from
 * StudyChatContext; nothing when this member has no chat here. The game's
 * players never see it. Message text is only ever a React text node
 * (ChatBubble). Another member's message can be reported, with the room as
 * its context.
 */
export const StudyChat = ({ roomId, members, myId, connected, className }: StudyChatProps) => {
  const context = useStudyChat();
  if (!context?.chat) return null;
  return (
    <StudyChatPanel
      roomId={roomId}
      members={members}
      myId={myId}
      connected={connected}
      messages={context.chat.messages}
      enabled={context.chat.enabled}
      error={context.error}
      onSend={context.send}
      className={className}
    />
  );
};

interface StudyChatPanelProps extends Omit<StudyChatProps, "className"> {
  messages: ChatMessage[];
  /** False once the chat has closed */
  enabled: boolean;
  /** Why the last message was refused */
  error: string | null;
  onSend: (text: string) => void;
  className?: string;
}

export const StudyChatPanel = ({
  roomId,
  members,
  myId,
  connected,
  messages,
  enabled,
  error,
  onSend,
  className,
}: StudyChatPanelProps) => {
  const [text, setText] = useState("");
  const [reporting, setReporting] = useState<{ id: number; username: string } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // Follow new messages only while the reader is at the bottom; someone
  // scrolled up to read is left there, with a "New messages" button
  const atBottomRef = useRef(true);
  const [unseen, setUnseen] = useState(false);
  const inputId = useId();
  const noteId = useId();
  const names = new Map(members.map((m) => [m.id, m.username]));
  // The newest message: what changes even when the list is full (MAX_CHAT_MESSAGES)
  const lastId = messages.at(-1)?.id;
  const lastIsOwn = messages.at(-1)?.userId === myId;

  useEffect(() => {
    const list = listRef.current;
    if (!list || lastId === undefined) return;
    // Your own message always comes into view
    if (atBottomRef.current || lastIsOwn) {
      list.scrollTop = list.scrollHeight;
      setUnseen(false);
    } else {
      setUnseen(true);
    }
  }, [lastId, lastIsOwn]);

  const showLatest = () => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
    atBottomRef.current = true;
    setUnseen(false);
  };

  const remaining = CHAT_MAX_LENGTH - chatLength(text);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !enabled || !connected || remaining < 0) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <section
      aria-labelledby={`${inputId}-title`}
      className={cn("flex flex-col gap-2 rounded-xl bg-card p-3 lg:rounded-none lg:bg-transparent", className)}
    >
      <h2 id={`${inputId}-title`} className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <MessageSquare className="size-4 text-muted-foreground" aria-hidden="true" />
        Room chat
      </h2>
      <div className="relative">
        <div
          ref={listRef}
          role="log"
          aria-live="polite"
          aria-label="Room chat messages"
          tabIndex={0}
          onScroll={(event) => {
            atBottomRef.current = isNearBottom(event.currentTarget);
            if (atBottomRef.current) setUnseen(false);
          }}
          className="flex max-h-48 min-h-16 flex-col gap-1 overflow-y-auto overscroll-contain rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {messages.length === 0 ? (
            <p className="m-auto px-2 text-center text-xs text-muted-foreground">
              No messages yet. Only people in this room read them; the players can't.
            </p>
          ) : (
            messages.map((message, index) => {
              const own = message.userId === myId;
              const username = names.get(message.userId);
              const name = username ?? "Someone who left";
              const startsGroup = index === 0 || messages[index - 1].userId !== message.userId;
              return (
                <div
                  key={message.id}
                  className={cn("group flex flex-col", own ? "items-end" : "items-start", startsGroup && index > 0 && "mt-1.5")}
                >
                  {startsGroup && !own && (
                    <span className="px-1 text-[11px] text-muted-foreground" aria-hidden="true">
                      {name}
                    </span>
                  )}
                  <div className={cn("flex w-full items-center gap-1", own && "justify-end")}>
                    <ChatBubble message={message} own={own} senderName={name} />
                    {!own && username !== undefined && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setReporting({ id: message.userId, username })}
                        aria-label={`Report ${username}'s message`}
                        title={`Report ${username}`}
                        className="size-7 shrink-0 text-muted-foreground opacity-0 focus-visible:opacity-100 group-hover:opacity-100 hover:text-destructive [@media(hover:none)]:opacity-100"
                      >
                        <Flag className="size-3.5" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        {unseen && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={showLatest}
            className="absolute bottom-1 left-1/2 -translate-x-1/2 shadow-md"
          >
            <ArrowDown aria-hidden="true" />
            New messages
          </Button>
        )}
      </div>
      {enabled ? (
        <form onSubmit={submit} className="flex gap-2">
          <label htmlFor={inputId} className="sr-only">
            Message the room
          </label>
          <div className="relative min-w-0 flex-1">
            <Input
              id={inputId}
              value={text}
              onChange={(event) => setText(event.target.value)}
              // In UTF-16 units, so never more than the server's limit in characters
              maxLength={CHAT_MAX_LENGTH}
              placeholder="Message the room"
              autoComplete="off"
              enterKeyHint="send"
              aria-describedby={noteId}
              aria-invalid={error ? true : undefined}
              disabled={!connected}
              className={cn(remaining <= CHAT_COUNTER_FROM && "pr-10")}
            />
            {remaining <= CHAT_COUNTER_FROM && (
              <span
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs tabular-nums",
                  remaining <= 0 ? "text-destructive" : "text-muted-foreground"
                )}
              >
                {remaining}
              </span>
            )}
          </div>
          <Button type="submit" size="icon" aria-label="Send" disabled={!text.trim() || !connected || remaining < 0}>
            <Send aria-hidden="true" />
          </Button>
        </form>
      ) : null}
      <p id={noteId} className={cn("text-xs", error ? "text-loss" : "text-muted-foreground")} aria-live="polite">
        {error ?? (enabled ? "" : "The chat closed after the game. Messages go an hour after it ended.")}
      </p>
      {reporting && (
        <ReportDialog
          player={reporting}
          studyRoomId={roomId}
          open
          onOpenChange={(open) => !open && setReporting(null)}
        />
      )}
    </section>
  );
};
