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
  /**
   * Shown inline in a form: each change applies at once, so the presets,
   * odds and rating beside it follow the picker, and the button only closes
   * it. Without it the picker is its own step: "Use this time control"
   * applies the time and goes back.
   */
  onDone?: () => void;
}

/** Pick any minutes + increment combination. */
export const Custom = ({ onDone }: CustomProps) => {
  const { timeControl, updateTimeControl, goBack } = useGameSetup();
  const [{ minutes, increment }, setValues] = useState(() => customPickerValues(timeControl));
  const apply = (next: { minutes: number; increment: number }) =>
    updateTimeControl(getTimeControlFormat(next.minutes * 60), next.minutes * 60, next.increment);
  const change = (next: { minutes: number; increment: number }) => {
    setValues(next);
    if (onDone) apply(next);
  };
  const setMinutes = (next: number) => change({ minutes: next, increment });
  const setIncrement = (next: number) => change({ minutes, increment: next });
  // Picking a preset (still clickable beside the inline picker, or chosen
  // before opening it) moves the picker to that time
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
          if (onDone) return onDone();
          apply({ minutes, increment });
          goBack();
        }}
      >
        {onDone ? "Done" : "Use this time control"}
      </Button>
    </div>
  );
};
