import { useState, type FormEvent } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  isDateRangeInverted,
  type HistoryFilterKey,
  type HistoryFilters as Filters,
} from "../utils/historyFilters";

/** Select can't hold an empty value: this one means "not filtered" */
const ANY = "any";

type Option = { value: string; label: string };

const SELECTS: { key: HistoryFilterKey; label: string; any: string; options: Option[] }[] = [
  {
    key: "result",
    label: "Result",
    any: "Any result",
    options: [
      { value: "won", label: "Won" },
      { value: "lost", label: "Lost" },
      { value: "drawn", label: "Drawn" },
    ],
  },
  {
    key: "timeControl",
    label: "Time control",
    any: "Any time control",
    options: [
      { value: "bullet", label: "Bullet" },
      { value: "blitz", label: "Blitz" },
      { value: "rapid", label: "Rapid" },
    ],
  },
  {
    key: "color",
    label: "Colour",
    any: "Either colour",
    options: [
      { value: "white", label: "White" },
      { value: "black", label: "Black" },
    ],
  },
  {
    key: "rated",
    label: "Rated",
    any: "Rated and unrated",
    options: [
      { value: "rated", label: "Rated" },
      { value: "unrated", label: "Unrated" },
    ],
  },
  {
    key: "kind",
    label: "Kind",
    any: "All kinds",
    options: [
      { value: "online", label: "Online" },
      { value: "tournament", label: "Tournament" },
      { value: "bot", label: "Computer" },
      { value: "table", label: "Table mode" },
    ],
  },
];

interface HistoryFiltersProps {
  filters: Filters;
  activeCount: number;
  onChange: (key: HistoryFilterKey, value: string | undefined) => void;
  onClear: () => void;
  /** Whose games, when not the viewer's own: results and colours are from their side */
  ownerName?: string;
}

/**
 * The opponent's name: applied on Enter or when the field loses focus, not
 * on every key, so each search is one Back step. Remounted (key) when the
 * URL changes it, e.g. on Back or Clear.
 */
const OpponentField = ({
  value,
  onChange,
  id,
  className,
}: {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  id: string;
  className?: string;
}) => {
  const [text, setText] = useState(value ?? "");
  const apply = () => {
    const trimmed = text.trim();
    if (trimmed !== (value ?? "")) onChange(trimmed || undefined);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    apply();
  };
  return (
    <form onSubmit={submit} role="search" className={cn("relative", className)}>
      <Label htmlFor={id} className="sr-only">
        Opponent
      </Label>
      <Input
        id={id}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={apply}
        placeholder="Opponent's username"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={30}
        enterKeyHint="search"
        className="h-9 pr-8"
      />
      {text && (
        <button
          type="button"
          aria-label="Clear opponent"
          className="absolute top-1/2 right-1 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          onClick={() => {
            setText("");
            if (value) onChange(undefined);
          }}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </form>
  );
};

