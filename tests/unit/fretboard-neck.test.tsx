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
    expect(circle("blue").getAttribute("fill")).toBe("#2F6FE0");
    expect(container.querySelector('[data-kind="relative"]')!.getAttribute("data-in-shape")).toBe("false");
  });

  it("outlines root notes in the text color so they read on the wood in dark mode", () => {
    const { container } = render(<Neck markers={markers} windowLow={0} windowHigh={3} ariaLabel="neck" onPickFret={() => {}} />);
    expect(container.querySelector('[data-kind="tonic"] circle')!.getAttribute("class")).toBe("stroke-text-primary");
    expect(container.querySelector('[data-kind="blue"] circle')!.getAttribute("class")).toBeNull();
  });
});

describe("Neck rings", () => {
  it("paints rings above the notes, dashing the ones asked to be", () => {
    const { container } = render(
      <Neck markers={markers} windowLow={0} windowHigh={3} ariaLabel="neck" onPickFret={() => {}} rings={[{ string: 0, fret: 3 }, { string: 1, fret: 1, dashed: true }]} />,
    );
    const rings = [...container.querySelectorAll("[data-ring]")];
    expect(rings).toHaveLength(2);
    expect(rings[0].getAttribute("class")).toBe("stroke-pathfinder");
    expect(rings[0].getAttribute("stroke-dasharray")).toBeNull();
    expect(rings[1].getAttribute("stroke-dasharray")).not.toBeNull();
    const last = container.querySelectorAll("[data-tone]");
    expect(last[last.length - 1].compareDocumentPosition(rings[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("draws no window band without a window", () => {
    const { container } = render(<Neck markers={[]} ariaLabel="neck" />);
    expect(container.querySelector("[data-window-low]")).toBeNull();
  });
});

describe("Neck string names", () => {
  const dadgad = ["D", "A", "D", "G", "A", "D"].map((name, i) => ({ name, changed: [true, false, false, false, true, true][i] }));
  it("names each string left of the nut, marking retuned ones", () => {
    const { container } = render(<Neck markers={markers} windowLow={0} windowHigh={3} ariaLabel="neck" onPickFret={() => {}} strings={dadgad} />);
    const names = [...container.querySelectorAll("[data-string-name]")];
    expect(names.map((n) => n.textContent)).toEqual(["D", "A", "D", "G", "A", "D"]);
    expect(names[4].getAttribute("class")).toContain("fill-tuning-ink");
    expect(names[2].getAttribute("class")).not.toContain("fill-tuning-ink");
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
