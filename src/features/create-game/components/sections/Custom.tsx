import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGameSetup } from "../../GameSetupContext";
import {
  CUSTOM_INCREMENTS,
  CUSTOM_MINUTES,
  customPickerValues,
  getTimeControlFormat,
} from "../../constants/timeControls";
import { formatTimeControl } from "@/utils/timeControl";

interface CustomProps {
  /** Called once the time control is applied (default: back to the previous step) */
  onDone?: () => void;
}

/** Pick any minutes + increment combination. */
export const Custom = ({ onDone }: CustomProps) => {
  const { timeControl, updateTimeControl, goBack } = useGameSetup();
  const [{ minutes, increment }, setValues] = useState(() => customPickerValues(timeControl));
  const setMinutes = (next: number) => setValues((values) => ({ ...values, minutes: next }));
  const setIncrement = (next: number) => setValues((values) => ({ ...values, increment: next }));
  // Shown inline (onDone), the presets stay clickable: picking one moves the
  // picker to it, so "Use this time control" can't switch back to an old value
  const [shownFor, setShownFor] = useState(timeControl);
  if (shownFor.time !== timeControl.time || shownFor.increment !== timeControl.increment) {
    setShownFor(timeControl);
    setValues(customPickerValues(timeControl));
  }
  const format = getTimeControlFormat(minutes * 60);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="custom-minutes">Minutes per side</Label>
          <Select value={String(minutes)} onValueChange={(v) => setMinutes(Number(v))}>
            <SelectTrigger id="custom-minutes" className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CUSTOM_MINUTES.map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {m} min
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="custom-increment">Increment</Label>
          <Select value={String(increment)} onValueChange={(v) => setIncrement(Number(v))}>
            <SelectTrigger id="custom-increment" className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CUSTOM_INCREMENTS.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s} sec
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between border-y border-border py-3">
        <span className="text-sm text-muted-foreground">
          {onDone ? "Time control" : "This game will be"}
        </span>
        <span className="text-sm font-medium capitalize">
          {format} ·{" "}
          <span className="tabular-nums">{formatTimeControl(minutes * 60, increment)}</span>
        </span>
      </div>

      <Button
        size="xl"
        className="w-full"
        onClick={() => {
          updateTimeControl(format, minutes * 60, increment);
          (onDone ?? goBack)();
        }}
      >
        Use this time control
      </Button>
    </div>
  );
};
