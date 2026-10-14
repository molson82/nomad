import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { ProgressionStrip } from "@/components/chords/progression-strip";
import { progressionSteps } from "@/lib/chords/progression-chords";

const steps = progressionSteps("G", [1, 5, 6, 4, 7]);
const strip = () => within(screen.getByRole("region", { name: "Progression" }));

describe("ProgressionStrip", () => {
  it("lists the chords, the selected one pressed, vii° disabled", () => {
    render(<ProgressionStrip steps={steps} selected={1} onSelect={() => {}} />);
    const chips = strip().getAllByRole("button").filter((b) => b.hasAttribute("aria-pressed"));
    expect(chips.map((c) => c.getAttribute("aria-label"))).toEqual([
      "I, G major",
      "V, D major",
      "vi, E minor",
      "IV, C major",
      "F♯ diminished, no shapes yet",
    ]);
    expect(chips.map((c) => c.getAttribute("aria-pressed"))).toEqual(["false", "true", "false", "false", "false"]);
    expect(chips[4]).toBeDisabled();
  });

  it("selects a chip, and tapping the selected chip goes back to the key", () => {
    const onSelect = vi.fn();
    render(<ProgressionStrip steps={steps} selected={1} onSelect={onSelect} />);
    fireEvent.click(strip().getByRole("button", { name: "vi, E minor" }));
    expect(onSelect).toHaveBeenLastCalledWith(2);
    fireEvent.click(strip().getByRole("button", { name: "V, D major" }));
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });

  it("steps with the arrows, skipping vii° and stopping at the ends", () => {
    const onSelect = vi.fn();
    const { rerender } = render(<ProgressionStrip steps={steps} selected={null} onSelect={onSelect} />);
    expect(strip().getByRole("button", { name: "Previous chord" })).toBeDisabled();
    fireEvent.click(strip().getByRole("button", { name: "Next chord" }));
    expect(onSelect).toHaveBeenLastCalledWith(0);
    rerender(<ProgressionStrip steps={steps} selected={3} onSelect={onSelect} />);
    expect(strip().getByRole("button", { name: "Next chord" })).toBeDisabled();
    fireEvent.click(strip().getByRole("button", { name: "Previous chord" }));
    expect(onSelect).toHaveBeenLastCalledWith(2);
  });
});
