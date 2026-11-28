import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UpNextRow } from "@/components/home/UpNextRow";
import { getTournamentRoute } from "@/constants/routes";
import { useOpenTournaments } from "../hooks/useTournaments";
import { tournamentFacts } from "../utils/tournamentFormat";
import { TournamentClock } from "./TournamentClock";

/**
 * Home, in "Up next": the tournament that is on, or the next one, as a row
 * when there is one. Renders nothing otherwise (and while loading: it isn't
 * worth a skeleton).
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
    <UpNextRow
      aria-label="Tournament"
      icon={<Trophy className="size-5" aria-hidden="true" />}
      title={tournament.name}
      description={
        <>
          {tournamentFacts(tournament)} · <TournamentClock tournament={tournament} compact />
        </>
      }
      actions={
        <Button asChild variant="outline" className="min-h-11 min-w-31 sm:min-h-9">
          <Link to={getTournamentRoute(tournament.id)}>
            {tournament.joined ? "Open tournament" : "View tournament"}
          </Link>
        </Button>
      }
    />
  );
};
