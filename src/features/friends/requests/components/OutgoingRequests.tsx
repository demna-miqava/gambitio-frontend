import { Send } from "lucide-react";
import { FriendRequestCard } from "./FriendRequestCard";
import { EmptyState } from "@/components/EmptyState";
import type { FriendRequest } from "@/features/friends/types";

interface OutgoingRequestsProps {
  requests: FriendRequest[];
  onCancel: (request: FriendRequest) => void;
  disabled?: boolean;
}

export const OutgoingRequests = ({ requests, onCancel, disabled }: OutgoingRequestsProps) => {
  if (requests.length === 0) {
    return (
      <EmptyState
        compact
        icon={Send}
        title="No sent requests"
        description="Search for players to send them a request."
      />
    );
  }

  return (
    <ul className="space-y-2">
      {requests.map((request) => (
        <FriendRequestCard
          key={request.id}
          request={request}
          type="outgoing"
          onCancel={onCancel}
          disabled={disabled}
        />
      ))}
    </ul>
  );
};
