import { useEffect, useId, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { Eye, EyeOff, MessageCircleOff, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLiveGame } from "@/features/current-game/contexts/LiveGameContext";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import { useGameChat } from "../GameChatContext";
import {
  CHAT_COUNTER_FROM,
  CHAT_MAX_LENGTH,
  OFF_REASON_TEXT,
  chatLength,
  quickReplies,
} from "../utils/chat";
import { ChatMessages } from "./ChatMessages";

interface ChatPanelProps {
  className?: string;
  /** Put the cursor in the message box when the panel opens (the phone sheet) */
  autoFocus?: boolean;
  /** Docked at the foot of the game's side rail, where it is about 9 lines tall */
  compact?: boolean;
}

/**
 * Hides or shows the opponent's messages, on this device and for this game.
 * Sits in the heading of whatever holds the ChatPanel.
 */
export const ChatMuteButton = ({ className }: { className?: string }) => {
  const { muted, setMuted, messages, offReason } = useGameChat();
  const { opponent } = useLiveGame();
  const Icon = muted ? EyeOff : Eye;
  // Nothing to hide in a chat that is off and empty
  if (offReason && messages.length === 0) return null;
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-pressed={muted}
      aria-label={`Hide ${opponent.username}'s messages`}
      title={muted ? "Show their messages" : "Hide their messages"}
      onClick={() => setMuted(!muted)}
      className={cn("size-8 text-muted-foreground hover:text-foreground", className)}
    >
      <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
    </Button>
  );
};

/**
 * The conversation with the opponent and the box to write in. Fills the
 * height it is given; the messages scroll inside.
 */
export const ChatPanel = ({ className, autoFocus = false, compact = false }: ChatPanelProps) => {
  const { messages, canSend, offReason, send, error, clearError, rejected, muted, showing } = useGameChat();
  const { opponent, gameEnded, isConnected } = useLiveGame();
  const { id: viewerId } = useUser();
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Follow new messages only while the reader is at the bottom
  const stickToBottomRef = useRef(true);
  const errorId = useId();

  // While this is on screen, incoming messages count as read
  useEffect(() => showing(), [showing]);

  const shown = muted ? messages.filter((m) => m.userId === viewerId) : messages;
  const lastShownId = shown.length > 0 ? shown[shown.length - 1].id : null;
  useLayoutEffect(() => {
    const list = listRef.current;
    if (list && stickToBottomRef.current) list.scrollTop = list.scrollHeight;
  }, [lastShownId]);

  // A refused message goes back in the box, unless something new was typed
  useEffect(() => {
    if (rejected) setDraft((current) => current || rejected.text);
  }, [rejected]);

  const submit = (text: string) => {
    if (!canSend || !text.trim()) return;
    if (send(text)) {
      setDraft("");
      stickToBottomRef.current = true;
    }
  };
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit(draft);
    inputRef.current?.focus();
  };

  const remaining = CHAT_MAX_LENGTH - chatLength(draft);
  const isEmpty = shown.length === 0;

  return (
    <div className={cn("flex min-h-0 flex-col gap-2", className)}>
      <div className="min-h-0 flex-1">
        <div
          ref={listRef}
          role="log"
          aria-label={`Chat with ${opponent.username}`}
          tabIndex={0}
          onScroll={(event) => {
            const el = event.currentTarget;
            stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 32;
          }}
          className="flex h-full flex-col gap-1 overflow-y-auto overscroll-contain rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {isEmpty && offReason ? (
            // Nothing to read and nothing can be written: say why, in the middle
            <div className="m-auto flex flex-col items-center gap-2 px-4 py-4 text-center" role="status">
              <MessageCircleOff className="size-6 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
              <p className="text-sm font-medium text-foreground">{OFF_REASON_TEXT[offReason]}</p>
              {offReason === "off_by_opponent" && (
                <p className="text-xs text-muted-foreground">
                  You can't message each other in this game.
                </p>
              )}
            </div>
          ) : isEmpty ? (
            <div
              className={cn(
                "m-auto flex flex-col items-center px-2 text-center",
                compact ? "gap-2 py-1" : "gap-3 py-4"
              )}
            >
              <p className={cn("text-muted-foreground", compact ? "text-[13px]" : "text-sm")}>
                {muted
                  ? `You've hidden ${opponent.username}'s messages.`
                  : compact
                    ? "Only the two of you can see this chat."
                    : `Say hello to ${opponent.username}. Only the two of you see this.`}
              </p>
              {canSend && (
                <div className="flex flex-wrap justify-center gap-1.5">
                  {quickReplies(gameEnded).map((reply) => (
                    <button
                      key={reply}
                      type="button"
                      onClick={() => submit(reply)}
                      className="relative touch-target rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring active:bg-active-bg"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Pushes a short conversation to the bottom, next to the box */}
              <div className="flex-1" aria-hidden="true" />
              <ChatMessages messages={shown} viewerId={viewerId} opponentName={opponent.username} />
            </>
          )}
        </div>
      </div>

      {offReason ? (
        // With messages above; an empty conversation says it in the middle instead
        !isEmpty && (
          <p className="rounded-lg bg-muted/50 px-3 py-2 text-center text-xs text-muted-foreground" role="status">
            {OFF_REASON_TEXT[offReason]}
          </p>
        )
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <div className="relative min-w-0 flex-1">
              <Input
                ref={inputRef}
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  if (error) clearError();
                }}
                // In UTF-16 units, so never more than the server's limit in characters
                maxLength={CHAT_MAX_LENGTH}
                placeholder={isConnected ? "Message" : "Reconnecting…"}
                aria-label={`Message ${opponent.username}`}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                disabled={!isConnected}
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
      )}
    </div>
  );
};
