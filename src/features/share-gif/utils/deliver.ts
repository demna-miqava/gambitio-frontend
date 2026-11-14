/** Whether this browser can hand the file to the system share sheet. */
export function canShareFile(file: File, nav: Navigator | undefined = globalThis.navigator): boolean {
  try {
    return typeof nav?.share === "function" && typeof nav.canShare === "function" && nav.canShare({ files: [file] });
  } catch {
    return false;
  }
}

/** Saves a blob through a temporary link. */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the download a moment to start before the URL goes away
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * - "shared"/"cancelled": the share sheet opened (and the user finished or
 *   closed it)
 * - "needs-gesture": the browser refused because the click that started the
 *   generation is too long ago; share again from a fresh click
 * - "failed": sharing isn't possible here, download instead
 */
export type ShareOutcome = "shared" | "cancelled" | "needs-gesture" | "failed";

export async function shareFile(file: File, title: string, nav: Navigator = navigator): Promise<ShareOutcome> {
  try {
    await nav.share({ files: [file], title });
    return "shared";
  } catch (error) {
    const name = error instanceof Error || error instanceof DOMException ? error.name : "";
    if (name === "AbortError") return "cancelled";
    if (name === "NotAllowedError") return "needs-gesture";
    return "failed";
  }
}
