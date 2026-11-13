import { Button } from "@/components/ui/button";

type Props = {
  onAcceptRematch: () => void;
  onDeclineRematch: () => void;
};

const RematchOffered = ({ onAcceptRematch, onDeclineRematch }: Props) => (
  <div className="flex w-full flex-col justify-center gap-3">
    <p className="text-center text-sm text-muted-foreground">
      Your opponent wants a rematch
    </p>
    <div className="flex gap-2">
      <Button size="md" onClick={onAcceptRematch} className="flex-1">
        Accept
      </Button>
      <Button size="md" onClick={onDeclineRematch} variant="secondary" className="flex-1">
        Decline
      </Button>
    </div>
  </div>
);

export default RematchOffered;
