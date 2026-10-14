import { describe, expect, it } from "vitest";
import { CIRCLE } from "@/lib/theory/circle";
import {
  COMMON_PROGRESSIONS,
  DECODER_LAYOUT,
  chordLongName,
  chordName,
  diatonicChords,
  progressionLabel,
  romanFor,
} from "@/lib/theory/chords";
import { formatNote } from "@/lib/theory/spelling";

const byTonic = (t: string) => CIRCLE.find((k) => formatNote(k.tonic) === t)!;
const names = (t: string) => diatonicChords(byTonic(t)).map(chordName).join(" ");

describe("diatonicChords", () => {
  it("names the seven chords of G, F and D♭", () => {
    expect(names("G")).toBe("G Am Bm C D Em F♯°");
    expect(names("F")).toBe("F Gm Am B♭ C Dm E°");
    expect(names("D♭")).toBe("D♭ E♭m Fm G♭ A♭ B♭m C°");
    expect(names("F♯")).toBe("F♯ G♯m A♯m B C♯ D♯m F°"); // vii° shown as F°, not E♯°
  });

  it("builds each triad from degrees d, d+2, d+4 wrapped into 1–7", () => {
    const chords = diatonicChords(byTonic("G"));
    expect(chords.map((c) => c.degrees)).toEqual([
      [1, 3, 5], [2, 4, 6], [3, 5, 7], [4, 6, 1], [5, 7, 2], [6, 1, 3], [7, 2, 4],
    ]);
    expect(chords[4].notes.map(formatNote).join(" ")).toBe("D F♯ A");
    expect(chords[6].notes.map(formatNote).join(" ")).toBe("F♯ A C");
  });

  it("labels romans and qualities in major-key order", () => {
    const chords = diatonicChords(CIRCLE[0]);
    expect(chords.map((c) => c.roman)).toEqual(["I", "ii", "iii", "IV", "V", "vi", "vii°"]);
    expect(chords.map((c) => c.quality)).toEqual(["maj", "min", "min", "maj", "maj", "min", "dim"]);
  });

  it("gives long names for accessible labels", () => {
    const chords = diatonicChords(byTonic("G"));
    expect(chordLongName(chords[0])).toBe("G major");
    expect(chordLongName(chords[1])).toBe("A minor");
    expect(chordLongName(chords[6])).toBe("F♯ diminished");
  });
});

describe("Decoder layout and progressions", () => {
  it("matches the physical wheel: major 4·1·5, minor 3·6·2, dim 7", () => {
    expect(DECODER_LAYOUT).toEqual({ major: [4, 1, 5], minor: [3, 6, 2], dim: 7 });
  });

  it("labels progressions by numeral", () => {
    expect(romanFor(6)).toBe("vi");
    expect(progressionLabel([1, 5, 6, 4])).toBe("I–V–vi–IV");
  });

  it("ships the five agreed presets", () => {
    expect(COMMON_PROGRESSIONS.map((p) => [p.id, p.name, progressionLabel(p.degrees)])).toEqual([
      ["pop", "Pop", "I–V–vi–IV"],
      ["ii-v-i", "Jazz turnaround", "ii–V–I"],
      ["i-iv-v", "Three-chord", "I–IV–V"],
      ["vi-iv-i-v", "Sensitive", "vi–IV–I–V"],
      ["fifties", "50s", "I–vi–IV–V"],
    ]);
  });
});
