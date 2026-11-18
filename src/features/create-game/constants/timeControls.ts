import { formatTimeControl } from "@/utils/timeControl";
import type { TimeControlType } from "@/types";

/** Same thresholds as the server: < 3 min bullet, < 10 min blitz, else rapid. */
export const getTimeControlFormat = (timeInSeconds: number): TimeControlType => {
  if (timeInSeconds < 180) return "bullet";
  if (timeInSeconds < 600) return "blitz";
  return "rapid";
};

/**
 * Time control configurations for game setup.
 * Labels are generated with formatTimeControl ("3+2", "5+0").
 */
export const PLAY_TIME_CONTROLS = [
  {
    label: "bullet" as TimeControlType,
    options: [
      { time: 60, increment: 0 },
      { time: 60, increment: 1 },
      { time: 120, increment: 1 },
    ],
  },
  {
    label: "blitz" as TimeControlType,
    options: [
      { time: 180, increment: 0 },
      { time: 180, increment: 2 },
      { time: 300, increment: 0 },
    ],
  },
  {
    label: "rapid" as TimeControlType,
    options: [
      { time: 600, increment: 0 },
      { time: 900, increment: 10 },
      { time: 1800, increment: 0 },
    ],
  },
].map((control) => ({
  ...control,
  options: control.options.map((option) => ({
    ...option,
    label: formatTimeControl(option.time, option.increment),
  })),
}));

/** Choices offered by the custom time control picker */
export const CUSTOM_MINUTES = [1, 2, 3, 4, 5, 7, 10, 15, 20, 25, 30, 45, 60, 90];
export const CUSTOM_INCREMENTS = [0, 1, 2, 3, 5, 10, 15, 20, 30, 60];

/**
 * What the custom picker shows for a time control: its minutes and
 * increment when the picker offers them, else 10 minutes and no increment.
 */
export const customPickerValues = ({ time, increment }: { time: number; increment: number }) => ({
  minutes: CUSTOM_MINUTES.includes(time / 60) ? time / 60 : 10,
  increment: CUSTOM_INCREMENTS.includes(increment) ? increment : 0,
});

/**
 * Clocks (seconds) the player with less time can be given in a game with
 * time odds. Only the ones shorter than the other player's clock are offered.
 */
export const ODDS_CLOCKS = [
  15, 30, 45, 60, 90, 120, 150, 180, 240, 300, 360, 420, 480, 540, 600, 720, 900, 1200,
  1500, 1800, 2400, 2700, 3600, 4500, 5400,
];

/** The shorter clocks on offer against `time`, longest first. */
export const shorterClocks = (time: number): number[] =>
  ODDS_CLOCKS.filter((clock) => clock < time).reverse();

/** The shorter clock picked by default: about half of `time`. */
export const defaultShorterClock = (time: number): number | null => {
  const options = shorterClocks(time);
  return options.find((clock) => clock <= time / 2) ?? options[options.length - 1] ?? null;
};
