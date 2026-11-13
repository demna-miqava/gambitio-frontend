import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import type { Move } from "chess.js";
import {
  CAPTURE_SOUND_URL,
  GENERIC_SOUND_URL,
  MOVE_SOUND_URL,
} from "@/constants/apiConfig";
import { useSettings } from "@/features/settings/SettingsContext";

export type ChessSoundType = "move" | "capture" | "generic";

// Each URL is optional (VITE_*_SOUND_URL); an unset one is simply silent
const SOUND_URLS: Record<ChessSoundType, string | undefined> = {
  move: MOVE_SOUND_URL,
  capture: CAPTURE_SOUND_URL,
  generic: GENERIC_SOUND_URL,
};
const VOLUME = 0.5;
/** A sound later than this after its move is skipped rather than played */
const MAX_RESUME_DELAY_MS = 250;
const SOUND_TYPES = Object.keys(SOUND_URLS) as ChessSoundType[];
// Any of these counts as the tap or key press that lets a page play sound
const UNLOCK_EVENTS = ["pointerdown", "touchend", "keydown"] as const;

interface ChessSoundContextValue {
  playSound: (soundType: ChessSoundType) => void;
  playSoundForMove: (move: Move | null, isCheckmate: boolean) => void;
  playGenericSound: () => void;
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

  // Created the first time sounds are enabled, i.e. once settings have loaded
  useEffect(() => {
    if (!enabled || playerRef.current) return;
    if (typeof AudioContext === "undefined") return;
    const context = new AudioContext({ latencyHint: "interactive" });
    const gain = context.createGain();
    gain.gain.value = VOLUME;
    gain.connect(context.destination);
    const player: SoundPlayer = { context, gain, buffers: {}, fallbacks: {} };
    playerRef.current = player;
    for (const type of SOUND_TYPES) {
      // An unset VITE_*_SOUND_URL is simply silent
      const url = SOUND_URLS[type];
      if (url) void loadSound(player, type, url);
    }
  }, [enabled]);

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
    (move: Move | null, isCheckmate: boolean) => {
      if (!move) return;
      if (isCheckmate) playSound("generic");
      else if (move.captured) playSound("capture");
      else playSound("move");
    },
    [playSound]
  );

  const playGenericSound = useCallback(() => playSound("generic"), [playSound]);

  const value = useMemo(
    () => ({ playSound, playSoundForMove, playGenericSound }),
    [playSound, playSoundForMove, playGenericSound]
  );

  return <ChessSoundContext.Provider value={value}>{children}</ChessSoundContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useChessSound = () => {
  const context = useContext(ChessSoundContext);
  if (!context) throw new Error("useChessSound must be used within ChessSoundProvider");
  return context;
};
