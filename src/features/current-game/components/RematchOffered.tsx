import { Button } from "@/components/ui/button";

type Props = {
  /** Defaults to "Your opponent wants a rematch" */
  message?: string;
  onAcceptRematch: () => void;
  onDeclineRematch: () => void;
};

const RematchOffered = ({
  message = "Your opponent wants a rematch",
  onAcceptRematch,
  onDeclineRematch,
}: Props) => (
  <div className="flex w-full flex-col justify-center gap-3">
    <p className="text-center text-sm text-muted-foreground">
      {message}
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
