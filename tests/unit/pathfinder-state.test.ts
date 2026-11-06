import { describe, expect, it } from "vitest";
import {
  EMPTY_FRETS,
  EMPTY_STATE,
  canBuildPath,
  forgetLink,
  highlightFrets,
  lockIn,
  lockedVoicing,
  parsePathfinder,
  resetPath,
  tapFret,
  type Lock,
} from "@/lib/pathfinder/state";
import type { KeyState } from "@/lib/key-state/store";
import { voicingOf } from "@/lib/theory/chord-names";
import type { Note } from "@/lib/theory/notes";

const AM7 = [5, 7, 5, 5, 5, 5];
const std = [0, 0, 0, 0, 0, 0];
const lock = (over: Partial<Lock> = {}): Lock => ({ frets: AM7, key: "C", tuning: std, createdLink: true, ...over });
const keys = (linked: boolean, shared: Note = "C"): KeyState => ({ linked, shared, tools: { circle: "G", chords: "D", scales: "A" } });

describe("building", () => {
  it("places, moves and removes a note", () => {
    const one = tapFret(EMPTY_FRETS, 0, 5);
    expect(one[0]).toBe(5);
    expect(tapFret(one, 0, 7)[0]).toBe(7);
    expect(tapFret(one, 0, 5)[0]).toBeNull();
  });

  it("needs two distinct pitch classes to build a path", () => {
    expect(canBuildPath(EMPTY_FRETS, std)).toBe(false);
    expect(canBuildPath([5, null, null, null, null, null], std)).toBe(false);
    expect(canBuildPath([5, null, null, null, null, 5], std)).toBe(false);
    expect(canBuildPath([5, 7, null, null, null, null], std)).toBe(true);
  });
});

describe("parsePathfinder", () => {
  it("rejects bad storage", () => {
    for (const raw of [
      null,
      "nope",
      "{}",
      '{"frets":[1,2]}',
      '{"frets":[99,null,null,null,null,null],"lock":null}',
      '{"frets":[1.5,null,null,null,null,null],"lock":null}',
      '{"frets":[null,null,null,null,null,null],"lock":{"frets":[1]}}',
      '{"frets":[null,null,null,null,null,null],"lock":{"frets":[5,7,5,5,5,5],"key":"H","tuning":[0,0,0,0,0,0],"createdLink":true}}',
      '{"frets":[null,null,null,null,null,null],"lock":{"frets":[null,null,null,null,null,null],"key":"C","tuning":[0,0,0,0,0,0],"createdLink":true}}',
      '{"frets":[null,null,null,null,null,null],"lock":{"frets":[5,7,5,5,5,5],"key":"C","tuning":[99,0,0,0,0,0],"createdLink":true}}',
    ]) {
      expect(parsePathfinder(raw)).toEqual(EMPTY_STATE);
    }
  });

  it("round-trips a good state", () => {
    const state = { frets: AM7, lock: lock() };
    expect(parsePathfinder(JSON.stringify(state))).toEqual(state);
  });
});

describe("lock in and reset", () => {
  it("locks in by linking on the key, and records who made the link", () => {
    const off = lockIn({ frets: AM7, lock: null }, keys(false), "C", std);
    expect(off.keys).toMatchObject({ linked: true, shared: "C", tools: { circle: "G" } });
    expect(off.pathfinder.lock).toMatchObject({ key: "C", createdLink: true });
    expect(lockIn({ frets: AM7, lock: null }, keys(true, "E"), "C", std).pathfinder.lock!.createdLink).toBe(false);
  });

  it("resets, unlinking only a link lock-in made and still in place", () => {
    const made = { frets: AM7, lock: lock() };
    expect(resetPath(made, keys(true, "E")).keys).toMatchObject({ linked: false, tools: { circle: "E", chords: "E", scales: "E" } });
    expect(resetPath(made, keys(false)).keys).toEqual(keys(false));
    const theirs = { frets: AM7, lock: lock({ createdLink: false }) };
    expect(resetPath(theirs, keys(true, "E")).keys).toEqual(keys(true, "E"));
    expect(resetPath(made, keys(true)).pathfinder).toEqual(EMPTY_STATE);
  });
});

describe("forgetLink", () => {
  it("makes a later Reset leave the link alone", () => {
    const state = forgetLink({ frets: AM7, lock: lock() });
    expect(state.lock!.createdLink).toBe(false);
    expect(resetPath(state, keys(true, "E")).keys).toEqual(keys(true, "E"));
  });

  it("does nothing with no lock", () => {
    expect(forgetLink(EMPTY_STATE)).toBe(EMPTY_STATE);
  });
});

describe("highlightFrets", () => {
  it("moves the short way with the key", () => {
    expect(highlightFrets(lock(), "E", std)).toEqual([9, 11, 9, 9, 9, 9]);
    expect(highlightFrets(lock(), "B", std)).toEqual([4, 6, 4, 4, 4, 4]);
    expect(highlightFrets(lock(), "C", std)).toEqual(AM7);
  });

  it("wraps a note an octave to stay on the neck", () => {
    expect(highlightFrets(lock({ frets: [0, 2, 2, null, null, null] }), "B", std)).toEqual([11, 1, 1, null, null, null]);
    expect(highlightFrets(lock({ frets: [15, 13, null, null, null, null] }), "D", std)).toEqual([5, 15, null, null, null, null]);
  });

  it("keeps pitch when the tuning changes", () => {
    expect(highlightFrets(lock(), "C", [-2, 0, 0, 0, 0, 0])).toEqual([7, 7, 5, 5, 5, 5]);
    expect(highlightFrets(lock({ frets: [0, null, null, null, null, null] }), "C", [2, 0, 0, 0, 0, 0])).toEqual([10, null, null, null, null, null]);
  });

  it("doesn't move a note an octave when the whole change stays on the neck", () => {
    expect(highlightFrets(lock({ frets: [1, 3, 3, 2, 1, 1] }), "E", [3, 3, 3, 3, 3, 3])).toEqual([2, 4, 4, 3, 2, 2]);
  });

  it("stays on the neck through key and tuning together", () => {
    const moved = highlightFrets(lock({ frets: [0, 1, 15, 14, 2, 0] }), "F#", [-5, 4, -3, 2, -1, 1]);
    for (const fret of moved) {
      expect(fret).toBeGreaterThanOrEqual(0);
      expect(fret).toBeLessThanOrEqual(15);
    }
  });
});

describe("lockedVoicing", () => {
  it("names a locked chord from its locked voicing, whatever the neck wrapped", () => {
    const frets = [15, 13, null, null, null, null];
    const v = lockedVoicing(lock({ frets }), "D");
    expect(v.bass).toBe((voicingOf(frets)!.bass + 2) % 12);
  });
});
