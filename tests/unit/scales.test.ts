import { describe, expect, it } from "vitest";
import { NOTES } from "@/lib/theory/notes";
import { neckNotes, positions, scaleDegrees, scaleName, scaleNotes, type Position, type ScaleView } from "@/lib/theory/scales";
import { formatNote, pitchClassOf } from "@/lib/theory/spelling";

const MAJOR: ScaleView = { tonality: "major", type: "scale" };
const MINOR: ScaleView = { tonality: "minor", type: "scale" };
const MAJ_PENT: ScaleView = { tonality: "major", type: "pentatonic" };
const MIN_PENT: ScaleView = { tonality: "minor", type: "pentatonic" };
const MAJ_BLUES: ScaleView = { tonality: "major", type: "blues" };
const MIN_BLUES: ScaleView = { tonality: "minor", type: "blues" };
const ALL_VIEWS = [MAJOR, MINOR, MAJ_PENT, MIN_PENT, MAJ_BLUES, MIN_BLUES];

const frets = (p: Position) => [0, 1, 2, 3, 4, 5].map((s) => p.notes.filter((n) => n.string === s).map((n) => n.fret));
const order = (ps: Position[], useBox = false) =>
  ps.map((p) => `${useBox ? p.box : p.letter} ${p.lowFret}–${p.highFret}`).join(" · ");
const names = (root: (typeof NOTES)[number], view: ScaleView) => scaleNotes(root, view).map(formatNote).join(" ");

describe("views", () => {
  it("numbers each of the six views", () => {
    expect(scaleDegrees("G", MAJOR)).toEqual(["1", "2", "3", "4", "5", "6", "7"]);
    expect(scaleDegrees("G", MAJ_PENT)).toEqual(["1", "2", "3", "5", "6"]);
    expect(scaleDegrees("G", MAJ_BLUES)).toEqual(["1", "2", "♭3", "3", "5", "6"]);
    expect(scaleDegrees("G", MINOR)).toEqual(["1", "2", "♭3", "4", "5", "♭6", "♭7"]);
    expect(scaleDegrees("G", MIN_PENT)).toEqual(["1", "♭3", "4", "5", "♭7"]);
    expect(scaleDegrees("G", MIN_BLUES)).toEqual(["1", "♭3", "4", "♭5", "5", "♭7"]);
  });

  it("spells the notes from the view's own tonic", () => {
    expect(names("G", MAJOR)).toBe("G A B C D E F♯");
    expect(names("G", MINOR)).toBe("E F♯ G A B C D");
    expect(names("G", MAJ_BLUES)).toBe("G A B♭ B D E");
    expect(names("G", MIN_BLUES)).toBe("E G A B♭ B D");
    expect(names("A", MAJ_BLUES)).toBe("A B C C♯ E F♯");
    expect(names("C#", MAJ_BLUES)).toBe("D♭ E♭ E F A♭ B♭"); // not F♭
    expect(names("Ab", MIN_BLUES)).toBe("F A♭ B♭ B C E♭"); // A♭ major's blue note: not C♭
    expect(names("F#", MAJOR)).toBe("F♯ G♯ A♯ B C♯ D♯ F"); // not E♯
  });

  it("names all six views", () => {
    expect(ALL_VIEWS.map((v) => scaleName("G", v))).toEqual([
      "G major", "E minor", "G major pentatonic", "E minor pentatonic", "G major blues", "E minor blues",
    ]);
    expect(scaleName("C#", MAJOR)).toBe("D♭ major");
  });
});

describe("neckNotes", () => {
  it("lists every note of the view on frets 0–15", () => {
    expect(neckNotes("G", MAJOR).filter((n) => n.string === 0).map((n) => n.fret)).toEqual([0, 2, 3, 5, 7, 8, 10, 12, 14, 15]);
  });

  it("marks the tonic, the relative-minor root (major views only) and the blue note", () => {
    const major = neckNotes("G", MAJOR);
    expect(major.find((n) => n.string === 0 && n.fret === 3)!.kind).toBe("tonic");
    expect(major.find((n) => n.string === 0 && n.fret === 0)).toMatchObject({ label: "6", kind: "relative" });
    const minor = neckNotes("G", MINOR);
    expect(minor.find((n) => n.string === 0 && n.fret === 0)).toMatchObject({ label: "1", kind: "tonic" });
    expect(minor.some((n) => n.kind === "relative")).toBe(false);
    expect(neckNotes("G", MIN_BLUES).find((n) => n.string === 1 && n.fret === 1)).toMatchObject({ label: "♭5", kind: "blue" });
  });
});

