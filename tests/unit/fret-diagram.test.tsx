import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FretDiagram, type DiagramMarker } from "@/components/fretboard/fret-diagram";

// E minor pentatonic box 1, low E and A strings only (enough to exercise the options).
const markers: DiagramMarker[] = [
  { string: 0, fret: 0, label: "1", kind: "tonic", srText: "6th string, fret 0, E, 1" },
  { string: 0, fret: 3, label: "♭3", kind: "tone", srText: "6th string, fret 3, G, ♭3" },
  { string: 1, fret: 1, label: "♭5", kind: "blue", srText: "5th string, fret 1, B♭, ♭5" },
];

describe("FretDiagram", () => {
  it("draws open-string notes as markers and no × when muting is off", () => {
    const { container } = render(
      <FretDiagram markers={markers} lowFret={0} highFret={3} ariaLabel="box" showMuted={false} openStyle="marker" showNoteNames={false} />,
    );
    expect(screen.queryByText("×")).toBeNull();
    expect(container.querySelector("[data-nut]")).not.toBeNull();
    const open = container.querySelector('[data-open="true"] circle')!;
    expect(open.getAttribute("fill")).toBe("#161718"); // a tonic marker, not a hollow ○
    expect(container.querySelectorAll("[data-string-note]")).toHaveLength(0);
    expect(screen.getByText("5th string, fret 1, B♭, ♭5")).toBeInTheDocument();
  });

  it("puts open-string markers on the wood, not the page, so they read in dark mode", () => {
    const { container } = render(
      <FretDiagram markers={markers} lowFret={0} highFret={3} ariaLabel="box" showMuted={false} openStyle="marker" showNoteNames={false} />,
    );
    const woodTop = Number(container.querySelector("[data-wood]")!.getAttribute("y"));
    const nutY = Number(container.querySelector("[data-nut]")!.getAttribute("y1"));
    const openMarker = container.querySelector('[data-open="true"] circle')!;
    expect(woodTop).toBeLessThan(Number(openMarker.getAttribute("cy")) - Number(openMarker.getAttribute("r")));
    expect(woodTop).toBeLessThan(nutY);
  });

  it("labels markers by role, R for the tonic", () => {
    const { container } = render(
      <FretDiagram markers={markers} lowFret={0} highFret={3} ariaLabel="box" showMuted={false} openStyle="marker" showNoteNames={false} />,
    );
    expect([...container.querySelectorAll("[data-role]")].map((m) => m.getAttribute("data-role"))).toEqual(["R", "♭3", "♭5"]);
  });
});
