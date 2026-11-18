import { saveTableGame } from "@/services/game";
import type { StoredGame } from "@/types";
import { tableGamePgn, type Side, type TableGameState } from "./tableGame";
import { markCurrentSaved, removeUnsaved, tableClientId, type UnsavedTableGame } from "./tableStorage";

/**
 * What the server stores, from a finished game; null for one that has
 * nothing to save (clock only, no moves) or that the server already has.
 */
export const toUnsaved = (state: TableGameState, names: Record<Side, string>): UnsavedTableGame | null => {
  const { setup, result } = state;
  if (!result || setup.clockOnly || state.moves.length === 0 || state.savedGameId !== undefined) return null;
  return {
    id: state.id,
    finishedAt: state.endedAt ?? Date.now(),
    label: `${names.white} vs ${names.black}`,
    body: {
      pgn: tableGamePgn(state),
      result: result.result,
      endReason: result.endReason,
      color: setup.recorderColor,
      whiteTime: setup.whiteTime,
      blackTime: setup.blackTime,
      increment: setup.increment,
      opponent:
        setup.opponent.kind === "guest"
          ? { kind: "guest", name: setup.opponent.name }
          : { kind: "friend", userId: setup.opponent.userId },
    },
  };
};

/** Saves still on their way, by game id: asking again joins the one already sent */
const inFlight = new Map<string, Promise<StoredGame>>();

/**
 * The one way a finished table game reaches the server, from the play
 * screen and from the "Not saved yet" list alike. The game's id goes along
 * as the clientId, so even a repeat request (a reload mid-save) stores it
 * once; a second ask while one is on its way doesn't send another. Once
 * stored, the game leaves the unsaved list and the game on the device
 * remembers it was saved.
 */
export const saveUnsavedTableGame = (item: UnsavedTableGame): Promise<StoredGame> => {
  const pending = inFlight.get(item.id);
  if (pending) return pending;
  const request = saveTableGame({ ...item.body, clientId: tableClientId(item.id) })
    .then((saved) => {
      removeUnsaved(item.id);
      markCurrentSaved(item.id, saved.id);
      return saved;
    })
    .finally(() => inFlight.delete(item.id));
  inFlight.set(item.id, request);
  return request;
};