describe("full-scale positions", () => {
  it("places G major's five CAGED positions", () => {
    const ps = positions("G", MAJOR);
    expect(order(ps)).toBe("G 0–4 · E 2–5 · D 4–8 · C 7–10 · A 9–13");
    const at = (letter: string) => frets(ps.find((p) => p.letter === letter)!);
    expect(at("G")).toEqual([[0, 2, 3], [0, 2, 3], [0, 2, 4], [0, 2], [0, 1, 3], [0, 2, 3]]);
    expect(at("E")).toEqual([[2, 3, 5], [2, 3, 5], [2, 4, 5], [2, 4, 5], [3, 5], [2, 3, 5]]);
    expect(at("D")).toEqual([[5, 7, 8], [5, 7], [4, 5, 7], [4, 5, 7], [5, 7, 8], [5, 7, 8]]);
    expect(at("C")).toEqual([[7, 8, 10], [7, 9, 10], [7, 9, 10], [7, 9], [7, 8, 10], [7, 8, 10]]);
    expect(at("A")).toEqual([[10, 12], [9, 10, 12], [9, 10, 12], [9, 11, 12], [10, 12, 13], [10, 12]]);
  });

  it("uses the same positions, renumbered, for the relative minor", () => {
    const e = positions("G", MINOR).find((p) => p.letter === "E")!;
    expect(e.notes.find((n) => n.string === 0 && n.fret === 2)!.label).toBe("2"); // F♯ in E minor
  });

  it("every key's positions hold all 7 notes, 2–3 per string, within 5 frets and 0–15", () => {
    for (const root of NOTES) {
      const ps = positions(root, MAJOR);
      expect(ps.map((p) => p.letter).sort()).toEqual(["A", "C", "D", "E", "G"]);
      for (const p of ps) {
        expect(new Set(p.notes.map((n) => pitchClassOf(n.note))).size).toBe(7);
        for (const s of frets(p)) {
          expect(s.length).toBeGreaterThanOrEqual(2);
          expect(s.length).toBeLessThanOrEqual(3);
        }
        expect(p.highFret - p.lowFret).toBeLessThanOrEqual(4);
        expect(p.lowFret).toBeGreaterThanOrEqual(0);
        expect(p.highFret).toBeLessThanOrEqual(15);
      }
    }
  });
});

describe("pentatonic boxes", () => {
  it("places E minor's five boxes", () => {
    const ps = positions("G", MIN_PENT);
    expect(order(ps, true)).toBe("1 0–3 · 2 2–5 · 3 4–8 · 4 7–10 · 5 9–12");
    expect(ps.map((p) => p.letter).join("")).toBe("GEDCA");
    const box = (n: number) => frets(ps.find((p) => p.box === n)!);
    expect(box(1)).toEqual([[0, 3], [0, 2], [0, 2], [0, 2], [0, 3], [0, 3]]);
    expect(box(3)).toEqual([[5, 7], [5, 7], [5, 7], [4, 7], [5, 8], [5, 7]]);
    expect(box(5)).toEqual([[10, 12], [10, 12], [9, 12], [9, 12], [10, 12], [10, 12]]);
  });

  it("puts each box in its lowest octave, like the full-scale positions", () => {
    expect(order(positions("C", MIN_PENT), true)).toBe("4 0–3 · 5 2–5 · 1 5–8 · 2 7–10 · 3 9–13");
  });

  it("keeps box N in the same neck region as letter N in every key", () => {
    for (const root of NOTES) {
      const full = positions(root, MAJOR);
      for (const box of positions(root, MAJ_PENT)) {
        const sameLetter = full.find((p) => p.letter === box.letter)!;
        expect(Math.abs(box.lowFret - sameLetter.lowFret), `${root} box ${box.box}`).toBeLessThanOrEqual(2);
      }
    }
  });

  it("every key's boxes hold all 5 notes, 2 per string, within 0–15", () => {
    for (const root of NOTES) {
      for (const view of [MAJ_PENT, MIN_PENT]) {
        for (const p of positions(root, view)) {
          expect(new Set(p.notes.map((n) => pitchClassOf(n.note))).size).toBe(5);
          for (const s of frets(p)) expect(s).toHaveLength(2);
          expect(p.lowFret).toBeGreaterThanOrEqual(0);
          expect(p.highFret).toBeLessThanOrEqual(15);
        }
      }
    }
  });

  it("blues adds the blue note wherever it falls inside the box", () => {
    const box1 = positions("G", MIN_BLUES).find((p) => p.box === 1)!;
    expect(box1.notes.filter((n) => n.kind === "blue").map((n) => [n.string, n.fret])).toEqual([[1, 1], [3, 3]]);
    const aBox1 = positions("C", MIN_BLUES).find((p) => p.box === 1)!;
    expect(aBox1.notes.filter((n) => n.kind === "blue").map((n) => [n.string, n.fret, formatNote(n.note)])).toEqual([
      [1, 6, "E♭"],
      [3, 8, "E♭"],
    ]);
  });
});
