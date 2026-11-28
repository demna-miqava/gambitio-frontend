import { useState } from "react";
import { MessageCircle, MessageCircleOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useLiveGame } from "@/features/current-game/contexts/LiveGameContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useKeyboardInset } from "@/hooks/useKeyboardInset";
import { cn } from "@/lib/utils";
import { useGameChat } from "../GameChatContext";
import { ChatMuteButton, ChatPanel } from "./ChatPanel";

/** The count of unseen messages, as a dot on a button or tab */
export const UnreadBadge = ({ count, className }: { count: number; className?: string }) =>
  count > 0 ? (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.625rem] leading-none font-medium text-primary-foreground tabular-nums",
        className
      )}
    >
      {count > 9 ? "9+" : count}
    </span>
  ) : null;

/**
 * Chat where the side panel has no room for it (below 1024px): a button with
 * the unread count that opens the conversation in a sheet, from the bottom
 * on phones and from the side on tablets. A slashed icon when the opponent
 * has chat turned off (the sheet says so). Renders nothing when the game has
 * no chat to show (see isChatShown).
 */
export const ChatSheetButton = ({
  className,
  labelled = false,
}: {
  className?: string;
  /** With its name under the icon, as a button of the phone's bottom bar (pass the bar's item classes) */
  labelled?: boolean;
}) => {
  const { available, unread, offReason } = useGameChat();
  const offByOpponent = offReason === "off_by_opponent";
  const Icon = offByOpponent ? MessageCircleOff : MessageCircle;
  const { opponent } = useLiveGame();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  // Keeps the message box above the on-screen keyboard
  const keyboardInset = useKeyboardInset(open && isMobile);
  if (!available) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size={labelled ? "md" : "icon"}
          aria-label={
            offByOpponent
              ? "Chat: your opponent has it turned off"
              : unread > 0
                ? `Chat, ${unread} new ${unread === 1 ? "message" : "messages"}`
                : "Chat"
          }
          title={offByOpponent ? "Your opponent has chat turned off" : "Chat"}
          className={cn("relative", offByOpponent && "text-muted-foreground", className)}
        >
          <Icon className={labelled ? undefined : "size-[18px]"} strokeWidth={1.75} aria-hidden="true" />
          {labelled && <span aria-hidden="true">Chat</span>}
          <UnreadBadge
            count={unread}
            className={cn("absolute", labelled ? "top-1 left-1/2 ml-1.5" : "top-0.5 right-0.5")}
          />
        </Button>
      </SheetTrigger>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        style={
          isMobile
            ? // Above the keyboard, and never taller than what is left over it
              { bottom: keyboardInset, maxHeight: `calc(100dvh - ${keyboardInset}px - 2.5rem)` }
            : undefined
        }
        className={cn(
          "gap-0",
          isMobile
            ? "h-[min(26rem,62dvh)] rounded-t-2xl pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            : "w-88 max-w-[85vw]"
        )}
      >
        {/* Clear of the sheet's close button on the right */}
        <SheetHeader className="flex-row items-center gap-1 py-2.5 pr-12">
          <SheetTitle className="min-w-0 flex-1 truncate font-display text-base">
            Chat with {opponent.username}
          </SheetTitle>
          <ChatMuteButton />
          <SheetDescription className="sr-only">
            Messages between you and your opponent. Spectators can't see them.
          </SheetDescription>
        </SheetHeader>
        <ChatPanel className="min-h-0 flex-1 px-4 pb-1" autoFocus={!isMobile} />
      </SheetContent>
    </Sheet>
  );
};
