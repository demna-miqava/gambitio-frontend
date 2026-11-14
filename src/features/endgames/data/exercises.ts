import type { EndgameCategory, EndgameExercise } from "../types";

/**
 * The endgame lab's exercises, in the order they're suggested. Every
 * position with seven pieces or fewer was checked against the Syzygy
 * tablebases: the wins are wins and the draws are draws with correct play
 * (the move-limit and par figures come from the distance to mate). The
 * breakthrough has eight pieces; it is the textbook position, won by 1.b6.
 *
 * Ids are stored by the server with the player's progress: never rename one.
 * The player is always the side to move, which is White, so move lists
 * number from 1. White.
 */
export const ENDGAME_EXERCISES: EndgameExercise[] = [
  // Checkmates
  {
    id: "queen-corner-mate",
    title: "Mate in the corner",
    category: "Checkmates",
    difficulty: "beginner",
    fen: "k7/8/2K5/8/8/8/8/7Q w - - 0 1",
    playerColor: "white",
    objective: { type: "checkmate", maxMoves: 2 },
    lesson:
      "With the king trapped in the corner, mate is close, and so is stalemate. Before every queen move, check that the black king still has a legal move or is in check.",
    hints: [
      "Don't take away every square from the black king without giving check.",
      "A quiet queen move that leaves the king one square to shuffle to sets up mate.",
      "Qb1 leaves a8–a7 to the king and mates next move on b7.",
    ],
    par: 2,
  },
  {
    id: "queen-mate",
    title: "King and queen mate",
    category: "Checkmates",
    difficulty: "beginner",
    fen: "8/8/8/4k3/8/8/8/3QK3 w - - 0 1",
    playerColor: "white",
    objective: { type: "checkmate", maxMoves: 15 },
    lesson:
      "Use the queen to fence the king into a shrinking box, a knight's move away from it, then bring your own king up to help. The queen can't mate alone.",
    hints: [
      "Put the queen a knight's move from the black king to cut it off.",
      "Keep shrinking the box, then march your king towards the enemy king.",
      "Once the king is on the edge, mate with the queen next to it, protected by your king.",
    ],
    par: 7,
  },
  {
    id: "two-rooks-ladder",
    title: "Two-rook ladder",
    category: "Checkmates",
    difficulty: "beginner",
    fen: "8/8/8/3k4/8/8/8/R3K2R w - - 0 1",
    playerColor: "white",
    objective: { type: "checkmate", maxMoves: 10 },
    lesson:
      "Two rooks mate without any help from the king: one rook cuts off a rank, the other gives check on the next one, and they climb like a ladder to the edge.",
    hints: [
      "Start with a rook check that pushes the king up the board.",
      "Alternate: one rook guards a rank while the other checks on the rank in front of it.",
      "If the king attacks a rook, move that rook far away along its rank and continue.",
    ],
    par: 5,
  },
  {
    id: "rook-mate",
    title: "King and rook mate",
    category: "Checkmates",
    difficulty: "intermediate",
    fen: "8/8/8/4k3/8/8/8/R3K3 w - - 0 1",
    playerColor: "white",
    objective: { type: "checkmate", maxMoves: 30 },
    lesson:
      "The rook cuts the king off along a file or rank while your king walks up to take the opposition. A check when the kings face each other pushes the king back one line at a time.",
    hints: [
      "Cut the king off with the rook, then bring your king closer.",
      "When the kings stand opposite each other, check with the rook to push the king back.",
      "If no check is possible, make a waiting move with the rook along its line.",
    ],
    par: 14,
  },
  {
    id: "two-bishops-mate",
    title: "Two-bishop mate",
    category: "Checkmates",
    difficulty: "advanced",
    fen: "8/8/8/4k3/8/8/8/2B1KB2 w - - 0 1",
    playerColor: "white",
    objective: { type: "checkmate", maxMoves: 35 },
    lesson:
      "Side by side, the bishops build a wall the king can't cross. Push the king to an edge, then into a corner, with your king close by. The final mate comes in the corner.",
    hints: [
      "Place the bishops next to each other in the centre to make a barrier.",
      "Bring your king up and use it to take squares the bishops can't.",
      "Drive the king into a corner; mate is given by a bishop check on the diagonal.",
    ],
    par: 17,
  },

  // King and pawn
  {
    id: "rule-of-the-square",
    title: "Rule of the square",
    category: "King and pawn",
    difficulty: "beginner",
    fen: "8/8/8/8/P7/8/5k2/7K w - - 0 1",
    playerColor: "white",
    objective: { type: "promote" },
    lesson:
      "Draw a square from the pawn to its promotion rank. If the defending king can't step inside that square, the pawn runs home on its own. Don't waste a move.",
    hints: [
      "Count: can the black king reach the pawn's square in time?",
      "It can't. Just push the pawn every move.",
    ],
  },
  {
    id: "key-squares",
    title: "Key squares",
    category: "King and pawn",
    difficulty: "intermediate",
    fen: "8/8/3k4/8/3K4/8/4P3/8 w - - 0 1",
    playerColor: "white",
    objective: { type: "promote" },
    lesson:
      "A pawn on its second to fourth rank has three key squares two ranks ahead of it. Your king is already on one (d4, for the pawn on e2): keep it there and the pawn is sure to queen.",
    hints: [
      "Don't let the black king push yours off the key squares.",
      "The pawn has spare moves. Use one so it's Black who has to give way.",
      "Only e3 or Ke4 keep the win.",
    ],
  },
  {
    id: "outside-passed-pawn",
    title: "Outside passed pawn",
    category: "King and pawn",
    difficulty: "intermediate",
    fen: "8/8/4k1pp/8/P7/4K1PP/8/8 w - - 0 1",
    playerColor: "white",
    objective: { type: "promote" },
    lesson:
      "A passed pawn far from the other pawns is a decoy. Push it to drag the black king away, then your king feasts on the pawns left behind and one of yours queens.",
    hints: [
      "The a-pawn is the decoy. Push it.",
      "While the black king chases it, head the other way with your king.",
      "Win the kingside pawns, then push your own.",
    ],
  },
  {
    id: "breakthrough",
    title: "Pawn breakthrough",
    category: "King and pawn",
    difficulty: "advanced",
    fen: "7k/ppp5/8/PPP5/8/8/8/7K w - - 0 1",
    playerColor: "white",
    objective: { type: "promote" },
    lesson:
      "Three pawns against three, both kings far away. A pawn sacrifice in the middle opens a path for one of the others, and no black pawn or king can stop it.",
    hints: [
      "Sacrifice the middle pawn.",
      "1.b6! After cxb6 play a6, after axb6 play c6.",
    ],
  },

  // Opposition
  {
    id: "opposition-win",
    title: "Taking the opposition",
    category: "Opposition",
    difficulty: "beginner",
    fen: "4k3/8/4K3/4P3/8/8/8/8 w - - 0 1",
    playerColor: "white",
    objective: { type: "promote" },
    lesson:
      "With your king on the sixth rank in front of the pawn, the game is won whoever moves. Step aside so your king controls the promotion path, then push.",
    hints: [
      "Move your king beside the pawn's path, not backwards.",
      "Kd6 or Kf6: the pawn then walks through.",
    ],
  },
  {
    id: "hold-the-opposition",
    title: "Hold the opposition",
    category: "Opposition",
    difficulty: "intermediate",
    fen: "8/8/8/8/4k3/4p3/8/4K3 w - - 0 1",
    playerColor: "white",
    objective: { type: "draw", surviveMoves: 15 },
    lesson:
      "As the defender, stand right in front of the pawn. When the pawn moves up to your king, step back straight in front of it; when the enemy king steps aside, face it so it can't get past.",
    hints: [
      "Block the pawn with your king.",
      "Ke2 is the only move. Every other move loses.",
      "If the pawn reaches your second rank with check, step straight in front of it (Ke1).",
    ],
  },
  {
    id: "distant-opposition",
    title: "Distant opposition",
    category: "Opposition",
    difficulty: "advanced",
    fen: "8/8/8/4p3/4k3/8/8/4K3 w - - 0 1",
    playerColor: "white",
    objective: { type: "draw", surviveMoves: 15 },
    lesson:
      "Opposition works at a distance too: kings on the same file with an odd number of squares between them, the other side to move. Keep it, and the attacking king can never get in front of its pawn.",
    hints: [
      "The kings are three squares apart on the e-file. Keep it that way.",
      "Ke2 is the only drawing move.",
    ],
  },

  // Queen endgames
  {
    id: "queen-vs-pawn",
    title: "Queen against a pawn",
    category: "Queen endgames",
    difficulty: "intermediate",
    fen: "8/8/8/8/8/8/3pk3/K5Q1 w - - 0 1",
    playerColor: "white",
    objective: { type: "checkmate", maxMoves: 35 },
    lesson:
      "A queen beats a centre pawn on the seventh rank: check and pin until the king must stand in front of its pawn, then use that tempo to bring your king one step closer. Repeat, take the pawn, mate.",
    hints: [
      "Start with a check. A quiet move lets the pawn queen.",
      "Aim to force the king onto d1, in front of its pawn.",
      "Each time it blocks the pawn, bring your king one step nearer.",
    ],
    par: 12,
  },

  // Rook endgames
  {
    id: "lucena-bridge",
    title: "Lucena: build a bridge",
    category: "Rook endgames",
    difficulty: "advanced",
    fen: "1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1",
    playerColor: "white",
    objective: { type: "promote" },
    lesson:
      "Your king is stuck in front of its pawn. Cut the black king off, put your rook on the fourth rank, then walk your king out: when the checks come, the rook blocks them like a bridge.",
    hints: [
      "First push the black king a file further away with a check.",
      "Bring your rook to the fourth rank (Rd4).",
      "Walk the king out towards the rook; block a check with the rook on the b-file.",
    ],
  },
  {
    id: "philidor-defence",
    title: "Philidor defence",
    category: "Rook endgames",
    difficulty: "advanced",
    fen: "8/8/8/8/3kp3/7R/r7/4K3 w - - 0 1",
    playerColor: "white",
    objective: { type: "draw", surviveMoves: 20 },
    lesson:
      "Keep your rook on the third rank so the enemy king can't come forward. Once the pawn steps onto that rank, the king loses its shelter: swing your rook to the back and check from behind.",
    hints: [
      "Keep the rook on the third rank and wait.",
      "When the pawn moves to e3, go to the back rank and give checks from behind.",
    ],
  },
];

/** Categories in the order the lab lists them. */
export const ENDGAME_CATEGORIES: { name: EndgameCategory; description: string }[] = [
  { name: "Checkmates", description: "The basic mates every player needs." },
  { name: "King and pawn", description: "When a single pawn decides the game." },
  { name: "Opposition", description: "How kings fight for squares." },
  { name: "Queen endgames", description: "Stopping a pawn one step from queening." },
  { name: "Rook endgames", description: "The two positions every rook ending comes back to." },
];

export const getEndgameExercise = (id: string | undefined): EndgameExercise | undefined =>
  ENDGAME_EXERCISES.find((exercise) => exercise.id === id);

/** The exercise after `id` in the lab's order, if any. */
export const nextEndgameExercise = (id: string): EndgameExercise | undefined => {
  const index = ENDGAME_EXERCISES.findIndex((exercise) => exercise.id === id);
  return index === -1 ? undefined : ENDGAME_EXERCISES[index + 1];
};
