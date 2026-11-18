import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/lib/utils";
import { shareGame, unshareGame } from "@/services/game";
import { QKEY_GAME_SHARE_LINK, QKEY_SHARED_GAME } from "@/constants/queryKeys";
import type { StoredGame } from "@/types";
import { outcomeText, sharedGameUrl } from "../sharedGame";

interface ShareLinkContextValue {
  /** Opens the dialog with the game's link (made on first use) */
  openShareLink: () => void;
}

const ShareLinkContext = createContext<ShareLinkContextValue | null>(null);

/**
 * Whether the viewer may share the game: they played it, and it was played
 * to an end (the server checks the same; an aborted game was never a game).
 */
// eslint-disable-next-line react-refresh/only-export-components
export const canShareGame = (
  game: Pick<StoredGame, "status" | "result"> & {
    whitePlayer: { id: number | null };
    blackPlayer: { id: number | null };
  },
  viewerId: number | null | undefined
): boolean =>
  viewerId != null &&
  (game.whitePlayer.id === viewerId || game.blackPlayer.id === viewerId) &&
  game.status === "finished" &&
  game.result !== "aborted";

/** How long "Copied" stays on the button */
const COPIED_MS = 2_000;

const canShareNatively = () =>
  typeof navigator !== "undefined" && typeof navigator.share === "function";

const ShareLinkDialog = ({
  game,
  open,
  onOpenChange,
}: {
  game: StoredGame;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => [QKEY_GAME_SHARE_LINK, game.id], [game.id]);
  // Asking for the link makes it (the same one every time), so it is only
  // asked for once the player opens the dialog
  const link = useQuery({
    queryKey,
    queryFn: () => shareGame(game.id),
    enabled: open,
    staleTime: Infinity,
    retry: false,
  });
  const url = link.data ? sharedGameUrl(link.data.token) : "";

  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (copiedTimer.current && clearTimeout(copiedTimer.current)), []);
  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  const copyLink = () => {
    if (!url) return;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true);
        if (copiedTimer.current) clearTimeout(copiedTimer.current);
        copiedTimer.current = setTimeout(() => setCopied(false), COPIED_MS);
      })
      .catch(() => toast.error("Couldn't copy to the clipboard", { description: "Select the link and copy it." }));
  };

  const shareNatively = () => {
    if (!url) return;
    navigator
      .share({
        title: `${game.whitePlayer.username} vs ${game.blackPlayer.username}`,
        text: `${outcomeText(game)}. Replay the game on Gambitio.`,
        url,
      })
      // Closing the share sheet rejects too: nothing to report either way
      .catch(() => {});
  };

  const turnOff = useMutation({
    mutationFn: () => unshareGame(game.id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey });
      // A copy of the shared page this browser loaded would outlive the link
      queryClient.removeQueries({ queryKey: [QKEY_SHARED_GAME] });
      toast.success("Link turned off", { description: "It no longer opens the game." });
      onOpenChange(false);
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Couldn't turn the link off. Try again.")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this game</DialogTitle>
          <DialogDescription>
            Anyone with the link can replay the game, no account needed. Signed-in players also
            get the engine.
          </DialogDescription>
        </DialogHeader>

        {link.isError ? (
          <div role="alert" className="space-y-3">
            <p className="text-sm text-destructive">
              {getApiErrorMessage(link.error, "Couldn't make the link. Check your connection and try again.")}
            </p>
            <Button variant="outline" size="md" onClick={() => void link.refetch()}>
              Retry
            </Button>
          </div>
        ) : !link.data ? (
          <div className="flex gap-2" aria-busy="true" aria-label="Making the link">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-24" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                readOnly
                value={url}
                aria-label="Link to this game"
                className="h-10 min-w-0 flex-1 font-mono text-sm"
                onFocus={(event) => event.currentTarget.select()}
              />
              <Button size="md" onClick={copyLink} className="w-24 shrink-0">
                {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <span className="sr-only" aria-live="polite">
              {copied ? "Link copied" : ""}
            </span>
            {canShareNatively() && (
              <Button variant="outline" size="md" onClick={shareNatively} className="w-full">
                <Share2 aria-hidden="true" /> Share…
              </Button>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            variant="ghost"
            size="md"
            className="text-destructive hover:text-destructive"
            disabled={!link.data || turnOff.isPending}
            onClick={() => turnOff.mutate()}
          >
            {turnOff.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
            Turn off link
          </Button>
          <Button variant="outline" size="md" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface ShareLinkProviderProps {
  game: StoredGame;
  /** The signed-in user: only a player of the game can share it */
  viewerId: number | null | undefined;
  children: ReactNode;
}

/**
 * Offers "Share link" for a finished game to the two who played it (see the
 * button in the analysis header): a link to a page that shows the game to
 * anyone, signed in or not.
 */
export const ShareLinkProvider = ({ game, viewerId, children }: ShareLinkProviderProps) => {
  const [open, setOpen] = useState(false);
  const allowed = canShareGame(game, viewerId);
  const openShareLink = useCallback(() => setOpen(true), []);
  const value = useMemo(() => (allowed ? { openShareLink } : null), [allowed, openShareLink]);

  return (
    <ShareLinkContext.Provider value={value}>
      {children}
      {allowed && <ShareLinkDialog game={game} open={open} onOpenChange={setOpen} />}
    </ShareLinkContext.Provider>
  );
};

/** "Share link" for the game on screen, or null where it isn't offered (not the viewer's game, imported PGNs). */
// eslint-disable-next-line react-refresh/only-export-components
export const useShareLink = () => useContext(ShareLinkContext);
