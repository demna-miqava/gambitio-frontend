const isScrollable = (el: HTMLElement, axis: "x" | "y") => {
  const style = getComputedStyle(el);
  const overflow = axis === "y" ? style.overflowY : style.overflowX;
  const canScroll = overflow === "auto" || overflow === "scroll";
  return axis === "y"
    ? canScroll && el.scrollHeight > el.clientHeight
    : canScroll && el.scrollWidth > el.clientWidth;
};

const findScrollParent = (el: HTMLElement, axis: "x" | "y") => {
  let node = el.parentElement;
  while (node && node !== document.body) {
    if (isScrollable(node, axis)) return node;
    node = node.parentElement;
  }
  return null;
};

/**
 * Brings `el` into view inside its own scrolling list only. Unlike
 * scrollIntoView, it never scrolls the page, so stepping through moves
 * doesn't make the layout jump.
 */
export const scrollIntoContainer = (el: HTMLElement | null | undefined) => {
  if (!el) return;
  const rect = el.getBoundingClientRect();

  const y = findScrollParent(el, "y");
  if (y) {
    const box = y.getBoundingClientRect();
    if (rect.top < box.top) y.scrollTop -= box.top - rect.top + 8;
    else if (rect.bottom > box.bottom) y.scrollTop += rect.bottom - box.bottom + 8;
  }

  const x = findScrollParent(el, "x");
  if (x) {
    const box = x.getBoundingClientRect();
    if (rect.left < box.left) x.scrollLeft -= box.left - rect.left + 8;
    else if (rect.right > box.right) x.scrollLeft += rect.right - box.right + 8;
  }
};
