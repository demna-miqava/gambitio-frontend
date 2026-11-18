'use client';

import * as React from 'react';
import {
  formatCount,
  stepSpring,
  type CountFormat,
  type SpringOptions,
  type SpringState,
} from './spring';

// A spring driven by requestAnimationFrame, in place of motion's useSpring:
// the counter was the only thing on the game pages that loaded motion.

type CountingNumberProps = React.ComponentProps<'span'> & {
  number: number;
  fromNumber?: number;
  padStart?: boolean;
  inView?: boolean;
  /** IntersectionObserver rootMargin, e.g. "0px" */
  inViewMargin?: string;
  inViewOnce?: boolean;
  decimalSeparator?: string;
  transition?: SpringOptions;
  decimalPlaces?: number;
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

/** Whether the element has been (or, unless `once`, is) on screen */
function useInView(
  ref: React.RefObject<HTMLElement | null>,
  enabled: boolean,
  margin: string,
  once: boolean
) {
  const [inView, setInView] = React.useState(!enabled);
  React.useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin: margin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, enabled, margin, once]);
  return !enabled || inView;
}

function CountingNumber({
  ref,
  number,
  fromNumber = 0,
  padStart = false,
  inView = false,
  inViewMargin = '0px',
  inViewOnce = true,
  decimalSeparator = '.',
  transition = { stiffness: 90, damping: 50 },
  decimalPlaces = 0,
  className,
  ...props
}: CountingNumberProps) {
  const localRef = React.useRef<HTMLSpanElement>(null);
  React.useImperativeHandle(ref, () => localRef.current as HTMLSpanElement);

  const decimals = decimalPlaces;
  const padTo = padStart ? Math.floor(Math.abs(number)).toString().length : 0;
  const { stiffness, damping, mass } = transition;

  // Where the counter is, kept across target changes so it carries on from there
  const springRef = React.useRef<SpringState>({ value: fromNumber, velocity: 0 });
  const isInView = useInView(localRef, inView, inViewMargin, inViewOnce);

  // The text React renders once; the animation writes the element directly
  const [initialText] = React.useState(() =>
    formatCount(fromNumber, { decimals, decimalSeparator, padTo })
  );

  React.useEffect(() => {
    if (!isInView) return;
    const format: CountFormat = { decimals, decimalSeparator, padTo };
    const show = (value: number) => {
      if (localRef.current) localRef.current.textContent = formatCount(value, format);
    };
    if (prefersReducedMotion() || typeof requestAnimationFrame === 'undefined') {
      springRef.current = { value: number, velocity: 0 };
      show(number);
      return;
    }
    // At rest within half of the last digit shown
    const restDelta = 0.5 / 10 ** decimals;
    let frame = 0;
    let last: number | null = null;
    const tick = (now: number) => {
      const elapsed = last === null ? 0 : (now - last) / 1000;
      last = now;
      const next = stepSpring(springRef.current, number, elapsed, { stiffness, damping, mass }, restDelta);
      springRef.current = next;
      show(next.value);
      if (!next.done) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isInView, number, decimals, decimalSeparator, padTo, stiffness, damping, mass]);

  return (
    <span
      ref={localRef}
      data-slot="counting-number"
      className={className}
      {...props}
    >
      {initialText}
    </span>
  );
}

export { CountingNumber, type CountingNumberProps };
