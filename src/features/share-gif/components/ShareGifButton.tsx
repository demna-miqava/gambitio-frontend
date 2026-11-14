import { Film, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useShareGif } from "../contexts/ShareGifContext";

/** Labelled "Share GIF" button (phones); renders nothing where no GIF is offered. */
export const ShareGifButton = ({ className }: { className?: string }) => {
  const shareGif = useShareGif();
  if (!shareGif) return null;
  const { isGenerating, canShareGif } = shareGif;

  return (
    <Button
      type="button"
      variant="outline"
      size="md"
      onClick={shareGif.shareGif}
      disabled={!canShareGif}
      // Stays focusable while busy; repeat clicks are ignored
      aria-busy={isGenerating || undefined}
      aria-disabled={isGenerating || undefined}
      className={cn(className)}
    >
      {isGenerating ? (
        <Loader2 className="animate-spin" aria-hidden="true" />
      ) : (
        <Film aria-hidden="true" />
      )}
      {isGenerating ? "Making GIF…" : "Share GIF"}
    </Button>
  );
};
