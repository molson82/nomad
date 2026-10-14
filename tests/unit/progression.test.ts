import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  EMPTY_PROGRESSION,
  MAX_CHORDS,
  PROGRESSION_KEY,
  parseProgression,
  stepBadges,
  withChord,
  withPreset,
  withoutStep,
} from "@/lib/circle/progression";

const pop = { degrees: [1, 5, 6, 4], presetId: "pop" };

describe("progression transitions", () => {
  it("adds a chord and drops the preset highlight", () => {
    expect(withChord(pop, 2)).toEqual({ degrees: [1, 5, 6, 4, 2], presetId: null });
  });

  it("stops at 8 chords", () => {
    const full = { degrees: [1, 2, 3, 4, 5, 6, 7, 1], presetId: null };
    expect(full.degrees).toHaveLength(MAX_CHORDS);
    expect(withChord(full, 2)).toBe(full);
  });

  it("removes one step and drops the preset highlight", () => {
    expect(withoutStep(pop, 1)).toEqual({ degrees: [1, 6, 4], presetId: null });
  });

  it("replaces the tray with a preset", () => {
    expect(withPreset("ii-v-i")).toEqual({ degrees: [2, 5, 1], presetId: "ii-v-i" });
    expect(withPreset("nope")).toEqual(EMPTY_PROGRESSION);
  });

  it("numbers chords by step, merging repeats into one badge", () => {
    const badges = stepBadges([1, 4, 1, 5]);
    expect(badges.get(1)).toEqual([1, 3]);
    expect(badges.get(4)).toEqual([2]);
    expect(badges.get(5)).toEqual([4]);
    expect(badges.get(6)).toBeUndefined();
  });
});

describe("parseProgression", () => {
  it("round-trips a valid progression", () => {
    expect(parseProgression(JSON.stringify(pop))).toEqual(pop);
    expect(parseProgression(JSON.stringify({ degrees: [7, 7], presetId: null }))).toEqual({
      degrees: [7, 7],
      presetId: null,
    });
  });

  it.each([
    ["missing", null],
    ["not json", "{oops"],
    ["degree 0", JSON.stringify({ degrees: [0], presetId: null })],
    ["degree 8", JSON.stringify({ degrees: [8], presetId: null })],
    ["string degree", JSON.stringify({ degrees: ["1"], presetId: null })],
    ["fractional degree", JSON.stringify({ degrees: [1.5], presetId: null })],
    ["9 chords", JSON.stringify({ degrees: [1, 1, 1, 1, 1, 1, 1, 1, 1], presetId: null })],
    ["unknown preset", JSON.stringify({ degrees: [1, 5, 6, 4], presetId: "retired" })],
    ["missing presetId", JSON.stringify({ degrees: [1] })],
    ["an array", "[]"],
  ])("falls back to an empty tray for %s", (_label, raw) => {
    expect(parseProgression(raw)).toEqual(EMPTY_PROGRESSION);
  });
});

describe("progressionStore", () => {
  async function load() {
    vi.resetModules();
    return import("@/lib/circle/progression");
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("persists and notifies", async () => {
    const { progressionStore } = await load();
    const listener = vi.fn();
    progressionStore.subscribe(listener);
    progressionStore.set(pop);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem(PROGRESSION_KEY)!)).toEqual(pop);
  });

  it("works in memory when storage is blocked", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    const { progressionStore } = await load();
    expect(progressionStore.get()).toEqual(EMPTY_PROGRESSION);
    progressionStore.set(pop);
    expect(progressionStore.get()).toEqual(pop);
  });
});
