import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { isAxiosError } from "axios"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** "Mar 4, 2026": the app's one short date format (lists, cards, tables) */
export function formatShortDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * The server's message for a failed request (it sends `{ error }`), or the
 * fallback when there's none (network errors, timeouts).
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError<{ error?: unknown } | undefined>(error)) return fallback;
  const data = error.response?.data;
  return typeof data?.error === "string" && data.error ? data.error : fallback;
}
