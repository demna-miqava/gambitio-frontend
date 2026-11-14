import { getApiErrorMessage } from "@/lib/utils";

/** The server's error code for a failed request, if it sent one. */
export const apiErrorCode = (error: unknown): string | undefined => {
  const code = (error as { response?: { data?: { code?: unknown } } })?.response?.data?.code;
  return typeof code === "string" ? code : undefined;
};

/** What to tell the player when saving a line fails. */
export function saveLineErrorMessage(error: unknown): string {
  switch (apiErrorCode(error)) {
    case "LINE_EXISTS":
      return "This line is already in your repertoire for that colour.";
    case "INVALID_LINE":
      return getApiErrorMessage(error, "This line isn't legal from the starting position.");
    case "REPERTOIRE_FULL":
      return getApiErrorMessage(error, "Your repertoire is full. Delete a line to make room.");
    default:
      return getApiErrorMessage(error, "Couldn't save the line. Try again.");
  }
}
