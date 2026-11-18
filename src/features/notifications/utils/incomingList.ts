/**
 * The "Challenges for you" list (Home, Play) carries this attribute. While
 * the list is on screen, an incoming challenge shows up there and needs no
 * toast on top of it.
 */
export const INCOMING_LIST_ATTR = "data-incoming-challenges";

/** Some of the element is inside the viewport (a hidden tab measures 0×0). */
export const isInViewport = (el: Element): boolean => {
  const rect = el.getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.bottom > 0 &&
    rect.top < window.innerHeight
  );
};

/** A "Challenges for you" list is on screen. */
export const isIncomingListInView = (): boolean =>
  [...document.querySelectorAll(`[${INCOMING_LIST_ATTR}]`)].some(isInViewport);
