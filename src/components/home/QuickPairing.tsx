import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bot, CircleAlert, Loader2, SlidersHorizontal, Tablet, Trophy, X } from "lucide-react";
import { useMatchmaking } from "@/features/matchmaking/hooks/useMatchmaking";
import { useRatedPreference } from "@/features/matchmaking/hooks/useRatedPreference";
import { PillRadioGroup } from "@/components/PillRadioGroup";
import { RATED_OPTIONS } from "@/features/matchmaking/constants/ratedOptions";
import { useUserGames } from "@/features/game-table/hooks/useUserGames";
import { PLAY_TIME_CONTROLS } from "@/features/create-game/constants/timeControls";
import { SPEED_ICON, SPEED_LABEL } from "@/features/game/constants/speed";
import { Button } from "@/components/ui/button";
import { ProvisionalMark } from "@/components/ProvisionalMark";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/constants/routes";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import type { TimeControlType } from "@/types";
import { HOME_GAMES_QUERY } from "./constants";
import { FIRST_GAME, usualTimeControl, type QuickTimeControl } from "./usualTimeControl";

/** A search that has run this long says the pool is quiet */
const SLOW_AFTER_SECONDS = 30;

const elapsedLabel = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/** "3+2" with the plus dimmed */
const Numerals = ({ label }: { label: string }) => {
  const at = label.lastIndexOf("+");
  return (
    <>
      {label.slice(0, at)}
      <span className="mx-px opacity-50">+</span>
      {label.slice(at + 1)}
    </>
  );
};

const modeClass =
  "inline-flex min-h-11 items-center gap-2 rounded-md px-2.5 text-[13px] font-semibold text-muted-foreground transition-colors outline-none hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:min-h-9";

/**
 * New game: nine time controls in three rows (bullet, blitz, rapid), each
 * row led by the speed and the player's rating in it. One tap on a tile
 * starts looking for an opponent; there is no separate Play button.
 *
 * Colour is spent on one tile: the time control the player plays most
 * ("Your usual", from their recent games), or 10+0 as a good first game for
 * someone with none. While searching, that tile gives the accent to the one
 * being searched, the others step back (a tap on one switches the search),
 * and the footer says what is being looked for, for how long, with Cancel.
 * A search that couldn't start says so in the footer too, with Try again.
 * All of it takes the footer's place, so nothing on the panel moves.
 *
 * Rated or Casual, beside the title, is which pool the search joins: a
 * casual game changes no ratings and is only paired with other casual
 * searches. Changing it while searching moves the search.
 */
