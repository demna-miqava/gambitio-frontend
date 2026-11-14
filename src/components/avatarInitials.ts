/**
 * Up to two letters for an avatar without a photo: the first letters of the
 * first two words ("Magnus Carlsen", "magnus_carlsen" → "MC"), otherwise the
 * first two characters ("hikaru" → "HI"). "?" when there's no name.
 */
export const getInitials = (name: string | null | undefined): string => {
  const words = (name ?? "").trim().split(/[\s._-]+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) {
    return Array.from(words[0]).slice(0, 2).join("").toUpperCase();
  }
  return (Array.from(words[0])[0] + Array.from(words[1])[0]).toUpperCase();
};

/**
 * True for the sign-in provider's generated placeholder picture (Clerk's
 * gradient silhouette). Its URL ends in base64 JSON with `"type":"default"`.
 * Those are shown as initials, like any account without a picture.
 */
export const isPlaceholderAvatar = (src: string): boolean => {
  if (!src.includes("img.clerk.com/")) return false;
  try {
    const encoded = src.split("?")[0].split("/").pop() ?? "";
    return JSON.parse(atob(encoded)).type === "default";
  } catch {
    return false;
  }
};
