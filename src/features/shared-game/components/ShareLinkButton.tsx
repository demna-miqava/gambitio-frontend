import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useShareLink } from "./ShareLinkContext";

/** Labelled "Share link" button (phones); renders nothing where the game can't be shared. */
export const ShareLinkButton = ({ className }: { className?: string }) => {
  const shareLink = useShareLink();
  if (!shareLink) return null;

  return (
    <Button type="button" variant="outline" size="md" onClick={shareLink.openShareLink} className={cn(className)}>
      <Link2 aria-hidden="true" /> Share link
    </Button>
  );
};
