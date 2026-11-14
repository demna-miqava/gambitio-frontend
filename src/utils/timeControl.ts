const FRACTIONS: Record<number, string> = { 15: "¼", 30: "½", 45: "¾" };

/** Starting time in minutes: whole numbers as is, ¼/½/¾, else a decimal. */
const formatMinutes = (timeInSeconds: number): string => {
  if (timeInSeconds % 60 === 0) return String(timeInSeconds / 60);
  if (timeInSeconds < 60 && FRACTIONS[timeInSeconds]) return FRACTIONS[timeInSeconds];
  return String(Math.round((timeInSeconds / 60) * 100) / 100);
};

/**
 * The standard "minutes+increment" label: 300, 0 → "5+0"; 180, 2 → "3+2";
 * 30, 0 → "½+0". Used for every time control label in the app.
 *
 * @param time - Starting time in seconds
 * @param increment - Increment in seconds (missing or null means 0)
 */
export const formatTimeControl = (
  time: number,
  increment?: number | null
): string => `${formatMinutes(time)}+${increment ?? 0}`;