export const QuickPairing = () => {
  const { bulletRating, blitzRating, rapidRating, chessProfile } = useUser();
  // The same request as Home's recent games (same key): read from its cache
  const games = useUserGames(HOME_GAMES_QUERY);
  const usual = games.isPending ? null : usualTimeControl(games.games);
  const featured = games.isPending ? null : (usual ?? FIRST_GAME);
  const featuredTag = usual ? "Your usual" : "Good first game";

  // The time control of the search that is running, or that ran last
  const [selected, setSelected] = useState<QuickTimeControl>(FIRST_GAME);
  const [elapsed, setElapsed] = useState(0);
  const [rated, setRated] = useRatedPreference();
  const { setShouldConnect, isSearching, isConnecting, error, clearError } = useMatchmaking({
    time: selected.time,
    increment: selected.increment,
    rated,
    quietErrors: true,
  });

  const ratings: Record<TimeControlType, { value?: number; provisional?: boolean | null }> = {
    bullet: { value: bulletRating, provisional: chessProfile?.bulletProvisional },
    blitz: { value: blitzRating, provisional: chessProfile?.blitzProvisional },
    rapid: { value: rapidRating, provisional: chessProfile?.rapidProvisional },
  };

  const cancel = () => setShouldConnect(false);
  const start = (control: QuickTimeControl) => {
    // A tap on the tile being searched takes it back; on another one, the
    // search moves there (leave the queue first, then join the new one)
    if (isSearching) cancel();
    if (isSearching && control.label === selected.label) return;
    setElapsed(0);
    setSelected(control);
    setShouldConnect(true);
  };
  const changeRated = (next: boolean) => {
    if (next === rated) return;
    // A failed search was for the other kind: its message goes with it
    clearError();
    // The other pool: leave this queue and join that one, from zero
    if (isSearching) {
      cancel();
      setElapsed(0);
      setShouldConnect(true);
    }
    setRated(next);
  };
  useEffect(() => {
    if (!isSearching) return;
    const tick = setInterval(() => setElapsed((seconds) => seconds + 1), 1000);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) setShouldConnect(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearInterval(tick);
      window.removeEventListener("keydown", onKey);
    };
  }, [isSearching, setShouldConnect]);

  const pool = ratings[PLAY_TIME_CONTROLS.find((speed) => speed.options.includes(selected))?.label ?? "rapid"];
  // "3+2", or "casual 3+2": what the footer says is being looked for
  const what = rated ? selected.label : `casual ${selected.label}`;
  // The search ended by itself: `selected` is still the one that failed
  const showError = !isSearching && error !== null;

  return (
    <section
      aria-labelledby="quick-pairing-title"
      className="flex h-full flex-col rounded-[10px] border border-border bg-card p-5 shadow-(--shadow-panel) sm:rounded-2xl sm:p-7"
    >
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div>
          <h1 id="quick-pairing-title" className="font-display text-[22px] leading-tight sm:text-[28px]">
            New game
          </h1>
          <p className="mt-1 text-[13px] text-faint">Minutes each, plus seconds added after every move.</p>
        </div>
        <PillRadioGroup
          label="Rated or casual"
          value={rated ? "rated" : "casual"}
          onValueChange={(value) => changeRated(value === "rated")}
          options={RATED_OPTIONS}
        />
      </header>

      <div className="mt-5 grid gap-4 pb-5 sm:mt-6 sm:gap-2.5">
        {PLAY_TIME_CONTROLS.map(({ label: speed, options }) => {
          const Icon = SPEED_ICON[speed];
          const rating = ratings[speed];
          return (
            <div
              key={speed}
              role="group"
              aria-label={SPEED_LABEL[speed]}
              className="grid grid-cols-3 gap-2 sm:grid-cols-[116px_repeat(3,minmax(0,1fr))] sm:gap-2.5"
            >
              <div className="col-span-full flex items-center gap-2 leading-[1.3] sm:col-span-1 sm:grid sm:grid-cols-[16px_1fr] sm:content-center">
                <Icon className="size-4 text-muted-foreground" strokeWidth={2} aria-hidden="true" />
                <span className="font-semibold">{SPEED_LABEL[speed]}</span>
                <span className="text-[13px] text-faint tabular-nums sm:col-start-2">
                  {chessProfile === undefined ? (
                    <Skeleton className="h-2.5 w-9" />
                  ) : rating.value !== undefined ? (
                    <>
                      <span className="sr-only">Your rating: </span>
                      {rating.value}
                      <ProvisionalMark provisional={rating.provisional} className="text-faint" />
                    </>
                  ) : null}
                </span>
              </div>
              {options.map((control) => {
                const isChosen = isSearching && control.label === selected.label;
                const isFeatured = !isSearching && featured?.label === control.label;
                return (
                  <button
                    key={control.label}
                    type="button"
                    onClick={() => start(control)}
                    aria-pressed={isChosen}
                    aria-busy={isChosen || undefined}
                    aria-label={`${
                      isChosen ? "Cancel the search for" : "Play"
                    } ${control.label} ${SPEED_LABEL[speed].toLowerCase()}${rated ? "" : ", casual"}${
                      isFeatured ? `. ${featuredTag}` : ""
                    }`}
                    className={cn(
                      "flex h-16 flex-col items-center justify-center rounded-[10px] sm:h-[72px]",
                      "transition-[background-color,color,box-shadow,opacity,translate] duration-150 active:translate-y-px",
                      "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                      isChosen
                        ? "animate-tile-pulse bg-primary-solid text-primary-solid-foreground motion-reduce:animate-none"
                        : isFeatured
                          ? "bg-primary-solid text-primary-solid-foreground hover:bg-primary-solid-hover"
                          : "bg-muted shadow-[inset_0_0_0_1px_var(--border)] hover:bg-card hover:shadow-[inset_0_0_0_1.5px_var(--primary-solid)]",
                      isSearching && !isChosen && "opacity-50"
                    )}
                  >
                    <span className="font-display text-[22px] leading-[1.1] font-medium [font-variant-numeric:lining-nums] sm:text-[26px]">
                      <Numerals label={control.label} />
                    </span>
                    {(isChosen || isFeatured) && (
                      <span className="text-[11px] leading-[1.2] font-semibold opacity-85">
                        {isChosen ? "Searching" : featuredTag}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Searching, failed or idle: each takes this row's place, so the tiles never move */}
      <footer
        aria-live="polite"
        className="mt-auto flex min-h-14 items-center border-t border-border pt-4"
      >
        {isSearching ? (
          <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-2 font-semibold">
            <Loader2 className="size-4 shrink-0 animate-spin text-primary" aria-hidden="true" />
            <p className="min-w-0 flex-1 basis-3/5">
              {isConnecting
                ? `Connecting to find a ${what} opponent`
                : elapsed >= SLOW_AFTER_SECONDS
                  ? `Still looking for a ${what} opponent. This pool is quiet right now.`
                  : pool.value !== undefined
                    ? `Finding a ${what} opponent near ${pool.value}`
                    : `Finding a ${what} opponent`}
              {/* Counting up is noise for a screen reader: the sentence is enough */}
              <span className="ml-2.5 font-medium text-faint tabular-nums" aria-hidden="true">
                {elapsedLabel(elapsed)}
              </span>
            </p>
            <Button variant="outline" size="md" className="ml-auto max-sm:h-11" onClick={cancel}>
              Cancel
              <kbd
                className="rounded-[4px] border border-border-strong px-1 font-sans text-[11px] font-semibold text-muted-foreground max-sm:hidden"
                aria-hidden="true"
              >
                Esc
              </kbd>
            </Button>
          </div>
        ) : showError ? (
          <div role="alert" className="flex w-full flex-wrap items-center gap-x-3 gap-y-2">
            <CircleAlert className="size-[18px] shrink-0 text-destructive" aria-hidden="true" />
            <p className="min-w-0 flex-1 basis-3/5 font-medium">
              {error.kind === "refused"
                ? error.message
                : `The search for a ${what} game ${
                    error.kind === "lost" ? "was cut off" : "did not start"
                  }. Check your connection, then try again.`}
            </p>
            <Button variant="outline" size="md" className="ml-auto max-sm:h-11" onClick={() => start(selected)}>
              Try again
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="-ml-2 max-sm:size-11"
              onClick={clearError}
              aria-label="Dismiss"
            >
              <X aria-hidden="true" />
            </Button>
          </div>
        ) : (
          <nav
            aria-label="Other ways to play"
            className="-ml-2.5 flex flex-wrap gap-0.5 max-sm:ml-0 max-sm:grid max-sm:w-full max-sm:grid-cols-2"
          >
            <Link to={ROUTES.PLAY} state={{ section: "custom" }} className={modeClass}>
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              Custom game
            </Link>
            <Link to={ROUTES.PLAY_BOTS} className={modeClass}>
              <Bot className="size-4" aria-hidden="true" />
              Play a bot
            </Link>
            <Link to={ROUTES.TABLE} className={modeClass}>
              <Tablet className="size-4" aria-hidden="true" />
              Table mode
            </Link>
            <Link to={ROUTES.TOURNAMENTS} className={modeClass}>
              <Trophy className="size-4" aria-hidden="true" />
              Tournaments
            </Link>
          </nav>
        )}
      </footer>
    </section>
  );
};
