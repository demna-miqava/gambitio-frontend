import { useEffect } from "react";

const APP_NAME = "Gambitio";

/**
 * Sets the tab title to "<title> · Gambitio" while the component is mounted
 * and puts the previous title back afterwards. Pass undefined for just
 * "Gambitio".
 */
export function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
