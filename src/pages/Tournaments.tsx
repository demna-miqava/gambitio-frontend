import { useState } from "react";
import { Plus } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { CreateTournamentDialog } from "@/features/tournaments/components/CreateTournamentDialog";
import { TournamentLists } from "@/features/tournaments/components/TournamentList";

/** Arena tournaments: what is on, what is next, what has been played. */
const Tournaments = () => {
  useDocumentTitle("Tournaments");
  const [creating, setCreating] = useState(false);

  return (
    <PageContainer className="max-w-3xl space-y-8">
      <PageHeader
        title="Tournaments"
        description="Arenas: join, get paired again and again while the clock runs, and score 2 for a win and 1 for a draw. Two wins in a row and your points count double."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus aria-hidden="true" /> New tournament
          </Button>
        }
      />
      <TournamentLists onCreate={() => setCreating(true)} />
      <CreateTournamentDialog open={creating} onOpenChange={setCreating} />
    </PageContainer>
  );
};

export default Tournaments;
