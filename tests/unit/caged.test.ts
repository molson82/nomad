import { describe, expect, it } from "vitest";
import { cagedShapes, type CagedShape } from "@/lib/theory/caged";
import { chordTones } from "@/lib/theory/fretboard";
import { NOTES } from "@/lib/theory/notes";

// Frets low E → high E, null for strings the shape doesn't use.
function frets(shape: CagedShape): (number | null)[] {
  return [0, 1, 2, 3, 4, 5].map((s) => shape.tones.find((t) => t.string === s)?.fret ?? null);
}
const order = (root: (typeof NOTES)[number]) =>
  cagedShapes(root).map((s) => `${s.name} ${s.lowFret}–${s.highFret}`).join(" · ");
const byName = (root: (typeof NOTES)[number], name: string) => cagedShapes(root).find((s) => s.name === name)!;

describe("cagedShapes", () => {
  it("places G's five shapes up the neck", () => {
    expect(order("G")).toBe("G 0–3 · E 3–5 · D 5–8 · C 7–10 · A 10–12");
    expect(frets(byName("G", "G"))).toEqual([3, 2, 0, 0, 0, 3]);
    expect(frets(byName("G", "E"))).toEqual([3, 5, 5, 4, 3, 3]);
    expect(frets(byName("G", "D"))).toEqual([null, null, 5, 7, 8, 7]);
    expect(frets(byName("G", "C"))).toEqual([null, 10, 9, 7, 8, 7]);
    expect(frets(byName("G", "A"))).toEqual([null, 10, 12, 12, 12, 10]);
  });

  it("puts C's C-shape at the open chord x32010", () => {
    expect(frets(byName("C", "C"))).toEqual([null, 3, 2, 0, 1, 0]);
    expect(order("C")).toBe("C 0–3 · A 3–5 · G 5–8 · E 8–10 · D 10–13");
  });

  it("moves a shape up 12 rather than off the nut", () => {
    expect(order("E")).toBe("E 0–2 · D 2–5 · C 4–7 · A 7–9 · G 9–12");
    expect(frets(byName("E", "G"))).toEqual([12, 11, 9, 9, 9, 12]);
  });

  it("names the root string and role of each note", () => {
    const e = byName("G", "E");
    expect(e.rootString).toBe(0);
    expect(e.tones.map((t) => t.role).join("")).toBe("R5R35R");
  });

  it("every root's shapes lie within 0–15 and are complete", () => {
    const sizes: Record<string, number> = { C: 5, A: 5, G: 6, E: 6, D: 4 };
    for (const root of NOTES) {
      const shapes = cagedShapes(root);
      expect(new Set(shapes.map((s) => s.name)).size).toBe(5);
      const tones = new Set(chordTones(root).map((t) => `${t.string}:${t.fret}:${t.role}`));
      for (const shape of shapes) {
        expect(shape.tones).toHaveLength(sizes[shape.name]);
        expect(shape.lowFret).toBeGreaterThanOrEqual(0);
        expect(shape.highFret).toBeLessThanOrEqual(15);
        for (const t of shape.tones) expect(tones.has(`${t.string}:${t.fret}:${t.role}`)).toBe(true);
      }
      for (let i = 1; i < shapes.length; i++) {
        expect(shapes[i].lowFret).toBeGreaterThanOrEqual(shapes[i - 1].lowFret);
      }
    }
  });
});

describe("cagedShapes (minor)", () => {
  const minor = (root: (typeof NOTES)[number]) => cagedShapes(root, "minor");
  const named = (root: (typeof NOTES)[number], name: string) => minor(root).find((s) => s.name === name)!;

  it("places E minor's five shapes up the neck for the key of G", () => {
    expect(minor("G").map((s) => `${s.label} ${s.lowFret}–${s.highFret}`).join(" · ")).toBe(
      "Em 0–2 · Dm 2–5 · Cm 4–7 · Am 7–9 · Gm 9–12",
    );
    expect(frets(named("G", "E"))).toEqual([0, 2, 2, 0, 0, 0]);
    expect(frets(named("G", "D"))).toEqual([null, null, 2, 4, 5, 3]);
    expect(frets(named("G", "C"))).toEqual([null, 7, 5, 4, 5, 7]);
    expect(frets(named("G", "A"))).toEqual([null, 7, 9, 9, 8, 7]);
    expect(frets(named("G", "G"))).toEqual([12, 10, 9, 9, 12, 12]);
    expect(named("G", "E").tones.map((t) => t.role).join(" ")).toBe("R 5 R ♭3 5 R");
  });

  it("puts A minor's Am-shape at the open chord x02210 in the key of C", () => {
    expect(frets(named("C", "A"))).toEqual([null, 0, 2, 2, 1, 0]);
  });

  it("keeps major labels as bare letters", () => {
    expect(cagedShapes("G").map((s) => s.label)).toEqual(["G", "E", "D", "C", "A"]);
  });

  it("every key's minor shapes lie within 0–15, are complete and in neck order", () => {
    const sizes: Record<string, number> = { C: 5, A: 5, G: 6, E: 6, D: 4 };
    for (const root of NOTES) {
      const shapes = minor(root);
      expect(new Set(shapes.map((s) => s.name)).size).toBe(5);
      const tones = new Set(chordTones(root, "minor").map((t) => `${t.string}:${t.fret}:${t.role}`));
      for (const shape of shapes) {
        expect(shape.tones).toHaveLength(sizes[shape.name]);
        expect(shape.lowFret).toBeGreaterThanOrEqual(0);
        expect(shape.highFret).toBeLessThanOrEqual(15);
        expect(shape.tones.find((t) => t.string === shape.rootString)!.role).toBe("R");
        for (const t of shape.tones) expect(tones.has(`${t.string}:${t.fret}:${t.role}`)).toBe(true);
      }
      for (let i = 1; i < shapes.length; i++) expect(shapes[i].lowFret).toBeGreaterThanOrEqual(shapes[i - 1].lowFret);
    }
  });
});
