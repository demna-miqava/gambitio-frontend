import { useId, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Loader2, Play, Search, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { UserAvatar } from "@/components/UserAvatar";
import { SegmentedRadioGroup } from "@/components/SegmentedRadioGroup";
import { useDebounce } from "@/hooks/useDebounce";
import { getUserFriends } from "@/services/user";
import { cn } from "@/lib/utils";
import type { Side, TableSetup } from "../utils/tableGame";

/** Time controls offered at the table, minutes + increment seconds */
const PRESETS = [
  { minutes: 1, increment: 0 },
  { minutes: 3, increment: 2 },
  { minutes: 5, increment: 0 },
  { minutes: 5, increment: 3 },
  { minutes: 10, increment: 0 },
  { minutes: 15, increment: 10 },
  { minutes: 30, increment: 0 },
  { minutes: 90, increment: 30 },
] as const;

/** As the server allows (TIME_LIMITS): 15 s to 3 hours, increment to 3 minutes */
const MAX_MINUTES = 180;
const MAX_INCREMENT = 180;
const MAX_GUEST_NAME = 30;

interface Friend {
  id: number;
  username: string;
  avatarUrl?: string | null;
}

const minutesToSeconds = (minutes: number) => Math.round(minutes * 60);
const validMinutes = (value: number) => Number.isFinite(value) && value >= 0.25 && value <= MAX_MINUTES;

/** Your friends, searched by name, to name as the other player. */
const FriendPicker = ({
  myId,
  selected,
  onSelect,
}: {
  myId: number;
  selected: Friend | null;
  onSelect: (friend: Friend | null) => void;
}) => {
  const [search, setSearch] = useState("");
  const query = useDebounce(search.trim(), 250);
  const friends = useQuery({
    queryKey: ["table-friend-picker", myId, query],
    queryFn: () =>
      getUserFriends(myId, new URLSearchParams({ page: "1", limit: "8", ...(query ? { q: query } : {}) }).toString()),
  });
  const list = (friends.data?.data ?? []) as Friend[];

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl bg-muted px-3 py-2">
        <span className="flex min-w-0 items-center gap-2.5">
          <UserAvatar src={selected.avatarUrl} username={selected.username} className="size-8" />
          <span className="truncate text-sm font-medium">{selected.username}</span>
        </span>
        <Button type="button" size="sm" variant="ghost" onClick={() => onSelect(null)}>
          Change
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Find a friend"
          aria-label="Find a friend"
          className="pl-9"
        />
      </div>
      {friends.isPending ? (
        <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Loading friends…
        </p>
      ) : friends.isError ? (
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          Couldn't load your friends.
          <Button type="button" size="sm" variant="outline" onClick={() => void friends.refetch()}>
            Retry
          </Button>
        </div>
      ) : list.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {query ? `No friend called “${query}”.` : "No friends yet. Play them as a guest, or add them first."}
        </p>
      ) : (
        <ul className="space-y-1" aria-label="Friends">
          {list.map((friend) => (
            <li key={friend.id}>
              <button
                type="button"
                onClick={() => onSelect(friend)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <UserAvatar src={friend.avatarUrl} username={friend.username} className="size-8" />
                <span className="truncate">{friend.username}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

interface TableSetupFormProps {
  myId: number;
  myName: string;
  onStart: (setup: TableSetup) => void;
}

/**
 * Before a table game: the time control (time odds allowed), who is White,
 * and the other player (a friend, who confirms the game later, or a guest
 * by name). "Clock only" hides the board; such a game isn't saved.
 */
export const TableSetupForm = ({ myId, myName, onStart }: TableSetupFormProps) => {
  const ids = { odds: useId(), clockOnly: useId(), guest: useId(), minutes: useId(), increment: useId(), white: useId(), black: useId() };
  const [preset, setPreset] = useState<number | "custom">(3);
  const [minutes, setMinutes] = useState("5");
  const [increment, setIncrement] = useState("3");
  const [odds, setOdds] = useState(false);
  const [whiteMinutes, setWhiteMinutes] = useState("5");
  const [blackMinutes, setBlackMinutes] = useState("5");
  const [color, setColor] = useState<Side>("white");
  const [kind, setKind] = useState<"guest" | "friend">("guest");
  const [guestName, setGuestName] = useState("");
  const [friend, setFriend] = useState<Friend | null>(null);
  const [clockOnly, setClockOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = (index: number) => {
    const chosen = PRESETS[index]!;
    setPreset(index);
    setMinutes(String(chosen.minutes));
    setIncrement(String(chosen.increment));
    setWhiteMinutes(String(chosen.minutes));
    setBlackMinutes(String(chosen.minutes));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const base = Number(minutes);
    const inc = Number(increment);
    const white = odds ? Number(whiteMinutes) : base;
    const black = odds ? Number(blackMinutes) : base;
    if (![white, black].every(validMinutes)) {
      return setError(`Each clock needs between 15 seconds and ${MAX_MINUTES} minutes.`);
    }
    if (!Number.isInteger(inc) || inc < 0 || inc > MAX_INCREMENT) {
      return setError(`The increment is 0 to ${MAX_INCREMENT} whole seconds.`);
    }
    const name = guestName.trim();
    if (kind === "guest" && !name) return setError("Give the other player a name.");
    if (kind === "friend" && !friend) return setError("Pick the friend you're playing.");
    setError(null);
    onStart({
      whiteTime: minutesToSeconds(white),
      blackTime: minutesToSeconds(black),
      increment: inc,
      recorderColor: color,
      recorderName: myName,
      opponent: kind === "friend" && friend ? { kind: "friend", userId: friend.id, username: friend.username } : { kind: "guest", name },
      clockOnly,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6 rounded-2xl bg-card p-4 sm:p-6" aria-describedby={error ? `${ids.minutes}-error` : undefined}>
      <fieldset className="space-y-3">
        <legend className="mb-2 flex items-center gap-2 text-sm font-medium">
          <Timer className="size-4 text-muted-foreground" aria-hidden="true" /> Time control
        </legend>
        <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Time control presets">
          {PRESETS.map((option, index) => (
            <button
              key={index}
              type="button"
              role="radio"
              aria-checked={preset === index}
              onClick={() => pick(index)}
              className={cn(
                "h-11 rounded-xl text-sm font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                preset === index ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent"
              )}
            >
              {option.minutes}+{option.increment}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor={ids.minutes}>Minutes</Label>
            <Input
              id={ids.minutes}
              type="number"
              inputMode="decimal"
              min={0.25}
              max={MAX_MINUTES}
              step="any"
              value={minutes}
              disabled={odds}
              onChange={(event) => {
                setPreset("custom");
                setMinutes(event.target.value);
                setWhiteMinutes(event.target.value);
                setBlackMinutes(event.target.value);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={ids.increment}>Increment (seconds)</Label>
            <Input
              id={ids.increment}
              type="number"
              inputMode="numeric"
              min={0}
              max={MAX_INCREMENT}
              value={increment}
              onChange={(event) => {
                setPreset("custom");
                setIncrement(event.target.value);
              }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor={ids.odds} className="font-normal">
            Time odds: a different clock for each side
          </Label>
          <Switch id={ids.odds} checked={odds} onCheckedChange={setOdds} />
        </div>
        {odds && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={ids.white}>White's minutes</Label>
              <Input id={ids.white} type="number" inputMode="decimal" min={0.25} max={MAX_MINUTES} step="any" value={whiteMinutes} onChange={(e) => setWhiteMinutes(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={ids.black}>Black's minutes</Label>
              <Input id={ids.black} type="number" inputMode="decimal" min={0.25} max={MAX_MINUTES} step="any" value={blackMinutes} onChange={(e) => setBlackMinutes(e.target.value)} />
            </div>
          </div>
        )}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium">You play</legend>
        <SegmentedRadioGroup
          label="Your colour"
          value={color}
          onValueChange={setColor}
          options={[
            { value: "white", label: "White" },
            { value: "black", label: "Black" },
          ]}
        />
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm font-medium">The other player</legend>
        <SegmentedRadioGroup
          label="Who you're playing"
          value={kind}
          onValueChange={(value) => {
            setKind(value);
            setError(null);
          }}
          options={[
            { value: "guest", label: "A guest" },
            { value: "friend", label: "A friend" },
          ]}
        />
        {kind === "guest" ? (
          <div className="space-y-1.5">
            <Label htmlFor={ids.guest}>Their name</Label>
            <Input
              id={ids.guest}
              value={guestName}
              maxLength={MAX_GUEST_NAME}
              autoComplete="off"
              placeholder="e.g. Grandpa"
              onChange={(event) => setGuestName(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">Saved with the game as a name only.</p>
          </div>
        ) : (
          <>
            <FriendPicker myId={myId} selected={friend} onSelect={setFriend} />
            <p className="text-xs text-muted-foreground">
              They get the game in their inbox to confirm. It shows in their history once they do.
            </p>
          </>
        )}
      </fieldset>

      <div className="flex items-start justify-between gap-3 rounded-xl bg-muted px-3 py-3">
        <div>
          <Label htmlFor={ids.clockOnly}>Clock only</Label>
          <p className="text-xs text-muted-foreground">No board: tap your half to end your turn. Not saved.</p>
        </div>
        <Switch id={ids.clockOnly} checked={clockOnly} onCheckedChange={setClockOnly} />
      </div>

      {error && (
        <p id={`${ids.minutes}-error`} role="alert" className="text-sm text-loss">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full">
        <Play aria-hidden="true" /> Set up the clock
      </Button>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Check className="size-3.5" aria-hidden="true" />
        Unrated: table games never change ratings or stats.
      </p>
    </form>
  );
};
