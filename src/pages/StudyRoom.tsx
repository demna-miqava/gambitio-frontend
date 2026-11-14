import { Link, useParams } from "react-router-dom";
import { BookX } from "lucide-react";
import { ChessBoardProvider } from "@/features/game/contexts/ChessBoardContext";
import { FullScreenLoader } from "@/components/FullScreenLoader";
import { EmptyState } from "@/components/EmptyState";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useUser } from "@/hooks/useUser";
import { useStudyRoom } from "@/features/study/hooks/useStudyRoom";
import { StudyRoomView } from "@/features/study/components/StudyRoomView";

/**
 * A shared study room: everyone in it sees and moves the same board. Keyed
 * by room, so opening another room (e.g. from an invite) starts afresh
 * instead of showing this room's state, version or "not found" there.
 */
const StudyRoom = () => {
  const { roomId } = useParams();
  return <StudyRoomPage key={roomId} roomId={roomId} />;
};

const StudyRoomPage = ({ roomId }: { roomId: string | undefined }) => {
  const id = Number(roomId);
  const { id: myId } = useUser();
  const room = useStudyRoom(id);
  useDocumentTitle(room.snapshot ? room.snapshot.room.name : "Study room");

  if (room.status === "not_found" || !Number.isSafeInteger(id) || id <= 0) {
    return (
      <PageContainer className="max-w-xl pt-10">
        <EmptyState
          icon={BookX}
          title="Study room not found"
          description="It may have been deleted, or you're not in it. Ask someone in the room to invite you."
          action={
            <Button variant="outline" asChild>
              <Link to={ROUTES.STUDY}>Your study rooms</Link>
            </Button>
          }
        />
      </PageContainer>
    );
  }

  if (!room.snapshot || myId === undefined) {
    return <FullScreenLoader height="h-[60vh] w-full" />;
  }

  return (
    // One board per room; the shared position is set by the room
    <ChessBoardProvider color="white" isArchiveMode key={id}>
      <h1 className="sr-only">Study room: {room.snapshot.room.name}</h1>
      <StudyRoomView
        snapshot={room.snapshot}
        myId={myId}
        connected={room.connected}
        send={room.send}
        goTo={room.goTo}
        boardResetKey={room.boardResetKey}
        activity={room.activity}
        onExit={room.expectExit}
      />
    </ChessBoardProvider>
  );
};

export default StudyRoom;
