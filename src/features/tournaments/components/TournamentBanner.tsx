import { Link } from "react-router-dom";
import { Medal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTournamentRoute } from "@/constants/routes";
import { useOpenTournaments } from "../hooks/useTournaments";
import { tournamentFacts } from "../utils/tournamentFormat";
import { TournamentClock } from "./TournamentClock";

/**
 * Home: the tournament that is on, or the next one, when there is one.
 * Renders nothing otherwise (and while loading: it isn't worth a skeleton).
 */
export const TournamentBanner = () => {
  // Read once: Home shouldn't keep asking while it sits open. The list's
  // own page of them, so the player's tournament is found wherever it is
  // in it (and the list opens from the cache)
  const { data } = useOpenTournaments(20, { poll: false });
  // The player's own first, then what is running, then what is next
  const tournament = data?.data.find((t) => t.joined) ?? data?.data[0];
  if (!tournament) return null;

  return (
    <section
      aria-label="Tournament"
      className="flex flex-col gap-3 rounded-2xl bg-card p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
    >
      <div className="min-w-0">
        <p className="flex items-center gap-2.5 font-display text-xl text-foreground">
          <Medal className="size-5 shrink-0 text-gold" aria-hidden="true" />
          <span className="truncate">{tournament.name}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          {tournamentFacts(tournament)} · <TournamentClock tournament={tournament} compact />
        </p>
      </div>
      <Button asChild variant={tournament.joined ? "default" : "outline"} className="h-11 shrink-0 sm:h-10">
        <Link to={getTournamentRoute(tournament.id)}>
          {tournament.joined ? "Open tournament" : "View tournament"}
        </Link>
      </Button>
    </section>
  );
};
