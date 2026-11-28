import { useId } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PillRadioGroup } from "@/components/PillRadioGroup";
import { BOTS } from "@/features/play-bots/constants/bots";
import { useGameSetup } from "@/features/create-game/GameSetupContext";
import type { PlayerColorOption } from "@/types/game.types";
import { ROUTES } from "@/constants/routes";

const COLORS: readonly { value: PlayerColorOption; label: string }[] = [
  { value: "white", label: "White" },
  { value: "random", label: "Random" },
  { value: "black", label: "Black" },
];

/**
 * Against the computer, without leaving the page: how strong (a slider over
 * the bots, weakest to strongest, starting at the one nearest the player's
 * blitz rating), which side, and Play. The board beside it shows the
 * opponent and the side picked. The full list of bots, with what each plays
 * like, is still on its own page.
 */
export const Bot = () => {
  const navigate = useNavigate();
  const { bot, setBot, botColor, setBotColor } = useGameSetup();
  const sliderId = useId();
  const index = Math.max(0, BOTS.findIndex(({ id }) => id === bot.id));

  const play = () => {
    const color = botColor === "random" ? (Math.random() > 0.5 ? "white" : "black") : botColor;
    navigate(ROUTES.BOT_GAME, { state: { botId: bot.id, color, gameKey: Date.now() } });
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor={sliderId} className="text-[13px] font-semibold text-muted-foreground">
            Strength
          </label>
          <output htmlFor={sliderId} className="font-display-num text-[28px] leading-none">
            {bot.rating}
          </output>
        </div>
        <input
          id={sliderId}
          type="range"
          min={0}
          max={BOTS.length - 1}
          step={1}
          value={index}
          onChange={(event) => setBot(BOTS[Number(event.target.value)])}
          aria-valuetext={`${bot.rating}, ${bot.name}`}
          className="mt-3 h-11 w-full cursor-pointer accent-(--primary-solid) sm:h-6"
        />
        <div className="flex justify-between text-xs text-faint tabular-nums" aria-hidden="true">
          <span>{BOTS[0].rating}</span>
          <span>{BOTS[BOTS.length - 1].rating}</span>
        </div>
        <p className="mt-3 text-sm">
          <span className="font-semibold">{bot.name}.</span>{" "}
          <span className="text-muted-foreground">{bot.description}</span>
        </p>
      </div>

      <div className="space-y-2">
        <p aria-hidden="true" className="text-[13px] font-semibold text-muted-foreground">
          You play
        </p>
        <PillRadioGroup
          label="You play"
          value={botColor}
          onValueChange={setBotColor}
          options={COLORS}
          className="grid w-full"
        />
      </div>

      <div className="space-y-3">
        <Button size="xl" className="w-full" onClick={play}>
          {/* One string: the button spaces its children apart */}
          {`Play the ${bot.rating} bot`}
        </Button>
        <p className="text-[13px] text-faint">
          Games against a bot are unrated and have no clock, and you can take a move back at once.{" "}
          <Link
            to={ROUTES.PLAY_BOTS}
            className="font-semibold text-primary underline-offset-[3px] hover:underline"
          >
            All bots
          </Link>
        </p>
      </div>
    </div>
  );
};
