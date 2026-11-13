/** Display names for Lichess puzzle theme keys (as named on Lichess). */
export const THEME_LABELS: Record<string, string> = {
  advancedPawn: "Advanced pawn",
  advantage: "Advantage",
  anastasiaMate: "Anastasia's mate",
  arabianMate: "Arabian mate",
  attackingF2F7: "Attacking f2 or f7",
  attraction: "Attraction",
  backRankMate: "Back rank mate",
  bishopEndgame: "Bishop endgame",
  bodenMate: "Boden's mate",
  capturingDefender: "Capture the defender",
  castling: "Castling",
  clearance: "Clearance",
  crushing: "Crushing",
  defensiveMove: "Defensive move",
  deflection: "Deflection",
  discoveredAttack: "Discovered attack",
  discoveredCheck: "Discovered check",
  doubleBishopMate: "Double bishop mate",
  doubleCheck: "Double check",
  dovetailMate: "Dovetail mate",
  enPassant: "En passant",
  endgame: "Endgame",
  equality: "Equality",
  exposedKing: "Exposed king",
  fork: "Fork",
  hangingPiece: "Hanging piece",
  hookMate: "Hook mate",
  interference: "Interference",
  intermezzo: "Intermezzo",
  killBoxMate: "Kill box mate",
  kingsideAttack: "Kingside attack",
  knightEndgame: "Knight endgame",
  long: "Long puzzle",
  master: "Master games",
  masterVsMaster: "Master vs master games",
  mate: "Checkmate",
  mateIn1: "Mate in 1",
  mateIn2: "Mate in 2",
  mateIn3: "Mate in 3",
  mateIn4: "Mate in 4",
  mateIn5: "Mate in 5 or more",
  middlegame: "Middlegame",
  oneMove: "One-move puzzle",
  opening: "Opening",
  pawnEndgame: "Pawn endgame",
  pin: "Pin",
  promotion: "Promotion",
  queenEndgame: "Queen endgame",
  queenRookEndgame: "Queen and rook endgame",
  queensideAttack: "Queenside attack",
  quietMove: "Quiet move",
  rookEndgame: "Rook endgame",
  sacrifice: "Sacrifice",
  short: "Short puzzle",
  skewer: "Skewer",
  smotheredMate: "Smothered mate",
  superGM: "Super GM games",
  trappedPiece: "Trapped piece",
  underPromotion: "Underpromotion",
  veryLong: "Very long puzzle",
  vukovicMate: "Vukovic mate",
  xRayAttack: "X-ray attack",
  zugzwang: "Zugzwang",
};

/**
 * "backRankMate" -> "Back rank mate", "mateIn6" -> "Mate in 6". Words are
 * split at lower/upper and letter/digit boundaries; acronyms ("GM") keep
 * their case.
 */
export const decamelize = (key: string): string => {
  const words = key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/([A-Za-z])(\d)/g, "$1 $2")
    .replace(/(\d)([A-Za-z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => (/^[A-Z0-9]{2,}$/.test(word) ? word : word.toLowerCase()));
  const sentence = words.join(" ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
};

export const formatThemeLabel = (key: string): string => THEME_LABELS[key] ?? decamelize(key);

/** Themes whose label or key contains the query (case-insensitive). */
export const filterThemes = <T extends { theme: string }>(themes: T[], query: string): T[] => {
  const q = query.trim().toLowerCase();
  if (!q) return themes;
  return themes.filter(
    ({ theme }) => formatThemeLabel(theme).toLowerCase().includes(q) || theme.toLowerCase().includes(q)
  );
};

/** Lichess theme keys are alphanumeric; anything else is ignored (bad URL / storage). */
export const isValidThemeKey = (value: string | null | undefined): value is string =>
  !!value && /^[A-Za-z0-9]{1,40}$/.test(value);
