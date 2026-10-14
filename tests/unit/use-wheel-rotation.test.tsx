import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useWheelRotation } from "@/lib/circle/use-wheel-rotation";

function mockReducedMotion(matches: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) as unknown as typeof window.matchMedia;
}

afterEach(() => {
  delete (window as { matchMedia?: unknown }).matchMedia;
});

describe("useWheelRotation", () => {
  describe("with reduced motion", () => {
    beforeEach(() => mockReducedMotion(true));

    it("starts at the committed key", () => {
      const { result } = renderHook(() => useWheelRotation({ committedIndex: 1, onCommit: vi.fn() }));
      expect(result.current.theta).toBe(-30);
      expect(result.current.displayIndex).toBe(1);
    });

    it("steps clockwise and commits at once", () => {
      const onCommit = vi.fn();
      const { result } = renderHook(() => useWheelRotation({ committedIndex: 1, onCommit }));
      act(() => result.current.step(1));
      expect(result.current.theta).toBe(-60);
      expect(onCommit).toHaveBeenLastCalledWith(2);
    });

    it("steps back across C the short way", () => {
      const onCommit = vi.fn();
      const { result } = renderHook(() => useWheelRotation({ committedIndex: 0, onCommit }));
      act(() => result.current.step(-1));
      expect(result.current.theta).toBe(30);
      expect(onCommit).toHaveBeenLastCalledWith(11);
    });

    it("steps accumulate from the pending target", () => {
      const onCommit = vi.fn();
      const { result } = renderHook(() => useWheelRotation({ committedIndex: 0, onCommit }));
      act(() => {
        result.current.step(1);
        result.current.step(1);
        result.current.step(1);
      });
      expect(result.current.displayIndex).toBe(3);
      expect(onCommit).toHaveBeenLastCalledWith(3);
    });

    it("turns with the arrow keys", () => {
      const onCommit = vi.fn();
      const { result } = renderHook(() => useWheelRotation({ committedIndex: 0, onCommit }));
      const key = (k: string) =>
        ({ key: k, preventDefault: vi.fn() }) as unknown as React.KeyboardEvent<SVGSVGElement>;
      act(() => result.current.wheelHandlers.onKeyDown(key("ArrowRight")));
      expect(onCommit).toHaveBeenLastCalledWith(1);
      act(() => result.current.wheelHandlers.onKeyDown(key("ArrowLeft")));
      expect(onCommit).toHaveBeenLastCalledWith(0);
    });
  });

  describe("dragging", () => {
    beforeEach(() => mockReducedMotion(true));

    // A 200×200 wheel at the origin: center (100, 100), radius 100.
    const pointer = (clientX: number, clientY: number, timeStamp: number) =>
      ({
        clientX,
        clientY,
        timeStamp,
        pointerId: 1,
        stopPropagation: vi.fn(),
        currentTarget: {
          getBoundingClientRect: () => ({ left: 0, top: 0, width: 200, height: 200 }),
          setPointerCapture: vi.fn(),
        },
      }) as unknown as React.PointerEvent<SVGSVGElement>;

    it("ignores a thumb wiggling on the center disc", () => {
      const onCommit = vi.fn();
      const { result } = renderHook(() => useWheelRotation({ committedIndex: 0, onCommit }));
      const h = () => result.current.wheelHandlers;
      act(() => h().onPointerDown(pointer(100, 95, 0)));
      act(() => h().onPointerMove(pointer(106, 100, 16)));
      act(() => h().onPointerMove(pointer(100, 106, 32)));
      act(() => h().onPointerMove(pointer(94, 100, 48)));
      expect(result.current.theta).toBeCloseTo(0); // -0 at rest is fine
      act(() => h().onPointerUp(pointer(94, 100, 200)));
      expect(onCommit).toHaveBeenLastCalledWith(0);
    });

    it("still turns when the drag is out on the rings", () => {
      const onCommit = vi.fn();
      const { result } = renderHook(() => useWheelRotation({ committedIndex: 0, onCommit }));
      const h = () => result.current.wheelHandlers;
      act(() => h().onPointerDown(pointer(100, 10, 0))); // 12 o'clock
      act(() => h().onPointerMove(pointer(190, 100, 16))); // 3 o'clock: +90°
      expect(result.current.theta).toBeCloseTo(90);
      act(() => h().onPointerUp(pointer(190, 100, 200)));
      expect(onCommit).toHaveBeenLastCalledWith(9); // E♭ comes to the top
    });
  });

  describe("with motion", () => {
    beforeEach(() => mockReducedMotion(false));

    it("jumps without spinning to a key that arrives before the first frame (hydration)", () => {
      const { result, rerender } = renderHook(
        ({ index }) => useWheelRotation({ committedIndex: index, onCommit: vi.fn() }),
        { initialProps: { index: 0 } },
      );
      rerender({ index: 7 });
      expect(result.current.displayIndex).toBe(7);
      expect(result.current.theta).toBe(150); // D♭ the short way from C: -210 + 360
    });

    it("commits a turn still settling when the page goes away (e.g. a tab tap)", () => {
      const onCommit = vi.fn();
      const { result, unmount } = renderHook(() => useWheelRotation({ committedIndex: 0, onCommit }));
      act(() => result.current.step(1));
      unmount();
      expect(onCommit).toHaveBeenCalledWith(1);
    });

    it("does not commit until the spring settles", () => {
      const onCommit = vi.fn();
      const { result } = renderHook(() => useWheelRotation({ committedIndex: 0, onCommit }));
      act(() => result.current.step(1));
      expect(onCommit).not.toHaveBeenCalled();
    });
  });
});
