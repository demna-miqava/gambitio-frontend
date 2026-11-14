import { useMemo, useState } from "react";
import { DEFAULT_POSITION } from "chess.js";
import { SaveToRepertoireDialog } from "@/features/repertoire";
import { CreateStudyRoomDialog } from "@/features/study";
import { useUser } from "@/hooks/useUser";
import { useArchiveGame } from "../contexts/ArchiveGameContext";
import { endOfLine, nodesAlong } from "../utils/analysisTree";

/**
 * "Save line to repertoire" and "Study with friends" for the analysis panel.
 * The repertoire gets the line up to the current move; a study room starts
 * from the whole line the current move is on (to its end), from the board's
 * starting position.
 */
export const useLineActions = () => {
  const { root, path, getHeaders } = useArchiveGame();
  const { username } = useUser();
  const [repertoireOpen, setRepertoireOpen] = useState(false);
  const [studyOpen, setStudyOpen] = useState(false);

  const fromStart = root.fen === DEFAULT_POSITION;
  const lineToHere = useMemo(
    () => nodesAlong(root, path).flatMap((node) => (node.move ? [node.move.san] : [])),
    [root, path]
  );
  const wholeLine = useMemo(
    () => nodesAlong(root, endOfLine(root, path)).flatMap((node) => (node.move ? [node.move.san] : [])),
    [root, path]
  );

  const { White, Black } = getHeaders() ?? {};
  const studyName = White && Black ? `${White} vs ${Black}` : "Analysis";
  // In a review of the player's own game, the line goes to the colour they had
  const myColor = !username ? undefined : White === username ? "white" : Black === username ? "black" : undefined;

  const dialogs = (
    <>
      {fromStart && (
        <SaveToRepertoireDialog
          open={repertoireOpen}
          onOpenChange={setRepertoireOpen}
          moves={lineToHere}
          {...(myColor && { defaultColor: myColor })}
        />
      )}
      <CreateStudyRoomDialog
        open={studyOpen}
        onOpenChange={setStudyOpen}
        initialMoves={wholeLine}
        {...(!fromStart && { initialFen: root.fen })}
        defaultName={studyName}
      />
    </>
  );

  return {
    /** Lines in a repertoire start from the standard position */
    canSaveLine: fromStart && lineToHere.length > 0,
    openRepertoire: () => setRepertoireOpen(true),
    openStudy: () => setStudyOpen(true),
    dialogs,
  };
};
