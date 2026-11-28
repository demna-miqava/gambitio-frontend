// Applies the saved (or system) theme and palette before first paint to avoid
// a flash. Loaded synchronously (no async/defer/module) from <head> in
// index.html, right after the theme-color meta tag it updates. A separate
// file rather than an inline script so the Content-Security-Policy
// (public/_headers) needs no 'unsafe-inline' or hash for scripts.
// Not bundled by Vite: plain ES5 so it runs in any browser that loads the page.
(function () {
  try {
    var stored = JSON.parse(localStorage.getItem("theme"));
    var dark =
      stored === "dark" ||
      (stored !== "light" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (dark) document.documentElement.classList.add("dark");
    // Page backgrounds per theme, as in src/constants/palettes.ts (any other
    // stored palette, from before there were two themes, falls back to emerald)
    var backgrounds = {
      emerald: ["#f4f4f4", "#0e0e0e"],
      walnut: ["#f8f4ef", "#100e0b"],
    };
    var palette = JSON.parse(localStorage.getItem("palette"));
    if (!Object.prototype.hasOwnProperty.call(backgrounds, palette)) palette = "emerald";
    document.documentElement.dataset.palette = palette;
    document
      .querySelector('meta[name="theme-color"]')
      .setAttribute("content", backgrounds[palette][dark ? 1 : 0]);
  } catch (e) {}
})();
