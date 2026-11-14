import { useEffect, useId, useMemo, useState, type KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Search, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { puzzleService } from "../../services/puzzle.service";
import { PUZZLE_THEMES_QUERY_KEY } from "../../constants/puzzle.constants";
import { filterThemes, formatThemeLabel } from "../../utils/themeLabels";

interface PuzzleThemePickerProps {
  /** Selected Lichess theme key, "" for all themes */
  value: string;
  onChange: (theme: string) => void;
  className?: string;
}

interface Option {
  theme: string;
  label: string;
  count?: number;
}

const ALL_THEMES = "All themes";

/** Searchable theme list (combobox + listbox) in a popover. */
export const PuzzleThemePicker = ({ value, onChange, className }: PuzzleThemePickerProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: [PUZZLE_THEMES_QUERY_KEY],
    queryFn: puzzleService.fetchThemes,
    // Counts only change when puzzles are imported
    staleTime: 60 * 60 * 1000,
  });

  const options = useMemo<Option[]>(() => {
    const themes = filterThemes(data ?? [], query).map((t) => ({
      theme: t.theme,
      label: formatThemeLabel(t.theme),
      count: t.count,
    }));
    return query.trim() ? themes : [{ theme: "", label: ALL_THEMES }, ...themes];
  }, [data, query]);

  const selectedLabel = value ? formatThemeLabel(value) : ALL_THEMES;
  const optionId = (index: number) => `${listId}-option-${index}`;

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setQuery("");
      // Start on the selected theme ("All themes" is index 0)
      setActive(Math.max(0, (data ?? []).findIndex((t) => t.theme === value) + 1));
    }
  };

  const select = (theme: string) => {
    setOpen(false);
    if (theme !== value) onChange(theme);
  };

  // Keep the active option visible while arrowing through the list
  useEffect(() => {
    if (open) document.getElementById(`${listId}-option-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, open, listId]);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!options.length) return;
    const last = options.length - 1;
    const moves: Record<string, number> = {
      ArrowDown: active >= last ? 0 : active + 1,
      ArrowUp: active <= 0 ? last : active - 1,
      Home: 0,
      End: last,
      PageDown: Math.min(last, active + 8),
      PageUp: Math.max(0, active - 8),
    };
    if (event.key in moves) {
      event.preventDefault();
      setActive(moves[event.key]!);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = options[active];
      if (option) select(option.theme);
    }
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="md"
          className={cn("w-full justify-between gap-2 font-normal", className)}
          aria-label={`Puzzle theme: ${selectedLabel}. Change theme`}
        >
          <span className="flex min-w-0 items-center gap-2">
            <Tags className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="truncate">{selectedLabel}</span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) min-w-64 p-0">
        <div className="relative border-b border-border">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={options.length ? optionId(active) : undefined}
            aria-label="Search themes"
            placeholder="Search themes"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            className="h-10 rounded-none border-0 pl-9 shadow-none focus-visible:ring-0"
            autoFocus
          />
        </div>

        {isPending ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground" role="status">
            Loading themes…
          </p>
        ) : isError ? (
          <div className="space-y-2 px-3 py-4 text-center text-sm" role="alert">
            <p className="text-muted-foreground">Couldn't load themes.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : (
          <div
            id={listId}
            role="listbox"
            aria-label="Puzzle themes"
            className="max-h-72 overflow-y-auto p-1"
          >
            {options.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground" role="status">
                No themes match “{query.trim()}”
              </p>
            )}
            {options.map((option, index) => {
              const selected = option.theme === value;
              return (
                <div
                  key={option.theme || "all"}
                  id={optionId(index)}
                  role="option"
                  aria-selected={selected}
                  onClick={() => select(option.theme)}
                  onMouseMove={() => index !== active && setActive(index)}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                    index === active && "bg-accent text-accent-foreground"
                  )}
                >
                  <Check
                    className={cn("size-4 shrink-0", selected ? "opacity-100" : "opacity-0")}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {option.count !== undefined && (
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {option.count.toLocaleString()}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
