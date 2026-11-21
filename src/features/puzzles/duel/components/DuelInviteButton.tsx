import { Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDuelInvites } from "../hooks/useDuelInvites";

/** "Duel" on a friend's card: sends them a puzzle duel invite. */
export const DuelInviteButton = ({ friend }: { friend: { id: number; username: string } }) => {
  const invites = useDuelInvites();
  const invited = invites.outgoing.some((i) => i.to.id === friend.id);
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={invites.send.isPending || invited}
      onClick={() => invites.send.mutate({ recipientId: friend.id })}
      aria-label={invited ? `Puzzle duel invite sent to ${friend.username}` : `Invite ${friend.username} to a puzzle duel`}
      title="You're friends. Invite them to a puzzle duel"
    >
      <Swords aria-hidden="true" />
      {invited ? "Invited" : "Duel"}
    </Button>
  );
};
