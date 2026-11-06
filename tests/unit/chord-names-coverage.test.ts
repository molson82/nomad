import { describe, expect, it } from "vitest";
import { chordNames, noteList, transposeVoicing, voicingOf, type Frets } from "@/lib/theory/chord-names";
import { chordName, diatonicChords } from "@/lib/theory/chords";
import { CIRCLE } from "@/lib/theory/circle";
import { pitchClassOf } from "@/lib/theory/spelling";
import { TUNING_PRESETS, type TuningOffsets } from "@/lib/theory/tuning";

const first = (frets: Frets, offsets?: TuningOffsets) => chordNames(voicingOf(frets, offsets)!)[0]?.text;

describe("chord qualities, as guitarists hold them", () => {
  it.each<[string, Frets]>([
    ["C", [null, 3, 2, 0, 1, 0]],
    ["Cm", [null, 3, 5, 5, 4, 3]],
    ["Cmaj7", [null, 3, 2, 0, 0, 0]],
    ["C7", [null, 3, 2, 3, 1, 0]],
    ["Cm7", [null, 3, 5, 3, 4, 3]],
    ["Cm7♭5", [null, 3, 4, 3, 4, null]],
    ["Cdim", [null, 3, 4, 5, 4, null]],
    ["Caug", [null, 3, 2, 1, 1, null]],
    ["Csus2", [null, 3, 0, 0, 1, 3]],
    ["Csus4", [null, 3, 3, 0, 1, 1]],
    ["C6", [null, 3, 2, 2, 1, 3]],
    ["Cm6", [null, 3, 1, 2, 1, 3]],
    ["C7sus4", [null, 3, 5, 3, 6, 3]],
    ["C9", [null, 3, 2, 3, 3, 3]],
    ["Cmaj9", [null, 3, 2, 4, 3, null]],
    ["Cm9", [null, 3, 1, 3, 3, null]],
    ["C7♭9", [null, 3, 2, 3, 2, null]],
    ["C6/9", [null, 3, 2, 2, 3, 3]],
    ["C13", [null, 3, 2, 3, null, 5]],
    ["Cm(maj7)", [null, 3, 5, 4, 4, 3]],
    ["Dm", [null, null, 0, 2, 3, 1]],
    ["F", [1, 3, 3, 2, 1, 1]],
    ["E7", [0, 2, 0, 1, 0, 0]],
    ["D", [null, null, 0, 2, 3, 2]],
  ])("%s", (name, frets) => {
    expect(first(frets)).toBe(name);
  });

  it("omits the 5th only where the table allows", () => {
    expect(first([null, 3, 2, 3, null, null])).toBe("C7"); // no 5th
    expect(first([null, 3, 2, 2, null, null])).not.toBe("C6"); // a 6th chord needs its 5th
  });

  it("writes slash chords from the lowest note", () => {
    expect(first([0, 3, 2, 0, 1, 0])).toBe("C/E");
    expect(first([3, 3, 2, 0, 1, 0])).toBe("C/G");
  });

  it("returns nothing for a tone cluster", () => {
    expect(chordNames({ pitchClasses: [0, 1, 2], bass: 0 })).toEqual([]);
  });
});

describe("every movable shape in every position", () => {
  const SHAPES: [string, number[]][] = [
    ["", [0, 2, 2, 1, 0, 0]],
    ["m", [0, 2, 2, 0, 0, 0]],
    ["7", [0, 2, 0, 1, 0, 0]],
    ["m7", [0, 2, 0, 0, 0, 0]],
    ["maj7", [0, 2, 1, 1, 0, 0]],
  ];

  it.each(SHAPES)("E-shape %s slides up the neck", (suffix, shape) => {
    for (let fret = 0; fret < 12; fret++) {
      const name = chordNames(voicingOf(shape.map((f) => f + fret))!)[0];
      expect(name.suffix).toBe(suffix);
      expect(name.root).toBe((4 + fret) % 12);
      expect(name.bass).toBe(name.root);
    }
  });
});

describe("every key", () => {
  it.each(CIRCLE.map((k) => [k.index, k] as const))("key %i spells its diatonic chords as the Circle does", (_i, key) => {
    for (const chord of diatonicChords(key)) {
      if (chord.quality === "dim") continue; // ° on the Circle, dim here
      const pitches = chord.notes.map(pitchClassOf);
      const name = chordNames({ pitchClasses: [...pitches].sort((a, b) => a - b), bass: pitches[0] }, key)[0];
      expect(name.text).toBe(chordName(chord));
    }
  });
});

describe("transposing", () => {
  it("keeps the chord's shape of intervals", () => {
    const v = voicingOf([5, 7, 5, 5, 5, 5])!;
    for (let semitones = -11; semitones < 12; semitones++) {
      const name = chordNames(transposeVoicing(v, semitones))[0];
      expect(name.suffix).toBe("m7");
    }
  });

  it("comes back to where it started", () => {
    const v = voicingOf([null, 3, 2, 0, 1, 0])!;
    expect(transposeVoicing(transposeVoicing(v, 5), -5)).toEqual(v);
  });
});

describe("in other tunings", () => {
  it("reads the same frets as different notes", () => {
    const open = [0, 0, 0, 0, 0, 0];
    expect(first(open)).toBe("Em11");
    expect(chordNames(voicingOf(open, TUNING_PRESETS.find((p) => p.id === "open-g")!.offsets)!)[0].text).toBe("G/D"); // the low string is D
    expect(chordNames(voicingOf(open, TUNING_PRESETS.find((p) => p.id === "open-d")!.offsets)!)[0].text).toBe("D");
    expect(chordNames(voicingOf(open, TUNING_PRESETS.find((p) => p.id === "open-c")!.offsets)!)[0].text).toBe("C");
  });
});

describe("whatever you play", () => {
  // A seeded walk over the neck: no crash, no junk, and every name's notes are the notes you played.
  let seed = 12345;
  const next = (n: number) => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed % n;
  };

  it("never produces a broken name", () => {
    for (let i = 0; i < 2000; i++) {
      const frets = Array.from({ length: 6 }, () => (next(3) === 0 ? null : next(16)));
      const offsets = TUNING_PRESETS[next(TUNING_PRESETS.length)].offsets;
      const v = voicingOf(frets, offsets);
      if (!v) continue;
      const names = chordNames(v);
      expect(names.length).toBeLessThanOrEqual(5);
      expect(new Set(names.map((n) => n.text)).size).toBe(names.length);
      for (const name of names) {
        expect(name.text).not.toMatch(/undefined|NaN|♯♯|♭♭/);
        expect(v.pitchClasses).toContain(name.root);
        expect(name.bass).toBe(v.bass);
        const list = noteList(v, name);
        expect(list).toHaveLength(v.pitchClasses.length);
        expect(list.join()).not.toMatch(/undefined|♯♯|♭♭/);
      }
    }
  });
});
