import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { StoredGame } from "@/types";
import { gameFrames } from "../utils/frames";
import { gifFileName, gifOrientation, playerLabel, resultLabel } from "../utils/gameInfo";
import { canShareFile, downloadBlob, shareFile } from "../utils/deliver";

interface ShareGifContextValue {
  /** Makes the GIF, then opens the share sheet or downloads it */
  shareGif: () => void;
  isGenerating: boolean;
  /** False when the game has no moves to animate */
  canShareGif: boolean;
}

const ShareGifContext = createContext<ShareGifContextValue | null>(null);

interface ShareGifProviderProps {
  game: StoredGame;
  /** The signed-in user, who sees the board from their side if they played */
  viewerId: number | null | undefined;
  children: ReactNode;
}

const isAbort = (error: unknown) => error instanceof DOMException && error.name === "AbortError";

/** Offers "Share GIF" for a finished game (see the button in the analysis header). */
export const ShareGifProvider = ({ game, viewerId, children }: ShareGifProviderProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const busyRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);

  const pgn = game.pgn ?? "";
  const canShareGif = useMemo(() => {
    try {
      return gameFrames(pgn).length > 1;
    } catch {
      return false;
    }
  }, [pgn]);

  const shareGif = useCallback(async () => {
    if (busyRef.current || !canShareGif) return;
    busyRef.current = true;
    setIsGenerating(true);
    const controller = new AbortController();
    abortRef.current = controller;
    const toastId = toast.loading("Making your GIF…");

    try {
      // The encoder and piece images load only when someone asks for a GIF
      const { generateGameGif } = await import("../generateGameGif");
      let shownPercent = 0;
      const blob = await generateGameGif(
        {
          pgn,
          orientation: gifOrientation(game, viewerId),
          whiteLabel: playerLabel(game.whitePlayer),
          blackLabel: playerLabel(game.blackPlayer),
          result: resultLabel(game.result, game.endReason),
        },
        {
          signal: controller.signal,
          onProgress: (fraction) => {
            const percent = Math.floor(fraction * 10) * 10;
            if (percent > shownPercent && percent < 100) {
              shownPercent = percent;
              toast.loading(`Making your GIF… ${percent}%`, { id: toastId });
            }
          },
        }
      );

      const fileName = gifFileName(game.id);
      const file = new File([blob], fileName, { type: "image/gif" });
      const title = `${game.whitePlayer.username} vs ${game.blackPlayer.username}`;
      const download = () => {
        downloadBlob(blob, fileName);
        toast.success("GIF downloaded", { id: toastId, description: fileName });
      };

      if (!canShareFile(file)) {
        download();
        return;
      }
      const outcome = await shareFile(file, title);
      if (outcome === "shared" || outcome === "cancelled") {
        toast.dismiss(toastId);
      } else if (outcome === "needs-gesture") {
        // Making the GIF took long enough that the browser no longer counts
        // the click; sharing needs a fresh one
        toast.success("Your GIF is ready", {
          id: toastId,
          duration: 15_000,
          action: {
            label: "Share",
            onClick: async () => {
              const retry = await shareFile(file, title);
              if (retry === "needs-gesture" || retry === "failed") download();
            },
          },
          cancel: { label: "Download", onClick: download },
        });
      } else {
        download();
      }
    } catch (error) {
      if (isAbort(error)) {
        toast.dismiss(toastId);
      } else {
        console.error("GIF generation failed", error);
        toast.error("Couldn't make the GIF", { id: toastId, description: "Please try again." });
      }
    } finally {
      busyRef.current = false;
      abortRef.current = null;
      if (!controller.signal.aborted) setIsGenerating(false);
    }
  }, [canShareGif, game, pgn, viewerId]);

  const value = useMemo<ShareGifContextValue>(
    () => ({ shareGif: () => void shareGif(), isGenerating, canShareGif }),
    [shareGif, isGenerating, canShareGif]
  );

  return <ShareGifContext.Provider value={value}>{children}</ShareGifContext.Provider>;
};

/** "Share GIF" for the game on screen, or null where it isn't offered (imported PGNs, the analysis board). */
// eslint-disable-next-line react-refresh/only-export-components
export const useShareGif = () => useContext(ShareGifContext);
