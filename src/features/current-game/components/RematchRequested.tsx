import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  onCancelRematchRequest: () => void;
};

const RematchRequested = ({ onCancelRematchRequest }: Props) => {
  return (
    <div className="flex w-full flex-col justify-center gap-3">
      <p className="flex items-center justify-center gap-2 text-center text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Waiting for your opponent…
      </p>
      <Button size="md" variant="outline" onClick={onCancelRematchRequest} className="w-full">
        Cancel
      </Button>
    </div>
  );
};

export default RematchRequested;
