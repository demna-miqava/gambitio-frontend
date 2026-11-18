import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ROUTES } from "@/constants/routes";
import { TablePlay } from "@/features/table-mode/components/TablePlay";
import { loadCurrentGame, storeCurrentGame } from "@/features/table-mode/utils/tableStorage";

/** The table clock and recorder, for the game kept on this device. */
const TableGame = () => {
  useDocumentTitle("Table game");
  const navigate = useNavigate();
  // Read once: from here on the game lives in TablePlay (which keeps storing it)
  const [initial] = useState(loadCurrentGame);
  if (!initial) return <Navigate to={ROUTES.TABLE} replace />;
  return (
    <TablePlay
      initial={initial}
      onLeave={() => navigate(ROUTES.TABLE)}
      onDone={() => {
        storeCurrentGame(null);
        navigate(ROUTES.TABLE, { replace: true });
      }}
    />
  );
};

export default TableGame;
