import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

/**
 * Recent games for an account that has none: what will be here, and the one
 * thing that can fill it today (a game played somewhere else).
 */
export const NoGamesYet = () => (
  <section aria-labelledby="no-games-title">
    <h2 id="no-games-title" className="mb-3 font-display text-xl leading-tight sm:text-[22px]">
      Recent games
    </h2>
    <div className="panel grid gap-2 px-4 py-5 text-sm text-muted-foreground sm:px-5 sm:py-6">
      <p className="text-[15px] font-semibold text-foreground">No games yet</p>
      <p className="max-w-[62ch]">
        After each game you get an accuracy score and the moves worth a second look. Played
        somewhere else? Bring a game in as a PGN and review it here.
      </p>
      <div className="mt-2">
        <Button asChild variant="outline" className="max-sm:h-11">
          <Link to={ROUTES.TOOLS.IMPORT_GAME}>Import a PGN</Link>
        </Button>
      </div>
    </div>
  </section>
);
