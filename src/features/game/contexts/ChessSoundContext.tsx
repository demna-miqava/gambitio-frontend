import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import type { Move } from "chess.js";
import { useSettings } from "@/features/settings/SettingsContext";

export type ChessSoundType = "move" | "capture" | "gameEnd";

// Served from public/sounds/
const SOUND_URLS: Record<ChessSoundType, string> = {
  move: "/sounds/move.mp3",
  capture: "/sounds/capture.mp3",
  gameEnd: "/sounds/game-end.mp3",
};
const VOLUME = 0.5;
/** A sound later than this after its move is skipped rather than played */
const MAX_RESUME_DELAY_MS = 250;
/**
 * A game that ends on the board asks for the game-end sound twice: for the
 * move itself, and again when the server reports the result.
 */
const GAME_END_REPEAT_MS = 1500;
const SOUND_TYPES = Object.keys(SOUND_URLS) as ChessSoundType[];
// Any of these counts as the tap or key press that lets a page play sound
const UNLOCK_EVENTS = ["pointerdown", "touchend", "keydown"] as const;

interface ChessSoundContextValue {
  playSound: (soundType: ChessSoundType) => void;
  /** `endsGame`: the move finished the game (checkmate, stalemate, ...) */
  playSoundForMove: (move: Move | null, endsGame: boolean) => void;
  playGameEndSound: () => void;
}

const ChessSoundContext = createContext<ChessSoundContextValue | null>(null);

interface SoundPlayer {
  context: AudioContext;
  gain: GainNode;
  /** Decoded sounds, ready to start at once */
  buffers: Partial<Record<ChessSoundType, AudioBuffer>>;
  /** For a sound that couldn't be fetched or decoded (e.g. no CORS) */
  fallbacks: Partial<Record<ChessSoundType, HTMLAudioElement>>;
}

const loadSound = async (
  player: SoundPlayer,
  type: ChessSoundType,
  url: string
) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    player.buffers[type] = await player.context.decodeAudioData(
      await response.arrayBuffer()
    );
  } catch (error) {
    console.warn(`Sound "${type}" plays without Web Audio:`, error);
    const audio = new Audio(url);
    audio.volume = VOLUME;
    player.fallbacks[type] = audio;
  }
};

/**
 * One sound player for the whole app. Follows the soundsEnabled setting.
 *
 * Sounds are decoded once into Web Audio buffers and started from memory,
 * so they play the moment a move lands. An <audio> element per sound was
 * noticeably late on phones (every play() goes through the media pipeline,
 * and rewinding it is a seek).
 */
export const ChessSoundProvider = ({ children }: { children: React.ReactNode }) => {
  const { settings } = useSettings();
  const enabled = settings?.soundsEnabled ?? false;
  const playerRef = useRef<SoundPlayer | null>(null);
  // Mobile browsers block playback until the user interacts with the page;
  // say so once instead of on every move
  const warnedRef = useRef(false);
  const lastGameEndAtRef = useRef(-Infinity);

  // Created the first time sounds are enabled, i.e. once settings have loaded.
  // All three sounds are fetched and decoded here, ahead of the first move.
  useEffect(() => {
    if (!enabled || playerRef.current) return;
    if (typeof AudioContext === "undefined") return;
    const context = new AudioContext({ latencyHint: "interactive" });
    const gain = context.createGain();
    gain.gain.value = VOLUME;
    gain.connect(context.destination);
    const player: SoundPlayer = { context, gain, buffers: {}, fallbacks: {} };
    playerRef.current = player;
    for (const type of SOUND_TYPES) void loadSound(player, type, SOUND_URLS[type]);
  }, [enabled]);

  // Closed with the provider (signing out unmounts it): browsers allow only
  // a few audio contexts per page, and an open one keeps the audio device busy
  useEffect(
    () => () => {
      playerRef.current?.context.close().catch(() => {});
      playerRef.current = null;
    },
    []
  );

  // Browsers start an AudioContext suspended until the user interacts with
  // the page, and iOS suspends it again when the tab goes to the background.
  // Resume on every tap or key press, so it is already running when a move
  // arrives from the opponent (which isn't a tap).
  useEffect(() => {
    if (!enabled) return;
    const resume = () => {
      const context = playerRef.current?.context;
      if (context && context.state !== "running") {
        context.resume().catch(() => {});
      }
    };
    for (const type of UNLOCK_EVENTS) {
      document.addEventListener(type, resume, { capture: true, passive: true });
    }
    return () => {
      for (const type of UNLOCK_EVENTS) {
        document.removeEventListener(type, resume, { capture: true });
      }
    };
  }, [enabled]);

  const playSound = useCallback(
    (soundType: ChessSoundType) => {
      const player = enabled ? playerRef.current : null;
      if (!player) return;
      if (soundType === "gameEnd") {
        const now = performance.now();
        if (now - lastGameEndAtRef.current < GAME_END_REPEAT_MS) return;
        lastGameEndAtRef.current = now;
      }
      const warn = (error: unknown) => {
        if (warnedRef.current) return;
        warnedRef.current = true;
        console.warn("Sound playback was blocked by the browser:", error);
      };

      const buffer = player.buffers[soundType];
      if (buffer) {
        const { context } = player;
        const start = () => {
          const source = context.createBufferSource();
          source.buffer = buffer;
          source.connect(player.gain);
          source.start();
        };
        if (context.state === "running") {
          start();
          return;
        }
        // Suspended: a sound queued now would play whenever the context
        // next resumes (possibly the user's next tap), so only play it if
        // resuming is quick
        const requestedAt = performance.now();
        context
          .resume()
          .then(() => {
            if (performance.now() - requestedAt < MAX_RESUME_DELAY_MS) start();
          })
          .catch(warn);
        return;
      }

      // Not decoded (yet, or at all): the slower <audio> element
      const audio = player.fallbacks[soundType];
      if (!audio) return;
      audio.currentTime = 0;
      audio.play().catch(warn);
    },
    [enabled]
  );

  const playSoundForMove = useCallback(
    (move: Move | null, endsGame: boolean) => {
      if (!move) return;
      if (endsGame) playSound("gameEnd");
      else if (move.captured) playSound("capture");
      else playSound("move");
    },
    [playSound]
  );

  const playGameEndSound = useCallback(() => playSound("gameEnd"), [playSound]);

  const value = useMemo(
    () => ({ playSound, playSoundForMove, playGameEndSound }),
    [playSound, playSoundForMove, playGameEndSound]
  );

  return <ChessSoundContext.Provider value={value}>{children}</ChessSoundContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useChessSound = () => {
  const context = useContext(ChessSoundContext);
  if (!context) throw new Error("useChessSound must be used within ChessSoundProvider");
  return context;
};
