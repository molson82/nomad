import { describe, expect, it } from "vitest";
import { chordNames, noteList, transposeVoicing, voicingOf, type Frets } from "@/lib/theory/chord-names";
import { circleKeyFor, type CircleKey } from "@/lib/theory/circle";
import type { TuningOffsets } from "@/lib/theory/tuning";

const names = (frets: Frets, offsets?: TuningOffsets, key?: CircleKey) =>
  chordNames(voicingOf(frets, offsets)!, key).map((n) => n.text);

describe("chordNames", () => {
  it("names the spec's chords", () => {
    expect(names([5, 7, 5, 5, 5, 5])).toEqual(["Am7", "C6/A"]);
    expect(names([null, 3, 2, 0, 1, 0])).toEqual(["C"]);
    expect(names([3, 2, 0, 0, 0, 3])).toEqual(["G"]);
    expect(names([0, 2, 2, 0, 0, 0])).toEqual(["Em"]);
    expect(names([5, 7, null, null, null, null])).toEqual(["A5"]);
  });

  it("names a first-inversion triad as a slash chord, not a 6th", () => {
    expect(names([null, 3, 2, 2, 1, 0])[0]).toBe("Am/C");
    expect(names([null, 3, 2, 2, 1, 0])).not.toContain("C6");
  });

  it("keeps 9ths honest", () => {
    const n = names([null, 3, 2, 0, 3, 0]);
    expect(n[0]).toBe("Cadd9");
    expect(n).not.toContain("C9");
  });

  it("names an altered dominant", () => {
    expect(names([null, 3, 2, 3, 4, null])[0]).toBe("C7♯9");
  });

  it("lists a dim7's other roots", () => {
    const n = names([null, 3, 4, 2, 4, null]);
    expect(n[0]).toBe("Cdim7");
    expect(n).toHaveLength(4);
    expect(n).toContain("Adim7/C");
  });

  it("names one pitch class as the note, and returns nothing for no match", () => {
    expect(names([5, null, null, null, null, 5])).toEqual(["A"]);
    expect(names([8, 4, null, null, null, 2])).toEqual([]); // C D♭ F♯
  });

  it("spells for a key when given one", () => {
    const shape = [4, 6, 4, 4, 4, 4];
    expect(names(shape)[0]).toBe("A♭m7");
    expect(names(shape, undefined, circleKeyFor("B"))[0]).toBe("G♯m7");
  });

  it("never returns more than 5", () => {
    for (let f = 0; f < 12; f++) expect(names([f, f + 2, f + 2, f + 1, f, f + 3]).length).toBeLessThanOrEqual(5);
  });
});

describe("voicingOf", () => {
  it("is null with no notes", () => {
    expect(voicingOf([null, null, null, null, null, null])).toBeNull();
  });

  it("takes the bass from the lowest pitch, not the lowest string", () => {
    expect(voicingOf([12, 0, null, null, null, null])!.bass).toBe(9);
  });

  it("reads the tuning for pitch", () => {
    expect(voicingOf([0, null, null, null, null, null], [-2, 0, 0, 0, 0, 0])!.bass).toBe(2);
  });

  it("transposes pitch classes and bass", () => {
    expect(transposeVoicing(voicingOf([5, 7, null, null, null, null])!, 3)).toEqual({ pitchClasses: [0, 7], bass: 0 });
  });
});

describe("noteList", () => {
  it("spells the notes by the primary name", () => {
    const v = voicingOf([5, 7, 5, 5, 5, 5])!;
    expect(noteList(v, chordNames(v)[0])).toEqual(["A", "C", "E", "G"]);
  });

  it("spells an altered tone by its degree", () => {
    const v = voicingOf([null, 3, 2, 3, 4, null])!;
    expect(noteList(v, chordNames(v)[0])).toEqual(["C", "D♯", "E", "B♭"]);
  });

  it("falls back to the app's note names with no chord name", () => {
    expect(noteList(voicingOf([8, 4, null, null, null, 2])!, null)).toEqual(["C", "C♯", "F♯"]);
  });
});
