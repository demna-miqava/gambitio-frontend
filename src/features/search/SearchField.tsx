import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { BookOpen, History, Loader2, Search, X } from "lucide-react";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { searchPlayers } from "@/services/user";
import { loadOpenings, loadedOpenings, type OpeningTable } from "@/features/openings/openings";
import { searchOpenings } from "@/features/openings/searchOpenings";
import { stillMatching } from "./stillMatching";
import { useShortcutKey } from "@/features/game/hooks/useShortcutKey";
import { useDebounce } from "@/hooks/useDebounce";
import { useUser } from "@/hooks/useUser";
import { QKEY_PLAYER_SEARCH } from "@/constants/queryKeys";
import { getAnalysisFromPositionRoute, getProfileGamesRoute, getProfileRoute } from "@/constants/routes";
import { cn } from "@/lib/utils";

/** What a username can be: anything else finds no player, so it isn't asked */
const USERNAME = /^[a-zA-Z0-9_]{1,30}$/;
/** Players whose games with you are offered ("Your games with ann") */
const GAMES_WITH = 2;

interface Result {
  key: string;
  to: string;
  /** What a screen reader hears for the option */
  label: string;
  lead: ReactNode;
  title: ReactNode;
  detail?: string;
}

/**
 * Find a player, an opening or a game, from one field.
 *
 * - Players, by name (the server's search: exact, then starts with, then
 *   contains), opening their profile.
 * - Openings, by name or ECO code, from the opening table this app already
 *   ships: each opens on the analysis board.
 * - Games: your games with each player found, in your game history with
 *   that opponent filled in.
 *
 * A combobox: the results list under the field as you type, arrow keys move
 * through them, Enter opens one, Escape closes the list (and, pressed again,
 * clears the field). "/" anywhere on the page puts the cursor in the field.
 */
