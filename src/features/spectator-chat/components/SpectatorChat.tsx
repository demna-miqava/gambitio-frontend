import { useState } from "react";
import { EyeOff, MessageSquare, MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { UnreadBadge } from "@/features/game-chat/components/ChatSheetButton";
import { useIsMobile } from "@/hooks/use-mobile";
import { useKeyboardInset } from "@/hooks/useKeyboardInset";
import { cn } from "@/lib/utils";
import { useSpectatorChat } from "../SpectatorChatContext";
import { SpectatorChatPanel } from "./SpectatorChatPanel";

const DESCRIPTION = "Everyone watching this game reads this chat. The players never see it.";

/**
 * The spectator chat in the side panel (from 1024px): a heading with Hide,
 * and the conversation. Hidden, it is one line offering to show it again.
 * Nothing for the game's players: the server sends them no spectator chat.
 */
export const SpectatorChatSection = ({ gameId, className }: { gameId: number; className?: string }) => {
  const { available, hidden, setHidden } = useSpectatorChat();
  if (!available) return null;
  if (hidden) {
    return (
      <div className={cn("flex items-center justify-between gap-2", className)}>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <EyeOff className="size-3.5" aria-hidden="true" />
          Spectator chat hidden
        </span>
        <Button type="button" variant="ghost" size="sm" onClick={() => setHidden(false)}>
          Show chat
        </Button>
      </div>
    );
  }
  return (
    <section aria-labelledby="spectator-chat-title" className={cn("flex min-h-0 flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 id="spectator-chat-title" className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <MessageSquare className="size-4 text-muted-foreground" aria-hidden="true" />
          Spectator chat
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => setHidden(true)}
          title="Hide the spectator chat in every game you watch (you can show it again)"
        >
          <EyeOff aria-hidden="true" /> Hide
        </Button>
      </div>
      <p className="sr-only">{DESCRIPTION}</p>
      <SpectatorChatPanel gameId={gameId} className="h-64" />
    </section>
  );
};

/**
 * The spectator chat where the side panel has no room for it (below
 * 1024px): a button with the unread count opening it in a sheet, from the
 * bottom on phones (as the players' chat does) and from the side on
 * tablets. Hiding it turns the button into "Show chat".
 */
export const SpectatorChatSheetButton = ({ gameId, className }: { gameId: number; className?: string }) => {
  const { available, hidden, setHidden, unread } = useSpectatorChat();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const keyboardInset = useKeyboardInset(open && isMobile);
  if (!available) return null;
  if (hidden) {
    return (
      <Button type="button" variant="ghost" size="sm" className={className} onClick={() => setHidden(false)}>
        <MessagesSquare aria-hidden="true" /> Show chat
      </Button>
    );
  }
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn("relative", className)}
          aria-label={unread > 0 ? `Spectator chat, ${unread} new ${unread === 1 ? "message" : "messages"}` : "Spectator chat"}
        >
          <MessagesSquare aria-hidden="true" />
          Chat
          <UnreadBadge count={unread} />
        </Button>
      </SheetTrigger>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        style={
          isMobile
            ? { bottom: keyboardInset, maxHeight: `calc(100dvh - ${keyboardInset}px - 2.5rem)` }
            : undefined
        }
        className={cn(
          "gap-0",
          isMobile
            ? "h-[min(28rem,66dvh)] rounded-t-2xl pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            : "w-88 max-w-[85vw]"
        )}
      >
        <SheetHeader className="flex-row items-center gap-1 py-2.5 pr-12">
          <SheetTitle className="min-w-0 flex-1 truncate font-display text-base">Spectator chat</SheetTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => {
              setHidden(true);
              setOpen(false);
            }}
          >
            <EyeOff aria-hidden="true" /> Hide
          </Button>
          <SheetDescription className="sr-only">{DESCRIPTION}</SheetDescription>
        </SheetHeader>
        <SpectatorChatPanel gameId={gameId} className="min-h-0 flex-1 px-4 pb-1" autoFocus={!isMobile} />
      </SheetContent>
    </Sheet>
  );
};
