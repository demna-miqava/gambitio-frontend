import type { Game, StoredGameListItem, StoredGamePlayer } from "@/types";

/** A game against a computer bot (played in the browser, stored unrated) */
export const isBotGame = (game: StoredGameListItem): boolean => game.botId !== null;

/** The computer's side of a bot game */
export const isBotPlayer = (game: StoredGameListItem, player: StoredGamePlayer): boolean =>
  isBotGame(game) && player.id === null;

/** A timed game between two players: one that can be opened as a live game */
export const isPlayerGame = <G extends StoredGameListItem>(game: G): game is G & Game =>
  game.botId === null &&
  game.time !== null &&
  game.type !== null &&
  game.whitePlayer.id !== null &&
  game.blackPlayer.id !== null;
