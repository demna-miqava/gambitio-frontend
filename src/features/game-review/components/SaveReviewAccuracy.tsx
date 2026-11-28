import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { saveGameReview } from "@/services/game";
import { userStore } from "@/utils/userStorage";
import { QKEY_USER_GAMES } from "@/constants/queryKeys";
import { useGameReview } from "../contexts/GameReviewContext";

/** What was last sent for a game ("91.3|74"), so reopening a reviewed game sends nothing */
const sent = userStore("review-sent:v1", { maxEntries: 300 });

/** As the server keeps it: one decimal */
const rounded = (accuracy: number | null) => (accuracy === null ? null : Math.round(accuracy * 10) / 10);

/**
 * Inside a GameReviewProvider, for one of the viewer's own finished games:
 * once the review is ready, its two accuracies are saved to the viewer's
 * account, so the game shows them in their game lists on any device. Sent
 * once per result; a failure is silent and tried again the next time the
 * game is opened (the review itself is unaffected). Renders nothing.
 */
export const SaveReviewAccuracy = ({ gameId }: { gameId: number }) => {
  const review = useGameReview()?.review ?? null;
  const queryClient = useQueryClient();
  const white = review ? rounded(review.white.accuracy) : undefined;
  const black = review ? rounded(review.black.accuracy) : undefined;

  useEffect(() => {
    if (white === undefined || black === undefined) return;
    const key = String(gameId);
    const value = `${white ?? ""}|${black ?? ""}`;
    if (sent.get(key) === value) return;
    saveGameReview(gameId, { white, black })
      .then(() => {
        sent.set(key, value);
        // The lists that show it are out of date now, also when the player
        // has left this page while it was being saved (often for one of them)
        void queryClient.invalidateQueries({ queryKey: [QKEY_USER_GAMES] });
      })
      .catch(() => {});
  }, [gameId, white, black, queryClient]);

  return null;
};
