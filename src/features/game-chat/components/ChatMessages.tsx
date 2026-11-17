import { cn } from "@/lib/utils";
import type { ChatMessage } from "../types";
import { formatMessageTime } from "../utils/chat";

interface ChatMessagesProps {
  messages: ChatMessage[];
  viewerId: number | undefined;
  opponentName: string;
}

/**
 * The messages of a conversation, the viewer's on the right.
 *
 * Message text is only ever a React text node ({message.text}), never HTML:
 * whatever a player typed shows up as the characters they typed. Don't
 * render it any other way (no dangerouslySetInnerHTML, no turning links into
 * anchors without checking the scheme).
 */
export const ChatMessages = ({ messages, viewerId, opponentName }: ChatMessagesProps) => (
  <>
    {messages.map((message, index) => {
      const own = message.userId === viewerId;
      const startsGroup = index > 0 && messages[index - 1].userId !== message.userId;
      return (
        <p
          key={message.id}
          // Right-to-left text lays out correctly whatever the page's direction
          dir="auto"
          title={formatMessageTime(message.at)}
          className={cn(
            "w-fit max-w-[85%] rounded-2xl px-3 py-1.5 text-sm leading-snug [overflow-wrap:anywhere]",
            own ? "self-end bg-primary/15 text-foreground" : "self-start bg-muted text-foreground",
            startsGroup && "mt-1.5"
          )}
        >
          <span className="sr-only">{own ? "You: " : `${opponentName}: `}</span>
          {message.text}
        </p>
      );
    })}
  </>
);
