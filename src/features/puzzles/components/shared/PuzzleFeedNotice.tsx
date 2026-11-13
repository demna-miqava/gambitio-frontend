import { AlertCircle, Loader2, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePuzzle } from "../../contexts";
import { formatThemeLabel } from "../../utils/themeLabels";

/** Shown instead of the puzzle controls while there's no puzzle on the board. */
export const PuzzleFeedNotice = () => {
  const context = usePuzzle();
  const { feed } = context;
  const theme = context.mode === "infinite" ? context.theme : "";

  if (feed.isError) {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 rounded-xl bg-loss-bg px-3 py-5 text-center text-sm">
        <AlertCircle className="size-5 text-loss" aria-hidden="true" />
        <p className="text-foreground">Couldn't load puzzles.</p>
        <Button variant="outline" size="sm" onClick={feed.retry}>
          Try again
        </Button>
      </div>
    );
  }

  if (feed.isEmpty) {
    return (
      <div role="status" className="flex flex-col items-center gap-3 rounded-xl bg-muted px-3 py-5 text-center text-sm">
        <SearchX className="size-5 text-muted-foreground" aria-hidden="true" />
        <p className="text-foreground">
          {theme
            ? `No puzzles left in “${formatThemeLabel(theme)}”.`
            : "You've solved every puzzle we have. Check back later."}
        </p>
        {theme && context.mode === "infinite" && (
          <Button variant="outline" size="sm" onClick={() => context.onThemeChange("")}>
            Show all themes
          </Button>
        )}
      </div>
    );
  }

  return (
    <div role="status" className="flex min-h-12 items-center gap-2.5 rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      Loading puzzles…
    </div>
  );
};
