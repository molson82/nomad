import { mod } from "@/lib/theory/spelling";

// The wheel is one angle θ in degrees. Turning it by -30° brings the next key
// clockwise (G after C) to 12 o'clock.
export const STEP = 30;
const FLICK_SECONDS = 0.15;
// ζ ≈ 0.7: settles in ~300ms with a ~5% overshoot, like a detent.
const STIFFNESS = 320;
const DAMPING = 25;
const TAP_SLOP = 8;
const SWIPE_MIN = 48;
const SWIPE_RATIO = 1.5;

export function angleToKeyIndex(theta: number): number {
  return mod(Math.round(-theta / STEP), 12);
}

// The angle showing `index` that is closest to where the wheel is now.
export function targetForIndex(theta: number, index: number): number {
  const base = -STEP * index;
  return base + 360 * Math.round((theta - base) / 360);
}

export function nearestTarget(theta: number, velocityDegPerSec: number): number {
  return STEP * Math.round((theta + velocityDegPerSec * FLICK_SECONDS) / STEP);
}

export function springStep(
  state: { x: number; v: number },
  target: number,
  dtSec: number,
): { x: number; v: number } {
  const accel = -STIFFNESS * (state.x - target) - DAMPING * state.v;
  const v = state.v + accel * dtSec;
  return { x: state.x + v * dtSec, v };
}

export function isSettled(state: { x: number; v: number }, target: number): boolean {
  return Math.abs(state.x - target) < 0.05 && Math.abs(state.v) < 0.5;
}

export function classifyGesture(dx: number, dy: number): "tap" | "swipe-left" | "swipe-right" | "none" {
  if (Math.hypot(dx, dy) < TAP_SLOP) return "tap";
  if (Math.abs(dx) > SWIPE_MIN && Math.abs(dx) > SWIPE_RATIO * Math.abs(dy)) {
    return dx < 0 ? "swipe-left" : "swipe-right";
  }
  return "none";
}

export function pointerAngle(cx: number, cy: number, x: number, y: number): number {
  return (Math.atan2(y - cy, x - cx) * 180) / Math.PI;
}

export function angleDelta(from: number, to: number): number {
  return mod(to - from + 180, 360) - 180;
}
