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
