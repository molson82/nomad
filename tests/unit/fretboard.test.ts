import { describe, expect, it } from "vitest";
import { chordTones, triad, toneAt } from "@/lib/theory/fretboard";
import { formatNote } from "@/lib/theory/spelling";
import { NOTES } from "@/lib/theory/notes";
import { circleKeyFor, majorScale } from "@/lib/theory/circle";

const spelled = (root: Parameters<typeof triad>[0]) => triad(root).map(formatNote).join(" ");
const onString = (root: Parameters<typeof chordTones>[0], string: number) =>
  chordTones(root)
    .filter((t) => t.string === string)
    .map((t) => `${t.fret}${t.role}`)
    .join(" ");

describe("triad", () => {
  it("spells the chord like the Circle does", () => {
    expect(spelled("G")).toBe("G B D");
    expect(spelled("F")).toBe("F A C");
    expect(spelled("C#")).toBe("D♭ F A♭");
    expect(spelled("F#")).toBe("F♯ A♯ C♯");
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
    expect(toneAt(triad("G"), 4, 3)).toMatchObject({ string: 4, fret: 3, role: "5" });
  });

  it("refuses a position that is not in the chord", () => {
    expect(() => toneAt(triad("G"), 0, 1)).toThrow(/not a chord tone/);
  });
});

describe("triad (minor)", () => {
  it("is the key's relative minor, spelled as the Circle spells the key", () => {
    expect(triad("G", "minor").map(formatNote).join(" ")).toBe("E G B");
    expect(triad("C", "minor").map(formatNote).join(" ")).toBe("A C E");
    expect(triad("C#", "minor").map(formatNote).join(" ")).toBe("B♭ D♭ F");
  });

  it("matches the major scale's ⑥ ① ③ in every key", () => {
    for (const root of NOTES) {
      const s = majorScale(circleKeyFor(root));
      expect(triad(root, "minor")).toEqual([s[5], s[0], s[2]]);
    }
  });
});

describe("chordTones (minor)", () => {
  it("labels the minor third ♭3", () => {
    const roles = new Set(chordTones("G", "minor").map((t) => t.role));
    expect([...roles].sort()).toEqual(["5", "R", "♭3"]);
    expect(toneAt(triad("G", "minor"), 5, 3, "minor")).toMatchObject({ role: "♭3" }); // high E fret 3 = G
  });
});
