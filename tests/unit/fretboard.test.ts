import { describe, expect, it } from "vitest";
import { chordTones, majorTriad, toneAt } from "@/lib/theory/fretboard";
import { formatNote } from "@/lib/theory/spelling";

const triad = (root: Parameters<typeof majorTriad>[0]) => majorTriad(root).map(formatNote).join(" ");
const onString = (root: Parameters<typeof chordTones>[0], string: number) =>
  chordTones(root)
    .filter((t) => t.string === string)
    .map((t) => `${t.fret}${t.role}`)
    .join(" ");

describe("majorTriad", () => {
  it("spells the chord like the Circle does", () => {
    expect(triad("G")).toBe("G B D");
    expect(triad("F")).toBe("F A C");
    expect(triad("C#")).toBe("D♭ F A♭");
    expect(triad("F#")).toBe("F♯ A♯ C♯");
  });
});

describe("chordTones", () => {
  it("finds every G chord tone on frets 0–15", () => {
    expect(onString("G", 0)).toBe("3R 73 105 15R");
    expect(onString("G", 1)).toBe("23 55 10R 143");
    expect(onString("G", 3)).toBe("0R 43 75 12R");
    expect(onString("G", 5)).toBe("3R 73 105 15R");
  });

  it("carries spelled note names", () => {
    const tone = chordTones("C#").find((t) => t.string === 0 && t.role === "3")!;
    expect(formatNote(tone.note)).toBe("F");
  });
});

describe("toneAt", () => {
  it("names the chord tone at a position", () => {
    expect(toneAt(majorTriad("G"), 4, 3)).toMatchObject({ string: 4, fret: 3, role: "5" });
  });

  it("refuses a position that is not in the chord", () => {
    expect(() => toneAt(majorTriad("G"), 0, 1)).toThrow(/not a chord tone/);
  });
});
