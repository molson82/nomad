import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { NeckOverview } from "@/components/chords/neck-overview";
import { cagedShapes } from "@/lib/theory/caged";
import { chordTones } from "@/lib/theory/fretboard";

describe("NeckOverview", () => {
  const tones = chordTones("G");
  const shape = cagedShapes("G").find((s) => s.name === "E")!;

  it("marks every chord tone on frets 0–15", () => {
    const { container } = render(<NeckOverview tones={tones} window={{ ...shape, label: `${shape.label}-shape` }} chordName="G major" onPickFret={() => {}} />);
    expect(container.querySelectorAll("[data-tone]")).toHaveLength(tones.length);
    expect(container.querySelectorAll('[data-tone][data-in-shape="true"]')).toHaveLength(6);
  });

  it("keeps open-string notes on the fretboard and strings in theme colours", () => {
    const { container } = render(<NeckOverview tones={tones} window={{ ...shape, label: `${shape.label}-shape` }} chordName="G major" onPickFret={() => {}} />);
    const wood = container.querySelector("[data-fretboard]")!;
    expect(Number(wood.getAttribute("x"))).toBeLessThanOrEqual(5); // behind the fret-0 markers too
    const strings = container.querySelectorAll("[data-string-line]");
    expect(strings).toHaveLength(6);
    strings.forEach((line) => expect(line).toHaveClass("stroke-string"));
  });

  it("frames the selected shape", () => {
    const { container } = render(<NeckOverview tones={tones} window={{ ...shape, label: `${shape.label}-shape` }} chordName="G major" onPickFret={() => {}} />);
    const frame = container.querySelector("[data-window-low]")!;
    expect(frame.getAttribute("data-window-low")).toBe("3");
    expect(frame.getAttribute("data-window-high")).toBe("5");
    expect(screen.getByRole("img", { name: "G major across the neck, E-shape at frets 3 to 5" })).toBeInTheDocument();
  });
});
