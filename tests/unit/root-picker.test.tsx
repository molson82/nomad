import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { RootPicker } from "@/components/chords/root-picker";

describe("RootPicker", () => {
  it("names the chord and spells its notes", () => {
    render(<RootPicker root="C#" onStep={() => {}} />);
    expect(screen.getByRole("heading", { level: 2, name: "D♭ major" })).toBeInTheDocument();
    expect(screen.getByText("D♭ · F · A♭")).toBeInTheDocument();
  });

  it("steps down and up", () => {
    const onStep = vi.fn();
    render(<RootPicker root="G" onStep={onStep} />);
    fireEvent.click(screen.getByRole("button", { name: "Previous root" }));
    expect(onStep).toHaveBeenLastCalledWith(-1);
    fireEvent.click(screen.getByRole("button", { name: "Next root" }));
    expect(onStep).toHaveBeenLastCalledWith(1);
  });
});
