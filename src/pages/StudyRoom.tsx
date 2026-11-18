import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { BookX } from "lucide-react";
import { ChessBoardProvider } from "@/features/game/contexts/ChessBoardContext";
import { EngineAnalysisProvider } from "@/features/engine-analysis";
import { FullScreenLoader } from "@/components/FullScreenLoader";
import { EmptyState } from "@/components/EmptyState";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useUser } from "@/hooks/useUser";
import { parsePositiveId } from "@/utils/ids";
import { useStudyRoom } from "@/features/study/hooks/useStudyRoom";
import { StudyRoomView } from "@/features/study/components/StudyRoomView";
import { StudyChatContext } from "@/features/study/hooks/useStudyChat";

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
  // 0 (never a room) for anything but a plain numeric id
  const id = parsePositiveId(roomId) ?? 0;
  const { id: myId } = useUser();
  const room = useStudyRoom(id);
  useDocumentTitle(room.snapshot ? room.snapshot.room.name : "Study room");
  const { chat, chatError, sendChat } = room;
  const chatValue = useMemo(() => ({ chat, error: chatError, send: sendChat }), [chat, chatError, sendChat]);

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
      {/* Each person's own engine, off until they switch it on */}
      <EngineAnalysisProvider>
        {/* The chat apart from the room: a message re-renders the chat panel only */}
        <StudyChatContext.Provider value={chatValue}>
          <StudyRoomView
            snapshot={room.snapshot}
            myId={myId}
            connected={room.connected}
            send={room.send}
            goTo={room.goTo}
            boardResetKey={room.boardResetKey}
            activity={room.activity}
            onExit={room.expectExit}
            onGameChange={room.syncGame}
          />
        </StudyChatContext.Provider>
      </EngineAnalysisProvider>
    </ChessBoardProvider>
  );
};

export default StudyRoom;
