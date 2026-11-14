import type { EndgameCategory, EndgameExercise } from "../types";

/**
 * The endgame lab's exercises, in the order they're suggested. Every
 * position with seven pieces or fewer was checked against the Syzygy
 * tablebases with scripts/verify-endgames.mjs (npm run verify:endgames): the
 * wins are wins and the draws are draws with correct play, and the key moves
 * the hints name keep that result (the move-limit and par figures come from
 * the distance to mate). The breakthrough has eight pieces; it is the
 * textbook position, won by 1.b6.
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
  {
    id: "bishop-knight-corner",
    title: "Bishop and knight: the last net",
    category: "Checkmates",
    difficulty: "intermediate",
    fen: "7k/8/5K2/8/8/8/8/2B3N1 w - - 0 1",
    playerColor: "white",
    objective: { type: "checkmate", maxMoves: 10 },
    lesson:
      "Bishop and knight can only force mate in a corner of the bishop's colour. The black king is already in one: h8 is a dark square, like your bishop. Seal it in with your king, then let the knight and bishop take the last squares.",
    hints: [
      "Take g7 and g8 away with your king: Kf7.",
      "Bring the knight towards g5 and use the bishop to cover the dark squares.",
      "A typical finish: Bg7+ Kh7, Ng5 mate.",
    ],
    par: 6,
  },
  {
    id: "bishop-knight-mate",
    title: "Bishop and knight mate",
    category: "Checkmates",
    difficulty: "advanced",
    fen: "k7/8/1K6/8/8/8/8/2B1N3 w - - 0 1",
    playerColor: "white",
    objective: { type: "checkmate", maxMoves: 40 },
    lesson:
      "The hardest of the basic mates. The black king sits in a8, the wrong corner: your bishop is dark-squared, so mate is only possible on a1 or h8. Keep the king on the edge and herd it along to a dark corner, with king, knight and bishop all close.",
    hints: [
      "Mate is only possible in a1 or h8, the corners of your bishop's colour.",
      "Bring the knight into play first (Nc2 or Nd3) and keep your king near the black one.",
      "The knight takes the light squares, the bishop the dark ones, your king the rest. Squeeze the king along the edge one square at a time.",
    ],
    par: 24,
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
    id: "rook-pawn-draw",
    title: "Rook pawn: run to the corner",
    category: "King and pawn",
    difficulty: "beginner",
    fen: "8/8/8/8/p7/1k6/8/3K4 w - - 0 1",
    playerColor: "white",
    objective: { type: "draw", surviveMoves: 10 },
    lesson:
      "A rook pawn can't be forced through if the defending king gets in front of it: the attacker can't drive a king out of the corner without stalemating it. You just have to get there in time.",
    hints: [
      "Head for the corner the pawn is running to.",
      "Kc1! It's the only move: from there your king reaches b1 and a1 in time.",
      "Stuck on a1 with nothing to do is stalemate, and that's a draw.",
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
    id: "protected-passed-pawn",
    title: "Protected passed pawn",
    category: "King and pawn",
    difficulty: "intermediate",
    fen: "8/8/8/1Pk3p1/P5P1/4K3/8/8 w - - 0 1",
    playerColor: "white",
    objective: { type: "promote" },
    lesson:
      "The b5-pawn is passed and protected by a4. The black king can't take b5, and it can't take a4 either, because b5 would then run and queen. It's tied to those pawns, while your king is free to go wherever it likes.",
    hints: [
      "The black king is tied to your queenside pawns. Yours is free.",
      "Bring your king to the centre (Ke4), heading for f5 and the g5-pawn.",
      "If the black king blocks the road to f5, turn to the queenside instead and escort the b-pawn: it can't guard both.",
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
    id: "outflanking",
    title: "Outflanking",
    category: "Opposition",
    difficulty: "intermediate",
    fen: "8/3k4/2p5/2P5/4K3/8/8/8 w - - 0 1",
    playerColor: "white",
    objective: { type: "promote" },
    lesson:
      "Both pawns are stuck. If your king reaches d6 or b6, the c6-pawn falls and yours queens. Walking straight at the black king doesn't get you through; going round the side does, because the king guarding c6 can't also block the flank.",
    hints: [
      "Ke5? Ke7! takes the opposition, and you can't get past.",
      "Go round the side: Kf5! is the only winning move.",
      "After ...Ke7, Ke5 leaves Black in zugzwang; after ...Kd8, step to e6 or f6 and head for d6.",
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

  // Pawn races
  {
    id: "catch-the-pawn",
    title: "Step into the square",
    category: "Pawn races",
    difficulty: "beginner",
    fen: "7k/8/8/p7/8/5K2/8/8 w - - 0 1",
    playerColor: "white",
    objective: { type: "draw", surviveMoves: 10 },
    lesson:
      "To catch a passed pawn with your king alone, you have to be inside its square: the square drawn from the pawn to its queening rank. Count before you move. One step the wrong way and the pawn runs.",
    hints: [
      "The pawn's square runs from a5 to e5, e1 and a1.",
      "Ke4, Ke3 or Ke2 steps inside it. Every other move is too slow.",
      "Then walk to the pawn and take it.",
    ],
  },
  {
    id: "pawn-race",
    title: "Queening first",
    category: "Pawn races",
    difficulty: "intermediate",
    fen: "8/8/8/1P6/6p1/8/7k/K7 w - - 0 1",
    playerColor: "white",
    objective: { type: "checkmate", maxMoves: 28 },
    lesson:
      "Both pawns are three steps from queening and you move first, so you queen first. That isn't the end: you still have to stop the g-pawn. A queen beats a knight pawn on the seventh: check until the king has to block its own pawn, bring your king a step closer, and repeat.",
    hints: [
      "Count: b6, b7, b8 against ...g3, g2, g1.",
      "Only b6 wins. If Black races, b8=Q even comes with check along the b8–h2 diagonal.",
      "Once you have a queen, force the king in front of the g-pawn with checks and use each free move to bring your king over.",
    ],
    par: 18,
  },
  {
    id: "connected-passers-vs-rook",
    title: "Two pawns beat a rook",
    category: "Pawn races",
    difficulty: "intermediate",
    fen: "r7/8/5PP1/8/8/8/1k6/7K w - - 0 1",
    playerColor: "white",
    objective: { type: "promote" },
    lesson:
      "Two connected passed pawns on the sixth rank are stronger than a rook when the enemy king is far away. Push one to the seventh: the rook can stop one pawn, not both.",
    hints: [
      "Push a pawn to the seventh rank.",
      "f7 or g7. If the rook blocks one pawn, push the other: it attacks the rook or queens.",
      "If the rook starts checking, walk your king up towards your pawns, where the checks run out.",
    ],
  },

  // Minor pieces
  {
    id: "right-bishop",
    title: "Right-coloured bishop",
    category: "Minor pieces",
    difficulty: "beginner",
    fen: "7k/5K2/7P/8/8/8/8/4B3 w - - 0 1",
    playerColor: "white",
    objective: { type: "promote" },
    lesson:
      "Your bishop is dark-squared, like h8, so it controls the queening square and the rook pawn wins. The only trap is stalemate: the king in the corner has very few squares, so check that it can always move.",
    hints: [
      "Don't push yet: h7 now just lets the king take the pawn.",
      "Bring your king to g6 and make waiting moves with the bishop if you need to.",
      "Push h7 when it comes with check; the bishop finishes the job from the long diagonal.",
    ],
  },
  {
    id: "wrong-bishop-draw",
    title: "Wrong-coloured bishop",
    category: "Minor pieces",
    difficulty: "intermediate",
    fen: "8/8/8/4b3/6kp/8/4K3/8 w - - 0 1",
    playerColor: "white",
    objective: { type: "draw", surviveMoves: 15 },
    lesson:
      "Black's bishop is dark-squared, but the pawn queens on h1, a light square. Once your king reaches the corner nothing can drive it out: Black can only stalemate you or let the game be drawn.",
    hints: [
      "Head for h1.",
      "Kf1 or Kf2: only those get there in time.",
      "Once you're in the corner, stay there.",
    ],
  },
  {
    id: "knight-vs-pawn",
    title: "Knight against a pawn",
    category: "Minor pieces",
    difficulty: "intermediate",
    fen: "8/8/8/8/2k1N3/8/1p6/7K w - - 0 1",
    playerColor: "white",
    objective: { type: "draw", surviveMoves: 15 },
    lesson:
      "A knight can stop a pawn on the seventh by guarding its queening square, and a check buys the time to get there. When the king comes closer, keep checking or keep guarding the square.",
    hints: [
      "Which squares guard b1? a3, c3 and d2.",
      "Nd2+! It checks and covers b1 at once.",
      "If the king comes closer, check again: Nb1+ and Na3+ keep the pawn from queening.",
    ],
  },
  {
    id: "opposite-bishops-draw",
    title: "Opposite-coloured bishops",
    category: "Minor pieces",
    difficulty: "intermediate",
    fen: "8/8/8/2b1k3/4pp2/8/4K3/7B w - - 0 1",
    playerColor: "white",
    objective: { type: "draw", surviveMoves: 20 },
    lesson:
      "Two pawns down, but the bishops run on different colours, so Black's bishop can never challenge yours. Blockade: your king stands in front of the pawns and your bishop guards the light squares they need.",
    hints: [
      "The danger is ...f3+, on a light square.",
      "Bg2! Now ...f3+ is met by Bxf3. Every other move loses.",
      "Keep your king in front of the pawns; with the light squares covered, Black can't make progress.",
    ],
  },
  {
    id: "bishop-vs-knight",
    title: "Bishop against knight",
    category: "Minor pieces",
    difficulty: "advanced",
    fen: "8/8/3n4/4k2p/P6P/3BK3/8/8 w - - 0 1",
    playerColor: "white",
    objective: { type: "promote" },
    lesson:
      "With pawns on both wings the bishop is the better piece: it guards from a distance and switches sides in one move, while the knight is slow. And a passed rook pawn is a knight's worst enemy.",
    hints: [
      "Use your passed a-pawn.",
      "a5! The knight has to hurry to the queenside to stop it.",
      "Keep pushing with the bishop's help. If the knight gives itself up, take it; your king and bishop do the rest.",
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
  {
    id: "queen-vs-bishop-pawn",
    title: "Queen against a bishop pawn",
    category: "Queen endgames",
    difficulty: "intermediate",
    fen: "8/8/8/8/8/4K3/1kp5/7Q w - - 0 1",
    playerColor: "white",
    objective: { type: "checkmate", maxMoves: 12 },
    lesson:
      "Against a bishop pawn the usual checks fail: the defending king goes to the corner (a1), and taking the pawn would be stalemate. With your king this close you don't need the checks. Bring it straight in.",
    hints: [
      "Your king is only two steps from the pawn.",
      "Kd2! guards c1, so the pawn can't queen.",
      "Then drive the black king away with checks and take the pawn.",
    ],
    par: 6,
  },
  {
    id: "bishop-pawn-stalemate",
    title: "Bishop pawn: the stalemate trick",
    category: "Queen endgames",
    difficulty: "intermediate",
    fen: "8/1KP5/8/1q6/4k3/8/8/8 w - - 0 1",
    playerColor: "white",
    objective: { type: "draw", surviveMoves: 20 },
    lesson:
      "This time you have the pawn. A bishop pawn on the seventh draws against a queen when the enemy king is far away: when you're checked, go to the corner rather than in front of the pawn. If the queen then takes the pawn, it's stalemate.",
    hints: [
      "You're in check. Don't block your own pawn with Kc8.",
      "Ka8 or Ka7. Kc8 gives Black the time to bring the king over, and loses.",
      "With your king on a8, ...Qxc7 leaves you without a move: stalemate.",
    ],
  },
  {
    id: "rook-pawn-stalemate",
    title: "Rook pawn: hide in the corner",
    category: "Queen endgames",
    difficulty: "intermediate",
    fen: "8/PK6/8/1q6/8/2k5/8/8 w - - 0 1",
    playerColor: "white",
    objective: { type: "draw", surviveMoves: 20 },
    lesson:
      "A rook pawn on the seventh draws against a queen too. Your king hides on a8 in front of its pawn, and the queen can't take away its last squares without giving stalemate, so Black never gets the free moves to bring the king up.",
    hints: [
      "Stay next to your pawn and the corner.",
      "Ka8 holds (so do Kc7 and Kc8).",
      "With your king on a8 and the pawn on a7, any queen move that takes b7 and b8 without check is stalemate.",
    ],
  },
  {
    id: "queen-vs-rook",
    title: "Queen against rook",
    category: "Queen endgames",
    difficulty: "advanced",
    fen: "1k6/1r6/2K5/Q7/8/8/8/8 w - - 0 1",
    playerColor: "white",
    objective: { type: "checkmate", maxMoves: 20 },
    lesson:
      "This is Philidor's position. With Black to move it's zugzwang: the king or the rook has to give way, and forks and back-rank mates follow. You're to move, so lose a move: the queen can travel in a triangle and come back to the same square.",
    hints: [
      "If it were Black's move, you'd be winning at once.",
      "Pass the move with the queen: three moves that come back to a5.",
      "Qe5+ Ka8 (or Ka7), Qa1+ Kb8, Qa5: now Black has to move.",
    ],
    par: 10,
  },

  // Rook endgames
  {
    id: "cut-off-by-file",
    title: "King cut off by two files",
    category: "Rook endgames",
    difficulty: "intermediate",
    fen: "7r/8/8/8/1k2P3/4K3/8/3R4 w - - 0 1",
    playerColor: "white",
    objective: { type: "promote" },
    lesson:
      "Your rook on the d-file keeps the black king two files away from the pawn. That's enough to win: king and pawn walk up together, the king shielding the pawn from the rook's checks, while your rook holds the line.",
    hints: [
      "Leave the rook where it is: it keeps the black king out.",
      "Advance king and pawn together: e5, Ke4, Kf5.",
      "When the checks come, walk your king up the board towards the checking rook until they run out.",
    ],
  },
  {
    id: "rook-behind-passer",
    title: "Rook behind the passed pawn",
    category: "Rook endgames",
    difficulty: "intermediate",
    fen: "r7/6k1/P5p1/8/8/6P1/5K2/5R2 w - - 0 1",
    playerColor: "white",
    objective: { type: "promote" },
    lesson:
      "Rooks belong behind passed pawns. From a1 your rook backs the pawn all the way up the board and stays active, while the black rook in front of the pawn is reduced to a blocker.",
    hints: [
      "Your rook isn't doing anything on f1.",
      "Ra1! Behind the pawn. Every other move lets Black hold.",
      "Then push the pawn when it's safe and bring your king up; the black rook is stuck in front of the pawn.",
    ],
  },
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
    id: "lucena-centre-pawn",
    title: "Lucena with a centre pawn",
    category: "Rook endgames",
    difficulty: "advanced",
    fen: "3K4/3P1k2/8/8/8/8/2r5/4R3 w - - 0 1",
    playerColor: "white",
    objective: { type: "promote" },
    lesson:
      "The same winning method with a d-pawn. Push the black king one more file away, put your rook on the fourth rank, then walk out. Block a check with the rook only when your king stands next to it, or the rook is simply traded off.",
    hints: [
      "Check first: Rf1+.",
      "Then Rf4: the rook on the fourth rank is your bridge.",
      "Walk out: Ke7, Kd6, Ke6, Kd5, and block the last check with Rd4, next to your king.",
    ],
  },
  {
    id: "philidor-third-rank",
    title: "Philidor: get there first",
    category: "Rook endgames",
    difficulty: "intermediate",
    fen: "8/8/8/8/3kp3/8/7r/R3K3 w - - 0 1",
    playerColor: "white",
    objective: { type: "draw", surviveMoves: 20 },
    lesson:
      "The Philidor defence only works if your rook reaches the third rank before the enemy king does. Get it there now, then wait.",
    hints: [
      "Black's king wants to come to d3 next.",
      "Ra3! Now the king can't step onto the third rank. Rook moves along the first rank, or king moves, lose.",
      "When the pawn moves to e3, switch to checks from behind (Ra8).",
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
  {
    id: "philidor-checks-from-behind",
    title: "Philidor: checks from behind",
    category: "Rook endgames",
    difficulty: "intermediate",
    fen: "8/8/8/8/5k2/R5p1/7r/6K1 w - - 0 1",
    playerColor: "white",
    objective: { type: "draw", surviveMoves: 15 },
    lesson:
      "Black has pushed the pawn to g3, so your third rank no longer keeps the king out. But now the king has no shelter from behind: go to the far end of the board and check it from there.",
    hints: [
      "Your rook has done its job on the third rank.",
      "Ra8! Then check the king from behind as soon as it comes forward.",
      "Rf3+?, Rxg3? and Ra2? all lose.",
    ],
  },
  {
    id: "short-side-defence",
    title: "Short-side defence",
    category: "Rook endgames",
    difficulty: "advanced",
    fen: "8/8/8/8/R7/3kp3/7r/5K2 w - - 0 1",
    playerColor: "white",
    objective: { type: "draw", surviveMoves: 20 },
    lesson:
      "Your king is on the short side of the pawn, towards the h-file, which leaves the long side to your rook. Checks need distance: from four files away, the king can't walk up to the rook to stop them without leaving its pawn.",
    hints: [
      "Black threatens ...Rh1+ and ...e2. Act now.",
      "Ra3+! Every other move loses, Kg1 included.",
      "If ...Kd2, Ra2+ skewers the rook on h2; if the king walks away from the pawn, take it.",
    ],
  },
  {
    id: "vancura",
    title: "Vancura defence",
    category: "Rook endgames",
    difficulty: "advanced",
    fen: "8/8/8/8/2k5/p4R2/6K1/r7 w - - 0 1",
    playerColor: "white",
    objective: { type: "draw", surviveMoves: 20 },
    lesson:
      "Against a rook pawn with the enemy rook in front of it, attack the pawn from the side and keep your king on g2 or h2. The black rook is tied to the pawn, and the black king can't come to its aid without being checked away.",
    hints: [
      "Keep the rook on the third rank, hitting a3 from the side.",
      "Re3, Kh2 or Rf4+ hold. If the pawn goes to a2, get behind it with Ra3.",
      "When the king steps up to your rook, check it: after ...Kb4, Re4+.",
    ],
  },
  {
    id: "rook-vs-pawn",
    title: "Rook against pawn",
    category: "Rook endgames",
    difficulty: "advanced",
    fen: "8/8/8/2k5/1p6/8/7K/5R2 w - - 0 1",
    playerColor: "white",
    objective: { type: "checkmate", maxMoves: 32 },
    lesson:
      "A rook on its own can't stop a pawn escorted by its king. Count the moves: the rook can wait on the first rank, but your king has to come back in time to help.",
    hints: [
      "Every rook move lets Black draw.",
      "Bring the king: Kg1 (or Kg2, Kg3), then Kf2 and Ke3.",
      "Put the rook behind the pawn and use a check to push the black king away from it, then take the pawn.",
    ],
    par: 21,
  },
  {
    id: "saavedra",
    title: "Saavedra position",
    category: "Rook endgames",
    difficulty: "advanced",
    fen: "8/8/1KP5/3r4/8/8/8/k7 w - - 0 1",
    playerColor: "white",
    objective: { type: "checkmate", maxMoves: 40 },
    lesson:
      "The most famous endgame study (1895). The rook checks until your king comes close to it, then sets a stalemate trap. Promoting to a rook instead of a queen avoids the stalemate and still wins.",
    hints: [
      "c7, then walk the king down the b-file towards the rook to get out of the checks.",
      "When the rook goes to d4, c8=Q? Rc4+! Qxc4 is stalemate.",
      "c8=R! threatens Ra8 mate; after ...Ra4, Kb3 attacks the rook and threatens Rc1 mate.",
    ],
    par: 26,
  },

  // Rook vs minor piece
  {
    id: "rook-vs-knight-win",
    title: "A knight far from home",
    category: "Rook vs minor piece",
    difficulty: "beginner",
    fen: "k7/8/2K5/8/8/8/6n1/3R4 w - - 0 1",
    playerColor: "white",
    objective: { type: "checkmate", maxMoves: 3 },
    lesson:
      "A knight that strays from its king can't defend it. This one is too far away to help: two moves, and the black king is mated in its corner.",
    hints: [
      "Take away the king's escape squares.",
      "Kb6! threatens Rd8 mate, and the knight can't stop it.",
    ],
    par: 2,
  },
  {
    id: "rook-vs-bishop-win",
    title: "Bishop in the wrong corner",
    category: "Rook vs minor piece",
    difficulty: "intermediate",
    fen: "k1b5/8/1K6/8/8/8/8/7R w - - 0 1",
    playerColor: "white",
    objective: { type: "checkmate", maxMoves: 5 },
    lesson:
      "Rook against bishop is usually a draw, but not when the defending king is stuck in a corner of the bishop's colour. a8 is light, like the bishop, so it can't shield the king from checks along the back rank.",
    hints: [
      "Aim at the back rank.",
      "Rd1 threatens Rd8+. Whatever the bishop does, it's taken, or it has to block on c8 and is taken with mate.",
    ],
    par: 3,
  },
  {
    id: "rook-vs-knight-draw",
    title: "Rook against knight: stay together",
    category: "Rook vs minor piece",
    difficulty: "intermediate",
    fen: "8/8/8/4k3/8/2NK4/8/7r w - - 0 1",
    playerColor: "white",
    objective: { type: "draw", surviveMoves: 20 },
    lesson:
      "Rook against knight is a draw as long as the knight stays next to its king and away from the edge. Separate the two and the knight gets trapped, or the king gets mated.",
    hints: [
      "Keep the knight beside your king.",
      "Ne2, Kc2 or Ke3 hold. Ne4?, Nd5? and Nb1? drift away and lose.",
    ],
  },
  {
    id: "rook-vs-bishop-draw",
    title: "Rook against bishop: the right corner",
    category: "Rook vs minor piece",
    difficulty: "advanced",
    fen: "8/8/8/8/8/6k1/r7/6BK w - - 0 1",
    playerColor: "white",
    objective: { type: "draw", surviveMoves: 20 },
    lesson:
      "With a dark-squared bishop the safe corner is h1, a light square the bishop doesn't control. A check along the first rank is blocked by Bg1, and if the pinned bishop leaves you with no legal move, that's stalemate.",
    hints: [
      "Keep your bishop on the g1–a7 diagonal.",
      "Bd4, Bc5 or Bb6. The checks Bf2+ and Bh2+ lose, and so does Be3.",
      "When the rook checks along the first rank, block with Bg1 (or take the rook if you can).",
    ],
  },
];

/** Categories in the order the lab lists them. */
export const ENDGAME_CATEGORIES: { name: EndgameCategory; description: string }[] = [
  { name: "Checkmates", description: "The basic mates every player needs." },
  { name: "King and pawn", description: "When a single pawn decides the game." },
  { name: "Opposition", description: "How kings fight for squares." },
  { name: "Pawn races", description: "Counting moves when pawns run for it." },
  { name: "Minor pieces", description: "Bishops and knights: right colours, wrong colours and blockades." },
  { name: "Queen endgames", description: "A queen against a pawn, and against a rook." },
  { name: "Rook endgames", description: "Lucena, Philidor and the ideas around them." },
  { name: "Rook vs minor piece", description: "When a rook beats a bishop or knight, and when it can't." },
];

export const getEndgameExercise = (id: string | undefined): EndgameExercise | undefined =>
  ENDGAME_EXERCISES.find((exercise) => exercise.id === id);

/** The exercise after `id` in the lab's order, if any. */
export const nextEndgameExercise = (id: string): EndgameExercise | undefined => {
  const index = ENDGAME_EXERCISES.findIndex((exercise) => exercise.id === id);
  return index === -1 ? undefined : ENDGAME_EXERCISES[index + 1];
};
