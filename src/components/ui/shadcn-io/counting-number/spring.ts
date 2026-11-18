/** Spring settings, as in motion's useSpring (mass 1 unless given) */
export interface SpringOptions {
  stiffness?: number;
  damping?: number;
  mass?: number;
}

export interface SpringState {
  value: number;
  velocity: number;
}

/** Integration step, small enough to stay stable for stiff springs */
const STEP_S = 1 / 240;

/**
 * Moves a damped spring towards `target` by `elapsedS` seconds. Returns the
 * new state, and `done` once it has come to rest (then exactly at the target).
 */
export function stepSpring(
  { value, velocity }: SpringState,
  target: number,
  elapsedS: number,
  { stiffness = 100, damping = 10, mass = 1 }: SpringOptions,
  restDelta = 0.5
): SpringState & { done: boolean } {
  // A tab in the background can come back after seconds: cap the catch-up
  let remaining = Math.min(elapsedS, 1);
  while (remaining > 0) {
    const dt = Math.min(STEP_S, remaining);
    const force = -stiffness * (value - target) - damping * velocity;
    velocity += (force / mass) * dt;
    value += velocity * dt;
    remaining -= dt;
  }
  const done = Math.abs(value - target) < restDelta && Math.abs(velocity) < restDelta * 4;
  return done ? { value: target, velocity: 0, done } : { value, velocity, done };
}

export interface CountFormat {
  decimals: number;
  decimalSeparator: string;
  /** Pad the whole part with zeros to this many digits (0 = no padding) */
  padTo: number;
}

/** The number as the counter shows it */
export function formatCount(value: number, { decimals, decimalSeparator, padTo }: CountFormat) {
  let formatted = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
  if (decimals > 0) formatted = formatted.replace(".", decimalSeparator);
  if (padTo > 0) {
    const [intPart, fracPart] = formatted.split(decimalSeparator);
    const paddedInt = intPart?.padStart(padTo, "0") ?? "";
    formatted = fracPart ? `${paddedInt}${decimalSeparator}${fracPart}` : paddedInt;
  }
  return formatted;
}
