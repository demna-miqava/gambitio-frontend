import { isAxiosError } from "axios";
import { Link } from "react-router-dom";
import { NotFound } from "@/components/NotFound";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

interface GameLoadErrorProps {
  error: unknown;
  onRetry: () => void;
}

/** The game doesn't exist (or the id is invalid), as opposed to a failed request */
const isGameMissing = (error: unknown) =>
  !error ||
  (isAxiosError(error) &&
    (error.response?.status === 404 || error.response?.status === 400));

/**
 * Game page fallback: "Game not found" for a missing game, otherwise a
 * "Couldn't load" screen with Retry (network errors, server errors).
 */
export const GameLoadError = ({ error, onRetry }: GameLoadErrorProps) => {
  if (isGameMissing(error)) {
    return (
      <NotFound
        title="Game not found"
        description="This game doesn't exist or has been removed."
      />
    );
  }

  return (
    <NotFound
      code=""
      title="Couldn't load this game"
      description="Check your connection and try again."
      action={
        <div className="flex gap-2">
          <Button onClick={onRetry}>Retry</Button>
          <Button variant="outline" asChild>
            <Link to={ROUTES.HOME}>Back to home</Link>
          </Button>
        </div>
      }
    />
  );
};
