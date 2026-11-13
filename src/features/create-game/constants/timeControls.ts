import { TIME_CONTROL_ICONS } from "@/constants/timeControlIcons";
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
    icon: TIME_CONTROL_ICONS.bullet,
    options: [
      { time: 60, increment: 0 },
      { time: 60, increment: 1 },
      { time: 120, increment: 1 },
    ],
  },
  {
    label: "blitz" as TimeControlType,
    icon: TIME_CONTROL_ICONS.blitz,
    options: [
      { time: 180, increment: 0 },
      { time: 180, increment: 2 },
      { time: 300, increment: 0 },
    ],
  },
  {
    label: "rapid" as TimeControlType,
    icon: TIME_CONTROL_ICONS.rapid,
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
