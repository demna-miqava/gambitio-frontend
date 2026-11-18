/**
 * A table clock's time: "1:05:00", "4:59", and tenths under ten seconds
 * ("9.4"). `spoken` gives words for screen readers ("4 minutes 59 seconds").
 */
export const formatTableClock = (ms: number, spoken = false): string => {
  const clamped = Math.max(0, ms);
  if (spoken) {
    const total = Math.ceil(clamped / 1000);
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return minutes > 0 ? `${minutes} minutes ${seconds} seconds` : `${seconds} seconds`;
  }
  if (clamped < 10_000) return (Math.floor(clamped / 100) / 10).toFixed(1);
  const total = Math.ceil(clamped / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}` : `${minutes}:${seconds}`;
};
