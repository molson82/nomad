import { describe, expect, it } from "vitest";
import {
  angleDelta,
  angleToKeyIndex,
  classifyGesture,
  isSettled,
  nearestTarget,
  pointerAngle,
  springStep,
  targetForIndex,
} from "@/lib/circle/wheel-math";

describe("angleToKeyIndex", () => {
  it("reads the key at 12 o'clock from the wheel angle", () => {
    expect(angleToKeyIndex(0)).toBe(0); // C
    expect(angleToKeyIndex(-30)).toBe(1); // G
    expect(angleToKeyIndex(30)).toBe(11); // F
    expect(angleToKeyIndex(-14)).toBe(0);
    expect(angleToKeyIndex(-16)).toBe(1);
    expect(angleToKeyIndex(-390)).toBe(1); // wrapped once
    expect(angleToKeyIndex(720)).toBe(0);
  });
});

describe("targetForIndex", () => {
  it("goes the short way round", () => {
    expect(targetForIndex(-150, 7)).toBe(-210); // B → D♭ is two steps, never via F♯ the long way
    expect(targetForIndex(-330, 0)).toBe(-360); // F → C is one step
    expect(targetForIndex(0, 11)).toBe(30); // C → F is one step back
    expect(angleToKeyIndex(targetForIndex(-1000, 4))).toBe(4);
  });
});

describe("nearestTarget", () => {
  it("snaps to the nearest step with no velocity (a tap keeps the key)", () => {
    expect(nearestTarget(-30, 0)).toBe(-30);
    expect(nearestTarget(-44, 0)).toBe(-30);
    expect(nearestTarget(-46, 0)).toBe(-60);
  });

  it("carries a flick a little further", () => {
    expect(nearestTarget(-30, -400)).toBe(-90); // -30 + -60 → two extra steps
    expect(nearestTarget(-30, 60)).toBe(-30); // a +9° projection still rounds back
  });
});

describe("springStep", () => {
  function run(target: number, seconds: number) {
    let s = { x: 0, v: 0 };
    let max = 0;
    for (let t = 0; t < seconds; t += 1 / 60) {
      s = springStep(s, target, 1 / 60);
      max = Math.max(max, s.x);
    }
    return { s, max };
  }

  it("settles on the target within 400ms", () => {
    const { s } = run(30, 0.4);
    expect(Math.abs(s.x - 30)).toBeLessThan(0.5);
  });

  it("overshoots a little, never a whole step", () => {
    const { max } = run(30, 1);
    expect(max).toBeGreaterThan(30);
    expect(max).toBeLessThan(60);
  });

  it("knows when it has settled", () => {
    expect(isSettled({ x: 30.01, v: 0.1 }, 30)).toBe(true);
    expect(isSettled({ x: 30.01, v: 5 }, 30)).toBe(false);
    expect(isSettled({ x: 31, v: 0 }, 30)).toBe(false);
  });
});

describe("classifyGesture", () => {
  it("treats tiny movement as a tap", () => {
    expect(classifyGesture(0, 0)).toBe("tap");
    expect(classifyGesture(5, 5)).toBe("tap");
  });

  it("needs a clearly horizontal 48px move to swipe", () => {
    expect(classifyGesture(-60, 10)).toBe("swipe-left");
    expect(classifyGesture(60, -10)).toBe("swipe-right");
    expect(classifyGesture(48, 0)).toBe("none");
    expect(classifyGesture(60, 50)).toBe("none"); // too diagonal
    expect(classifyGesture(0, 120)).toBe("none"); // vertical scroll
  });
});

describe("pointer angles", () => {
  it("measures clockwise degrees from 3 o'clock", () => {
    expect(pointerAngle(0, 0, 10, 0)).toBe(0);
    expect(pointerAngle(0, 0, 0, 10)).toBe(90);
    expect(pointerAngle(0, 0, 0, -10)).toBe(-90);
  });

  it("takes the short signed difference across ±180°", () => {
    expect(angleDelta(170, -170)).toBe(20);
    expect(angleDelta(-170, 170)).toBe(-20);
    expect(angleDelta(10, 40)).toBe(30);
  });
});
