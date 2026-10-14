import { describe, expect, it } from "vitest";
import { CIRCLE, circleKeyFor, describeKey, keySignature, majorScale, rootNoteFor } from "@/lib/theory/circle";
import { NOTES } from "@/lib/theory/notes";
import { formatNote } from "@/lib/theory/spelling";

const SCALES: Record<string, string> = {
  C: "C D E F G A B",
  G: "G A B C D E F♯",
  D: "D E F♯ G A B C♯",
  A: "A B C♯ D E F♯ G♯",
  E: "E F♯ G♯ A B C♯ D♯",
  B: "B C♯ D♯ E F♯ G♯ A♯",
  "F♯": "F♯ G♯ A♯ B C♯ D♯ F",
  "D♭": "D♭ E♭ F G♭ A♭ B♭ C",
  "A♭": "A♭ B♭ C D♭ E♭ F G",
  "E♭": "E♭ F G A♭ B♭ C D",
  "B♭": "B♭ C D E♭ F G A",
  F: "F G A B♭ C D E",
};

describe("CIRCLE", () => {
  it("runs C G D A E B F♯ D♭ A♭ E♭ B♭ F clockwise", () => {
    expect(CIRCLE.map((k) => formatNote(k.tonic)).join(" ")).toBe("C G D A E B F♯ D♭ A♭ E♭ B♭ F");
    expect(CIRCLE.map((k) => k.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it("counts sharps clockwise and flats counter-clockwise", () => {
    expect(CIRCLE.map((k) => k.sharpsOrFlats)).toEqual([0, 1, 2, 3, 4, 5, 6, -5, -4, -3, -2, -1]);
  });

  it("names relative minors", () => {
    expect(CIRCLE.map((k) => formatNote(k.relativeMinor)).join(" ")).toBe("A E B F♯ C♯ G♯ D♯ B♭ F C G D");
  });

  it("marks G♭ as the enharmonic of F♯ only", () => {
    expect(CIRCLE.filter((k) => k.enharmonic).map((k) => formatNote(k.enharmonic!))).toEqual(["G♭"]);
    expect(CIRCLE[6].enharmonic && formatNote(CIRCLE[6].enharmonic)).toBe("G♭");
  });
});

describe("majorScale", () => {
  it.each(Object.entries(SCALES))("%s major", (tonic, expected) => {
    const key = CIRCLE.find((k) => formatNote(k.tonic) === tonic)!;
    expect(majorScale(key).map(formatNote).join(" ")).toBe(expected);
  });

  it("uses every letter exactly once and as many accidentals as the signature", () => {
    for (const key of CIRCLE) {
      const scale = majorScale(key);
      expect(new Set(scale.map((n) => n.letter)).size).toBe(7);
      expect(scale.filter((n) => n.accidental !== 0)).toHaveLength(Math.abs(key.sharpsOrFlats));
    }
  });
});

describe("keySignature", () => {
  const sig = (tonic: string) =>
    keySignature(CIRCLE.find((k) => formatNote(k.tonic) === tonic)!)
      .map((n) => n.letter + (n.accidental > 0 ? "♯" : "♭"))
      .join(" ");

  it("lists sharps in F C G D A E B order", () => {
    expect(sig("C")).toBe("");
    expect(sig("G")).toBe("F♯");
    expect(sig("D")).toBe("F♯ C♯");
    expect(sig("F♯")).toBe("F♯ C♯ G♯ D♯ A♯ E♯");
  });

  it("lists flats in B E A D G C F order", () => {
    expect(sig("F")).toBe("B♭");
    expect(sig("D♭")).toBe("B♭ E♭ A♭ D♭ G♭");
  });
});

describe("shared root note mapping", () => {
  it("round-trips every pitch class", () => {
    for (const note of NOTES) expect(rootNoteFor(circleKeyFor(note))).toBe(note);
  });

  it("maps C# to D♭ major and F# to F♯ major", () => {
    expect(formatNote(circleKeyFor("C#").tonic)).toBe("D♭");
    expect(formatNote(circleKeyFor("F#").tonic)).toBe("F♯");
    expect(circleKeyFor("G").index).toBe(1);
  });
});

describe("describeKey", () => {
  it("reads naturally for screen readers", () => {
    expect(describeKey(CIRCLE[0])).toBe("C major, no sharps or flats");
    expect(describeKey(CIRCLE[1])).toBe("G major, 1 sharp");
    expect(describeKey(CIRCLE[2])).toBe("D major, 2 sharps");
    expect(describeKey(CIRCLE[11])).toBe("F major, 1 flat");
    expect(describeKey(CIRCLE[10])).toBe("B♭ major, 2 flats");
  });
});
