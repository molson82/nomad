import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ScaleHeader } from "@/components/scales/scale-header";

describe("ScaleHeader", () => {
  it("names a major view and points to its relative minor", () => {
    render(<ScaleHeader root="G" view={{ tonality: "major", type: "scale" }} onStep={() => {}} />);
    expect(screen.getByRole("heading", { level: 2, name: "G major" })).toBeInTheDocument();
    expect(screen.getByText("G A B C D E F♯")).toBeInTheDocument();
    expect(screen.getByText("Relative minor: E (⑥)")).toHaveClass("text-relative");
  });

  it("names a minor view and points back to its major", () => {
    render(<ScaleHeader root="G" view={{ tonality: "minor", type: "blues" }} onStep={() => {}} />);
    expect(screen.getByRole("heading", { level: 2, name: "E minor blues" })).toBeInTheDocument();
    expect(screen.getByText("E G A B♭ B D")).toBeInTheDocument();
    expect(screen.getByText("Relative of G major (⑥)")).toBeInTheDocument();
  });

  it("steps the root", () => {
    const onStep = vi.fn();
    render(<ScaleHeader root="G" view={{ tonality: "major", type: "scale" }} onStep={onStep} />);
    fireEvent.click(screen.getByRole("button", { name: "Next root" }));
    expect(onStep).toHaveBeenCalledWith(1);
  });
});
