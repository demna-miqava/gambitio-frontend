import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ArrowDown, Flag, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReportDialog } from "@/features/moderation/components/ReportDialog";
import { ChatBubble } from "@/features/game-chat/components/ChatMessages";
import { CHAT_COUNTER_FROM, CHAT_MAX_LENGTH, chatLength } from "@/features/game-chat/utils/chat";
import { isNearBottom } from "@/features/study/utils/chatScroll";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import { useSpectatorChat } from "../SpectatorChatContext";

interface SpectatorChatPanelProps {
  gameId: number;
  className?: string;
  /** Put the cursor in the box when the panel opens (a sheet on a large screen) */
  autoFocus?: boolean;
}

/**
 * The spectators' conversation and the box to write in. Fills the height it
 * is given; the messages scroll inside. Each message names its writer, and
 * someone else's can be reported (the report keeps this chat as it stands).
 * Message text is only ever a React text node (ChatBubble).
 */
export const SpectatorChatPanel = ({ gameId, className, autoFocus = false }: SpectatorChatPanelProps) => {
  const { messages, canSend, open, send, error, clearError, rejected, showing } = useSpectatorChat();
  const { id: viewerId } = useUser();
  const [draft, setDraft] = useState("");
  const [reporting, setReporting] = useState<{ id: number; username: string } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);
  const [unseen, setUnseen] = useState(false);
  const inputId = useId();
  const errorId = useId();

  useEffect(() => showing(), [showing]);

  // Follow new messages while the reader is at the bottom; your own always shows
  const lastId = messages.at(-1)?.id;
  const lastIsOwn = messages.at(-1)?.userId === viewerId;
  useEffect(() => {
    const list = listRef.current;
    if (!list || lastId === undefined) return;
    if (atBottomRef.current || lastIsOwn) {
      list.scrollTop = list.scrollHeight;
      setUnseen(false);
    } else {
      setUnseen(true);
    }
  }, [lastId, lastIsOwn]);

  // The list shrinking (an error line under the box, the keyboard) keeps a
  // reader who was at the bottom there
  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      if (atBottomRef.current) list.scrollTop = list.scrollHeight;
    });
    observer.observe(list);
    return () => observer.disconnect();
  }, []);

  // A refused message goes back in the box, unless something new was typed
  useEffect(() => {
    if (rejected) setDraft((current) => current || rejected.text);
  }, [rejected]);

  const remaining = CHAT_MAX_LENGTH - chatLength(draft);
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSend || !draft.trim() || remaining < 0) return;
    if (send(draft)) {
      setDraft("");
      atBottomRef.current = true;
    }
  };

  return (
    <div className={cn("flex min-h-0 flex-col gap-2", className)}>
      <div className="relative min-h-0 flex-1">
        <div
          ref={listRef}
          role="log"
          aria-label="Spectator chat messages"
          tabIndex={0}
          onScroll={(event) => {
            atBottomRef.current = isNearBottom(event.currentTarget);
            if (atBottomRef.current) setUnseen(false);
          }}
          className="flex h-full flex-col gap-1 overflow-y-auto overscroll-contain rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {messages.length === 0 ? (
            <p className="m-auto px-2 py-4 text-center text-xs text-muted-foreground">
              No messages yet. Everyone watching reads this chat; the players never do.
            </p>
          ) : (
            <>
              <div className="flex-1" aria-hidden="true" />
              {messages.map((message, index) => {
                const own = message.userId === viewerId;
                const startsGroup = index === 0 || messages[index - 1].userId !== message.userId;
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "group flex flex-col",
                      own ? "items-end" : "items-start",
                      startsGroup && index > 0 && "mt-1.5"
                    )}
                  >
                    {startsGroup && !own && (
                      <span className="px-1 text-[11px] text-muted-foreground" aria-hidden="true">
                        {message.username}
                      </span>
                    )}
                    <div className={cn("flex w-full items-center gap-1", own && "justify-end")}>
                      <ChatBubble message={message} own={own} senderName={message.username} />
                      {!own && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setReporting({ id: message.userId, username: message.username })}
                          aria-label={`Report ${message.username}'s message`}
                          title={`Report ${message.username}`}
                          className="size-7 shrink-0 text-muted-foreground opacity-0 focus-visible:opacity-100 group-hover:opacity-100 hover:text-destructive [@media(hover:none)]:opacity-100"
                        >
                          <Flag className="size-3.5" aria-hidden="true" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
        {unseen && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              const list = listRef.current;
              if (list) list.scrollTop = list.scrollHeight;
              atBottomRef.current = true;
              setUnseen(false);
            }}
            className="absolute bottom-1 left-1/2 -translate-x-1/2 shadow-md"
          >
            <ArrowDown aria-hidden="true" />
            New messages
          </Button>
        )}
      </div>

      {open ? (
        <form onSubmit={onSubmit} className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <label htmlFor={inputId} className="sr-only">
              Message everyone watching
            </label>
            <div className="relative min-w-0 flex-1">
              <Input
                id={inputId}
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  if (error) clearError();
                }}
                // In UTF-16 units, so never more than the server's limit in characters
                maxLength={CHAT_MAX_LENGTH}
                placeholder={canSend ? "Message everyone watching" : "Reconnecting…"}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                disabled={!canSend}
                autoFocus={autoFocus}
                autoComplete="off"
                enterKeyHint="send"
                className={cn("h-10 sm:h-9", remaining <= CHAT_COUNTER_FROM && "pr-10")}
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
            <Button
              type="submit"
              size="icon"
              aria-label="Send message"
              disabled={!canSend || !draft.trim()}
              className="size-10 sm:size-9"
            >
              <SendHorizontal className="size-4" aria-hidden="true" />
            </Button>
          </div>
          {error && (
            <p id={errorId} role="alert" className="px-1 text-xs text-destructive">
              {error}
            </p>
          )}
        </form>
      ) : (
        <p role="status" className="rounded-lg bg-muted/50 px-3 py-2 text-center text-xs text-muted-foreground">
          This chat has closed.
        </p>
      )}

      {reporting && (
        <ReportDialog
          player={reporting}
          spectatorGameId={gameId}
          open
          onOpenChange={(next) => !next && setReporting(null)}
        />
      )}
    </div>
  );
};
