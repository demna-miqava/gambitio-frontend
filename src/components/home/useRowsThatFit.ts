import { useLayoutEffect, useRef, useState, type RefObject } from "react";

/** Home is two columns from Tailwind's lg; below that the page simply scrolls */
const TWO_COLUMNS = "(min-width: 1024px)";
/** Room kept under the content, matching the page's bottom padding (<main> md:pb-8) */
export const PAGE_BOTTOM_GAP = 32;

/** Page y (from the top of the document) of an element's top and bottom */
export const pageBox = (el: Element) => {
  const rect = el.getBoundingClientRect();
  return { top: rect.top + window.scrollY, bottom: rect.bottom + window.scrollY };
};

/** Page y past which the page would need to scroll */
export const screenBottom = () => window.innerHeight - PAGE_BOTTOM_GAP;

interface Options {
  /** The element holding the rows */
  rows: RefObject<HTMLElement | null>;
  /** Which elements inside it are rows, e.g. "tbody tr" */
  rowSelector: string;
  /** Page y the last row has to end above (given the rows' element) */
  bottom: (rowsEl: HTMLElement) => number;
  /** Elements whose size changes the room: re-measure when they resize */
  observe?: RefObject<HTMLElement | null>[];
  min: number;
  max: number;
}

/**
 * How many rows of a list fit above `bottom`, on two-column screens, between
 * `min` and `max`. Measures the first rendered row for the row height, so the
 * list must show at least one row to be measured; until then (and on
 * one-column screens) it is `undefined`.
 */
export const useRowsThatFit = ({ rows, rowSelector, bottom, observe = [], min, max }: Options) => {
  const [count, setCount] = useState<number | undefined>(undefined);
  // The latest `bottom` without re-subscribing every render
  const bottomRef = useRef(bottom);
  useLayoutEffect(() => {
    bottomRef.current = bottom;
  });

  useLayoutEffect(() => {
    const media = window.matchMedia(TWO_COLUMNS);

    const measure = () => {
      const rowsEl = rows.current;
      if (!media.matches || !rowsEl) {
        setCount(undefined);
        return;
      }
      const first = rowsEl.querySelector(rowSelector);
      // Nothing rendered yet (loading, or an empty list): nothing to fit
      if (!first) return;
      const height = first.getBoundingClientRect().height;
      if (!height) return;
      const fit = Math.floor((bottomRef.current(rowsEl) - pageBox(first).top) / height);
      setCount(Math.max(min, Math.min(max, fit)));
    };

    measure();
    const observer = new ResizeObserver(measure);
    if (rows.current) observer.observe(rows.current);
    for (const ref of observe) if (ref.current) observer.observe(ref.current);
    window.addEventListener("resize", measure);
    media.addEventListener("change", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      media.removeEventListener("change", measure);
    };
    // `observe` is a list of stable refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, rowSelector, min, max]);

  return count;
};