export const SearchField = ({ className }: { className?: string }) => {
  const navigate = useNavigate();
  const { id: userId } = useUser();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // A press that began on the results: the field may lose focus before the
  // click arrives (touch browsers), and the list must still be there for it
  const pressingList = useRef(false);
  const listId = useId();
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const query = text.trim();
  const asked = useDebounce(query, 200);

  const focus = useCallback(() => inputRef.current?.focus(), []);
  useShortcutKey("/", focus);

  // The opening table is fetched when the field is first used
  const [table, setTable] = useState<OpeningTable | null>(loadedOpenings);
  const wantsTable = open && !table;
  useEffect(() => {
    if (!wantsTable) return;
    let current = true;
    loadOpenings()
      .then((loaded) => current && setTable(loaded))
      // No openings in the results; the next use of the field tries again
      .catch(() => {});
    return () => {
      current = false;
    };
  }, [wantsTable]);

  // By what is in the field now, not by what was last asked: while the
  // pause before asking runs, a name is already being looked for
  const canBeName = USERNAME.test(query);
  const players = useQuery({
    queryKey: [QKEY_PLAYER_SEARCH, asked.toLowerCase()],
    queryFn: ({ signal }) => searchPlayers(asked, signal),
    enabled: open && canBeName && asked === query,
    staleTime: 30_000,
    retry: false,
    // While the next answer is on its way the last one stays (see `found`), so the list doesn't blink
    placeholderData: keepPreviousData,
  });

  // With the field unfocused (a press on the results took the focus, then
  // became a scroll), a press anywhere else still closes the list
  useEffect(() => {
    if (!open) return;
    const onPress = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    // A press that began on the results ends wherever the pointer is let
    // go, also off the list (where the list itself never hears of it)
    const onRelease = () => (pressingList.current = false);
    document.addEventListener("pointerdown", onPress, true);
    window.addEventListener("pointerup", onRelease, true);
    window.addEventListener("pointercancel", onRelease, true);
    return () => {
      pressingList.current = false;
      document.removeEventListener("pointerdown", onPress, true);
      window.removeEventListener("pointerup", onRelease, true);
      window.removeEventListener("pointercancel", onRelease, true);
    };
  }, [open]);

  const results = useMemo<{ heading: string; items: Result[] }[]>(() => {
    if (query.length === 0) return [];
    // Until the answer for what is in the field now arrives, `players.data`
    // is the answer to something typed earlier: only what still matches is
    // shown, or Enter would open a player from the last search
    const found = canBeName ? stillMatching(players.data ?? [], query) : [];
    const openings = table ? searchOpenings(table, query) : [];
    return [
      {
        heading: "Players",
        items: found.map((player) => ({
          key: `player:${player.id}`,
          to: getProfileRoute(player.id),
          label: `${player.username}, player${player.isFriend ? ", friend" : ""}`,
          lead: <PlayerAvatar username={player.username} avatarUrl={player.avatarUrl} size="sm" />,
          title: player.username,
          detail: player.isFriend ? "Friend" : undefined,
        })),
      },
      {
        heading: "Openings",
        items: openings.map((opening) => ({
          key: `opening:${opening.name}`,
          to: getAnalysisFromPositionRoute(opening.fen),
          label: `${opening.name}, opening, ${opening.eco}`,
          lead: <Lead icon={BookOpen} />,
          title: opening.name,
          detail: opening.eco,
        })),
      },
      {
        heading: "Games",
        items: userId
          ? found.slice(0, GAMES_WITH).map((player) => ({
              key: `games:${player.id}`,
              to: `${getProfileGamesRoute(userId)}?opponent=${encodeURIComponent(player.username)}`,
              label: `Your games with ${player.username}`,
              lead: <Lead icon={History} />,
              title: (
                <>
                  Your games with <b className="font-semibold">{player.username}</b>
                </>
              ),
            }))
          : [],
      },
    ].filter((group) => group.items.length > 0);
  }, [query, canBeName, players.data, table, userId]);

  const flat = useMemo(() => results.flatMap((group) => group.items), [results]);
  const activeIndex = Math.min(active, Math.max(0, flat.length - 1));
  const waiting = canBeName && (asked !== query || players.isFetching);
  const showList = open && query.length > 0;

  const optionId = (index: number) => `${listId}-${index}`;

  const go = (result: Result) => {
    pressingList.current = false;
    setOpen(false);
    setText("");
    inputRef.current?.blur();
    navigate(result.to);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) return setOpen(true);
      if (flat.length === 0) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      const next = (activeIndex + step + flat.length) % flat.length;
      setActive(next);
      // The list scrolls: keep the option the keys moved to in view
      document.getElementById(optionId(next))?.scrollIntoView({ block: "nearest" });
    } else if (event.key === "Enter") {
      const result = showList ? flat[activeIndex] : undefined;
      if (result) {
        event.preventDefault();
        go(result);
      }
    } else if (event.key === "Escape") {
      if (showList) setOpen(false);
      else if (text) setText("");
      else inputRef.current?.blur();
      // Not the page's own Escape (cancelling a search for an opponent)
      event.preventDefault();
    }
  };

  let index = -1;

  return (
    <div
      ref={rootRef}
      role="search"
      className={cn("relative", className)}
      // Leaving the field and its list closes the list
      onBlur={(event) => {
        if (pressingList.current) return;
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint"
        strokeWidth={2}
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="text"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        role="combobox"
        aria-label="Find a player, opening or game"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && flat.length > 0 ? optionId(activeIndex) : undefined}
        placeholder="Find a player, opening or game"
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => {
          pressingList.current = false;
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        className="h-11 w-full rounded-md bg-card pr-10 pl-9 text-base shadow-[inset_0_0_0_1px_var(--border)] outline-none placeholder:text-faint focus-visible:shadow-[inset_0_0_0_1.5px_var(--ring)] md:h-9 md:text-sm"
      />
      <span className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center">
        {waiting && showList ? (
          <Loader2 className="mr-1 size-4 animate-spin text-faint motion-reduce:animate-none" aria-hidden="true" />
        ) : text ? (
          <button
            type="button"
            aria-label="Clear the search"
            // Keeps the cursor in the field
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setText("");
              focus();
            }}
            className="relative touch-target flex size-6 items-center justify-center rounded-[4px] text-faint outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        ) : (
          <kbd
            aria-hidden="true"
            className="mr-1 rounded-[4px] border border-border-strong px-1.5 font-sans text-[11px] leading-[1.5] font-semibold text-faint max-md:hidden"
          >
            /
          </kbd>
        )}
      </span>

      <div
        hidden={!showList}
        onPointerDown={() => (pressingList.current = true)}
        className="absolute inset-x-0 top-full z-40 mt-1.5 max-h-[min(26rem,calc(100svh-9rem))] overflow-y-auto rounded-[10px] border border-border bg-card py-1.5 shadow-lg"
      >
        <div id={listId} role="listbox" aria-label="Search results">
          {results.map((group) => (
            <div key={group.heading} role="group" aria-label={group.heading}>
              <p className="px-3 pt-2 pb-1 text-xs font-semibold text-faint" aria-hidden="true">
                {group.heading}
              </p>
              {group.items.map((result) => {
                index += 1;
                const at = index;
                return (
                  <div
                    key={result.key}
                    id={optionId(at)}
                    role="option"
                    aria-selected={at === activeIndex}
                    aria-label={result.label}
                    // Before the field's blur, which would close the list first
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => go(result)}
                    onMouseMove={() => at !== activeIndex && setActive(at)}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-center gap-3 px-3 py-1.5 text-sm",
                      at === activeIndex && "bg-hover"
                    )}
                  >
                    {result.lead}
                    <span className="min-w-0 flex-1 truncate">{result.title}</span>
                    {result.detail && <span className="shrink-0 text-[13px] text-faint">{result.detail}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        {/* Beside the list, not in it: a listbox holds options only */}
        {showList && flat.length === 0 && (
          <p role="status" className="px-3 py-2.5 text-sm text-muted-foreground">
            {waiting || (open && !table)
              ? "Searching…"
              : players.isError && canBeName
                ? "Couldn't search players. Check your connection and try again."
                : `Nothing found for “${query}”.`}
          </p>
        )}
      </div>
    </div>
  );
};

/** The square at the start of a result that isn't a player */
const Lead = ({ icon: Icon }: { icon: typeof Search }) => (
  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
    <Icon className="size-4" strokeWidth={2} aria-hidden="true" />
  </span>
);
