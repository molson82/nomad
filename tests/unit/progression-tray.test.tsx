import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { ProgressionTray } from "@/components/circle/progression-tray";
import { CIRCLE } from "@/lib/theory/circle";
import { diatonicChords } from "@/lib/theory/chords";

const g = diatonicChords(CIRCLE[1]);

describe("ProgressionTray", () => {
  it("lists chords by numeral and name in the current key", () => {
    render(<ProgressionTray keyChords={g} degrees={[1, 5, 6, 4]} onRemove={() => {}} onClear={() => {}} />);
    const chips = within(screen.getByRole("list", { name: "Progression chords" })).getAllByRole("button");
    expect(chips.map((c) => c.getAttribute("aria-label"))).toEqual([
      "Remove G major, step 1",
      "Remove D major, step 2",
      "Remove E minor, step 3",
      "Remove C major, step 4",
    ]);
    expect(chips[2]).toHaveTextContent("viEm");
  });

  it("removes a tapped chip and clears", () => {
    const onRemove = vi.fn();
    const onClear = vi.fn();
    render(<ProgressionTray keyChords={g} degrees={[2, 5, 1]} onRemove={onRemove} onClear={onClear} />);
    fireEvent.click(screen.getByRole("button", { name: "Remove D major, step 2" }));
    expect(onRemove).toHaveBeenCalledWith(1);
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onClear).toHaveBeenCalled();
  });

  it("explains how to start when empty", () => {
    render(<ProgressionTray keyChords={g} degrees={[]} onRemove={() => {}} onClear={() => {}} />);
    expect(screen.queryByRole("list", { name: "Progression chords" })).toBeNull();
    expect(screen.getByRole("button", { name: "Clear" })).toBeDisabled();
    expect(screen.getByText("No chords yet — tap a chord or pick a progression.")).toBeInTheDocument();
  });
});
