import { useState } from "react";
import { Plus } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { CreateStudyRoomDialog } from "@/features/study/components/CreateStudyRoomDialog";
import { StudyRoomsList } from "@/features/study/components/StudyRoomsList";

/** Study rooms: shared boards to explore with friends. */
const StudyRooms = () => {
  useDocumentTitle("Study rooms");
  const [creating, setCreating] = useState(false);

  return (
    <PageContainer className="max-w-3xl space-y-8">
      <PageHeader
        title="Study rooms"
        description="Explore a board together with friends. Moves, arrows and comments are shared live and saved in the room."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus aria-hidden="true" /> New room
          </Button>
        }
      />
      <StudyRoomsList onCreate={() => setCreating(true)} />
      <CreateStudyRoomDialog open={creating} onOpenChange={setCreating} />
    </PageContainer>
  );
};

export default StudyRooms;
