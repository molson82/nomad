import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { ViewToggles } from "@/components/scales/view-toggles";

describe("ViewToggles", () => {
  it("shows the current tonality and type as pressed", () => {
    render(<ViewToggles view={{ tonality: "minor", type: "blues" }} onChange={() => {}} />);
    const tonality = within(screen.getByRole("group", { name: "Major or minor" }));
    expect(tonality.getByRole("button", { name: "Minor" })).toHaveAttribute("aria-pressed", "true");
    expect(tonality.getByRole("button", { name: "Major" })).toHaveAttribute("aria-pressed", "false");
    const type = within(screen.getByRole("group", { name: "Scale type" }));
    expect(type.getAllByRole("button").map((b) => b.getAttribute("aria-pressed"))).toEqual(["false", "false", "true"]);
  });

  it("reports changes as patches", () => {
    const onChange = vi.fn();
    render(<ViewToggles view={{ tonality: "major", type: "scale" }} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Minor" }));
    expect(onChange).toHaveBeenLastCalledWith({ tonality: "minor" });
    fireEvent.click(screen.getByRole("button", { name: "Pentatonic" }));
    expect(onChange).toHaveBeenLastCalledWith({ type: "pentatonic" });
  });
});
