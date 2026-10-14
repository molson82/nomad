import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { RootPicker } from "@/components/chords/root-picker";

describe("RootPicker", () => {
  it("names the chord and spells its notes", () => {
    render(<RootPicker root="C#" quality="major" onStep={() => {}} />);
    expect(screen.getByRole("heading", { level: 2, name: "D♭ major" })).toBeInTheDocument();
    expect(screen.getByText("D♭ · F · A♭")).toBeInTheDocument();
  });

  it("steps down and up", () => {
    const onStep = vi.fn();
    render(<RootPicker root="G" quality="major" onStep={onStep} />);
    fireEvent.click(screen.getByRole("button", { name: "Previous root" }));
    expect(onStep).toHaveBeenLastCalledWith(-1);
    fireEvent.click(screen.getByRole("button", { name: "Next root" }));
    expect(onStep).toHaveBeenLastCalledWith(1);
  });

  it("names the relative minor in major", () => {
    render(<RootPicker root="G" quality="major" onStep={() => {}} />);
    expect(screen.getByText("Relative minor: E (⑥)")).toBeInTheDocument();
  });

  it("shows the relative minor chord in minor", () => {
    render(<RootPicker root="G" quality="minor" onStep={() => {}} />);
    expect(screen.getByRole("heading", { level: 2, name: "E minor" })).toBeInTheDocument();
    expect(screen.getByText("E · G · B")).toBeInTheDocument();
    expect(screen.getByText("Relative of G major (⑥)")).toBeInTheDocument();
  });

  it("spells a flat key's relative minor with flats", () => {
    render(<RootPicker root="C#" quality="minor" onStep={() => {}} />);
    expect(screen.getByRole("heading", { level: 2, name: "B♭ minor" })).toBeInTheDocument();
    expect(screen.getByText("B♭ · D♭ · F")).toBeInTheDocument();
  });
});
