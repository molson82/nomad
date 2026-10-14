import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { FocusCard } from "@/components/chords/focus-card";
import { cagedShapes } from "@/lib/theory/caged";

const shapes = cagedShapes("G");
const named = (n: string) => shapes.find((s) => s.name === n)!;

describe("FocusCard", () => {
  it("titles the shape and names its neighbours", () => {
    render(<FocusCard shape={named("E")} shapes={shapes} chordName="G major" onStep={() => {}} />);
    expect(screen.getByRole("region", { name: "E-shape, frets 3 to 5" })).toBeInTheDocument();
    expect(screen.getByText("frets 3–5 · root on the 6th string")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous shape: G-shape" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Next shape: D-shape" })).toBeEnabled();
  });

  it("steps with the arrows", () => {
    const onStep = vi.fn();
    render(<FocusCard shape={named("E")} shapes={shapes} chordName="G major" onStep={onStep} />);
    fireEvent.click(screen.getByRole("button", { name: "Next shape: D-shape" }));
    expect(onStep).toHaveBeenLastCalledWith(1);
    fireEvent.click(screen.getByRole("button", { name: "Previous shape: G-shape" }));
    expect(onStep).toHaveBeenLastCalledWith(-1);
  });

  it("stops at both ends of the neck", () => {
    const { rerender } = render(<FocusCard shape={named("G")} shapes={shapes} chordName="G major" onStep={() => {}} />);
    expect(screen.getByRole("button", { name: "Previous shape" })).toBeDisabled();
    rerender(<FocusCard shape={named("A")} shapes={shapes} chordName="G major" onStep={() => {}} />);
    expect(screen.getByRole("button", { name: "Next shape" })).toBeDisabled();
  });
});
