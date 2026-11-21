import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BOTS, getBotById, type Bot } from "../constants/bots";
import { BotCard } from "./BotCard";
import { Button } from "@/components/ui/button";
import { RadioGroup } from "@/components/ui/radio-group";
import { PageHeader } from "@/components/PageHeader";
import type { PlayerColorOption } from "@/types/game.types";
import { ROUTES } from "@/constants/routes";
import { SegmentedRadioGroup, type SegmentedOption } from "@/components/SegmentedRadioGroup";
import { cn } from "@/lib/utils";

const colorOptions: SegmentedOption<PlayerColorOption>[] = [
  { value: "white", label: "White" },
  { value: "random", label: "Random" },
  { value: "black", label: "Black" },
];

/** How far the fade reaches into the list at an edge that has more to scroll */
const FADE_SIZE = "2.5rem";

/**
 * Which ends of a scroll box have more content past them. Both false when it
 * doesn't scroll (e.g. on phones, where the list isn't a scroll box).
 */
const useScrollEdges = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const [edges, setEdges] = useState({ top: false, bottom: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const top = el.scrollTop > 1;
    const bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 1;
    setEdges((prev) =>
      prev.top === top && prev.bottom === bottom ? prev : { top, bottom }
    );
  }, []);

  useEffect(() => {
    const el = ref.current;
    update();
    // The box's height follows the viewport's
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [update]);

  return { ref, edges, onScroll: update };
};

/** Fades the list out at the edges that hide more bots: a cue to scroll. */
const fadeMask = ({ top, bottom }: { top: boolean; bottom: boolean }) =>
  top || bottom
    ? `linear-gradient(to bottom, ${top ? `transparent, black ${FADE_SIZE}` : "black"}, ${
        bottom ? `black calc(100% - ${FADE_SIZE}), transparent` : "black"
      })`
    : undefined;

interface BotSelectorProps {
  selectedBot: Bot;
  onSelectBot: (bot: Bot) => void;
  selectedColor: PlayerColorOption;
  onSelectColor: (color: PlayerColorOption) => void;
  /** A position set up in the board editor: the game starts there and isn't saved */
  startFen?: string;
}

export const BotSelector = ({
  selectedBot,
  onSelectBot,
  selectedColor,
  onSelectColor,
  startFen,
}: BotSelectorProps) => {
  const navigate = useNavigate();
  const { ref: listRef, edges, onScroll } = useScrollEdges<HTMLDivElement>();
  const mask = fadeMask(edges);

  const handleStartGame = () => {
    const finalColor =
      selectedColor === "random"
        ? Math.random() > 0.5
          ? "white"
          : "black"
        : selectedColor;
    navigate(ROUTES.BOT_GAME, {
      state: { botId: selectedBot.id, color: finalColor, gameKey: Date.now(), ...(startFen && { startFen }) },
    });
  };

  return (
    <div className="flex flex-col gap-5 rounded-2xl bg-card p-4 sm:p-5">
      <PageHeader
        title="Play the computer"
        description={
          startFen
            ? "Choose an opponent for the position you set up. Games from a set-up position aren't rated or kept."
            : "Choose an opponent. Games against the computer aren't rated."
        }
      />

      {/* Phones scroll the page; only the two-column layout gets a scroll box */}
      <RadioGroup
        ref={listRef}
        onScroll={onScroll}
        style={mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined}
        aria-label="Opponent"
        value={selectedBot.id}
        onValueChange={(id) => {
          const bot = getBotById(id);
          if (bot) onSelectBot(bot);
        }}
        className="-mx-1 flex flex-col gap-2 px-1 py-0.5 lg:max-h-[min(440px,calc(100svh-24rem))] lg:min-h-48 lg:overflow-y-auto"
      >
        {BOTS.map((bot) => (
          <BotCard key={bot.id} bot={bot} />
        ))}
      </RadioGroup>

      <div className="space-y-2">
        <p
          aria-hidden="true"
          className="text-sm text-muted-foreground"
        >
          I play as
        </p>
        <SegmentedRadioGroup
          label="I play as"
          value={selectedColor}
          onValueChange={onSelectColor}
          options={colorOptions}
        />
      </div>

      {/*
        Below 1024px the list is long, so the button sticks to the bottom of
        the screen: above the bottom nav (and the home indicator) on phones,
        at the very bottom from 768px where there's no bottom nav. It spans
        the card's padding so the list scrolls under a solid bar.
      */}
      <div
        className={cn(
          "sticky z-10 -mx-4 -mb-4 rounded-b-2xl border-t border-border bg-card/95 px-4 pt-3 pb-4 backdrop-blur-md supports-[backdrop-filter]:bg-card/80",
          "bottom-[calc(4rem+env(safe-area-inset-bottom))] sm:-mx-5 sm:-mb-5 sm:px-5 sm:pb-5",
          "md:bottom-0 md:pb-[max(1.25rem,env(safe-area-inset-bottom))]",
          "lg:static lg:m-0 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none lg:supports-[backdrop-filter]:bg-transparent"
        )}
      >
        <Button size="xl" className="w-full" onClick={handleStartGame}>
          Play {selectedBot.name}
        </Button>
      </div>
    </div>
  );
};
