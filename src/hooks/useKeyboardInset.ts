import { useEffect, useState } from "react";

/**
 * How many pixels of the bottom of the window the on-screen keyboard covers,
 * so something fixed to the bottom (a sheet with a text box) can stay above
 * it. 0 where the browser already resizes the page for the keyboard, and
 * while `active` is false.
 */
export const useKeyboardInset = (active: boolean): number => {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!active || !viewport) {
      setInset(0);
      return;
    }
    const update = () =>
      setInset(Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop)));
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, [active]);

  return inset;
};
