import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { NeckOverview } from "@/components/chords/neck-overview";
import { cagedShapes } from "@/lib/theory/caged";
import { chordTones } from "@/lib/theory/fretboard";

describe("NeckOverview", () => {
  const tones = chordTones("G");
  const shape = cagedShapes("G").find((s) => s.name === "E")!;

  it("marks every chord tone on frets 0–15", () => {
    const { container } = render(<NeckOverview tones={tones} shape={shape} chordName="G major" onPickFret={() => {}} />);
    expect(container.querySelectorAll("[data-tone]")).toHaveLength(tones.length);
    expect(container.querySelectorAll('[data-tone][data-in-shape="true"]')).toHaveLength(6);
  });

  it("frames the selected shape", () => {
    const { container } = render(<NeckOverview tones={tones} shape={shape} chordName="G major" onPickFret={() => {}} />);
    const frame = container.querySelector("[data-window-low]")!;
    expect(frame.getAttribute("data-window-low")).toBe("3");
    expect(frame.getAttribute("data-window-high")).toBe("5");
    expect(screen.getByRole("img", { name: "G major across the neck, E-shape at frets 3 to 5" })).toBeInTheDocument();
  });
});
