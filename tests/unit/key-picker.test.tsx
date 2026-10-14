import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { KeyPicker } from "@/components/key/key-picker";
import { NOTES } from "@/lib/theory/notes";

describe("KeyPicker", () => {
  it("offers all 12 notes and marks only the current one", () => {
    render(<KeyPicker value="G" onChange={() => {}} />);
    const buttons = within(screen.getByRole("group", { name: "Root note" })).getAllByRole("button");
    expect(buttons.map((b) => b.textContent)).toEqual([...NOTES]);
    expect(buttons.filter((b) => b.getAttribute("aria-pressed") === "true").map((b) => b.textContent)).toEqual(["G"]);
  });

  it("reports the tapped note", () => {
    const onChange = vi.fn();
    render(<KeyPicker value="C" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "F#" }));
    expect(onChange).toHaveBeenCalledWith("F#");
  });
});
