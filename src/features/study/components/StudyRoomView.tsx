import { memo, useCallback } from "react";
import { toast } from "sonner";
import { BoardLayout } from "@/features/game/components/BoardLayout";
import { GameLayout } from "@/features/game/components/GameLayout";
import { PromotionSelector } from "@/features/game/components/PromotionSelector";
import { TypedMoveInput } from "@/features/game/components/TypedMoveInput";
import { useChessBoardContext } from "@/features/game/contexts/ChessBoardContext";
import { useFlipBoardKey } from "@/features/game/hooks/useFlipBoardKey";
import { OpeningName } from "@/features/openings";
import { EvaluationBar, useAnalysis } from "@/features/engine-analysis";
import { describeMove } from "@/features/game/utils/describeMove";
import type { StudyClientMessage, StudyRoomSnapshot } from "../types";
import { useStudyBoard } from "../hooks/useStudyBoard";
import { liveNodeOf, nodeOf, pathTo, rootOf, toStudyPgn } from "../utils/studyState";
import { StudyLiveGame } from "./StudyLiveGame";
import { StudyChat } from "./StudyChat";
import { studyMoveLabel } from "../utils/activity";
import { StudyRoomHeader } from "./StudyRoomHeader";
import { StudyPeople } from "./StudyPeople";
import { StudyMovesList } from "./StudyMovesList";
import { StudyControls } from "./StudyControls";
import { StudyComment } from "./StudyComment";
import { StudyEngine } from "./StudyEngine";

interface StudyRoomViewProps {
  snapshot: StudyRoomSnapshot;
  myId: number;
  connected: boolean;
  send: (message: StudyClientMessage) => void;
  goTo: (nodeId: string) => void;
  boardResetKey: number;
  /** Latest change by someone else, e.g. "bob played 3. Bb5" */
  activity: string;
  onExit: (expected?: boolean) => void;
  /** A room watching a game: the game socket delivered a move or the end */
  onGameChange: () => void;
}

/**
 * A study room: the shared board and the panel beside it. Memoised: the
 * watched game (StudyLiveGame) and the chat (StudyChatContext) update
 * themselves, so a move in the game, a clock or a chat message doesn't
 * re-render the board, the engine or the moves list. Only a change to the
 * room does.
 */
