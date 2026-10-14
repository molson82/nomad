import { describe, expect, it } from "vitest";
import { nextPlayable, progressionSteps } from "@/lib/chords/progression-chords";
import { cagedShapes, cagedShapesFor } from "@/lib/theory/caged";
import { chordLongName, chordName, diatonicChords } from "@/lib/theory/chords";
import { circleKeyFor } from "@/lib/theory/circle";
import { chordTonesFor } from "@/lib/theory/fretboard";
import { NOTES } from "@/lib/theory/notes";
import { formatNote, pitchClassOf } from "@/lib/theory/spelling";

describe("progressionSteps", () => {
  it("names each step as the Circle does", () => {
    const steps = progressionSteps("G", [1, 5, 6, 4, 7]);
    expect(steps.map((s) => `${s.roman} ${s.name} ${s.quality}`)).toEqual([
      "I G major",
      "V D major",
      "vi Em minor",
      "IV C major",
      "vii° F♯° null",
    ]);
    expect(steps[1].notes.map(formatNote).join(" ")).toBe("D F♯ A");
    expect(steps[2].longName).toBe("E minor");
  });

  it("spells V of F♯ major as C♯, like the Circle", () => {
    expect(progressionSteps("F#", [5])[0].name).toBe("C♯");
  });

  it("matches the Circle's chords for every key and degree", () => {
    for (const root of NOTES) {
      const chords = diatonicChords(circleKeyFor(root));
      progressionSteps(root, [1, 2, 3, 4, 5, 6, 7]).forEach((step, i) => {
        expect(step.name).toBe(chordName(chords[i]));
        expect(step.longName).toBe(chordLongName(chords[i]));
        expect(step.notes).toEqual(chords[i].notes);
      });
    }
  });
});

describe("cagedShapesFor", () => {
  it("builds five in-range shapes for every playable chord of every key", () => {
    for (const root of NOTES) {
      for (const step of progressionSteps(root, [1, 2, 3, 4, 5, 6])) {
        const shapes = cagedShapesFor(step.notes, step.quality!);
        const pitches = new Set(step.notes.map(pitchClassOf));
        expect(shapes).toHaveLength(5);
        for (const shape of shapes) {
          expect(shape.lowFret).toBeGreaterThanOrEqual(0);
          expect(shape.highFret).toBeLessThanOrEqual(15);
          for (const t of shape.tones) expect(pitches.has(pitchClassOf(t.note))).toBe(true);
        }
      }
    }
  });

  it("gives vi the same shapes as the key's Minor view", () => {
    for (const root of NOTES) {
      const vi = progressionSteps(root, [6])[0];
      expect(cagedShapesFor(vi.notes, "minor")).toEqual(cagedShapes(root, "minor"));
    }
  });

  it("labels minor chord tones ♭3 on the whole neck", () => {
    const ii = progressionSteps("C", [2])[0]; // D minor
    expect(new Set(chordTonesFor(ii.notes, "minor").map((t) => t.role))).toEqual(new Set(["R", "♭3", "5"]));
  });
});

describe("nextPlayable", () => {
  const steps = progressionSteps("G", [7, 1, 7, 5, 7]); // F♯° G F♯° D F♯°

  it("skips diminished steps in both directions", () => {
    expect(nextPlayable(steps, 1, 1)).toBe(3);
    expect(nextPlayable(steps, 3, -1)).toBe(1);
  });

  it("stops at the ends", () => {
    expect(nextPlayable(steps, 3, 1)).toBeNull();
    expect(nextPlayable(steps, 1, -1)).toBeNull();
  });

  it("starts from the first playable step when nothing is selected", () => {
    expect(nextPlayable(steps, null, 1)).toBe(1);
    expect(nextPlayable(progressionSteps("G", [7]), null, 1)).toBeNull();
  });
});
