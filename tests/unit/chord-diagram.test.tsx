import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChordDiagram } from "@/components/chords/chord-diagram";
import { cagedShapes } from "@/lib/theory/caged";

const g = (name: string) => cagedShapes("G").find((s) => s.name === name)!;

describe("ChordDiagram", () => {
  it("draws the G E-shape at 3fr with numbered 3rds and 5ths", () => {
    const { container } = render(<ChordDiagram shape={g("E")} chordName="G major" />);
    expect(screen.getByRole("img", { name: "G major, E-shape, frets 3 to 5" })).toBeInTheDocument();
    expect(screen.getByText("3fr")).toBeInTheDocument();
    const roles = [...container.querySelectorAll("[data-role]")].map((m) => m.getAttribute("data-role"));
    expect(roles.sort()).toEqual(["3", "5", "5", "R", "R", "R"]);
    expect([...container.querySelectorAll("[data-string-note]")].map((n) => n.textContent)).toEqual([
      "G", "D", "G", "B", "D", "G",
    ]);
    expect(container.querySelector("[data-nut]")).toBeNull();
  });

  it("marks strings the D-shape doesn't use", () => {
    render(<ChordDiagram shape={g("D")} chordName="G major" />);
    expect(screen.getAllByText("×")).toHaveLength(2);
  });

  it("draws the nut and open strings for an open-position shape", () => {
    const { container } = render(<ChordDiagram shape={g("G")} chordName="G major" />);
    expect(container.querySelector("[data-nut]")).not.toBeNull();
    expect(screen.queryByText(/fr$/)).toBeNull();
    expect(container.querySelectorAll('[data-open="true"]')).toHaveLength(3); // D, G, B strings
  });

  it("draws open strings as hollow ○, not as fretted dots", () => {
    const { container } = render(<ChordDiagram shape={g("G")} chordName="G major" />);
    const open = [...container.querySelectorAll('[data-open="true"]')];
    expect(open).toHaveLength(3);
    for (const marker of open) {
      expect(marker.querySelector("circle")!.getAttribute("fill")).toBe("none");
      expect(marker.querySelector("text")).toBeNull();
    }
  });

  it("draws strings and the nut in theme colours that hold up in dark mode", () => {
    const { container } = render(<ChordDiagram shape={g("G")} chordName="G major" />);
    const strings = container.querySelectorAll("[data-string-line]");
    expect(strings).toHaveLength(6);
    strings.forEach((line) => expect(line).toHaveClass("stroke-string"));
    expect(container.querySelector("[data-nut]")).toHaveClass("stroke-text-primary");
  });

  it("lists its notes for screen readers", () => {
    render(<ChordDiagram shape={g("E")} chordName="G major" />);
    expect(screen.getByText("6th string, fret 3, G, root")).toBeInTheDocument();
    expect(screen.getByText("3rd string, fret 4, B, 3rd")).toBeInTheDocument();
  });

  it("labels the minor third ♭3 and reads it as flat 3rd", () => {
    const dm = cagedShapes("G", "minor").find((s) => s.name === "D")!;
    render(<ChordDiagram shape={dm} chordName="E minor" />);
    expect(screen.getByRole("img", { name: "E minor, Dm-shape, frets 2 to 5" })).toBeInTheDocument();
    expect(screen.getByText("♭3")).toBeInTheDocument();
    expect(screen.getByText("1st string, fret 3, G, flat 3rd")).toBeInTheDocument();
  });
});