export const StudyRoomView = memo(function StudyRoomView({
  snapshot,
  myId,
  connected,
  send,
  goTo,
  boardResetKey,
  activity,
  onExit,
  onGameChange,
}: StudyRoomViewProps) {
  const { room, state, members, present } = snapshot;
  const live = liveNodeOf(state);
  const goLive = useCallback(() => {
    if (live !== null) goTo(live);
  }, [goTo, live]);
  const { boardRef, orientation, flipBoard: flip } = useChessBoardContext();
  useFlipBoardKey(flip);
  const node = nodeOf(state, state.cursor) ?? rootOf(state);
  const { pendingPromotion, selectPromotion, cancelPromotion, playTyped, clearShapes } = useStudyBoard({
    node,
    send,
    resetKey: boardResetKey,
  });
  const { engineEnabled } = useAnalysis();
  // An engine line's first move, played in the room like a move on the board
  const playEngineMove = useCallback(
    (uci: string) => send({ type: "move", nodeId: node.id, uci }),
    [send, node.id]
  );
  const lineFens = [rootOf(state).fen, ...pathTo(state, node.id).map((id) => nodeOf(state, id)!.fen)];

  const copyPgn = useCallback(() => {
    navigator.clipboard
      .writeText(toStudyPgn(state, { Event: room.name, Site: "Gambitio study room" }))
      .then(() => toast.success("PGN copied"))
      .catch(() => toast.error("Couldn't copy to the clipboard"));
  }, [state, room.name]);

  const toMove = node.fen.split(" ")[1] === "b" ? "Black" : "White";
  const boardLabel = [
    "Shared study board",
    `${toMove} to move`,
    node.san && `Last move: ${studyMoveLabel(node)}, ${describeMove(node.san)}`,
    node.shapes.length > 0 && `${node.shapes.length} ${node.shapes.length === 1 ? "arrow or mark" : "arrows or marks"}`,
  ]
    .filter(Boolean)
    .join(". ");

  const board = (
    <div className="flex w-full gap-3">
      {/* The column is always there, so switching the engine doesn't move the board */}
      <div className="game-layout-eval hidden w-7 self-stretch lg:block">
        {engineEnabled && <EvaluationBar bottom={orientation} />}
      </div>
      <BoardLayout boardRef={boardRef} boardLabel={boardLabel}>
        {pendingPromotion && (
          <PromotionSelector
            color={pendingPromotion.color}
            square={pendingPromotion.to}
            onSelect={selectPromotion}
            onCancel={cancelPromotion}
            boardOrientation={orientation}
          />
        )}
      </BoardLayout>
    </div>
  );

  const sidebar = (
    <div className="flex w-full flex-col gap-3 lg:h-full lg:min-h-0 lg:gap-0 lg:overflow-hidden lg:rounded-2xl lg:bg-card">
      <StudyRoomHeader
        roomId={room.id}
        name={room.name}
        isOwner={room.ownerId === myId}
        myId={myId}
        connected={connected}
        onCopyPgn={copyPgn}
        onFlip={flip}
        onClearShapes={clearShapes}
        canClearShapes={node.shapes.length > 0}
        onExit={onExit}
        className="order-1"
      />

      {room.gameId != null && (
        <div className="order-2 lg:shrink-0 lg:border-b lg:border-border lg:px-4 lg:py-3">
          <StudyLiveGame
            gameId={room.gameId}
            onGameChange={onGameChange}
            atLive={live !== null && state.cursor === live}
            canGoLive={live !== null}
            onGoLive={goLive}
            roomLiveLabel={live !== null && live !== rootOf(state).id ? studyMoveLabel(nodeOf(state, live)) : null}
          />
        </div>
      )}

      {/* Phones: right under the board */}
      <div className="order-2 space-y-2 lg:order-6 lg:shrink-0 lg:border-t lg:border-border lg:p-3">
        <StudyControls state={state} onGoTo={goTo} send={send} />
        <TypedMoveInput onSubmit={playTyped} />
      </div>

      <div className="order-5 lg:order-2 lg:shrink-0 lg:border-b lg:border-border lg:px-4 lg:py-3">
        <StudyPeople
          roomId={room.id}
          ownerId={room.ownerId}
          myId={myId}
          members={members}
          present={present}
        />
      </div>

      {/* Phones: under the controls. Desktop: under the people (same order
          as each; it follows both in the markup) */}
      <div className="order-2 lg:shrink-0 lg:border-b lg:border-border lg:px-4 lg:py-2.5">
        <StudyEngine fen={node.fen} onPlayMove={playEngineMove} />
      </div>

      <div className="order-3 flex flex-col rounded-xl bg-card lg:min-h-0 lg:flex-1 lg:rounded-none lg:bg-transparent">
        <OpeningName fens={lineFens} className="px-3 pt-2 lg:shrink-0 lg:border-b lg:border-border lg:px-4 lg:py-2.5" />
        <div className="max-h-[min(360px,45svh)] min-h-24 overflow-y-auto p-2 lg:max-h-none lg:min-h-0 lg:flex-1 lg:px-3">
          <StudyMovesList state={state} onGoTo={goTo} />
        </div>
      </div>

      <div className="order-4 lg:order-5 lg:shrink-0 lg:border-t lg:border-border lg:px-3 lg:py-2.5">
        <StudyComment node={node} send={send} />
      </div>

      {/* Renders nothing when this member has no chat here */}
      <StudyChat
        roomId={room.id}
        members={members}
        myId={myId}
        connected={connected}
        className="order-5 lg:order-5 lg:shrink-0 lg:border-t lg:border-border lg:px-4 lg:py-2.5"
      />

      {/* What others do, read out; also shown as a quiet line */}
      <p
        className="order-6 min-h-4 truncate px-1 text-xs text-muted-foreground lg:order-7 lg:shrink-0 lg:border-t lg:border-border lg:px-4 lg:py-1.5"
        aria-live="polite"
        aria-atomic="true"
      >
        {activity}
      </p>
    </div>
  );

  return <GameLayout board={board} sidebar={sidebar} bareBoard fitPanel />;
});
