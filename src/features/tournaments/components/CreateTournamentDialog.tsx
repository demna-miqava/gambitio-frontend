import { useId, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getTournamentRoute } from "@/constants/routes";
import { getApiErrorMessage } from "@/lib/utils";
import { formatTimeControl } from "@/utils/timeControl";
import { useCreateTournament } from "../hooks/useTournaments";
import {
  CLOCK_PRESETS,
  LENGTH_PRESETS,
  NAME_MAX,
  NAME_MIN,
  START_PRESETS,
  formatLength,
} from "../utils/tournamentFormat";

const clockKey = (time: number, increment: number) => `${time}+${increment}`;
const DEFAULT_CLOCK = clockKey(180, 0);
const DEFAULT_LENGTH = 45;
const DEFAULT_START = 10;

interface CreateTournamentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Sets up an arena tournament and opens its lobby. */
export const CreateTournamentDialog = ({ open, onOpenChange }: CreateTournamentDialogProps) => {
  const navigate = useNavigate();
  const nameId = useId();
  const clockId = useId();
  const lengthId = useId();
  const startId = useId();
  const ratedId = useId();
  const errorId = useId();
  const [name, setName] = useState("");
  const [clock, setClock] = useState(DEFAULT_CLOCK);
  const [length, setLength] = useState(DEFAULT_LENGTH);
  const [startsIn, setStartsIn] = useState(DEFAULT_START);
  const [rated, setRated] = useState(true);
  const [inputError, setInputError] = useState<string | null>(null);
  const create = useCreateTournament();

  // Fresh fields each time it opens (the parent opens it)
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName("");
      setClock(DEFAULT_CLOCK);
      setLength(DEFAULT_LENGTH);
      setStartsIn(DEFAULT_START);
      setRated(true);
      setInputError(null);
    }
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) create.reset();
    onOpenChange(next);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.replace(/\s+/g, " ").trim();
    if (trimmed.length < NAME_MIN) {
      setInputError(`Give the tournament a name of at least ${NAME_MIN} characters.`);
      return;
    }
    setInputError(null);
    const [time, increment] = clock.split("+").map(Number) as [number, number];
    create.mutate(
      {
        name: trimmed,
        time,
        increment,
        minutes: length,
        // Counted from the moment of creating, not of opening the form
        startsAt: new Date(Date.now() + startsIn * 60_000).toISOString(),
        rated,
      },
      {
        onSuccess: (state) => {
          onOpenChange(false);
          navigate(getTournamentRoute(state.tournament.id));
        },
      }
    );
  };

  const error =
    inputError ??
    (create.isError ? getApiErrorMessage(create.error, "Couldn't create the tournament. Try again.") : null);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
          <DialogHeader>
            <DialogTitle>New tournament</DialogTitle>
            <DialogDescription>
              An arena: everyone who joins is paired again and again until the time is up. Most
              points wins.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor={nameId}>Name</Label>
            <Input
              id={nameId}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={NAME_MAX}
              placeholder="e.g. Friday night blitz"
              autoComplete="off"
              autoFocus
              aria-invalid={inputError !== null || undefined}
              aria-describedby={error ? errorId : undefined}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={clockId}>Time control</Label>
              <Select value={clock} onValueChange={setClock}>
                <SelectTrigger id={clockId} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLOCK_PRESETS.map(([time, increment]) => (
                    <SelectItem key={clockKey(time, increment)} value={clockKey(time, increment)}>
                      {formatTimeControl(time, increment)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={lengthId}>Runs for</Label>
              <Select value={String(length)} onValueChange={(value) => setLength(Number(value))}>
                <SelectTrigger id={lengthId} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LENGTH_PRESETS.map((minutes) => (
                    <SelectItem key={minutes} value={String(minutes)}>
                      {formatLength(minutes)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={startId}>Starts in</Label>
            <Select value={String(startsIn)} onValueChange={(value) => setStartsIn(Number(value))}>
              <SelectTrigger id={startId} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {START_PRESETS.map((minutes) => (
                  <SelectItem key={minutes} value={String(minutes)}>
                    {formatLength(minutes)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              It starts once two players are in. With nobody else five minutes after that, it is
              cancelled.
            </p>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor={ratedId}>Rated</Label>
              <p className="text-xs text-muted-foreground">Games change the players' ratings.</p>
            </div>
            <Switch id={ratedId} checked={rated} onCheckedChange={setRated} />
          </div>

          {error && (
            <p id={errorId} role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
              Create tournament
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
