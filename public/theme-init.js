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
    // Page backgrounds per palette, as in src/constants/palettes.ts
    var backgrounds = {
      emerald: ["#f6f3ea", "#07130f"],
      club: ["#f6f2ea", "#13100d"],
      midnight: ["#f5f2ec", "#0b101b"],
      walnut: ["#f9f1e9", "#160f0b"],
      ink: ["#f7f6f3", "#272522"],
      fjord: ["#f0f4f8", "#0a1119"],
      plum: ["#faf0f0", "#160d13"],
      tide: ["#f7f2e8", "#061316"],
      olive: ["#f5f3e8", "#10110a"],
    };
    var palette = JSON.parse(localStorage.getItem("palette"));
    if (!Object.prototype.hasOwnProperty.call(backgrounds, palette)) palette = "emerald";
    document.documentElement.dataset.palette = palette;
    document
      .querySelector('meta[name="theme-color"]')
      .setAttribute("content", backgrounds[palette][dark ? 1 : 0]);
  } catch (e) {}
})();
