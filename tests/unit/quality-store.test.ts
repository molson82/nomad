import { describe, expect, it } from "vitest";
import { DEFAULT_QUALITY, parseQuality, shapeForQuality, switchQualityShape } from "@/lib/chords/quality-store";
import { nearestShape } from "@/lib/chords/shape-store";
import { cagedShapes } from "@/lib/theory/caged";
import { NOTES, type Note } from "@/lib/theory/notes";

const shape = (root: Note, quality: "major" | "minor", name: string) =>
  cagedShapes(root, quality).find((s) => s.name === name)!;

describe("parseQuality", () => {
  it("reads a stored quality", () => {
    expect(parseQuality(JSON.stringify("minor"))).toBe("minor");
    expect(parseQuality(JSON.stringify("major"))).toBe("major");
  });

  it.each([
    ["missing", null],
    ["bad json", "{oops"],
    ["unknown value", JSON.stringify("dim")],
    ["a number", "3"],
  ])("falls back to major for %s", (_label, raw) => {
    expect(parseQuality(raw)).toBe(DEFAULT_QUALITY);
    expect(DEFAULT_QUALITY).toBe("major");
  });
});

describe("shapeForQuality", () => {
  it("keeps the region: G major E-shape (3–5) becomes the E minor Dm-shape (2–5)", () => {
    expect(shapeForQuality("G", shape("G", "major", "E"), "minor")).toBe("D");
  });

  it("round-trips back to where it started", () => {
    expect(shapeForQuality("G", shape("G", "minor", "D"), "major")).toBe("E");
    expect(shapeForQuality("C", shape("C", "major", "E"), "minor")).toBe("D"); // C E-shape 8–10 → A minor Dm 7–10
    expect(shapeForQuality("C", shape("C", "minor", "D"), "major")).toBe("E");
  });

  it("lets a neck tap pick minor shapes by window", () => {
    const em = cagedShapes("G", "minor"); // Em 0–2 · Dm 2–5 · Cm 4–7 · Am 7–9 · Gm 9–12
    expect(nearestShape(em, 0)).toBe("E");
    expect(nearestShape(em, 8)).toBe("A");
    expect(nearestShape(em, 15)).toBe("G");
  });
});

describe("switchQualityShape", () => {
  it("switching straight back returns to the starting shape in every key, both ways", () => {
    for (const root of NOTES) {
      for (const from of ["major", "minor"] as const) {
        const to = from === "major" ? "minor" : "major";
        for (const start of cagedShapes(root, from)) {
          const there = switchQualityShape(root, from, start.name, to, null);
          const back = switchQualityShape(root, to, there.name, from, there.memo);
          expect(`${root} ${from} ${back.name}`).toBe(`${root} ${from} ${start.name}`);
        }
      }
    }
  });

  it("uses the nearest window when the shape or root changed since the last switch", () => {
    const there = switchQualityShape("D", "major", "D", "minor", null); // D 0–3 → Am 2–4
    expect(there.name).toBe("A");
    expect(switchQualityShape("D", "minor", "C", "major", there.memo).name).toBe(shapeForQuality("D", shape("D", "minor", "C"), "major"));
    expect(switchQualityShape("E", "minor", "A", "major", there.memo).name).toBe(shapeForQuality("E", shape("E", "minor", "A"), "major"));
  });
});
