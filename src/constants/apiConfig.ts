// Locally the backend runs on its own port (set in .env). On Cloudflare the
// same Worker serves the site and /api, so the URLs are left empty in
// .env.production and default to this site's own address.
const sameOriginWs = () => {
  const url = new URL("/api/ws", window.location.href);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
};

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || sameOriginWs();
export const MOVE_SOUND_URL = import.meta.env.VITE_MOVE_SOUND_URL;
export const CAPTURE_SOUND_URL = import.meta.env.VITE_CAPTURE_SOUND_URL;
export const GENERIC_SOUND_URL = import.meta.env.VITE_GENERIC_SOUND_URL;
