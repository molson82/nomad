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
    expect(names(shape)[0]).toBe("G♯m7");
    expect(names(shape, undefined, circleKeyFor("B"))[0]).toBe("G♯m7");
  });

  it("spells the root by quality with no key", () => {
    const gsm = voicingOf([4, 6, 6, 4, 4, 4])!;
    expect(chordNames(gsm)[0].text).toBe("G♯m");
    expect(noteList(gsm, chordNames(gsm)[0])).toEqual(["G♯", "B", "D♯"]);
    const db = voicingOf([null, 4, 3, 1, 2, 1])!;
    expect(chordNames(db)[0].text).toBe("D♭");
    expect(noteList(db, chordNames(db)[0])).toEqual(["D♭", "F", "A♭"]);
    expect(names([null, 4, 6, 6, 5, 4])[0]).toBe("C♯m");
    expect(names([4, 6, 6, 5, 4, 4])[0]).toBe("A♭");
  });

  it("keeps the fixed names for a single note", () => {
    expect(names([4, null, null, null, null, null])).toEqual(["A♭"]);
    expect(names([null, 4, null, null, null, null])).toEqual(["C♯"]);
  });

  it("prefers a 7th chord over a 6th when the root is not in the bass", () => {
    expect(names([0, 0, 2, 0, 1, 0]).slice(0, 2)).toEqual(["Am7/E", "C6/E"]);
    expect(names([5, 7, 5, 5, 5, 5])[0]).toBe("Am7");
    expect(names([null, 3, 2, 2, 1, 3])[0]).toBe("C6");
  });

  it("names a third or sixth as the triad it implies", () => {
    expect(names([null, 3, 2, null, null, null])).toEqual(["C(no5)"]);
    expect(names([null, 0, null, null, 1, null])).toEqual(["Am(no5)"]);
    expect(names([0, 3, null, null, null, null])).toEqual(["C(no5)/E"]);
    expect(names([null, 3, null, 2, null, null])).toEqual(["Am(no5)/C"]);
  });

  it("names maj7♯11, add11, m6/9 and maj13", () => {
    expect(names([null, null, 3, 2, 0, 0])[0]).toBe("Fmaj7♯11");
    expect(names([null, 3, 2, 0, 1, 1])[0]).toBe("Cadd11");
    expect(names([null, 3, 1, 2, 3, 3])[0]).toBe("Cm6/9");
    expect(names([null, 3, 2, 2, 0, 0])[0]).toBe("Cmaj13");
  });

  it("spells the true letter in names and note lists", () => {
    const fs = voicingOf([2, 4, 3, 3, 2, 2])!;
    expect(noteList(fs, chordNames(fs)[0])).toEqual(["F♯", "A♯", "C♯", "E♯"]);
    expect(names([null, null, 3, 4, 4, 4], undefined, circleKeyFor("F#"))[0]).toBe("E♯m7♭5");
    expect(names([null, 8, 7, 5, 6, null], undefined, circleKeyFor("F#"))[0]).toBe("F"); // not E♯ with G♯♯
  });

  it("never returns more than 5", () => {
    for (let f = 0; f < 12; f++) expect(names([f, f + 2, f + 2, f + 1, f, f + 3]).length).toBeLessThanOrEqual(5);
  });
});

describe("symmetric chords", () => {
  it("keep the same name when transposed", () => {
    const relative = (v: ReturnType<typeof voicingOf>) => {
      const first = chordNames(v!)[0];
      return [first.suffix, ((first.root - first.bass) % 12 + 12) % 12];
    };
    const v = voicingOf([null, 13, 0, 13, 5, null], [-1, -1, -1, -1, -1, -1]);
    for (let semitones = 0; semitones < 12; semitones++) {
      expect(relative(transposeVoicing(v!, semitones))).toEqual(relative(v));
    }
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

  it("writes what players read instead of a double accidental", () => {
    const dim = voicingOf([null, 6, 4, 2, null, null])!;
    expect(noteList(dim, chordNames(dim)[0])).toEqual(["E♭", "G♭", "A"]);
    const aug = voicingOf([null, 4, 3, 2, 2, null])!;
    expect(noteList(aug, chordNames(aug)[0])).toEqual(["D♭", "F", "A"]);
  });

  it("falls back to the app's note names with no chord name", () => {
    expect(noteList(voicingOf([8, 4, null, null, null, 2])!, null)).toEqual(["C", "C♯", "F♯"]);
  });
});
