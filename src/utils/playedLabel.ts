const DAY_MS = 24 * 60 * 60 * 1000;
const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/**
 * When a game was played, as said to a person: "Just now", "25 minutes
 * ago", "2 hours ago" for today, "Yesterday", "3 days ago" within a week,
 * then the date ("12 Nov", with the year once it isn't this one).
 */
export function playedLabel(playedAt: string | Date, now: Date = new Date()): string {
  const at = new Date(playedAt);
  const days = Math.round((startOfDay(now) - startOfDay(at)) / DAY_MS);
  if (days <= 0) {
    const minutes = Math.floor((now.getTime() - at.getTime()) / 60_000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return at.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(at.getFullYear() !== now.getFullYear() && { year: "numeric" }),
  });
}
