import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { stepStore } from "@/lib/chords/step-store";
import { openChordsAt } from "@/lib/circle/jumps";
import { EMPTY_PROGRESSION, progressionStore } from "@/lib/circle/progression";
import { useProgression } from "@/lib/circle/use-progression";
import { COMMON_PROGRESSIONS } from "@/lib/theory/chords";

type Actions = ReturnType<typeof useProgression>[1];

afterEach(() => {
  progressionStore.set(EMPTY_PROGRESSION);
  stepStore.set(null);
  localStorage.clear();
});

describe("useProgression resets the Chord Compass step when the degrees change", () => {
  it.each<[string, (actions: Actions) => void]>([
    ["add", (actions) => actions.add(4)],
    ["remove", (actions) => actions.remove(0)],
    ["clear", (actions) => actions.clear()],
    ["pick", (actions) => actions.pick(COMMON_PROGRESSIONS[0].id)],
  ])("on %s", (_label, run) => {
    const { result } = renderHook(() => useProgression());
    act(() => {
      result.current[1].add(2);
      result.current[1].add(5);
    });
    stepStore.set(1);
    act(() => run(result.current[1]));
    expect(stepStore.get()).toBeNull();
  });

  it("keeps the step when nothing changed (clearing an empty tray)", () => {
    const { result } = renderHook(() => useProgression());
    stepStore.set(1);
    act(() => result.current[1].clear());
    expect(stepStore.get()).toBe(1);
  });

  it("leaves a step chosen by openChordsAt alone", () => {
    const { result } = renderHook(() => useProgression());
    act(() => result.current[1].pick(COMMON_PROGRESSIONS[0].id));
    openChordsAt("G", 1);
    expect(stepStore.get()).toBe(1);
  });
});
