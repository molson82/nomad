import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { TriadControls } from "@/components/chords/triad-controls";
import { triad } from "@/lib/theory/fretboard";
import { countTriads } from "@/lib/theory/triads";
import { TUNING_PRESETS, openPitches } from "@/lib/theory/tuning";

const dadgad = openPitches(TUNING_PRESETS.find((p) => p.id === "dadgad")!.offsets);
const names = ["D", "A", "D", "G", "A", "D"];

describe("TriadControls", () => {
  it("counts the shapes for each inversion on the chosen strings", () => {
    render(
      <TriadControls set={0} inversion="root" quality="major" available={countTriads(triad("D"), "major", dadgad)} strings={names} onSet={() => {}} onInversion={() => {}} />,
    );
    const inversions = within(screen.getByRole("group", { name: "Inversion" }));
    expect(inversions.getByRole("button", { name: /^1st inv/ })).toHaveTextContent("3 in the bass · 2 shapes");
    expect(inversions.getByRole("button", { name: /^Root pos/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("picks a string set", () => {
    const onSet = vi.fn();
    render(<TriadControls set={0} inversion="root" quality="major" available={countTriads(triad("D"), "major", dadgad)} strings={names} onSet={onSet} onInversion={() => {}} />);
    const sets = within(screen.getByRole("group", { name: "Triads on three strings" }));
    expect(sets.getByRole("button", { name: /^6–5–4/ })).toHaveTextContent("D A D");
    fireEvent.click(sets.getByRole("button", { name: /^4–3–2/ }));
    expect(onSet).toHaveBeenCalledWith(2);
  });

  it("disables strings and inversions with nothing playable", () => {
    const unison = openPitches([0, 0, 0, -5, 3, 0]);
    render(<TriadControls set={2} inversion="root" quality="major" available={countTriads(triad("D"), "major", unison)} strings={["E", "A", "D", "D", "D", "E"]} onSet={() => {}} onInversion={() => {}} />);
    expect(screen.getByRole("button", { name: /^4–3–2/ })).toBeDisabled();
    expect(within(screen.getByRole("group", { name: "Inversion" })).getByRole("button", { name: /^Root pos/ })).toHaveTextContent("too wide to play");
  });
});
