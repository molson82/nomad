import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Neck, type NeckMarker } from "@/components/fretboard/neck";
import { nearestByCentre } from "@/lib/chords/neck-geometry";

const markers: NeckMarker[] = [
  { string: 0, fret: 3, label: "", kind: "tonic", inWindow: true },
  { string: 0, fret: 0, label: "6", kind: "relative", inWindow: false },
  { string: 1, fret: 1, label: "♭5", kind: "blue", inWindow: true },
];

describe("Neck", () => {
  it("styles relative and blue markers distinctly", () => {
    const { container } = render(<Neck markers={markers} windowLow={0} windowHigh={3} ariaLabel="neck" onPickFret={() => {}} />);
    const circle = (kind: string) => container.querySelector(`[data-kind="${kind}"] circle`)!;
    expect(circle("relative").getAttribute("stroke")).toBe("#2F5BC0");
    expect(Number(circle("blue").getAttribute("r"))).toBeLessThan(Number(circle("tonic").getAttribute("r")));
    expect(circle("blue").getAttribute("fill")).toBe("#5B8DEF");
    expect(container.querySelector('[data-kind="relative"]')!.getAttribute("data-in-shape")).toBe("false");
  });
});

describe("nearestByCentre", () => {
  it("returns the item whose window centre is nearest, lower on a tie", () => {
    const items = [
      { id: "a", lowFret: 0, highFret: 4 },
      { id: "b", lowFret: 4, highFret: 8 },
      { id: "c", lowFret: 9, highFret: 12 },
    ];
    expect(nearestByCentre(items, 1).id).toBe("a");
    expect(nearestByCentre(items, 4).id).toBe("a");
    expect(nearestByCentre(items, 11).id).toBe("c");
  });
});