/** Every control; laid out as a wrapping row (`row`) or stacked (the phone sheet) */
const FilterControls = ({
  filters,
  onChange,
  layout,
  ownerName,
}: Pick<HistoryFiltersProps, "filters" | "onChange" | "ownerName"> & { layout: "row" | "stack" }) => {
  const stacked = layout === "stack";
  const idPrefix = `history-${layout}`;
  const inverted = isDateRangeInverted(filters);
  return (
    <div className={cn(stacked ? "grid gap-4" : "flex flex-wrap items-end gap-2")}>
      {SELECTS.map((select) => {
        const value = filters[select.key] ?? ANY;
        const id = `${idPrefix}-${select.key}`;
        return (
          <div key={select.key} className={cn(stacked && "grid gap-1.5")}>
            <Label htmlFor={id} className={cn(stacked ? "text-xs text-muted-foreground" : "sr-only")}>
              {select.label}
              {ownerName && (select.key === "result" || select.key === "color") && (
                <span className="sr-only">{`, for ${ownerName}`}</span>
              )}
            </Label>
            <Select value={value} onValueChange={(v) => onChange(select.key, v === ANY ? undefined : v)}>
              <SelectTrigger
                id={id}
                className={cn(stacked ? "w-full" : "w-auto", value !== ANY && "border-foreground/40 text-foreground")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>{select.any}</SelectItem>
                {select.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      })}

      <div className={cn(stacked && "grid gap-1.5")}>
        {stacked && (
          <Label htmlFor={`${idPrefix}-opponent`} className="text-xs text-muted-foreground" aria-hidden="true">
            Opponent
          </Label>
        )}
        <OpponentField
          key={filters.opponent ?? ""}
          id={`${idPrefix}-opponent`}
          value={filters.opponent}
          onChange={(v) => onChange("opponent", v)}
          className={stacked ? "w-full" : "w-48"}
        />
      </div>

      <fieldset className={cn("flex items-end gap-2", stacked && "grid grid-cols-2")}>
        <legend className="sr-only">Played between</legend>
        {(["from", "to"] as const).map((key) => (
          <div key={key} className={cn(stacked ? "grid gap-1.5" : "flex items-center gap-1.5")}>
            <Label
              htmlFor={`${idPrefix}-${key}`}
              className={cn("text-muted-foreground", stacked ? "text-xs" : "text-sm font-normal")}
            >
              {key === "from" ? "From" : "To"}
            </Label>
            <Input
              id={`${idPrefix}-${key}`}
              type="date"
              value={filters[key] ?? ""}
              max={key === "from" ? filters.to : undefined}
              min={key === "to" ? filters.from : undefined}
              onChange={(e) => onChange(key, e.target.value || undefined)}
              aria-invalid={inverted || undefined}
              className={cn("h-9", stacked ? "w-full" : "w-[9.5rem]")}
            />
          </div>
        ))}
      </fieldset>
      {inverted && (
        <p role="alert" className={cn("text-sm text-loss", !stacked && "w-full")}>
          The start date is after the end date, so dates aren't filtered.
        </p>
      )}
    </div>
  );
};

const ClearButton = ({ count, onClear, className }: { count: number; onClear: () => void; className?: string }) => (
  <Button variant="ghost" size="sm" onClick={onClear} className={className}>
    <X aria-hidden="true" />
    Clear {count === 1 ? "filter" : `${count} filters`}
  </Button>
);

/**
 * Filters for the game history. From 768px a row of controls that wraps;
 * on phones one Filters button (with the count of active filters) that opens
 * them in a sheet from the bottom.
 */
export const HistoryFilters = ({ filters, activeCount, onChange, onClear, ownerName }: HistoryFiltersProps) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="hidden items-end gap-2 md:flex">
        <div className="min-w-0 flex-1">
          <FilterControls filters={filters} onChange={onChange} layout="row" ownerName={ownerName} />
        </div>
        {activeCount > 0 && <ClearButton count={activeCount} onClear={onClear} className="shrink-0" />}
      </div>

      <div className="flex items-center gap-2 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="lg" className="relative">
              <SlidersHorizontal aria-hidden="true" />
              Filters
              {activeCount > 0 && (
                <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs leading-none font-medium text-primary-foreground tabular-nums">
                  <span className="sr-only">, </span>
                  {activeCount}
                  <span className="sr-only"> on</span>
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-2xl pb-safe">
            <SheetHeader>
              <SheetTitle>Filter games</SheetTitle>
              <SheetDescription>
                {ownerName ? `Results and colours are ${ownerName}'s.` : "Results and colours are yours."}
              </SheetDescription>
            </SheetHeader>
            <div className="px-4">
              <FilterControls filters={filters} onChange={onChange} layout="stack" ownerName={ownerName} />
            </div>
            <SheetFooter className="flex-row gap-2">
              {activeCount > 0 && (
                <Button variant="outline" size="lg" className="flex-1" onClick={onClear}>
                  Clear all
                </Button>
              )}
              <Button size="lg" className="flex-1" onClick={() => setOpen(false)}>
                Show games
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        {activeCount > 0 && <ClearButton count={activeCount} onClear={onClear} />}
      </div>
    </>
  );
};
