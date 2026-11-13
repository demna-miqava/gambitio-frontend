import { useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { getPalette } from "@/constants/palettes";

/**
 * Keeps the browser chrome (address bar, installed-app title bar) the colour
 * of the in-app theme rather than the operating system's.
 */
export const ThemeColorMeta = () => {
  const { theme, palette } = useTheme();

  useEffect(() => {
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = getPalette(palette)[theme].background;
  }, [theme, palette]);

  return null;
};
